import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Persona, ProfileMeta } from "./types.js";
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
    return JSON.parse(readFileSync(path, "utf8"));
  }
  return {
    name: persona,
    path: join(PROFILES_DIR, persona),
    created: new Date().toISOString(),
    conversations: 0,
    lastUsed: "",
    description: getPersona(persona)?.description ?? "",
  };
}

/** Save profile metadata to disk. */
export function saveProfileMeta(persona: string, meta: ProfileMeta): void {
  const dir = join(PROFILES_DIR, persona);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
}

/**
 * Create a new persona profile by sending seed conversation prompts.
 * This establishes conversation history so ads get personalized.
 */
export async function createPersona(name: string): Promise<void> {
  const persona = getPersona(name);
  if (!persona) throw new Error(`Unknown persona: ${name}. Available: ${PERSONAS.map((p) => p.name).join(", ")}`);

  console.log(`Creating persona "${name}"...`);
  console.log(`  Description: ${persona.description}`);
  console.log(`  Seed prompts: ${persona.seedPrompts.length}`);

  const { page, browser } = await launchProfile(name, { headless: false });

  try {
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
    });

    console.log(`  Profile saved. ${persona.seedPrompts.length} conversations seeded.`);
  } finally {
    await browser.close();
  }
}
