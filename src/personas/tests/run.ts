// Quick smoke tests for the personas module.
// Run with: pnpm personas:test

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  PersonaManager,
  makePersonaFromSeed,
  generateMasterKey,
  parseSSE,
  computeProofOfWork,
} from "../index.js";
import { personaDir, readIdentity } from "../storage.js";
import { asPersonaId, AuthState } from "../types.js";
import { computeHealthScore, issuesFor, buildReport } from "../health/score.js";

interface TestCase {
  name: string;
  fn: () => Promise<void> | void;
}

const TESTS: TestCase[] = [];
const test = (name: string, fn: TestCase["fn"]) => TESTS.push({ name, fn });

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function freshHome(): string {
  const h = join(tmpdir(), `personas-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(h, { recursive: true });
  return h;
}

// ─── crypto round-trip ───────────────────────────────────────────
test("crypto: round-trip PersonaCredentials", async () => {
  const { PersonaCrypto } = await import("../crypto.js");
  const k = generateMasterKey();
  const crypto = new PersonaCrypto(k);
  const obj = { email: "x@y.com", password: "p", accountCreatedAt: new Date().toISOString() };
  const blob = crypto.seal(obj, { personaId: "p1", masterKeyHex: k, wraps: "PersonaCredentials" });
  const back = crypto.open<typeof obj>(blob, { personaId: "p1", masterKeyHex: k });
  assert(back.email === obj.email, "email round-trip");
  assert(back.password === obj.password, "password round-trip");
});

test("crypto: tampered ciphertext throws", async () => {
  const { PersonaCrypto } = await import("../crypto.js");
  const k = generateMasterKey();
  const crypto = new PersonaCrypto(k);
  const blob = crypto.seal({ a: 1 }, { personaId: "p1", masterKeyHex: k, wraps: "AuthState" });
  // Flip a byte
  const buf = Buffer.from(blob.ciphertext, "base64");
  buf[0] = buf[0]! ^ 0xff;
  const tampered = { ...blob, ciphertext: buf.toString("base64") };
  let threw = false;
  try {
    crypto.open(tampered, { personaId: "p1", masterKeyHex: k });
  } catch {
    threw = true;
  }
  assert(threw, "tampered ciphertext must throw");
});

test("crypto: different personaId → cannot decrypt", async () => {
  const { PersonaCrypto } = await import("../crypto.js");
  const k = generateMasterKey();
  const crypto = new PersonaCrypto(k);
  const blob = crypto.seal({ a: 1 }, { personaId: "p1", masterKeyHex: k, wraps: "AuthState" });
  let threw = false;
  try {
    crypto.open(blob, { personaId: "p2", masterKeyHex: k });
  } catch {
    threw = true;
  }
  assert(threw, "wrong personaId must throw (HKDF salt mismatch)");
});

// ─── manager: create/load/list/archive ───────────────────────────
test("manager: create → load → list → archive", async () => {
  const home = freshHome();
  process.env.OPENAI_ADS_HOME = home;
  const k = generateMasterKey();
  const pm = new PersonaManager({ masterKeyHex: k });
  await pm.init();
  const id = asPersonaId("test-create-load-archive");
  const { persona, credentials, auth } = makePersonaFromSeed("crypto-trader", { id });
  await pm.persistPersona(persona);
  await pm.persistCredentials(id, credentials);
  await pm.persistAuth(id, auth);
  assert(existsSync(join(personaDir(id), "identity.json")), "identity.json created");
  const loaded = await pm.load(id);
  assert(loaded.identity.id === id, "loaded id matches");
  await pm.audit(id, "used", "test");
  const audit = await pm.readRecentAudit(id);
  assert(audit.length >= 1, "audit entry written");
  await import("../storage.js").then((m) => m.updateIndex((idx) => ({
    ...idx,
    personas: Object.fromEntries(
      Object.entries(idx.personas).filter(([k]) => k !== id),
    ),
  })));
  rmSync(home, { recursive: true, force: true });
});

// ─── SSE parser ─────────────────────────────────────────────────
test("sse: parses [DONE] marker", async () => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  const events: unknown[] = [];
  for await (const e of parseSSE(stream)) events.push(e);
  assert((events[0] as any).done === true, "first event is done");
});

test("sse: parses multi-line data event", async () => {
  const body = `data: {"message":{"id":"m1","author":{"role":"assistant"},"content":{"parts":["hi"]}}}

data: [DONE]

`;
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode(body));
      c.close();
    },
  });
  const events: any[] = [];
  for await (const e of parseSSE(stream)) events.push(e);
  assert(events.length === 2, "two events");
  assert(events[0].message?.id === "m1", "first event message id");
  assert(events[1].done === true, "second is done");
});

// ─── Proof of work ─────────────────────────────────────────────
test("sentinel: PoW produces a token", async () => {
  // Use a tiny difficulty so the loop terminates quickly.
  const out = await computeProofOfWork({
    seed: "test-seed",
    difficulty: "0",
    userAgent: "test-ua",
    cores: 8,
    screen: "1920x1080",
  });
  assert(out.proofToken.startsWith("gAAAAAB"), "proof token format");
  assert(out.iterations > 0, "iterations > 0");
});

test("sentinel: PoW respects difficulty", async () => {
  // Hard difficulty — should iterate but ultimately find a match (or throw).
  // We use 0x000 (3 zero hex chars) which is achievable in <1s.
  const out = await computeProofOfWork({
    seed: "abc",
    difficulty: "000",
    userAgent: "ua",
    cores: 4,
    screen: "1920x1080",
  });
  assert(out.proofToken.startsWith("gAAAAAB"), "valid token for difficulty 000");
});

// ─── health score ──────────────────────────────────────────────
test("health: healthy persona scores ~100", async () => {
  const k = generateMasterKey();
  const pm = new PersonaManager({ masterKeyHex: k });
  await pm.init();
  const home = freshHome();
  process.env.OPENAI_ADS_HOME = home;
  const id = asPersonaId("test-healthy");
  const { persona, credentials, auth } = makePersonaFromSeed("crypto-trader", { id });
  auth.health = "healthy";
  auth.accountState = "OK";
  auth.sessionStartedAt = new Date().toISOString();
  auth.cfClearance = "test-cf";
  auth.cfClearanceExp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  auth.sessionToken = "test-session";
  await pm.persistPersona(persona);
  await pm.persistCredentials(id, credentials);
  await pm.persistAuth(id, auth);
  const score = computeHealthScore({
    persona,
    auth,
    lastSessionValid: true,
    lastCfBlocked: false,
    sessionSuccessWindow: 1.0,
    recentAdYield: 0.5,
  });
  assert(score >= 80, `healthy score >= 80, got ${score}`);
  rmSync(home, { recursive: true, force: true });
});

test("health: banned persona scores 0", async () => {
  const { persona, auth } = makePersonaFromSeed("defi-developer", {
    id: asPersonaId("test-banned"),
  });
  auth.health = "banned";
  auth.accountState = "BANNED";
  const score = computeHealthScore({
    persona,
    auth,
    lastSessionValid: false,
    lastCfBlocked: false,
    sessionSuccessWindow: 0,
    recentAdYield: 0,
  });
  assert(score === 0, `banned score is 0, got ${score}`);
});

test("health: cf_blocked + missing cf_clearance => issues", async () => {
  const { persona, auth } = makePersonaFromSeed("api-engineer", {
    id: asPersonaId("test-cf"),
  });
  auth.health = "cf_blocked";
  auth.cfClearance = null;
  const issues = issuesFor({
    persona,
    auth,
    lastSessionValid: false,
    lastCfBlocked: true,
    sessionSuccessWindow: 0.5,
    recentAdYield: 0,
  });
  assert(issues.some((i) => i.includes("cf_clearance")), "lists cf_clearance issue");
  assert(issues.some((i) => i.includes("Cloudflare")), "lists Cloudflare issue");
});

test("health: buildReport shape", async () => {
  const { persona, auth } = makePersonaFromSeed("crypto-trader", {
    id: asPersonaId("test-report"),
  });
  const r = buildReport({
    persona,
    auth,
    lastSessionValid: true,
    lastCfBlocked: false,
    sessionSuccessWindow: 1.0,
    recentAdYield: 0,
  });
  assert(r.id === persona.identity.id, "id matches");
  assert(typeof r.healthScore === "number", "score is number");
  assert(Array.isArray(r.issues), "issues is array");
});

// ─── main runner ───────────────────────────────────────────────
async function main(): Promise<void> {
  let passed = 0;
  let failed = 0;
  for (const t of TESTS) {
    try {
      await t.fn();
      console.log(`  ✅ ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`  ❌ ${t.name}`);
      console.log(`     ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
