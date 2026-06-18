import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Persona, ProfileMeta, PersonaCredentials } from "./types.js";
import { cryptoTrader } from "./personas/crypto-trader.js";
import { defiDeveloper } from "./personas/defi-developer.js";
import { apiEngineer } from "./personas/api-engineer.js";
import { launchProfile, sendPrompt } from "./client.js";

const PROFILES_DIR = join(process.cwd(), "browser-profiles");

/** All available personas. */
export const PERSONAS: Persona[] = [cryptoTrader, defiDeveloper, apiEngineer];

export function getPersona(name: string): Persona | undefined {
  return PERSONAS.find((p) => p.name === name);
}

export function listPersonas(): Persona[] {
  return PERSONAS;
}

/** Load profile metadata from disk. */
export function loadProfileMeta(persona: string): ProfileMeta {
  const path = join(PROFILES_DIR, persona, "meta.json");
  if (existsSync(path)) {
    const meta = JSON.parse(readFileSync(path, "utf8")) as Partial<ProfileMeta>;
    return {
      name: persona,
      path: join(PROFILES_DIR, persona),
      created: meta.created ?? new Date().toISOString(),
      conversations: meta.conversations ?? 0,
      lastUsed: meta.lastUsed ?? "",
      description: meta.description ?? getPersona(persona)?.description ?? "",
      hasCredentials: meta.hasCredentials ?? existsSync(join(PROFILES_DIR, persona, "credentials.json")),
    };
  }
  return {
    name: persona,
    path: join(PROFILES_DIR, persona),
    created: new Date().toISOString(),
    conversations: 0,
    lastUsed: "",
    description: getPersona(persona)?.description ?? "",
    hasCredentials: false,
  };
}

/** Save profile metadata to disk. */
export function saveProfileMeta(persona: string, meta: ProfileMeta): void {
  const dir = join(PROFILES_DIR, persona);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
}

/** Load stored credentials for a persona. */
export function loadCredentials(persona: string): PersonaCredentials | null {
  const path = join(PROFILES_DIR, persona, "credentials.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PersonaCredentials;
  } catch {
    return null;
  }
}

/** Save credentials for a persona. */
export function saveCredentials(persona: string, creds: PersonaCredentials): void {
  const dir = join(PROFILES_DIR, persona);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "credentials.json"), JSON.stringify(creds, null, 2));
}

/** Check if a persona has stored account credentials. */
export function hasCredentials(persona: string): boolean {
  return loadCredentials(persona) !== null;
}

/** Get or create a stable proxy session ID for a persona.
 *  This ID is used with Oxylabs residential proxies to maintain IP stability
 *  across sessions (same cc-US + sessid → same geo region). */
export function getOrCreateProxySessionId(persona: string): string {
  const creds = loadCredentials(persona);
  if (creds?.proxySessionId) return creds.proxySessionId;

  const id = `${persona}-${Math.random().toString(36).slice(2, 8)}`;

  if (creds) {
    creds.proxySessionId = id;
    saveCredentials(persona, creds);
  } else {
    saveCredentials(persona, {
      email: "",
      password: "",
      mailTmId: "",
      mailTmToken: "",
      createdAt: new Date().toISOString(),
      proxySessionId: id,
    });
  }

  return id;
}

/**
 * Create a new persona profile by sending seed conversation prompts.
 * This establishes conversation history so ads get personalized.
 * If credentials are provided, auto-login before seeding.
 */
export async function createPersona(name: string): Promise<void> {
  const persona = getPersona(name);
  if (!persona) throw new Error(`Unknown persona: ${name}. Available: ${PERSONAS.map((p) => p.name).join(", ")}`);

  console.log(`Creating persona "${name}"...`);
  console.log(`  Description: ${persona.description}`);
  console.log(`  Seed prompts: ${persona.seedPrompts.length}`);

  const { page, browser } = await launchProfile(name, { headless: true });

  try {
    // If persona has credentials, log in first
    const creds = loadCredentials(name);
    if (creds) {
      console.log(`  Logged-in account: ${creds.email}`);
      const { loginToAccount } = await import("./client.js");
      await loginToAccount(page, creds.email, creds.password);
    }

    for (let i = 0; i < persona.seedPrompts.length; i++) {
      const prompt = persona.seedPrompts[i]!;
      const isFirst = i === 0;
      console.log(`  [${i + 1}/${persona.seedPrompts.length}] ${prompt.slice(0, 80)}...`);

      await sendPrompt(page, prompt, { waitForAds: isFirst, newChat: isFirst });
      await page.waitForTimeout(1500);
    }

    saveProfileMeta(name, {
      name,
      path: join(PROFILES_DIR, name),
      created: new Date().toISOString(),
      conversations: persona.seedPrompts.length,
      lastUsed: new Date().toISOString(),
      description: persona.description,
      hasCredentials: hasCredentials(name),
    });

    console.log(`  Profile saved. ${persona.seedPrompts.length} conversations seeded.`);
  } finally {
    await browser.close();
  }
}
