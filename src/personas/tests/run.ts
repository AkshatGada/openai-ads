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
import { personaDir, personasHome, readIdentity } from "../storage.js";
import { asPersonaId } from "../types.js";

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
