# Persona System — End-to-End Agent Runbook

> **Audience:** an agent (human or AI) who has never seen this codebase
> before and needs to take it from a clean clone to a working
> scrape-ads-via-personas pipeline.
>
> **Goal:** By the time you finish the runbook, you have N personas
> with real sessions, you've probed them with M prompts, and the ads
> ChatGPT showed them are persisted to disk for analysis.
>
> **Time:** ~15 minutes for the setup + binding; ~30 seconds per probe
> after that.
>
> **Companion docs:**
> - `SKILL.md` — operating reference, code map, debugging
> - `MAILTM_ALTERNATIVES.md` — email provider contingency plan
> - `../PERSONA_ARCHITECTURE.md` — design rationale (read if curious)
>
> **Read this file top to bottom. Do not skip steps. Each step has a
> "what success looks like" gate before the next step. If a step
> fails, stop and consult `SKILL.md` §10 (Debugging guide) before
> continuing.**

---

## The shape of the runbook

There are **two flows** the system supports, and you'll do both:

```
Flow 1 — GENERATE PERSONAS
   create → store on disk → bind real session

Flow 2 — PROBE + SCRAPE
   load → validate session → send prompt → extract ads → persist

Optionally, in parallel:
   pnpm personas:health   (keep personas alive 24/7)
```

You'll do Flow 1 once per persona (or per session, every ~30 days).
You'll do Flow 2 many times per day per persona, batched or one-off.

---

## Pre-flight: what you need before you start

| Requirement | How to verify |
|---|---|
| Node.js 22+ | `node --version` |
| pnpm 10.12.4+ | `pnpm --version` |
| Git | `git --version` |
| ~500MB free disk | `df -h ~/.openai-ads` |
| 5 minutes | — |

You do **not** need:
- ❌ A ChatGPT account (yet — Step 1.6 binds one)
- ❌ mail.tm (yet — only needed for browser signup)
- ❌ A working internet connection to ChatGPT (Flow 1 itself is offline)

You **do** need (before any network call to `chatgpt.com`):
- ✅ **Oxylabs ISP proxy credentials** — see Step 1.4. Without these,
  Cloudflare will block every request from your home IP. **Do not
  skip this step.** It is not optional.

---

## Why a proxy is mandatory

`chatgpt.com` is behind Cloudflare Bot Management. From a residential
IP (your home WiFi), the Cloudflare edge will:

- **Block** most requests with HTTP 403 ("Just a moment..." challenge page)
- **Challenge** even successful ones with a Turnstile CAPTCHA that has to be solved in a real browser
- **Flag** repeated requests from the same IP, even if they succeed
- **Geo-link** personas — without a proxy, every persona is "the same person from the same home," which is exactly what an anti-fraud system looks for

The persona system uses Oxylabs **ISP proxies** (static residential IPs
that don't rotate within a session) so each persona gets its own
stable US IP. The system is wired for it from day one; you just need
to put credentials in `.env` before any network call.

**The proxy is not "Step 3 (optional)".** It is a prerequisite for
anything that talks to `chatgpt.com`. Flow 1.4 (creating personas
offline) doesn't need it, but every step from 1.5 onward does.

If you don't have Oxylabs yet, see the "without Oxylabs" workaround
in Step 1.4 — it's a slower path but it works.

---

## Flow 1 — Generate personas

### Step 1.0: Clone the repo

```bash
git clone https://github.com/AkshatGada/openai-ads.git
cd openai-ads
git checkout feat/persona-v2
```

**Success gate:** the working directory contains `src/personas/`,
`PERSONA_ARCHITECTURE.md`, and `package.json`.

### Step 1.1: Install dependencies

```bash
pnpm install
```

**Success gate:** `pnpm install` exits 0, `node_modules/` exists,
no `ELIFECYCLE` errors. If `patchright` post-install scripts are
blocked, run `pnpm approve-builds` and approve `patchright-core`.

### Step 1.2: Verify the install

```bash
pnpm typecheck
```

**Success gate:** exits 0, no output. If you see errors in
`src/analyzer/cleaner-v2.ts`, those are pre-existing in unrelated
work and can be ignored for the persona system. You should see **zero
errors in `src/personas/`**.

```bash
pnpm personas:test
```

**Success gate:** `21 passed, 0 failed`. These tests are pure
unit tests, no network.

```bash
pnpm personas --help
```

**Success gate:** the help text renders with all 16 subcommands,
no crash, the seed list shows `crypto-trader / defi-developer / api-engineer`.

### Step 1.3: Generate the master key

The persona system needs **one secret**: a 32-byte key (64 hex chars)
used to AES-256-GCM-encrypt credentials and sessions on disk.

```bash
pnpm personas --init-keys
# → prints a 64-char hex key
# e.g. a4f8c1d92b6e7f3a5c8d9e0b1f2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
```

Copy the printed key to your `.env`:

```bash
echo "PERSONA_MASTER_KEY=<paste-key-here>" >> .env
chmod 600 .env
```

**Success gate:** `.env` exists, contains `PERSONA_MASTER_KEY=...`,
mode 0600. You can re-run `pnpm personas --init-keys` as many times
as you like; it just prints a new random key. The persona system
**will not** read the key from anywhere else — only `.env`.

> ⚠️ **Back this key up.** If you lose it, every persona's
> `credentials.bin` and `state.bin` become unreadable. The
> `identity.json` is plaintext so you can see who the personas were,
> but you cannot reuse the credentials or sessions without the key.
> 1Password / Bitwarden / encrypted USB — pick one.

### Step 1.4: Set up the proxy (mandatory before any chatgpt.com call)

The persona system needs an **Oxylabs ISP proxy** to talk to
`chatgpt.com`. Without it, Cloudflare blocks every request from your
home IP. This step is **not optional** — do not proceed to Step 1.6
until this passes.

**1. Get Oxylabs ISP creds.** Sign up at `https://oxylabs.io` (ISP
product, not residential — ISP is static residential IPs that don't
rotate). Cost is roughly $2-5 per IP per month. You'll get a
`username` (the part after `customer-`) and a `password`.

**2. Add to `.env`:**

```bash
cat >> .env <<'EOF'
OXYLABS_PROXY_USERNAME=<your_username>
OXYLABS_PROXY_PASSWORD=<your_password>
OXYLABS_PROXY_TYPE=isp
OXYLABS_PROXY_COUNTRY=US
OXYLABS_PROXY_TTL_MIN=30
EOF
chmod 600 .env
```

> If you set `OXYLABS_PROXY_COUNTRY=US` (the default), every
> persona will get a US static residential IP. Set it to whatever
> country your personas' `declared.country` is.

**3. Verify the proxy works:**

```bash
pnpm personas --proxy-test
```

**Success gate:** the output shows a US IP that is **not** your
home IP:

```
Testing proxy: http://customer-<user>-cc-us-sessid-...:***@isp.oxylabs.io:8001
Hitting https://ip.oxylabs.io/location through the proxy...
✅ Proxy is working. Observed egress:
   ip:        47.223.xx.xx
   country:   US
   region:    California
   city:      Los Angeles
   timezone:  America/Los_Angeles
```

**4. Inspect the pool config:**

```bash
pnpm personas --proxy-info
```

**Success gate:**

```
Proxy pool configuration:
  type:    isp
  country: US
  ttl:     30 min
  user:    set
  pass:    set
```

If `--proxy-test` fails:

| Failure | Fix |
|---|---|
| `CONNECT 401` | Wrong username/password. Check Oxylabs dashboard. |
| `CONNECT 407` | Proxy needs to be activated / not in good standing. |
| `ETIMEDOUT` | Your firewall or ISP is blocking outbound to `isp.oxylabs.io:8001`. Try from a different network. |
| `ENOTFOUND` | DNS issue. Check your internet connection. |
| `407 Proxy Authentication Required` | Username format. Oxylabs wants just `<username>`, NOT `customer-<username>`. The CLI prepends `customer-` automatically. |

#### Without Oxylabs (workaround, slower)

If you don't have Oxylabs yet and just want to test the system, you
can run with **no proxy** by setting:

```bash
echo "PERSONA_PROXY_DISABLED=true" >> .env
```

This makes the system send traffic from your home IP. Cloudflare
will likely block every request. You can use this to:
- Test that `--create`, `--list`, `--status`, `--dump` work (offline)
- Test that the persona architecture is correct end-to-end without a real ChatGPT session bound

You **cannot** use this to actually probe ChatGPT. The moment
you try `--validate` or `--probe` without a proxy, you'll get
`http_403` (Cloudflare challenge) or `cf_blocked` (server-side
block). When that happens, either:
- Sign up for Oxylabs ISP ($2-5/IP/mo, takes 5 minutes)
- Or: use the browser fallback (`--refresh-cf` / `--reauth`) to capture a `cf_clearance` from a real browser session, which sometimes works for short probe bursts

**Do not proceed to Step 1.6 without either a working proxy or
acceptance that the system will be Cloudflare-blocked.**

### Step 1.5: Create personas (offline, no network)

```bash
pnpm personas --create crypto-trader
pnpm personas --create defi-developer
pnpm personas --create api-engineer
pnpm personas --list
```

**Success gate:** the `--list` output shows three rows with
`SCORE=50 PROBES=0`. Each `--create` should print:

```
Created persona "Crypto Day Trader" (crypto-trader)
  on disk:  /home/<you>/.openai-ads/personas/crypto-trader
  next:     pnpm personas --status crypto-trader
```

Verify on disk:

```bash
ls ~/.openai-ads/personas/
# crypto-trader  defi-developer  api-engineer

ls ~/.openai-ads/personas/crypto-trader/
# identity.json  credentials.bin  state.bin  audit/

cat ~/.openai-ads/personas/crypto-trader/identity.json | head -30
# → JSON with identity, fingerprint, proxy, behavioral, history, operational
```

**What's stored:**
- `identity.json` (~5KB) — plaintext; the persona's declared identity, fingerprint, behavioral model
- `credentials.bin` (~150B) — AES-GCM ciphertext of empty credentials (no real account yet)
- `state.bin` (~150B) — AES-GCM ciphertext of empty session state
- `audit/2026-06.jsonl` — one line: `{ts, action: "created", reason: "from seed crypto-trader"}`

Each persona is **~5-10KB on disk**. The previous design was
200-500MB per persona (a Chrome user-data-dir). The new design
is ~250x smaller.

### Step 1.6: Bind a real ChatGPT session

This is the **only step that needs an active ChatGPT account** and,
for the autonomous path, **the only step that uses a browser.**

You have two options. Pick one.

#### Option A — Autonomous browser signup (recommended for dev)

```bash
pnpm personas --create-account crypto-trader
```

This is the magic. The system:

1. Creates a `mail.tm` disposable inbox like `crypto-trader-7f3c@mail.tm`
2. Launches Chromium with the persona's fingerprint (User-Agent, screen size, WebGL renderer, etc.)
3. Drives the email-code signup flow on `chatgpt.com`
4. Polls `mail.tm` every 5 seconds for the 6-digit code OpenAI sends
5. Extracts the code from the email body
6. Types it into ChatGPT
7. Captures the `__Secure-next-auth.session-token` and `cf_clearance` cookies
8. Seals them into `state.bin` (encrypted with the master key)
9. Closes the browser

Takes ~60-90 seconds. Run it for each persona.

**Success gate:** the command exits with
`✅ Created account for "<label>" (<id>)`.

> ⚠️ **Use sparingly.** Creating accounts via disposable emails
> violates ChatGPT's TOS. This is fine for development and
> testing, but for production scraping you should use your own
> paid accounts via Option B.

#### Option B — Manual capture of your own account (recommended for production)

1. Open `https://chatgpt.com` in any browser
2. Log in with your own ChatGPT account
3. Open DevTools → **Application** → **Storage** → **Cookies** → `https://chatgpt.com`
4. Find the cookie named `__Secure-next-auth.session-token` and **copy its value** (it's a long JWE-looking string, ~1-2KB)
5. (Optional but recommended) Find the cookie named `cf_clearance` and copy its value
6. Bind it to a persona via this script (one-off, no browser on this machine):

```typescript
// inject-session.ts — run with: pnpm tsx inject-session.ts
import { PersonaManager } from "./src/personas/index.js";

const pm = new PersonaManager({
  masterKeyHex: process.env.PERSONA_MASTER_KEY!,
});
await pm.init();

const sessionToken = process.argv[2];
const cfClearance = process.argv[3] ?? null;
const personaId = process.argv[4] ?? "crypto-trader";

if (!sessionToken) {
  console.error("Usage: pnpm tsx inject-session.ts <sessionToken> [cfClearance] [personaId]");
  process.exit(1);
}

await pm.persistAuth(personaId as any, {
  sessionToken,
  accessToken: null,
  accessTokenExp: null,
  cfClearance,
  cfClearanceExp: cfClearance
    ? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    : null,
  deviceId: crypto.randomUUID(),
  puid: null,
  lastValidatedAt: new Date().toISOString(),
  health: "unknown",
  sessionStartedAt: new Date().toISOString(),
  accountState: "UNKNOWN",
  plan: "unknown",
});
console.log(`✅ Bound session to ${personaId}`);
```

```bash
pnpm tsx inject-session.ts "eyJhbGciOiJkaXIiLCJlbmMiOiJkaXIi..." "cf_clearance_value..."
```

**Success gate:** `✅ Bound session to crypto-trader`.

#### Verify either option

```bash
pnpm personas --validate crypto-trader
```

**Success gate for a healthy session:**
```
✅ crypto-trader: health=healthy accountState=OK plan=plus email=you@example.com
```

**Failure modes (and what to do):**

| Output | Meaning | Fix |
|---|---|---|
| `❌ crypto-trader: session_expired` | Session token is dead | Re-run Option A or B |
| `❌ crypto-trader: cf_blocked` | Cloudflare challenge | `pnpm personas --refresh-cf crypto-trader` (browser) |
| `❌ crypto-trader: http_403` | Wrong IP / bad TLS | Set up the Oxylabs proxy (Step 1.4) and retry |

---

## Flow 2 — Probe personas and generate activity

### Step 2.0: Pick your probe surface

You have four options. Pick based on what you want to learn.

| Command | Use when | Format |
|---|---|---|
| `--probe <id> -p "..."` | testing a single prompt | inline |
| `--batch <id> <file>` | one persona, many prompts, fresh conv each | one prompt per line |
| `--converse <id> <file>` | one persona, threaded conversation | one turn per line |
| `--multi-batch <file>` | many personas, many prompts, parallel | `persona\|prompt` per line |

For the first run, use `--probe` to confirm the system works end-to-end.

### Step 2.1: Run your first probe

```bash
pnpm personas --probe crypto-trader --prompt \
  "I'm evaluating stablecoin payment APIs for cross-border settlement — what handles KYC + custody + on-chain settlement in one integration?"
```

**What happens (in order, browserless):**

1. `PersonaManager.getClient("crypto-trader")` acquires the per-persona lock
2. `ensureValidSession` calls `GET chatgpt.com/api/auth/session` with the session token; if the access token is fresh, reuse it; if expired, refresh it (~1 HTTP call)
3. `acquireSentinelProof` calls `POST /backend-anon/sentinel/chat-requirements`, computes the SHA3-512 proof-of-work (~1s CPU), and returns the proof token
4. `ChatGPTClient.sendMessage` calls `POST /backend-api/conversation` with the bearer token + sentinel proof + message body
5. The response is `text/event-stream`; `parseSSE` yields typed `StreamChunk` events as they arrive
6. For any chunk whose `content.parts` contains ad HTML (`data-ad-card-root` marker), `extractAdsFromHtml` regex-scrapes it
7. The final `ProbeResult` is returned; the persona's `history.adsSeen` and `operational.totalProbes` are updated; an audit entry is written

**Success gate:** output looks like:

```
prompt:    I'm evaluating stablecoin payment APIs for cross-border settlement — ...
model:     gpt-4o
elapsed:   4231ms
conv id:   conv-abc-123
msg id:    msg-xyz-789
ads found: 2
  🔴 BestMoney: "Get 4.5% APY on idle cash"
  🔴 Robinhood: "Put Your Cash to Work"
text:      There are several stablecoin payment APIs...
```

Total wall clock: **3-5 seconds** (was 10-15s with the old Playwright-per-probe design).

If you see `❌ ...` or the probe hangs, see `SKILL.md` §10 (Debugging guide).

### Step 2.2: Run a batch

Write a file with one prompt per line:

```bash
cat > prompts.txt <<'EOF'
What's the best stablecoin payment API for cross-border settlement?
Comparing Circle vs Fireblocks for custody
How do I move USD to USDC on Polygon cheaply?
What's the best way to handle KYC for a stablecoin product?
EOF

pnpm personas --batch crypto-trader prompts.txt
```

**Success gate:** 4 lines of output, each ending with
`ads=N t=Nms` (and `🔴 <advertiser>: "<title>"` if ads were found). At
the end, `DONE. N ads across 4 prompts.`

### Step 2.3: Run multi-persona in parallel

Write a file with `persona|prompt` per line:

```bash
cat > jobs.txt <<'EOF'
crypto-trader|I'm evaluating stablecoin payment APIs for cross-border settlement
crypto-trader|What's the best exchange API for trading bots?
defi-developer|What's the most reliable Ethereum RPC provider?
defi-developer|Best on-chain data indexing API for real-time position monitoring
api-engineer|API gateway comparison: Kong vs Tyk vs AWS API Gateway
api-engineer|Open-source Datadog alternatives for observability at scale
EOF

pnpm personas --multi-batch jobs.txt --concurrency 3
```

**Success gate:** 6 lines of output, each ending with
`ads=N t=Nms`. The `--concurrency 3` means 3 personas run in
parallel; the other 3 wait. Total wall clock: ~10-15s for 6 probes
across 3 personas.

**Verify the activity was persisted:**

```bash
pnpm personas --status crypto-trader
# Look for: probes: 3, conv: 3, ads seen: 2, healthScore: 100

pnpm personas --audit crypto-trader
# Shows: created, session_obtained, session_refreshed, used, ...
```

### Step 2.4: Inspect what was scraped

The ads are in the `ProbeResult` returned programmatically. If you
want them on disk, the persona system writes conversation summaries
to `~/.openai-ads/personas/<id>/conversations/<convId>.json`. The
ad HTML is in the SSE stream and accessible via the programmatic
API (`ChatGPTClient.probe().html`).

---

## Step 3 (optional but recommended) — Background health daemon

Keeps every persona's session fresh, updates health scores, and
catches `cf_blocked` / `session_expired` within 5 minutes instead of
discovering them at 2am when a probe hangs.

```bash
# In a dedicated terminal (or under tmux/screen/nohup)
pnpm personas:health
```

**Success gate:** the daemon logs probe results every 5 minutes:

```
{"level":"info","persona":"crypto-trader","valid":true,"health":"healthy","score":100,"ads":[],"issues":[],"msg":"probe complete"}
```

Press Ctrl-C to stop.

---

## What success looks like at the end of the runbook

After completing all of Flow 1 + Flow 2 + (optionally) Step 3,
you should have:

- ✅ 3 personas on disk (`~/.openai-ads/personas/{crypto-trader,defi-developer,api-engineer}/`)
- ✅ Each persona has a real `sessionToken` in `state.bin` (encrypted with `PERSONA_MASTER_KEY`)
- ✅ Each persona was bound through the Oxylabs ISP proxy (Step 1.4 verified)
- ✅ Each persona has been probed 2-4 times with real ChatGPT responses
- ✅ Some probes have surfaced ads (the `AdCard` shape you wanted)
- ✅ The persona records show the accumulated activity: `probes: 3, ads seen: 2, healthScore: 100`
- ✅ The audit log shows every action taken
- ✅ Each persona has its own US egress IP (different `sessid` → different IP)

If any of those checkmarks are missing, re-read the step that
should have produced it. The success gates are explicit; if a
gate fails, the next step will not work.

---

## Quick reference: the 8 commands you'll use most

```bash
# Flow 1: create + bind
pnpm personas --create <seed>           # offline
pnpm personas --create-account <seed>   # browser, ~60-90s
pnpm personas --validate <id>          # check session is alive

# Flow 2: probe + scrape
pnpm personas --probe <id> -p "..."     # single
pnpm personas --batch <id> file        # many, one persona
pnpm personas --multi-batch file       # many, many personas, parallel

# Maintenance
pnpm personas --list                   # table of all personas
pnpm personas --status <id>            # one persona, full detail
pnpm personas:health                   # background daemon
```

That's it. The other 8 commands (`--archive`, `--audit`,
`--converse`, `--dump`, `--health`, `--init-keys`, `--proxy-info`,
`--proxy-test`, `--refresh-cf`, `--reauth`, `--rotate-proxy`)
are explained in `SKILL.md` §2.

---

## What to do when something goes wrong

| Symptom | First thing to try | If that fails |
|---|---|---|
| `pnpm install` fails on `koffi` | `pnpm approve-builds` | Re-clone and retry |
| `pnpm typecheck` has errors in `src/personas/` | Re-run `pnpm install` | Re-clone |
| `pnpm typecheck` has errors elsewhere | Ignore them (pre-existing, unrelated) | Continue |
| `--create` writes no files | Check `PERSONA_MASTER_KEY` is set | Re-run `--init-keys` |
| `--validate` returns `session_expired` | Re-bind session (Flow 1.5) | Re-create persona |
| `--validate` returns `cf_blocked` | `pnpm personas --refresh-cf <id>` (browser) | Set up the proxy (Step 1.4) |
| `--probe` returns 403 | `pnpm personas --proxy-test` to check egress | Set up Oxylabs proxy |
| `--probe` returns 429 (rate limit) | Switch to `gpt-4o-mini` (or wait) | Reduce `--concurrency` |
| `--probe` returns no ads | Persona is on Free tier (no ads shown) | Use a Plus/Pro account |
| `--create-account` fails on mail.tm | Check the alt-providers doc | Switch to 1secmail |

If none of the above resolves it, read `SKILL.md` §10 (Debugging
guide) and §11 (Security & safety) for the full list.

---

## Definition of done

You are done with this runbook when:

1. `pnpm typecheck` exits 0
2. `pnpm personas:test` reports `21 passed, 0 failed`
3. `pnpm personas --list` shows N personas
4. `pnpm personas --validate <id>` returns `✅ ... health=healthy` for each
5. `pnpm personas --multi-batch jobs.txt` runs to completion and surfaces at least one ad card
6. `pnpm personas --status <id>` shows `probes > 0, ads seen > 0`

When all six are true, you have a working persona-based ad-scraping
pipeline. From here, the day-to-day operation is:

```bash
pnpm personas --multi-batch jobs.txt     # scrape
pnpm personas:health                     # keep alive
```

That's the system. Run the runbook top to bottom, verify each
gate, and you will end with a working pipeline.
