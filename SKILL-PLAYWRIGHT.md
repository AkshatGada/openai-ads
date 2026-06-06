# Playwright Persona-Based ChatGPT Scraper

This skill covers the Playwright-based persona scraper that creates persistent ChatGPT sessions for ad probing. Unlike the Oxylabs scraper (stateless, fresh session per probe), this system maintains browser profiles, conversation history, and optionally real ChatGPT accounts — enabling personalized ad targeting based on accumulated user context.

## When to use Playwright vs Oxylabs

| | Oxylabs | Playwright Persona |
|---|---|---|
| Session | Fresh each probe | Persistent on disk — reopens the same browser session |
| Conversation history | None (every prompt is a new chat) | Accumulated across probes — ChatGPT remembers all past chats |
| Ad targeting | Based only on current prompt text | Based on full conversation history + user persona |
| Speed | 60-90s per probe | 20-40s per probe (direct browser, no API roundtrip) |
| Scale | Parallel via API | Serial per persona (1 browser process) |
| Cost | Paid API credits | Free (local Chromium) |
| Accounts | Anonymous (no login) | Optional: real ChatGPT accounts with email + password |

**Rule**: Use Oxylabs for high-volume stateless probing. Use Playwright for persona-based probing where you want ad targeting influenced by user history.

## Architecture

```
src/playwright-scraper/
├── client.ts              # Core browser automation — launchProfile, sendPrompt, probeWithProfile, converseWithProfile
├── profiles.ts            # Persona manager — createPersona, loadCredentials, saveCredentials, getPersona
├── email.ts               # Mail.tm API wrapper — create temp inboxes for ChatGPT account signup
├── types.ts               # Persona, ProfileMeta, PersonaCredentials, PlaywrightProbeResult, PlaywrightProbeOptions
├── index.ts               # CLI entry — pnpm playwright <command>
├── personas/
│   ├── crypto-trader.ts   # Persona: active crypto day trader (Binance/Bybit/OKX, Python backtester)
│   ├── defi-developer.ts  # Persona: DeFi/smart contract developer (Uniswap/Aave, Alchemy/Infura)
│   └── api-engineer.ts    # Persona: backend API engineer at fintech (Stripe/Plaid, API gateways)
└── scripts/
    └── verify.ts          # Connectivity health check (create if needed)

browser-profiles/          # Persistent Chromium data dirs (gitignored)
├── crypto-trader/         # Browser cookies, localStorage, session for crypto-trader persona
│   ├── meta.json          # Profile metadata (conversations, last used)
│   ├── credentials.json   # Account credentials IF --create-account was used (gitignored)
│   └── Default/           # Chromium user data directory
├── defi-developer/
├── api-engineer/
└── default/

playwright-outputs/        # HTML probe results (gitignored)
playwright-logs/           # Run logs (gitignored)
```

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/AkshatGada/openai-ads.git
cd openai-ads

# 2. Install dependencies (includes playwright, playwright-extra, stealth plugin)
pnpm install

# 3. Install Chromium browser binary
npx playwright install chromium

# 4. Copy and fill .env (Oxylabs creds needed only for the Oxylabs scraper — not Playwright)
cp .env.example .env
```

No additional API keys needed for the Playwright scraper. Chromium runs locally.

## Personas

### What is a persona?

A persona is a **persistent ChatGPT user identity** with:
- A category-specific seed conversation history (4-6 prompts)
- A dedicated browser profile (cookies, localStorage, session state)
- Optionally, a real ChatGPT account (email, password) created via `--create-account`
- All probes share the same session → ChatGPT remembers past conversations → ads get personalized

### Available personas

| Persona | Target audience | What they talk about |
|---|---|---|
| `crypto-trader` | Crypto day trader | Trading APIs, exchange comparison, Python bots, WebSocket vs REST |
| `defi-developer` | DeFi smart contract dev | Blockchain RPC providers, Uniswap/Aave integration, on-chain data APIs |
| `api-engineer` | Backend API engineer | API gateways, webhook infrastructure, monitoring, Stripe/Plaid |

### Persona file format

Each persona is defined in `src/playwright-scraper/personas/<name>.ts`:

```ts
export const cryptoTrader: Persona = {
  name: "crypto-trader",
  description: "Active crypto day trader managing $50K across Binance...",
  seedPrompts: [
    "I'm a crypto day trader. I trade spot and futures...",
    "I've been manually trading for 2 years...",
    // 2-4 more prompts that build the persona's backstory
  ],
};
```

### Adding a new persona

1. Create `src/playwright-scraper/personas/<name>.ts` with the Persona interface
2. Import and add to the `PERSONAS` array in `src/playwright-scraper/profiles.ts:13`
3. Run `pnpm playwright --create <name>` (anonymous) or `pnpm playwright --create-account <name>` (with account)

## CLI Commands

```
pnpm playwright --list
  List all available personas with descriptions.

pnpm playwright --create <persona>
  Create and seed a persona profile (headed Chromium, anonymous ChatGPT).
  Sends 4 seed prompts to establish conversation history.
  Saves browser profile to browser-profiles/<persona>/.
  No account needed — works on free tier.

pnpm playwright --create-account <persona>
  Create persona WITH a real ChatGPT account.
  Steps:
    1. Create temp email via Mail.tm API
    2. Open ChatGPT signup → fill email + password
    3. Wait for verification email → extract link → verify
    4. Save credentials to browser-profiles/<persona>/credentials.json
    5. Seed 4 persona conversations (logged-in)
  Headed browser — user may need to solve a CAPTCHA.

pnpm playwright --status <persona>
  Show persona metadata: email, conversations, last used, account status.

pnpm playwright --probe <persona> "<prompt>"
  Send a single prompt through the persona's profile.
  Auto-logins if credentials exist and session expired.
  Waits for ChatGPT response + ad cards.
  Saves HTML to playwright-outputs/<persona>/.
  Prints ad results inline.

pnpm playwright --converse <persona> <file>
  Send multiple prompts in sequence (same chat session).
  File: one prompt per line, blank lines separator.

pnpm playwright --batch <persona> <file>
  Send multiple prompts as separate probes (new chat each time).
  File: one prompt per line.
```

## Core API (for programmatic use)

```ts
import {
  launchProfile,          // Open persistent browser for persona
  sendPrompt,             // Send one prompt on an open page
  probeWithProfile,       // Full probe: launch → send → capture → close
  converseWithProfile,    // Multi-turn: send N prompts in same chat
  createChatGPTAccount,   // Full signup: email → signup → verify → credentials
  loginToAccount,         // Log into existing account
  ensureLoggedIn,         // Auto-login if session expired
} from "./src/playwright-scraper/client.js";

import {
  getPersona,            // Get persona definition by name
  listPersonas,          // List all available personas
  loadCredentials,       // Load stored account credentials
  saveCredentials,       // Save account credentials
  createPersona,         // Create and seed a persona
} from "./src/playwright-scraper/profiles.js";
```

### Example: programmatic probe

```ts
import { probeWithProfile, saveResult } from "./src/playwright-scraper/client.js";

const result = await probeWithProfile(
  "Which exchange has the best REST API for Python trading bots?",
  { persona: "crypto-trader", headless: true, loginIfNeeded: true }
);

console.log(`Ads found: ${result.ads.length}`);
for (const ad of result.ads) {
  console.log(`  ${ad.advertiser}: "${ad.title}"`);
}

saveResult(result, "crypto-trader");
```

### Example: creating a new persona programmatically

```ts
import { getPersona } from "./src/playwright-scraper/profiles.js";
import { launchProfile, createChatGPTAccount, sendPrompt, loginToAccount } from "./src/playwright-scraper/client.js";

const persona = getPersona("crypto-trader")!;

// Step 1: Launch browser
const { page, browser } = await launchProfile("crypto-trader", { headless: false });

try {
  // Step 2: Create ChatGPT account (temp email + signup + verify)
  const creds = await createChatGPTAccount("crypto-trader", page);
  saveCredentials("crypto-trader", creds);

  // Step 3: Seed conversations
  for (const prompt of persona.seedPrompts) {
    await sendPrompt(page, prompt, { waitForAds: false, newChat: false });
  }
} finally {
  await browser.close();
}
```

## Account Creation Flow

When `--create-account` is used:

```
[1/4] Open Chromium (headed)
      → navigates to chatgpt.com

[2/4] Create temp email via Mail.tm API
      GET  https://api.mail.tm/domains          → pick domain
      POST https://api.mail.tm/accounts         → create inbox
      → Fill ChatGPT signup form with email + password
      → Submit

[3/4] Wait for verification email
      POST https://api.mail.tm/token            → get auth token
      GET  https://api.mail.tm/messages          → poll every 5s
      → Extract verification link from email HTML
      → Open link in browser
      → Account confirmed

[4/4] Save credentials + seed conversations
      → Write browser-profiles/<persona>/credentials.json
      → Send 4 seed persona prompts (logged in)
      → Save profile metadata
```

### Credentials file format

Stored at `browser-profiles/<persona>/credentials.json`:

```json
{
  "email": "crypto-trader-x7k2m@mail.tm",
  "password": "aB3!xYz9pQ2#mN5",
  "mailTmId": "abc-def-123",
  "mailTmToken": "eyJhbGciOi...",
  "createdAt": "2026-06-06T22:00:00Z"
}
```

This file is gitignored. Never commit credentials.

## Ad Detection

The Playwright scraper reuses the same `extractAdsFromHtml` function from `src/scraper/client.ts` used by the Oxylabs scraper. See the main [SKILL.md](./SKILL.md#ad-detection--what-we-discovered) for detection details.

Key markers:
- `data-ad-card-root="true"` — definitive ad card container
- `<p>Sponsored</p>` — ad label (with CSS classes on the `<p>` tag)
- Advertiser name in a `<p>` above "Sponsored"
- Title/body inside the ad card with `font-medium` and `line-clamp-2` CSS classes

## Integration with Analyzer

Playwright probe results produce the same HTML format as Oxylabs probes. Both feed into `src/analyzer/`.

```bash
# After running Playwright probes:
pnpm playwright --batch crypto-trader prompts.txt

# Ingest all probe data (Oxylabs + Playwright) into the analyzer:
pnpm analyze --ingest

# View analysis:
pnpm analyze --report
```

Playwright probes are tagged with `source: "playwright"` in `data/probes.json` when ingested by the analyzer.

## Running Probes

### Basic flow

```bash
# 1. List available personas
pnpm playwright --list

# 2. Create and seed a persona (anonymous — fastest)
pnpm playwright --create crypto-trader

# 3. Probe with persona
pnpm playwright --probe crypto-trader "Which exchange has the best REST API for Python trading bots?"

# 4. Check status
pnpm playwright --status crypto-trader

# 5. Run batch from file
echo "prompt 1" > probes.txt
echo "prompt 2" >> probes.txt
pnpm playwright --batch crypto-trader probes.txt
```

### Account-based flow

```bash
# 1. Create account (longer — opens headed browser, needs CAPTCHA solve)
pnpm playwright --create-account crypto-trader

# 2. Probe (auto-logins if session expired)
pnpm playwright --probe crypto-trader "Best crypto API for automated grid trading bots?"

# 3. Days later — profile still works. Auto-logins with stored credentials.
pnpm playwright --probe crypto-trader "Another prompt later..."
```

### Headed vs headless

- **Headed** (`headless: false`): Used for `--create` and `--create-account`. Browser window visible — needed for CAPTCHA solving.
- **Headless** (`headless: true`): Used for `--probe` and `--batch`. Runs invisibly. Faster.

The stealth plugin handles bot detection. If headless mode fails, the probe falls back gracefully.

## Profile Persistence

Browser profiles are stored at `browser-profiles/<persona>/`. Each profile contains:

| File/Dir | Content |
|---|---|
| `Default/` | Chromium user data (cookies, localStorage, indexedDB, cache) |
| `meta.json` | Profile metadata (created, conversations count, last used) |
| `credentials.json` | Account credentials (only if `--create-account` was used) |

**Profiles persist across machine restarts.** If you `--create` a persona today, you can `--probe` with it next week. The browser session state (cookies, etc.) is preserved on disk.

To reset a persona: delete its directory in `browser-profiles/` and re-create.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Could not find prompt textarea" | ChatGPT UI selectors changed. Update `textareaSelectors` in `client.ts:sendPrompt`. |
| Cloudflare challenge blocking | Ensure stealth plugin is active. Try `headless: false` for initial setup. |
| Mail.tm domains blocked by ChatGPT | Try again — Mail.tm rotates domains. Add GuerrillaMail as fallback in `email.ts`. |
| Persona creation hangs | Check internet. Chromium may need first-launch setup (~30s). |
| Account verification email never arrives | ChatGPT may require phone verification for that email domain. Try a different persona or use `--create` (anonymous). |
| Headless mode blocked | Use `--create` (headed) to establish the profile, then `--probe` should work headless. |

## Dependencies

- `playwright` — browser automation library
- `playwright-extra` — plugin wrapper for stealth
- `puppeteer-extra-plugin-stealth` — avoids bot detection on ChatGPT

No API keys required. Chromium runs locally. The Mail.tm API for temp emails is free and requires no key.

## Limitations

- **Single browser per persona** — probes are serial. Can't run 2 probes simultaneously on the same persona.
- **No proxy support** (yet) — uses local machine's IP. IP changes between sessions may affect ad geo-targeting consistency.
- **Ads are sparse** — ~3-5% fill rate observed. Most prompts won't trigger ads regardless of persona.
- **ChatGPT UI changes** — selectors may break when OpenAI updates the ChatGPT frontend. Update `textareaSelectors` and `sendSelectors` in `client.ts` if probes fail.

## Output integration

After running probes, enter Playwright outputs into the analyzer:

```bash
# The analyzer ingests all HTML files from:
#   scraper-outputs-*/     (Oxylabs batches)
#   playwright-outputs/     (Playwright probes)

pnpm analyze
  → Ingests all outputs → prints ad density by topic → prints advertiser map → prints blue ocean opportunities
```

For full analyzer documentation, see the main [SKILL.md](./SKILL.md).
