#!/usr/bin/env node
// Playwright ChatGPT Scraper CLI
// Usage: pnpm playwright --<command> [args...]

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { probeWithProfile, converseWithProfile, saveResult, launchProfile, launchAuthBrowser, createChatGPTAccount } from "./client.js";
import { createPersona, getPersona, listPersonas, saveCredentials, loadCredentials, loadProfileMeta } from "./profiles.js";
import type { PlaywrightProbeResult } from "./types.js";

const OUTPUT_DIR = join(process.cwd(), "playwright-outputs");
const BATCH_DIR = join(process.cwd(), "playwright-logs");

function usage(): void {
  console.log(`
Playwright ChatGPT Scraper — persona-based ad probing

Commands:
  pnpm playwright --list                          List available personas
  pnpm playwright --create <persona>              Create and seed a persona profile (headed browser)
  pnpm playwright --create-account <persona>      Create persona WITH a real ChatGPT account (email signup)
  pnpm playwright --status <persona>              Show persona account status and history
  pnpm playwright --probe <persona> "<prompt>"    Probe ChatGPT with a prompt using persona
  pnpm playwright --converse <persona> <file>     Send prompts from file in sequence
  pnpm playwright --batch <persona> <file>        Batch probe: one prompt per file line

Examples:
  pnpm playwright --list
  pnpm playwright --create-account crypto-trader
  pnpm playwright --status crypto-trader
  pnpm playwright --probe crypto-trader "Which exchange has the best REST API for Python trading bots?"
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    usage();
    process.exit(0);
  }

  const cmd = args[0]!;

  // --list
  if (cmd === "--list") {
    const personas = listPersonas();
    console.log(`\n${personas.length} personas available:\n`);
    for (const p of personas) {
      console.log(`  ${p.name}`);
      console.log(`    ${p.description}\n`);
    }
    process.exit(0);
  }

  // --create <persona>
  if (cmd === "--create") {
    const persona = args[1];
    if (!persona) { console.error("Missing persona name. Use --list to see available personas."); process.exit(1); }
    if (!getPersona(persona)) { console.error(`Unknown persona: ${persona}`); process.exit(1); }
    await createPersona(persona);
    console.log(`\nPersona "${persona}" created. Run probes with: pnpm playwright --probe ${persona} "...prompt..."`);
    process.exit(0);
  }

  // --create-account <persona>
  if (cmd === "--create-account") {
    const persona = args[1];
    if (!persona) { console.error("Missing persona name."); process.exit(1); }
    if (!getPersona(persona)) { console.error(`Unknown persona: ${persona}`); process.exit(1); }

    console.log(`\nCreating ChatGPT account for persona "${persona}"...\n`);

    // Step 1: Launch Firefox (avoids Google OAuth default in Chromium)
    console.log("[1/4] Opening Firefox for signup...");
    const { page, browser } = await launchAuthBrowser(persona, { headless: false });

    try {
      // Step 2: Create temp email + signup + verify
      console.log("[2/4] Creating ChatGPT account...");
      const creds = await createChatGPTAccount(persona, page);

      // Step 3: Save credentials
      console.log("[3/4] Saving credentials...");
      saveCredentials(persona, creds);
      console.log(`  Email: ${creds.email}`);
      console.log(`  Password: ${creds.password}`);

      // Step 4: Seed persona conversations
      console.log("[4/4] Seeding persona conversations...");
      const personaDef = getPersona(persona)!;
      for (let i = 0; i < personaDef.seedPrompts.length; i++) {
        const prompt = personaDef.seedPrompts[i]!;
        const isFirst = i === 0;
        console.log(`  [${i + 1}/${personaDef.seedPrompts.length}] ${prompt.slice(0, 80)}...`);
        const { sendPrompt } = await import("./client.js");
        await sendPrompt(page, prompt, { waitForAds: false, newChat: isFirst });
        await page.waitForTimeout(1500);
      }

      // Update meta
      loadProfileMeta(persona); // ensure exists
      const { saveProfileMeta } = await import("./profiles.js");
      saveProfileMeta(persona, {
        name: persona,
        path: `browser-profiles/${persona}`,
        created: new Date().toISOString(),
        conversations: personaDef.seedPrompts.length,
        lastUsed: new Date().toISOString(),
        description: personaDef.description,
        hasCredentials: true,
      });

      console.log(`\n✓ Persona "${persona}" ready — logged-in account with ${personaDef.seedPrompts.length} seed conversations.`);
      console.log(`  Email: ${creds.email}`);
      console.log(`  Probe: pnpm playwright --probe ${persona} "...prompt..."`);
    } finally {
      await browser.close();
    }

    process.exit(0);
  }

  // --status <persona>
  if (cmd === "--status") {
    const persona = args[1];
    if (!persona) { console.error("Missing persona name."); process.exit(1); }

    const meta = loadProfileMeta(persona);
    const creds = loadCredentials(persona);
    const def = getPersona(persona);

    console.log(`\nPersona: ${persona}`);
    console.log(`  Description: ${def?.description ?? meta.description}`);
    console.log(`  Created: ${meta.created}`);
    console.log(`  Conversations: ${meta.conversations}`);
    console.log(`  Last used: ${meta.lastUsed || "never"}`);
    console.log(`  Account: ${creds ? creds.email : "none (anonymous)"}`);
    if (creds) {
      console.log(`  Created at: ${creds.createdAt}`);
      console.log(`  Proxy session: ${creds.proxySessionId ?? "none (local IP)"}`);
    }
    console.log("");
    process.exit(0);
  }

  // --probe <persona> "<prompt>"
  if (cmd === "--probe") {
    const persona = args[1];
    const prompt = args[2];
    if (!persona || !prompt) { console.error("Usage: pnpm playwright --probe <persona> \"<prompt>\""); process.exit(1); }
    if (!getPersona(persona)) { console.error(`Unknown persona: ${persona}`); process.exit(1); }

    console.log(`Probing with persona "${persona}"...`);
    console.log(`  Prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}`);

    const result = await probeWithProfile(prompt, { persona, headless: true });
    const fpath = saveResult(result, persona);

    console.log(`\n${"=".repeat(50)}`);
    console.log(`  Ads found: ${result.ads.length}`);
    for (const ad of result.ads) {
      console.log(`    🔴 ${ad.advertiser}: "${ad.title}"`);
    }
    if (result.ads.length === 0) console.log("    No ads detected.");
    console.log(`  HTML saved: ${fpath}`);
    console.log(`${"=".repeat(50)}`);
    process.exit(0);
  }

  // --converse <persona> <file>
  if (cmd === "--converse") {
    const persona = args[1];
    const file = args[2];
    if (!persona || !file) { console.error("Usage: pnpm playwright --converse <persona> <file>"); process.exit(1); }
    if (!existsSync(file)) { console.error(`File not found: ${file}`); process.exit(1); }
    if (!getPersona(persona)) { console.error(`Unknown persona: ${persona}`); process.exit(1); }

    const prompts = readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (prompts.length === 0) { console.error("No prompts found in file."); process.exit(1); }

    console.log(`Running ${prompts.length} prompts through persona "${persona}"...\n`);

    const results = await converseWithProfile(prompts, persona);
    let totalAds = 0;

    if (!existsSync(BATCH_DIR)) mkdirSync(BATCH_DIR, { recursive: true });

    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      const fpath = saveResult(r, persona);
      totalAds += r.ads.length;
      console.log(`  [${i + 1}/${prompts.length}] ads=${r.ads.length}${r.ads.length > 0 ? ` 🔴 ${r.ads[0]?.advertiser}: "${r.ads[0]?.title}"` : ""} → ${fpath}`);
    }

    console.log(`\nTotal ads across ${results.length} prompts: ${totalAds}`);
    process.exit(0);
  }

  // --batch <persona> <file> (same as converse for now)
  if (cmd === "--batch") {
    const persona = args[1];
    const file = args[2];
    if (!persona || !file) { console.error("Usage: pnpm playwright --batch <persona> <file>"); process.exit(1); }
    if (!existsSync(file)) { console.error(`File not found: ${file}`); process.exit(1); }
    if (!getPersona(persona)) { console.error(`Unknown persona: ${persona}`); process.exit(1); }

    const prompts = readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    console.log(`Batch probing ${prompts.length} prompts with persona "${persona}"...\n`);

    if (!existsSync(BATCH_DIR)) mkdirSync(BATCH_DIR, { recursive: true });

    let totalAds = 0;
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]!;
      console.log(`  [${i + 1}/${prompts.length}] ${prompt.slice(0, 70)}...`);
      try {
        const result = await probeWithProfile(prompt, { persona, headless: true });
        saveResult(result, persona);
        totalAds += result.ads.length;
        if (result.ads.length > 0) {
          for (const ad of result.ads) {
            console.log(`    🔴 AD: ${ad.advertiser} — "${ad.title}"`);
          }
        }
      } catch (e) {
        console.log(`    ✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
      }
      // Pause between probes
      if (i < prompts.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    console.log(`\nDONE. ${totalAds} ads across ${prompts.length} prompts.`);
    process.exit(0);
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

main().catch((e) => {
  console.error("Fatal error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
