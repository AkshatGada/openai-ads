// On-disk read/write for persona files. Atomic via temp+rename.
// All write paths are 0600 (user-only). All dirs are 0700.

import { mkdir, readFile, rename, writeFile, chmod } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import {
  AuditEntry,
  EncryptedBlob,
  Persona,
  PersonaId,
  PersonaIndex,
  PERSONA_STORAGE_VERSION,
  PERSONA_VERSION,
} from "./types.js";

/** Default location: ~/.openai-ads/ — overridable via OPENAI_ADS_HOME. */
export function personasHome(): string {
  return process.env.OPENAI_ADS_HOME ?? join(homedir(), ".openai-ads");
}

export function personaDir(id: PersonaId): string {
  return join(personasHome(), "personas", id);
}

export function identityPath(id: PersonaId): string {
  return join(personaDir(id), "identity.json");
}
export function credentialsPath(id: PersonaId): string {
  return join(personaDir(id), "credentials.bin");
}
export function sessionPath(id: PersonaId): string {
  return join(personaDir(id), "state.bin");
}
export function proxyPath(id: PersonaId): string {
  return join(personaDir(id), "proxy.json");
}
export function conversationsDir(id: PersonaId): string {
  return join(personaDir(id), "conversations");
}
export function behaviorPath(id: PersonaId): string {
  return join(personaDir(id), "behavior.jsonl");
}
export function auditDir(id: PersonaId): string {
  return join(personaDir(id), "audit");
}
export function chromeProfileDir(id: PersonaId): string {
  return join(personaDir(id), "chrome-profile");
}
export function indexPath(): string {
  return join(personasHome(), "index.json");
}
export function configPath(): string {
  return join(personasHome(), "config.json");
}

async function ensureDir(path: string, mode: number): Promise<void> {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true, mode });
  }
}

/** Ensure the persona's directory tree exists with 0700 perms. */
export async function ensurePersonaDir(id: PersonaId): Promise<void> {
  const root = personaDir(id);
  await ensureDir(root, 0o700);
  await ensureDir(conversationsDir(id), 0o700);
  await ensureDir(auditDir(id), 0o700);
}

async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  await ensureDir(dirname(path), 0o700);
  const tmp = `${path}.tmp.${process.pid}.${Date.now()}`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, path);
  try {
    await chmod(path, 0o600);
  } catch {
    // non-fatal on Windows
  }
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

// ─── Persona public record ────────────────────────────────────────
export async function writeIdentity(id: PersonaId, persona: Persona): Promise<void> {
  if (persona.version !== PERSONA_VERSION) {
    throw new Error(`persona.version must be ${PERSONA_VERSION}, got ${persona.version}`);
  }
  if (persona.identity.id !== id) {
    throw new Error(`persona.identity.id (${persona.identity.id}) !== path id (${id})`);
  }
  await writeJsonAtomic(identityPath(id), persona);
}

export async function readIdentity(id: PersonaId): Promise<Persona> {
  return readJson<Persona>(identityPath(id));
}

export async function identityExists(id: PersonaId): Promise<boolean> {
  return existsSync(identityPath(id));
}

// ─── Encrypted blobs ───────────────────────────────────────────────
export async function writeEncryptedBlob(
  path: string,
  blob: EncryptedBlob,
): Promise<void> {
  await writeJsonAtomic(path, blob);
}

export async function readEncryptedBlob(path: string): Promise<EncryptedBlob> {
  return readJson<EncryptedBlob>(path);
}

// ─── Audit log (append-only, rotated monthly) ──────────────────────
function auditPathFor(id: PersonaId, date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return join(auditDir(id), `${yyyy}-${mm}.jsonl`);
}

export async function appendAudit(id: PersonaId, entry: AuditEntry): Promise<void> {
  await ensurePersonaDir(id);
  const path = auditPathFor(id, new Date(entry.ts));
  // Append (mode 0600 created on first write)
  const line = JSON.stringify(entry) + "\n";
  if (!existsSync(path)) {
    await writeFile(path, line, { encoding: "utf8", mode: 0o600 });
  } else {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(path, line, { encoding: "utf8" });
  }
}

export async function readAudit(id: PersonaId, limit = 100): Promise<AuditEntry[]> {
  const path = auditPathFor(id);
  if (!existsSync(path)) return [];
  const text = await readFile(path, "utf8");
  const lines = text.split("\n").filter((l) => l.length > 0);
  const out: AuditEntry[] = [];
  for (let i = Math.max(0, lines.length - limit); i < lines.length; i++) {
    out.push(JSON.parse(lines[i]!) as AuditEntry);
  }
  return out;
}

// ─── Conversations ─────────────────────────────────────────────────
export async function writeConversation(
  id: PersonaId,
  conversationId: string,
  body: unknown,
): Promise<void> {
  await ensureDir(conversationsDir(id), 0o700);
  const path = join(conversationsDir(id), `${conversationId}.json`);
  await writeJsonAtomic(path, body);
}

export async function readConversation(
  id: PersonaId,
  conversationId: string,
): Promise<unknown> {
  const path = join(conversationsDir(id), `${conversationId}.json`);
  return readJson(path);
}

// ─── Behavior samples (append-only) ────────────────────────────────
export async function appendBehaviorSample(
  id: PersonaId,
  sample: unknown,
): Promise<void> {
  await ensurePersonaDir(id);
  const line = JSON.stringify(sample) + "\n";
  if (!existsSync(behaviorPath(id))) {
    await writeFile(behaviorPath(id), line, { encoding: "utf8", mode: 0o600 });
  } else {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(behaviorPath(id), line, { encoding: "utf8" });
  }
}

// ─── Index ─────────────────────────────────────────────────────────
export async function readIndex(): Promise<PersonaIndex> {
  if (!existsSync(indexPath())) {
    return { version: PERSONA_STORAGE_VERSION, updatedAt: new Date().toISOString(), personas: {} };
  }
  return readJson<PersonaIndex>(indexPath());
}

export async function writeIndex(idx: PersonaIndex): Promise<void> {
  await writeJsonAtomic(indexPath(), idx);
}

export async function updateIndex(
  updater: (idx: PersonaIndex) => PersonaIndex,
): Promise<PersonaIndex> {
  const current = await readIndex();
  const next = updater(current);
  next.version = PERSONA_STORAGE_VERSION;
  next.updatedAt = new Date().toISOString();
  await writeIndex(next);
  return next;
}

// ─── Bootstrap ─────────────────────────────────────────────────────
export async function ensureHome(): Promise<void> {
  await ensureDir(personasHome(), 0o700);
  await ensureDir(join(personasHome(), "personas"), 0o700);
  if (!existsSync(indexPath())) {
    await writeIndex({
      version: PERSONA_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      personas: {},
    });
  }
}
