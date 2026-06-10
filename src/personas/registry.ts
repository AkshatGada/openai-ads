// Index maintenance: keep ~/.openai-ads/index.json in sync with the
// on-disk persona records. Cheap to read; used by the CLI for `--list`,
// `--status`, and `--health`.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { personaDir, personasHome, readIdentity, readIndex } from "./storage.js";
import {
  PersonaId,
  PersonaIndex,
  PersonaIndexEntry,
  asPersonaId,
} from "./types.js";

export async function listPersonaIds(): Promise<PersonaId[]> {
  const dir = join(personasHome(), "personas");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => asPersonaId(d.name))
    .sort();
}

export async function readEnrichedIndex(): Promise<PersonaIndex> {
  const idx = await readIndex();
  const ids = await listPersonaIds();
  const known = new Set(Object.keys(idx.personas));
  // Add any new personas on disk.
  for (const id of ids) {
    if (known.has(id)) continue;
    if (!(await safeIdentityExists(id))) continue;
    try {
      const persona = await readIdentity(id);
      idx.personas[id] = summarize(persona);
    } catch {
      // skip corrupt
    }
  }
  // Remove stale entries (e.g. archived).
  for (const k of Object.keys(idx.personas)) {
    if (!existsSync(join(personaDir(asPersonaId(k)), "identity.json"))) {
      delete idx.personas[k];
    }
  }
  return idx;
}

async function safeIdentityExists(id: PersonaId): Promise<boolean> {
  return existsSync(join(personaDir(id), "identity.json"));
}

export function summarize(p: import("./types.js").Persona): PersonaIndexEntry {
  return {
    id: p.identity.id,
    label: p.identity.label,
    plan: "unknown", // populated by validate() / getMe()
    health: "unknown", // populated by validate()
    lastUsed: p.operational.lastUsed,
    healthScore: p.operational.healthScore,
    totalProbes: p.operational.totalProbes,
    tags: p.identity.tags,
  };
}
