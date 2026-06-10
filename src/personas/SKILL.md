# Persona System v2 — Agent Skill

> **Purpose:** Operate and extend the persistent-persona system for probing
> ChatGPT ads. This document is the single source of truth for an agent
> (human or AI) that needs to install, run, debug, and modify the system.

## 0. What this is

A `pnpm personas` CLI that manages **persistent, real ChatGPT accounts** as
on-disk bundles of state (identity, encrypted credentials, auth tokens,
behavioral model, conversation history, audit log), persisted under
`~/.openai-ads/personas/<id>/`.

The system is designed around one core idea:

> **A persona account is not a browser. The browser is one tool that
> can act as the account. The default runtime is browserless HTTP
> (~95% of operations). The browser is a fallback for the 5% that
> need it (account creation, cf_clearance refresh, full re-auth).**

Day-to-day probing (`--probe`, `--batch`, `--converse`, `--multi-batch`,
`--validate`) goes through Node + `impers` (curl-impersonate) with the
persona's fingerprint as headers, hitting `chatgpt.com/backend-api/...`
directly. No Chromium process. ~3-5s per probe instead of 10-15s.

Browser commands are marked `[BROWSER]` in `--help` and surface an EDR
warning. They are *opt-in* only.

Replaces: `src/playwright-scraper/{client,profiles,email,index}.ts` (kept
in tree for now, deprecated path).

Design doc: `PERSONA_ARCHITECTURE.md` at repo root.

---

## 1. Boot a fresh clone

```bash
# 1. Clone
git clone https://github.com/AkshatGada/openai-ads.git
cd openai-ads
git checkout feat/persona-v2

# 2. Install (Node 22+ required, pnpm 10.12.4+)
node --version     # must be v22.0.0 or higher
pnpm --version     # must be 10.12.4 or higher
pnpm install

# 3. Generate the master key (one-time)
pnpm personas --init-keys
#   → prints a 64-char hex key. Add to .env as PERSONA_MASTER_KEY=<key>

# 4. (Optional) set up Oxylabs ISP proxy
#    Add to .env:
#      OXYLABS_PROXY_USERNAME=<your_oxylabs_customer_name>
#      OXYLABS_PROXY_PASSWORD=<your_oxylabs_password>

# 5. Verify the install
pnpm typecheck                 # must be clean
pnpm personas:test             # must be 21/21 green
pnpm personas --help           # see all commands
```

That's the full setup. The system is now ready.

---

## 2. The CLI — every command

```bash
# ─── Persona management (no network) ────────────────────────
pnpm personas --list                              # table of all personas
pnpm personas --create <seed-id>                   # mint a persona from a seed
pnpm personas --create <seed-id> --dry-run        # preview without writing
pnpm personas --create <seed-id> --id <new-id>    # custom id
pnpm personas --create <seed-id> --tags t1,t2    # add tags
pnpm personas --status [<id>]                     # one or all personas, full detail
pnpm personas --health                            # status table with health scores
pnpm personas --dump <id>                         # full JSON (sanitized UA)
pnpm personas --audit <id> [--limit N]            # tail the audit log
pnpm personas --archive <id>                      # remove from index (files stay)

# ─── Day-to-day operations (browserless, uses proxy) ────────
pnpm personas --validate <id>                     # session check, no auto-fallback
pnpm personas --probe <id> --prompt "..."         # single prompt
pnpm personas --converse <id> <file>              # threaded conversation
pnpm personas --batch <id> <file>                 # one prompt per line, fresh conv
pnpm personas --multi-batch <file>                # "persona|prompt" per line, parallel

# ─── Browser fallback (EDR-detectable, opt-in only) ─────────
pnpm personas --create-account <seed-id>          # full signup via Chromium + mail.tm
pnpm personas --reauth <id>                       # full re-auth via email code
pnpm personas --refresh-cf <id>                   # refresh cf_clearance only

# ─── Proxy management ───────────────────────────────────────
pnpm personas --proxy-info [<id>]                 # pool + per-persona config
pnpm personas --proxy-test                        # verify egress via ip.oxylabs.io
pnpm personas --rotate-proxy <id>                 # burn current sessid, mint new

# ─── Daemons & utilities ────────────────────────────────────
pnpm personas:health                              # foreground health daemon
pnpm personas --init-keys                         # generate PERSONA_MASTER_KEY
```

### File formats

- **`--converse <file>` / `--batch <file>`** — one prompt per line
- **`--multi-batch <file>`** — one `"<persona_id>|<prompt>"` per line
  (use `-` for stdin)
- **Master key** must be 64 hex chars (32 bytes). Generate with
  `pnpm personas --init-keys` or `openssl rand -hex 32`.

---

## 3. Architecture in 60 seconds

```
caller
  ↓
PersonaManager (src/personas/manager.ts)
  ├── PersonaLock           per-persona async mutex
  ├── LRU cache             decrypted personas in memory
  ├── ProxyPool             per-persona sticky Oxylabs session
  ├── ChatGPTClient         browserless HTTP (impers / fetch)
  └── BrowserPersonaRunner  Chromium fallback (patchright)
  ↓
Storage layer (src/personas/storage.ts)
  ~/.openai-ads/personas/<id>/
    identity.json        public, plaintext
    credentials.bin      AES-256-GCM ciphertext
    state.bin            AES-256-GCM ciphertext
    proxy.json           (in identity.json; here for reference)
    conversations/*.json full conversation trees
    audit/<yyyy-mm>.jsonl append-only
  ~/.openai-ads/index.json  fast lookups
```

### The runtime for a single `--probe` call

```
probe(prompt, personaId)
  → PersonaManager.getClient(id)
    → ensureValidSession()            cached → /api/auth/session via impers
    → ChatGPTClient constructed
  → client.probe(prompt)
    → acquireSentinelProof()          SHA3-512 PoW, ~1s
    → POST /backend-api/conversation  SSE stream
    → parse SSE → yield StreamChunks
    → extractAdsFromHtml(chunk.html)  reuses src/scraper/client.ts
  → persist result: history.adsSeen, operational.totalProbes
  → release lock
```

Total wall clock: **3-5s per probe** (vs 10-15s with the old
Playwright-per-probe design).

---

## 4. Code map

```
src/personas/
├── index.ts                    # public API barrel
├── types.ts                    # all interfaces (branded ids, Persona, etc.)
├── crypto.ts                   # AES-256-GCM + HKDF key derivation
├── storage.ts                  # atomic 0600 writes, encrypted blobs, audit log
├── lock.ts                     # per-persona async mutex
├── manager.ts                  # PersonaManager orchestrator
├── registry.ts                 # index.json maintenance
├── fingerprint.ts              # @apify/fingerprint-generator wrapper, seeded
├── multi-batch.ts              # parallel multi-persona batch runner
├── cli.ts                      # `pnpm personas` command surface
│
├── chatgpt/                    # browserless HTTP client
│   ├── client.ts               # ChatGPTClient: validate/getMe/listConvs/sendMessage/probe
│   ├── messages.ts             # SSE parser (ported from waylaidwanderer)
│   ├── sentinel.ts             # SHA3-512 proof-of-work (ported from PawanOsman)
│   └── types.ts                # Zod schemas for response validation
│
├── browser/                    # FALLBACK ONLY — EDR-detectable
│   ├── runner.ts               # BrowserPersonaRunner
│   └── signup.ts               # patchright + email-code signup flow
│
├── email/
│   └── mailtm.ts               # mail.tm disposable inbox helpers
│
├── proxy/
│   └── pool.ts                 # Oxylabs ISP / residential / datacenter
│
├── health/
│   ├── score.ts                # 0-100 health score with reasons
│   ├── loop.ts                 # HealthDaemon (background probe)
│   └── daemon.ts               # `pnpm personas:health` CLI
│
├── observability/
│   └── log.ts                  # pino with redaction of all secret paths
│
├── seeds/                      # immutable PersonaSeed specs
│   ├── crypto-trader.ts
│   ├── defi-developer.ts
│   ├── api-engineer.ts
│   └── index.ts
│
└── tests/
    └── run.ts                  # 21 unit tests; `pnpm personas:test`
```

---

## 5. Key data shapes

### `Persona` (public, plaintext in `identity.json`)

```ts
{
  version: 2,
  identity: {
    id, label, description, interests, backstory,
    declared: { country, region, city, timezone, locale },
    client: { os, browser, browserVersion, isMobile },
    fingerprintSeed,                // deterministic
    createdAt, createdBy, tags
  },
  fingerprint: {
    userAgent, secChUa, secChUaPlatform, ...,
    screen, viewport, locale, timezone, timezoneOffsetMin,
    hardware, platform, webgl, canvas, audio,
    fonts, plugins, languages
  },
  proxy: { provider, sessionId, description, lastEgress, burned, ... },
  behavioral: { typingWpm, interActionDelayMs, activeHours, ... },
  history: { summaries, adsSeen: { total, byAdvertiser, byTopic } },
  operational: { lastUsed, totalProbes, healthScore, ... }
}
```

### `AuthState` (encrypted in `state.bin`)

```ts
{
  sessionToken,              // __Secure-next-auth.session-token JWE, 30d
  accessToken, accessTokenExp,  // 1h JWT, refreshed via /api/auth/session
  cfClearance, cfClearanceExp,  // 30d Cloudflare cookie, IP+UA+TLS bound
  deviceId,                  // oai-device-id UUID, persistent
  puid,                      // _puid cookie
  lastValidatedAt, health, sessionStartedAt,
  accountState, plan         // OK/BANNED/..., free/plus/pro/team/...
}
```

### `PersonaCredentials` (encrypted in `credentials.bin`)

```ts
{
  email, password,           // null if email-code-only
  mailInbox: { provider, address, inboxId, tokenCipher, lastCheckedAt },
  orgId, accountCreatedAt
}
```

### Encrypted blob format (AES-256-GCM)

```ts
{
  ciphertext, iv, tag,        // base64
  alg: "aes-256-gcm",
  kdf: { name: "hkdf-sha256", salt: <personaId>, info: "persona-v2/<wraps>/v2" },
  sealedAt,
  wraps: "PersonaCredentials" | "AuthState"
}
```

The 32-byte key per blob is derived as
`HKDF-SHA256(masterKey, salt=personaId, info=blob.kdf.info)`. Different
personas cannot decrypt each other's files. Tampering throws.

---

## 6. Configuration

All env-driven. See `.env.example` for the canonical list.

### Required

| Var | Purpose |
|---|---|
| `PERSONA_MASTER_KEY` | 64 hex chars (32 bytes). Encrypts secrets at rest. |

### Optional — OpenAI Ads API (other modules; not needed by personas)

| Var | Purpose |
|---|---|
| `OPENAI_ADS_API_KEY` | For the OpenAI Ads *management* API (separate from the persona system) |
| `MINIMAX_*` | For the LLM agent |
| `OXYLABS_USERNAME` / `OXYLABS_PASSWORD` | For the Oxylabs ChatGPT Scraper (separate from the proxy) |
| `VERSEODIN_API_KEY` | For the VerseOdin ChatGPT Scraper (separate from the proxy) |
| `ADS_LIVE_MODE` | For the agent executor |

### Optional — Personas

| Var | Default | Purpose |
|---|---|---|
| `OPENAI_ADS_HOME` | `~/.openai-ads` | Override personas home directory |
| `OXYLABS_PROXY_USERNAME` | — | If set, persona system uses Oxylabs as proxy |
| `OXYLABS_PROXY_PASSWORD` | — | Required if username is set |
| `OXYLABS_PROXY_TYPE` | `isp` | `isp` \| `residential` \| `datacenter` |
| `OXYLABS_PROXY_COUNTRY` | `US` | cc code (e.g. `US`, `GB`, `DE`) |
| `OXYLABS_PROXY_STATE` | — | e.g. `us-ca` |
| `OXYLABS_PROXY_CITY` | — | e.g. `los_angeles` |
| `OXYLABS_PROXY_TTL_MIN` | `30` | Sticky session TTL in minutes |
| `PERSONA_PROXY_DISABLED` | `false` | Set to `true` to skip proxy entirely (local egress) |
| `PERSONAS_HEALTH_INTERVAL_MS` | `300000` | Health daemon probe interval (5 min) |
| `LOG_LEVEL` | `info` | pino log level |
| `OPENAI_PERSONA_<ID>_MAIL_TOKEN` | — | Required for browser-driven reauth (env key is uppercased persona id with `-` → `_`) |

---

## 7. The proxy

**Endpoint (default):** `isp.oxylabs.io:8001` (Oxylabs ISP, static residential)

**URL format (one per persona):**
```
http://customer-<user>-cc-us[-<state>[-<city>]]-sessid-<persona-id>-<8char-tail>-sesstime-<ttl>:<pw>@isp.oxylabs.io:8001
```

Each persona gets its own `sessid`, which routes to a distinct stable US IP.
Reusing the same `sessid` renews the sticky window. Different personas
→ different IPs. This is the "stable IP per account" requirement from
the architecture.

**Endpoints by type:**
- `isp` → `isp.oxylabs.io:8001` (static residential, ~$2-5/IP/mo)
- `residential` → `pr.oxylabs.io:7777` (rotating pool, ~$15/GB)
- `datacenter` → `dc.oxylabs.io:8001` (cheap, often burned)

**CLI commands:**
- `--proxy-info` shows the pool config
- `--proxy-info <id>` shows a per-persona assignment
- `--proxy-test` tunnels to `ip.oxylabs.io/location` and prints observed IP
- `--rotate-proxy <id>` burns the current sessid, mints a new one

**Cost:** Oxylabs ISP ≈ $100-250/mo for 50 personas (per-IP subscription).
Bandwidth is small per persona (50-200 MB/mo) so it's not the dominant cost.

---

## 8. Operational flow for real ChatGPT accounts

The day-to-day flow is:
1. Capture a real ChatGPT session by logging in once in a browser
2. Extract the `__Secure-next-auth.session-token` cookie value
3. Inject it into a persona's `state.bin` (encrypted with master key)
4. Run `--validate` to confirm it works and the persona is healthy
5. Run `--probe` / `--batch` etc. as needed

**The CLI doesn't currently have an "import session" command.** The
current flow is:
- `pnpm personas --create-account <seed-id>` does full signup via
  Chromium + mail.tm, which *is* an end-to-end account creation flow.
  This is browser-based (EDR-detectable). Run on a personal machine.
- Or: capture a session manually (browser DevTools → Application →
  Cookies → `__Secure-next-auth.session-token`) and inject it into
  `~/.openai-ads/personas/<id>/state.bin` via a small script.

To inject a session manually, the simplest path is to write a tiny
one-off TypeScript file:

```ts
import { PersonaManager } from "./src/personas/index.js";
const pm = new PersonaManager({ masterKeyHex: process.env.PERSONA_MASTER_KEY! });
await pm.init();
const auth = {
  sessionToken: "<captured_JWE>",
  accessToken: null, accessTokenExp: null,
  cfClearance: "<captured_cf_clearance_or_null>",
  cfClearanceExp: cfClearance ? Math.floor(Date.now()/1000) + 30*86400 : null,
  deviceId: "<uuid>",
  puid: null,
  lastValidatedAt: new Date().toISOString(),
  health: "unknown",
  sessionStartedAt: new Date().toISOString(),
  accountState: "UNKNOWN",
  plan: "unknown",
};
await pm.persistAuth("crypto-trader", auth);
```

The `pnpm personas:health` daemon will then validate it within 5 min
and populate `plan` / `accountState` / `health`.

---

## 9. How to extend the system

### Add a new seed

Create `src/personas/seeds/<name>.ts`:

```ts
import { PersonaSeed } from "../types.js";
export const myNewSeed: PersonaSeed = {
  id: "my-new-seed",
  label: "My New Persona",
  description: "What this persona is for",
  interests: ["topic1", "topic2"],
  declared: { country: "US", region: "US-NY", city: "New York", timezone: "America/New_York", locale: "en-US" },
  client: { os: "macos", browser: "chrome", browserVersion: 131, isMobile: false },
  seedPrompts: ["prompt 1", "prompt 2", "prompt 3", "prompt 4"],
  tags: ["tag1", "tag2"],
};
```

Then add to `src/personas/seeds/index.ts`:
```ts
export const PERSONA_SEEDS = [cryptoTrader, defiDeveloper, apiEngineer, myNewSeed];
```

### Add a new audit action

Edit `src/personas/types.ts`, add to the `AuditActionEnum` zod schema.
Then call `pm.audit(id, "my_new_action", reason, meta)` from your code.

### Add a new CLI subcommand

Edit `src/personas/cli.ts`:
1. Add to the `USAGE` string
2. Add a `flag("--foo")` check in `main()`
3. Add an `async function cmdFoo(pm, ...args)` implementation
4. Add a test in `src/personas/tests/run.ts`

### Add a new test

Edit `src/personas/tests/run.ts`, add a `test("name", async () => { ... })`
call. The test framework is hand-rolled; see existing tests for the
pattern (`assert()`, `freshHome()`, `TESTS` array).

### Add a new field to Persona

Edit `src/personas/types.ts`, add to the `Persona` interface.
**Backwards-compat:** if a new field is required, existing `identity.json`
files won't have it. Either:
- Make it optional (`field?: type`)
- Or add a migration in `storage.ts::readIdentity()` that fills defaults

After editing, update `makePersonaFromSeed` in `manager.ts` to populate
the new field, and add tests.

### Swap the default HTTP fetcher

`ChatGPTClient` accepts a `fetcher: HttpFetcher` option. To use `impers`
(TLS-impersonating fetch):

```ts
import { impersFetch } from "impers";  // alpha; pin a specific version
import type { HttpResponse, HttpRequestInit } from "./src/personas/chatgpt/client.js";

const impersFetcher = async (url: string, init: HttpRequestInit): Promise<HttpResponse> => {
  const res = await impersFetch(url, {
    method: init.method ?? "GET",
    headers: init.headers,
    body: init.body,
    impersonate: init.impersonate ?? "chrome131",
    proxy: init.proxy,
  });
  return { status: res.status, ok: res.ok, headers: res.headers, body: res.body, text: () => res.text(), json: () => res.json() };
};
```

Pass it via the `clientFactory` in the manager:
```ts
clientFactory: (persona, auth, ctx) => new ChatGPTClient(persona, auth, {
  fetcher: impersFetcher,
  proxyUrl: ctx.proxyUrl,
}),
```

### Add a new proxy provider

Edit `src/personas/proxy/pool.ts`:
- Add the new type to `ProxyType`
- Add the endpoint in `endpointFor()`
- Add the URL builder branch in `proxyUrlFor()`

---

## 10. Debugging guide

### `pnpm typecheck` fails

Most common causes:
- New dep added to package.json but not installed → `pnpm install`
- Missing `masterKeyHex` validation → check `crypto.ts` format (64 hex)
- New env var referenced in `config.ts` but not set → don't add new
  required vars; always use `optional(name, fallback)` or `process.env.X`

### `pnpm personas:test` fails

- Run with `LOG_LEVEL=debug` to see details
- `freshHome()` cleanup is best-effort; leftover `/tmp/personas-test-*`
  dirs are harmless
- If crypto tests fail, regenerate the master key with
  `pnpm personas --init-keys` (shouldn't matter, but worth a try)

### `--probe` returns `cf_blocked`

The persona's `cf_clearance` is missing, expired, or its IP/UA/TLS don't
match what was used to solve the original challenge. Recovery:
1. `pnpm personas --refresh-cf <id>` (browser, EDR-warning)
2. Or: capture `cf_clearance` manually in a browser, inject into `state.bin`
3. Or: rotate the proxy and try again

### `--probe` returns `session_expired`

The `__Secure-next-auth.session-token` is dead. Recovery:
1. `pnpm personas --reauth <id>` (browser, EDR-warning, needs
   `OPENAI_PERSONA_<ID>_MAIL_TOKEN` set)
2. Or: re-login manually in a browser, capture new sessionToken, inject

### `--probe` returns `banned`

The account is banned. Recovery: archive and create a new persona.
```bash
pnpm personas --archive banned-id
pnpm personas --create-account different-seed
```

### Rate-limited

Gpt-4 has a 40 messages / 3 hours cap on Plus. Switch to `gpt-4o-mini`:
```bash
pnpm personas --probe <id> --prompt "..." --model gpt-4o-mini
```

(Wiring for `--model` flag is in the manager; the client itself accepts
`model` as part of the probe options.)

### Cloudflare 403 even with valid `cf_clearance`

TLS fingerprint mismatch. Two paths:
- Run with `impers` (TLS-impersonating fetch)
- Run the browser fallback (`--refresh-cf` from a clean state)

### Persona is corrupted on disk

`identity.json` is plaintext and repairable. `credentials.bin` /
`state.bin` are AES-GCM with auth tags — if any byte is corrupted, the
tag check fails and decryption throws. Recovery:
- If `identity.json` is intact: re-derive credentials by re-signing-up
  with the same persona id (or capture a new sessionToken)
- If `identity.json` is corrupted: delete the dir, create a new persona
  with the same id, capture new state

---

## 11. Security & safety

### What this system does NOT do

- Does NOT create accounts without `mail.tm` (real email signup is not
  implemented; you'd have to write a new `mailtm` provider for that)
- Does NOT solve Arkose / FunCaptcha (we send `arkose_token: null` and
  hope; for high-value models this fails)
- Does NOT call the agent's `Minimax` LLM (that lives in `src/agent/`,
  which is a separate module)
- Does NOT touch the OpenAI Ads *management* API (that lives in
  `src/ads/`)

### What it does store on disk

- **Plaintext:** `identity.json` (fingerprint, proxy assignment,
  operational metadata, history, behavioral model — no secrets)
- **Encrypted:** `credentials.bin` (email, password, mail.tm token),
  `state.bin` (sessionToken, accessToken, cfClearance, deviceId)
- **Audit log:** `audit/<yyyy-mm>.jsonl` (append-only)

The master key is in `.env` (mode 0600) or wherever the user keeps
`PERSONA_MASTER_KEY`. If you sync `.openai-ads/` to cloud, ensure
`PERSONA_MASTER_KEY` is NOT in the same sync.

### Browser commands and EDR

The browser commands (`--create-account`, `--reauth`, `--refresh-cf`)
launch Chromium with automation plugins. On EDR-protected machines
(CrowdStrike Falcon, SentinelOne, etc.) these can be flagged. Mitigation:
- Run on a personal laptop, VPS, or VM without the EDR agent
- The CLI prints an EDR warning before running these commands

### What is and isn't rate-limited

- Per-account: gpt-4 has a 40 / 3h cap on Plus; gpt-4o-mini is much
  higher; free tier is 16 / day
- Per-IP: Cloudflare Bot Management may challenge if the IP is fresh
- Per-OpenAI-account: `POST /backend-api/conversation` is gated by
  Sentinel proof-of-work (~1s compute) and sometimes Arkose

---

## 12. Testing

```bash
pnpm personas:test
```

21 hand-rolled unit tests, no test framework:

- **crypto** (3): round-trip, tamper-detection, wrong-key-fail
- **manager** (1): create → load → audit → archive
- **sse** (2): `[DONE]` marker, multi-line event
- **sentinel** (2): PoW produces a token, respects difficulty
- **health** (4): healthy score ~100, banned score 0, cf-blocked
  issues, buildReport shape
- **proxy** (9): ISP URL format, residential endpoint, no-creds
  no-URL, disabled no-URL, geo chain, rotation, idempotency, TTL,
  markBurned

The tests do NOT touch the network. They use the global `fetch` and
mock SSE streams.

---

## 13. File a change

The persona system is **self-contained** in `src/personas/`. It only
imports from:
- `src/scraper/types.js` — the `AdCard` type
- `src/scraper/client.js` — the `extractAdsFromHtml` function

If you change the persona system, keep these in mind:
- `extractAdsFromHtml` is the only public dependency on the rest of the
  codebase. If you change its signature, you must change the persona
  system's call sites.
- All persona system paths live under `src/personas/` and
  `~/.openai-ads/`. The old `src/playwright-scraper/` is unchanged.
- After changes, run `pnpm typecheck && pnpm personas:test`. Both must
  pass.

### Commit + push

```bash
git status                                  # see what's changed
git add src/personas/ PERSONA_ARCHITECTURE.md src/personas/SKILL.md  # never touch the unrelated files
git -c user.email=<you> -c user.name=<you> -c commit.gpgsign=false commit -m "<msg>"
git push origin feat/persona-v2
```

> GPG signing is disabled in this repo's environment. If your local
> git config has `commit.gpgsign=true`, set the `-c commit.gpgsign=false`
> flag for these commits or add `~/.gitconfig`:
> ```ini
> [gpg]
>     format = ssh
> ```

---

## 14. Quick reference

| What | Where |
|---|---|
| Master key | `PERSONA_MASTER_KEY` env var (never on disk) |
| Persona data root | `~/.openai-ads/personas/<id>/` |
| Public record | `~/.openai-ads/personas/<id>/identity.json` |
| Encrypted credentials | `~/.openai-ads/personas/<id>/credentials.bin` |
| Encrypted auth state | `~/.openai-ads/personas/<id>/state.bin` |
| Audit log | `~/.openai-ads/personas/<id>/audit/<yyyy-mm>.jsonl` |
| Fast index | `~/.openai-ads/index.json` |
| Health daemon | `pnpm personas:health` |
| All commands | `pnpm personas --help` |
| Tests | `pnpm personas:test` |
| Architecture doc | `PERSONA_ARCHITECTURE.md` (repo root) |
| Design doc | this file (`src/personas/SKILL.md`) |

---

## 15. Common pitfalls

1. **Forgetting to set `PERSONA_MASTER_KEY`** → CLI exits with a clear
   error pointing to `--init-keys`.

2. **The `ChatGPTClient` is browserless, not authless.** It still needs
   a real `sessionToken` in `state.bin`. Blank personas created with
   `--create` won't work for `--probe` until you bind a real session.

3. **Browser binaries are required for the `[BROWSER]` commands.** If
   `pnpm install` didn't run the post-install scripts for `patchright`,
   the browser commands will fail. Re-run with
   `pnpm approve-builds` and approve `patchright-core`.

4. **`pnpm personas --validate` returns `session_expired` even after
   signup.** The signup flow seeds `sessionToken` from the captured
   cookies, but the cookies only become valid after the
   `__Secure-next-auth.session-token` JWE is issued. If signup was
   incomplete (e.g. phone verification required), the cookie is empty
   and the validate will fail. Re-run signup or capture manually.

5. **Two personas on the same proxy IP.** This happens if the proxy
   pool returns the same `sessid` for two persona ids. By construction
   each persona gets a unique `sessid` (random tail), but if you
   manually edit `proxy.sessionId` in `identity.json` and reuse a
   known-good sessid, you'll link the accounts. Don't.

6. **Cloudflare blocks `chatgpt.com/backend-api/...` from non-browser
   UAs.** This is the reason for the browser fallback. With a valid
   `cf_clearance` cookie, browserless `fetch` works. Without one, you
   get 403. The browser fallback is the way to bootstrap.

7. **Audit log is append-only and rotated monthly.** It's not
   pruned. If you have many personas probing for months, the audit
   log will grow. Add a cleanup task if it becomes a problem.

8. **The `fingerprintSeed` field is a one-way door.** Changing it
   invalidates the per-persona fingerprint determinism. Don't
   regenerate fingerprints for an existing persona; create a new one
   instead.

9. **The `behavior.jsonl` file is best-effort.** It's only written
   when the browser is run. If you never run a `[BROWSER]` command,
   the file won't exist. That's fine.

10. **Master key rotation requires re-encrypting every file.** If
    you change `PERSONA_MASTER_KEY`, you must re-run
    `--create` for every persona (or write a small script that
    decrypts with the old key and re-encrypts with the new).
    The CLI doesn't currently have a `--rotate-master-key` command.
