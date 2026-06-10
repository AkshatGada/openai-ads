# Persona Account System v2 — Architecture & Build Spec

> **Audience:** the engineer who picks this up next week.
> **Status:** Architecture Decision Record + working spec.
> **Date:** 2026-06-10.
> **Replaces:** `src/playwright-scraper/{client,profiles,email,index}.ts` and the
> three hardcoded personas in `src/playwright-scraper/personas/`.
> **Goal:** A persona is a *bundle of state*, not a Chrome profile. 95% of probe
> traffic flows through Node-only HTTP. The browser is only used for
> account creation, cf_clearance refresh, and full re-auth.

---

## 0. Why we're doing this

Today, `pnpm playwright --probe <persona> "<prompt>"` does the following for
every single prompt:

1. Launches a headless Chromium with `playwright-extra` + stealth plugin
   (`client.ts:1-14`).
2. Spins up a `userDataDir` at `browser-profiles/<name>/`, restored from disk
   (`client.ts:69-83`).
3. Loads cookies from disk, navigates to `chatgpt.com`, waits for `networkidle`,
   waits 2 seconds (`client.ts:84-95`).
4. Reads the rendered DOM to find the prompt textarea (six selectors tried
   in order, `client.ts:127-144`).
5. Types the prompt, clicks send, waits for the stop button to disappear
   (`client.ts:171-184`).
6. Waits up to 5 seconds for ad cards to render (`client.ts:187-198`).
7. Serializes the **entire page DOM** to HTML (`client.ts:203`), then
   `extractAdsFromHtml` regex-scans it (`src/scraper/client.ts:100-150`).
8. Closes the browser. Updates `meta.json`.

The cost per probe: **2-5s startup + 5-15s probe + 300-500MB RSS** (the bulk
of which is the Chromium process). For a 50-prompt batch this is
**~7-15 minutes wall clock and ~15GB·s of RSS, per persona, per batch.**

What's even worse: the *output* of step 7 is the same HTML we'd get if we
called `POST /backend-api/conversation` from Node — because the ads render
server-side and the HTML is shipped down in the SSE stream. The browser is
only doing (a) TLS fingerprint management, (b) cookie/session bookkeeping,
and (c) DOM rendering for the regex scraper.

We can do all three of those in Node.

The browser is still required exactly three times in a persona's life:

1. **Account creation** (the email-code flow needs JS to render, and
   Cloudflare Turnstile on signup is a JS challenge).
2. **cf_clearance refresh** (Cloudflare's clearance cookie is only minted
   by a real browser solving a real challenge).
3. **Full session re-auth** (when the 30-day `__Secure-next-auth.session-token`
   JWE expires, or when the user gets a forced logout).

In v2, every other operation goes through Node + `impers` (curl-impersonate
for Node). Expected steady-state: **< 1% of operations need a browser**.

---

## 1. First-principles reframe

A **persona account** is *not* a Chrome user-data-dir. It is a bundle of four
independent things:

1. **Identity.** A declaration of who this persona is — geo, locale, OS,
   browser, "ICP", "interests", "buying signals". The persona as a *concept*.
   Immutable, copied from a versioned seed.
2. **Credentials.** How the persona logs in to ChatGPT — email, password
   (or email-code-only), mail.tm inbox mapping, optional OAuth.
3. **Auth state.** Live session: sessionToken (JWE), accessToken (JWT),
   cfClearance (Cloudflare), deviceId (oai-device-id UUID), puid (the
   long-lived identifier cookie). **Volatile** — these rotate and expire.
4. **Behavioral model + history.** Typing speed, mouse curve, conversation
   thread summaries, "interests learned from past conversations", ad-relevance
   scores for past prompts, timezone of activity, proxy assignment.

The browser is *one tool that can act as the account*. So is `impers`.
So is `tls_client` in Python. The choice of tool is a runtime decision
based on (a) what cookies we have, (b) whether cf_clearance is fresh,
(c) what Cloudflare is currently willing to do for our egress IP, and
(d) what we need to do (a fresh conversation with ad personalization
based on this morning's browsing needs a browser; a simple "send prompt
X and extract ads" only needs `impers`).

The account lives in a directory. The browser profile is a *cache*, not
the source of truth.

---

## 2. The Persona data model

```ts
// src/personas/types.ts
// ────────────────────────────────────────────────────────────────────
// Persona v2 — opinionated, version-tagged, scoped for multi-client use.
// ────────────────────────────────────────────────────────────────────

export const PERSONA_VERSION = 2 as const;

export type PersonaId = string & { readonly __brand: 'PersonaId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };

export type ChatGptPlan = 'free' | 'go' | 'plus' | 'pro' | 'team' | 'enterprise' | 'unknown';
export type AccountState = 'OK' | 'TRIAL_AVAILABLE' | 'BANNED' | 'RATE_LIMITED'
                        | 'SOFT_BANNED' | 'MFA_REQUIRED' | 'UNKNOWN';
export type SessionHealth = 'healthy' | 'cf_blocked' | 'session_expired'
                          | 'banned' | 'rate_limited' | 'unknown';

// ═════════ Identity (immutable, copied from a seed) ═══════════════
export interface PersonaIdentity {
  /** Stable, slug-cased id used in paths. e.g. "crypto-trader-us-east". */
  id: PersonaId;

  /** Human-readable label for the dashboard. */
  label: string;

  /** Free-form description; what this persona is "for". */
  description: string;

  /** IAB-style or custom topic tags used for ad-relevance scoring. */
  interests: string[];

  /** Optional persona "story" that the seed-conversation generator consumes. */
  backstory?: string;

  /** Declared (and pinned) geo for Cloudflare, ads, and consistency. */
  declared: {
    country: string;          // ISO 3166-1 alpha-2, e.g. "US"
    region?: string;          // ISO 3166-2, e.g. "US-CA"
    city?: string;            // e.g. "San Francisco"
    timezone: string;         // IANA, e.g. "America/Los_Angeles"
    locale: string;           // e.g. "en-US"
  };

  /** Declared client environment (drives UA, client hints, screen, fonts). */
  client: {
    os: 'macos' | 'windows' | 'linux';
    browser: 'chrome' | 'edge' | 'safari' | 'firefox';
    browserVersion: number;       // e.g. 131
    isMobile: boolean;
  };

  /** A seed used to deterministically derive the fingerprint. */
  fingerprintSeed: string;       // e.g. "crypto-trader-2026-06-10-7f3c"

  createdAt: string;             // ISO
  createdBy?: string;            // user/agent id
  tags: string[];                // free-form: ["finance", "high-intent"]
}

// ═════════ Credentials (encrypted at rest) ════════════════════════
export interface PersonaCredentials {
  /** Email used to log in to chatgpt.com. */
  email: string;

  /** Password, if the account has one. Null for email-code-only accounts. */
  password: string | null;

  /** mail.tm mapping (or other disposable inbox provider). */
  mailInbox: {
    provider: 'mail.tm' | '1secmail' | 'imap';
    address: string;
    inboxId: string;
    tokenCipher: string;        // AES-GCM of the bearer token
    lastCheckedAt: string;
  } | null;

  /** Optional: ChatGPT "team" or "org" id for Team plans. */
  orgId?: string;
}

// ═════════ Auth state (live, volatile) ════════════════════════════
export interface AuthState {
  /** __Secure-next-auth.session-token (JWE). ~30d TTL. The "long" credential. */
  sessionToken: string;

  /** accessToken (JWT) from /api/auth/session. ~1h TTL. The "short" credential. */
  accessToken: string | null;
  accessTokenExp: number | null;     // unix seconds

  /** cf_clearance (Cloudflare). ~30d TTL, IP+UA+TLS bound. */
  cfClearance: string | null;
  cfClearanceExp: number | null;

  /** oai-device-id UUID, persistent per persona. */
  deviceId: string;

  /** _puid cookie (long-lived identifier). */
  puid: string | null;

  /** Last successful /api/auth/session probe timestamp. */
  lastValidatedAt: string;

  /** Computed from the most recent probe. */
  health: SessionHealth;

  /** When this session was first established. */
  sessionStartedAt: string;

  /** Ban / suspension / soft-ban signals we have observed. */
  accountState: AccountState;
  plan: ChatGptPlan;
}

// ═════════ Fingerprint (deterministic, NOT secret) ═════════════════
// Generated from identity.fingerprintSeed via @apify/fingerprint-generator
// at persona-create time, then stored. All fields are stable across the
// persona's life. Changing the seed = creating a new persona.
export interface Fingerprint {
  userAgent: string;
  secChUa: string;             // e.g. '"Chromium";v="131", "Not_A Brand";v="24"'
  secChUaMobile: '?0' | '?1';
  secChUaPlatform: string;     // e.g. '"macOS"'

  screen: { width: number; height: number; availWidth: number; availHeight: number; colorDepth: number; pixelRatio: number };
  viewport: { width: number; height: number };

  locale: string;
  timezone: string;
  timezoneOffsetMin: number;

  hardware: { deviceMemory: number; hardwareConcurrency: number; maxTouchPoints: number };
  platform: string;            // e.g. "MacIntel"

  webgl: { vendor: string; renderer: string; unmaskedVendor: string; unmaskedRenderer: string };
  canvas: { noiseSeed: string };   // deterministically applied by injector
  audio: { noiseSeed: string };

  fonts: string[];             // pre-detected available fonts
  plugins: string[];           // e.g. ["PDF Viewer", "Chrome PDF Viewer"]
  languages: string[];         // e.g. ["en-US", "en"]
}

// ═════════ Behavioral model (used when we DO launch the browser) ═══
export interface BehavioralModel {
  /** Mean words-per-minute when typing prompts. Std-dev in `typingWpmStddev`. */
  typingWpm: number;
  typingWpmStddev: number;

  /** Inter-action delay distribution (in ms). */
  interActionDelayMs: { mean: number; stddev: number };

  /** Daily active hours (24h clock, in declared.timezone). */
  activeHours: { start: number; end: number };

  /** Past observed mouse-curve samples (one per session, capped at N=200). */
  mouseCurveSamples: Array<{ t: number; x: number; y: number }>;

  /** Past observed typing-interval samples (capped at N=200). */
  typingSamples: Array<{ promptId: string; wpm: number; charIntervals: number[] }>;
}

// ═════════ Proxy assignment ════════════════════════════════════════
export interface ProxyAssignment {
  provider: 'oxylabs' | 'brightdata' | 'webshare' | 'local' | 'tor';
  /** Session id for sticky-IP residential proxies. */
  sessionId: string;
  /** Human-readable description of what this proxy yields. */
  description?: string;
  /** Egress IP/geo we observed the LAST time we used this proxy. */
  lastEgress?: { ip: string; country: string; region?: string };
  /** True if the proxy has been flagged / banned / is no longer working. */
  burned: boolean;
  burnedReason?: string;
  burnedAt?: string;
}

// ═════════ Conversation history (compressed) ══════════════════════
// Capped at last N=50 summaries. Full conversation trees are kept on
// disk in conversations/<convId>.json for the N=5 most recent, and
// pruned beyond that.
export interface ConversationSummary {
  conversationId: ConversationId;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  /** Topic tags derived from the conversation. */
  topics: string[];
  /** 0-1 score of how ad-relevant this conversation was. */
  adRelevance: number;
  /** First 280 chars of the conversation, for context. */
  preview: string;
}

export interface ConversationHistory {
  summaries: ConversationSummary[];
  /** Cumulative count of ads surfaced to this persona, broken down. */
  adsSeen: {
    total: number;
    byAdvertiser: Record<string, number>;
    byTopic: Record<string, number>;
  };
}

// ═════════ Operational metadata ═══════════════════════════════════
export interface OperationalMeta {
  lastUsed: string;
  totalProbes: number;
  totalConversations: number;
  /** Sliding-window success rate of /api/auth/session over the last 100 calls. */
  sessionSuccessRate: number;
  /** Sliding-window ad-yield (ads/prompt) over the last 50 prompts. */
  recentAdYield: number;
  /** 0-100 health score used in the dashboard. */
  healthScore: number;
  /** Tags from the audit log. */
  flags: string[];
}

// ═════════ Audit (append-only) ════════════════════════════════════
export type AuditAction =
  | 'created' | 'credentials_stored' | 'session_obtained'
  | 'session_refreshed' | 'cf_clearance_refreshed' | 'proxy_rotated'
  | 'fingerprint_updated' | 'rate_limited' | 'banned' | 'recovered'
  | 'used' | 'conversation_synced' | 'seeded' | 'archived';

export interface AuditEntry {
  ts: string;
  action: AuditAction;
  reason?: string;
  meta?: Record<string, unknown>;
}

// ═════════ THE Persona object ═════════════════════════════════════
export interface Persona {
  version: typeof PERSONA_VERSION;
  identity: PersonaIdentity;
  fingerprint: Fingerprint;
  proxy: ProxyAssignment;
  behavioral: BehavioralModel;
  history: ConversationHistory;
  operational: OperationalMeta;
}

// Files on disk hold the secret/auth parts separately and re-hydrate.
export interface PersonaOnDisk {
  /** identity.json — identity + fingerprint + proxy + behavioral + history + ops. */
  public: Persona;
  /** credentials.json — AES-GCM encrypted, decryptable with PERSONA_MASTER_KEY. */
  credentialsCipher: string;   // base64
  /** session.json — auth state. Encrypted at rest too. */
  sessionCipher: string;      // base64
  /** audit.jsonl — append-only. */
  audit: AuditEntry[];
}
```

### Notes on the design

- **Fingerprint is stored separately from auth state.** A session can die
  and be re-established without changing the fingerprint.
- **Fingerprint is deterministic from a seed.** Re-creating a persona with
  the same `fingerprintSeed` produces byte-identical fingerprints, which
  means the TLS impersonation profile, the canvas/audio noise seed, and the
  browser headers all line up.
- **Behavioral model is observed, not declared.** When the browser is run
  (rare), it records actual mouse-curve samples and typing intervals. These
  become the distribution we draw from in future browser runs.
- **Audit is append-only.** Every write goes through the persona manager,
  which appends to `audit.jsonl`. This is the only "log" we keep.
- **Credentials and session are encrypted at rest with AES-GCM**, using a
  key derived from `PERSONA_MASTER_KEY` (a 32-byte secret in `.env`) via
  HKDF-SHA256 with `personaId` as the salt. We never store the master key
  in source.

---

## 3. Runtime model: when a request "uses" a persona

```text
caller code
    │
    ▼
personaManager.probe(prompt, personaId)
    │
    ├── 1. lookupPersona(personaId)             (in-memory map, LRU)
    │       └─ on miss: readPersonaFromDisk(personaId)
    │
    ├── 2. acquireLock(personaId)               (per-persona mutex)
    │       └─ prevents concurrent use of the same persona
    │
    ├── 3. ensureValidAccessToken(persona)
    │       ├─ cached + not expired? return cached
    │       └─ else: GET /api/auth/session via impers
    │           ├─ 200 + accessToken  → cache, return
    │           ├─ 403 cf_blocked     → refreshCfClearance(persona) → retry
    │           ├─ 200 + {}           → session_expired → recoverOrFail
    │           └─ 401/302            → session_expired → recoverOrFail
    │
    ├── 4. acquireSentinelProof(persona)
    │       └─ POST /backend-anon/sentinel/chat-requirements → compute PoW
    │
    ├── 5. sendMessage(persona, prompt, { stream: true })
    │       └─ POST /backend-api/conversation with Bearer + PoW + deviceId
    │       └─ parse SSE → yield StreamChunk events
    │
    ├── 6. extractAdsFromHtml(lastChunk.html)   (re-use from scraper/client.ts)
    │
    ├── 7. persist result: write conversations/<convId>.json (or update summary)
    │       update operational.totalProbes, .adsSeen, .recentAdYield
    │       update history.summaries (sliding window)
    │
    └── 8. releaseLock(personaId), return result
```

**We launch a browser only in these cases:**

| Trigger | Path |
|---|---|
| First time a persona is created | `BrowserPersonaRunner.signup()` |
| `cf_clearance` expires or is challenged | `BrowserPersonaRunner.refreshCfClearance()` |
| `__Secure-next-auth.session-token` expires (30d) | `BrowserPersonaRunner.reauth()` |
| Forced logout (302 to `/auth/login`) | `BrowserPersonaRunner.reauth()` |
| Arkose challenge on a high-value model | `BrowserPersonaRunner.solveArkose()` |
| Anything that needs cookies not in our jar (e.g. precision time-of-day personalization) | `BrowserPersonaRunner.actAsPersona()` (a short Playwright session) |

Everything else goes through `impers`.

---

## 4. File-system layout

```text
~/.openai-ads/personas/<id>/
  identity.json          # identity + fingerprint + proxy + behavioral + history + ops  (public)
  credentials.json       # { ciphertext, iv, tag } — AES-GCM(plaintext) of PersonaCredentials
  session.json           # { ciphertext, iv, tag } — AES-GCM(plaintext) of AuthState
  proxy.json             # { sessionId, lastEgress, burned, ... }   (rotates more often)
  conversations/
    <conv-uuid>.json     # full conversation tree (kept for N=5 most recent)
    summaries.jsonl      # one ConversationSummary per line, all-time (capped 200)
  behavior.jsonl         # observed samples, one JSON per session
  audit/
    2026-06.jsonl        # append-only, rotated monthly
  chrome-profile/        # OPTIONAL — only used for browser-mode operations
                          # (PersistentContext userDataDir; built fresh on demand)
~/.openai-ads/
  index.json             # { personaId: { label, plan, health, lastUsed } } — for fast list
  master.key             # OR: kept only in env (preferred). The HKDF-salt is the personaId.
  secret.key             # 32-byte secret for AES-GCM; if file-based, mode 0600
  config.json            # global settings (impersonation profile, parallel limit, etc.)
```

Why split credentials and session? Because they have **different cadences**:

- `credentials.json` changes once per password reset (months).
- `session.json` changes whenever we re-authenticate (days/weeks, but also
  the access token field updates hourly inside).

We also want to be able to re-issue a session without re-prompting the user
for the master key (the master key decrypts both, but in a CI/automation
context we might keep the session-encryption key in memory and have the
credentials-encryption key require a fresh key-derivation step).

Compare to the current `browser-profiles/<name>/`:

```text
browser-profiles/<name>/
  Default/                       (full Chromium user-data-dir, 200-500MB)
  meta.json                      (created, lastUsed, conversation count)
  credentials.json               (PLAINTEXT email + password + mail.tm token)
  meta.json.bak                  (left behind by failed writes)
  ... (lots of files we don't care about)
```

V2's layout is **80KB-200KB per persona, regardless of how many probes
they've done**, and the secrets are encrypted.

---

## 5. The PersonaManager

```ts
// src/personas/manager.ts (sketch)
export class PersonaManager {
  private personas = new Map<PersonaId, Persona>();
  private sessions = new Map<PersonaId, AuthState>();
  private locks = new Map<PersonaId, Promise<unknown>>();
  private lru: LRU<PersonaId, Persona>;
  private crypto: PersonaCrypto;
  private browser: BrowserPersonaRunner;
  private proxy: ProxyPool;

  constructor(opts: PersonaManagerOptions) {
    this.lru = new LRU({ max: opts.maxInMemory ?? 50 });
    this.crypto = new PersonaCrypto(opts.masterKey);
    this.browser = new BrowserPersonaRunner({
      onCfClearance: (personaId, value, exp) => this.updateCfClearance(personaId, value, exp),
      onSessionToken: (personaId, value) => this.updateSessionToken(personaId, value),
    });
    this.proxy = new ProxyPool(opts.providers);
  }

  // ─── Lifecycle ────────────────────────────────────────────────
  async create(opts: CreatePersonaOptions): Promise<PersonaId> { /* ... */ }
  async load(id: PersonaId): Promise<Persona> { /* ... */ }
  async list(): Promise<PersonaSummary[]> { /* ... */ }
  async archive(id: PersonaId): Promise<void> { /* ... */ }

  // ─── Operations ───────────────────────────────────────────────
  async validate(id: PersonaId): Promise<ValidationResult> { /* ... */ }
  async probe(id: PersonaId, prompt: string, opts?: ProbeOptions)
    : Promise<ProbeResult> { /* ... */ }
  async sendMessage(id: PersonaId, msg: ChatMessage)
    : AsyncGenerator<StreamChunk> { /* ... */ }
  async listConversations(id: PersonaId, opts?): Promise<ConversationSummary[]> { /* ... */ }
  async getMe(id: PersonaId): Promise<MeProfile> { /* ... */ }
  async getHealth(id: PersonaId): Promise<PersonaHealthReport> { /* ... */ }

  // ─── Background ──────────────────────────────────────────────
  startHealthCheckLoop(opts: { intervalMs: number; personaIds?: PersonaId[] }): NodeJS.Timeout;
  stopHealthCheckLoop(): void;
}
```

**What it caches:** the decrypted `Persona` object (in memory, LRU-evicted)
and the most recent `accessToken` (in memory, never written to disk in
plaintext).

**What it locks:** per-persona mutex via `locks.set(id, locks.get(id).then(() => work()))`.
This prevents two callers from racing on the same persona's session
token or cf_clearance rotation. Cross-persona probes can run in parallel.

**What its recovery story is:**

| Failure | Recovery |
|---|---|
| `accessToken` expired | Re-fetch via `/api/auth/session`. (Free, fast.) |
| `cf_clearance` expired or 403 | `BrowserPersonaRunner.refreshCfClearance(persona)` — single Playwright run that hits a known-good URL and exports the cookie. |
| `sessionToken` expired (30d) | `BrowserPersonaRunner.reauth(persona)` — full email-code flow. |
| Mail.tm inbox gone | Create a new inbox, re-link. |
| Account banned | Mark `health = 'banned'`, surface in dashboard, do not retry. |
| Rate-limited (gpt-4) | Switch to `gpt-4o-mini` for the next N minutes. |
| Proxy burned | Rotate to a fresh proxy; mark old as `burned`. |
| IP-flagged by Cloudflare | Rotate proxy + re-solve `cf_clearance` from new IP. |

### Proposed file structure for the new module

```
src/personas/
  index.ts                    # public API barrel
  manager.ts                  # PersonaManager (the orchestrator)
  types.ts                    # all interfaces from §2
  crypto.ts                   # AES-GCM encrypt/decrypt with HKDF key derivation
  storage.ts                  # on-disk read/write (atomic writes via temp+rename)
  fingerprint.ts              # @apify/fingerprint-generator wrapper, seeded
  registry.ts                 # ~/.openai-ads/index.json maintenance
  lock.ts                     # per-persona async mutex
  chatgpt/
    client.ts                 # ChatGPTClient (browserless) — §6
    auth.ts                   # session validation, access-token refresh
    sentinel.ts               # PoW computation + Arkose handling
    messages.ts               # SSE parser, message-id generator
    types.ts                  # ChatGpt* types
  browser/
    runner.ts                 # BrowserPersonaRunner — §7
    signup.ts                 # account creation flow
    reauth.ts                 # full re-auth flow
    cf.ts                     # cf_clearance refresh
    arkose.ts                 # Arkose challenge handling
  email/
    mailtm.ts                 # mail.tm API (refactored from current email.ts)
  proxy/
    pool.ts                   # ProxyPool
    oxylabs.ts                # Oxylabs session-id rotation
    local.ts                  # no-proxy fallback
  health/
    check.ts                  # periodic health loop
    score.ts                  # healthScore 0-100
  observability/
    audit.ts                  # append to audit/<yyyy-mm>.jsonl
    log.ts                    # structured logger (pino)
  seeds/
    crypto-trader.ts          # declarative PersonaSeed (immutable spec)
    defi-developer.ts
    api-engineer.ts
    index.ts                  # PERSONA_SEEDS: PersonaSeed[]
  tests/
    crypto.test.ts
    sentinel.test.ts
    sse.test.ts
    manager.test.ts
    ...
```

---

## 6. The browserless `ChatGPTClient`

This is the workhorse. **No Playwright. No Chromium. Just `impers`.**

```ts
// src/personas/chatgpt/client.ts
import { impersFetch, ImpersResponse } from 'impers';
import { randomUUID, createHash } from 'node:crypto';
import { CookieJar } from 'tough-cookie';
import { jwtVerify, createRemoteJWKSet, decodeJwt } from 'jose';
import { z } from 'zod';
import type { AdCard } from '../../scraper/types.js';
import { extractAdsFromHtml } from '../../scraper/client.js';
import { computeProofOfWork } from './sentinel.js';
import { parseSSE } from './messages.js';
import type {
  Persona, PersonaId, AuthState, ConversationId, MessageId,
  ChatGptPlan, AccountState, StreamChunk, ConversationSummary,
  PersonaHealthReport, ValidationResult,
} from '../types.js';

// ─── Response schemas (defensive parsing) ─────────────────────────

const SessionSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    image: z.string().url().optional(),
    picture: z.string().url().optional(),
    idp: z.string().optional(),
  }).optional(),
  expires: z.string().optional(),
  accessToken: z.string().optional(),
  provider: z.string().optional(),
  userId: z.string().optional(),
  orgId: z.string().optional(),
}).passthrough();

const MeSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  picture: z.string().url().optional(),
  phone_number: z.string().nullable().optional(),
  default_org_id: z.string().optional(),
  account_plan: z.object({
    is_paid_subscription_active: z.boolean(),
    subscription_plan: z.enum(['free','go','plus','pro','team','enterprise']),
    account_user_role: z.string().optional(),
    subscription_expires_at: z.string().optional(),
    will_renew: z.boolean().optional(),
    has_premium_access: z.boolean().optional(),
  }).passthrough(),
  features: z.array(z.string()).optional(),
  puid: z.string().optional(),
}).passthrough();

const AccountCheckSchema = z.object({
  account_state: z.enum(['OK','TRIAL_AVAILABLE','BANNED','RATE_LIMITED','SOFT_BANNED','MFA_REQUIRED']),
  features: z.array(z.string()).optional(),
  persona_country: z.string().optional(),
  is_phone_verified: z.boolean().optional(),
  is_email_verified: z.boolean().optional(),
}).passthrough();

const ConversationsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string().nullable(),
    create_time: z.number(),
    update_time: z.number(),
    current_node: z.string().optional(),
    default_model_slug: z.string().optional(),
    is_archived: z.boolean().optional(),
  }).passthrough()),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  has_missing_conversations: z.boolean().optional(),
}).passthrough();

// ─── Errors ──────────────────────────────────────────────────────

export class PersonaError extends Error {
  constructor(public code: string, message: string, public cause?: unknown) {
    super(message); this.name = 'PersonaError';
  }
}

export class SessionExpiredError extends PersonaError {
  constructor(reason: string) { super('session_expired', `Session expired: ${reason}`); }
}
export class CfBlockedError extends PersonaError {
  constructor() { super('cf_blocked', 'Cloudflare challenge; cf_clearance refresh required'); }
}
export class BannedError extends PersonaError {
  constructor() { super('banned', 'Account banned'); }
}
export class RateLimitedError extends PersonaError {
  constructor(public retryAfterMs?: number) { super('rate_limited', 'Per-model rate limit hit'); }
}

// ─── The client ──────────────────────────────────────────────────

export interface ChatGPTClientOptions {
  /** impers profile name, e.g. 'chrome131'. */
  impersonate: string;
  /** Egress proxy URL or null. */
  proxyUrl?: string;
  /** AbortSignal for all requests. */
  signal?: AbortSignal;
  /** Hooks for observability. */
  onRequest?: (info: { method: string; url: string; ms: number; status: number }) => void;
}

export class ChatGPTClient {
  private jar: CookieJar;
  private accessTokenCache: { token: string; exp: number } | null = null;
  private persona: Persona;
  private auth: AuthState;
  private opts: ChatGPTClientOptions;
  private jwks = createRemoteJWKSet(new URL('https://chatgpt.com/.well-known/jwks.json'));

  constructor(persona: Persona, auth: AuthState, opts: ChatGPTClientOptions) {
    this.persona = persona;
    this.auth = auth;
    this.opts = opts;
    this.jar = new CookieJar();
    // Hydrate cookie jar from auth state
    this.jar.setCookieSync(
      `__Secure-next-auth.session-token=${auth.sessionToken}`,
      'https://chatgpt.com',
    );
    if (auth.cfClearance) {
      this.jar.setCookieSync(`cf_clearance=${auth.cfClearance}`, 'https://chatgpt.com');
    }
    if (auth.puid) {
      this.jar.setCookieSync(`_puid=${auth.puid}`, 'https://chatgpt.com');
    }
  }

  // ─── HTTP plumbing ───────────────────────────────────────────

  private async impersFetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('User-Agent', this.persona.fingerprint.userAgent);
    headers.set('Accept-Language', this.persona.fingerprint.languages.join(','));
    headers.set('oai-language', this.persona.fingerprint.locale);
    headers.set('oai-device-id', this.auth.deviceId);
    if (this.persona.client.browser === 'chrome') {
      headers.set('sec-ch-ua', this.persona.fingerprint.secChUa);
      headers.set('sec-ch-ua-mobile', this.persona.fingerprint.secChUaMobile);
      headers.set('sec-ch-ua-platform', this.persona.fingerprint.secChUaPlatform);
    }
    headers.set('Cookie', await this.jar.getCookieString(url));
    if (this.opts.signal) headers.set('X-Request-Timeout', String(this.opts.signal));

    const start = Date.now();
    const res = await impersFetch(url, {
      ...init,
      headers,
      impersonate: this.opts.impersonate as any,
      proxy: this.opts.proxyUrl as any,
    } as any);
    // Update jar with any Set-Cookie headers
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookies) {
      try { await this.jar.setCookie(c, url); } catch { /* ignore */ }
    }
    this.opts.onRequest?.({
      method: init.method ?? 'GET',
      url, ms: Date.now() - start, status: res.status,
    });
    return res;
  }

  // ─── Session validation ─────────────────────────────────────

  async validateSession(): Promise<ValidationResult> {
    const url = 'https://chatgpt.com/api/auth/session';
    const res = await this.impersFetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 403) {
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('text/html')) {
        // Cloudflare "Just a moment…" challenge page
        throw new CfBlockedError();
      }
      throw new PersonaError('http_403', `unexpected 403 (${ct})`);
    }
    if (!res.ok) {
      throw new PersonaError('http_' + res.status, `validate http_${res.status}`);
    }
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      throw new CfBlockedError();
    }
    const raw = await res.json();
    const data = SessionSchema.parse(raw);
    if (!data.accessToken) {
      // 200 + empty object = session_token is invalid
      throw new SessionExpiredError('empty_session');
    }

    // Cache access token
    const claims = decodeJwt(data.accessToken);
    this.accessTokenCache = { token: data.accessToken, exp: claims.exp ?? 0 };

    return {
      valid: true,
      accessToken: data.accessToken,
      accessTokenExp: claims.exp ?? 0,
      profile: data.user!,
      userId: data.userId ?? data.user!.id,
      orgId: data.orgId,
    };
  }

  /** Lazily fetch and cache a fresh access token. */
  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessTokenCache && this.accessTokenCache.exp > now + 60) {
      return this.accessTokenCache.token;
    }
    const v = await this.validateSession();
    return v.accessToken;
  }

  // ─── Profile / plan / state ─────────────────────────────────

  async getMe(): Promise<{ plan: ChatGptPlan; isPaid: boolean; expiresAt: string | null; email: string; userId: string; orgId?: string }> {
    const token = await this.getAccessToken();
    const res = await this.impersFetch('https://chatgpt.com/backend-api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new PersonaError('getMe_http_' + res.status, await res.text());
    const me = MeSchema.parse(await res.json());
    return {
      plan: me.account_plan.subscription_plan,
      isPaid: me.account_plan.is_paid_subscription_active,
      expiresAt: me.account_plan.subscription_expires_at ?? null,
      email: me.email,
      userId: me.id,
      orgId: me.default_org_id,
    };
  }

  async getAccountState(): Promise<AccountState> {
    const token = await this.getAccessToken();
    const res = await this.impersFetch(
      'https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27?action=account_state',
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new PersonaError('account_check_http_' + res.status, await res.text());
    const data = AccountCheckSchema.parse(await res.json());
    return data.account_state;
  }

  // ─── Conversations ──────────────────────────────────────────

  async listConversations(opts: { offset?: number; limit?: number } = {}): Promise<ConversationSummary[]> {
    const token = await this.getAccessToken();
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 20;
    const res = await this.impersFetch(
      `https://chatgpt.com/backend-api/conversations?offset=${offset}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new PersonaError('list_http_' + res.status, await res.text());
    const data = ConversationsSchema.parse(await res.json());
    return data.items.map(item => ({
      conversationId: item.id as ConversationId,
      title: item.title ?? '(untitled)',
      createdAt: new Date(item.create_time * 1000).toISOString(),
      updatedAt: new Date(item.update_time * 1000).toISOString(),
      messageCount: 0, // not in list response; hydrate via getConversation if needed
      topics: [],      // computed locally from title via embeddings/keyword heuristic
      adRelevance: 0,  // populated by post-processing
      preview: '',
    }));
  }

  // ─── Send a message (streaming) ─────────────────────────────

  async *sendMessage(prompt: string, opts: {
    model?: string; conversationId?: ConversationId; parentMessageId?: MessageId;
  } = {}): AsyncGenerator<StreamChunk> {
    const token = await this.getAccessToken();
    const model = opts.model ?? 'auto';
    const parentMessageId = opts.parentMessageId ?? (randomUUID() as MessageId);
    const messageId = randomUUID() as MessageId;
    const wsRequestId = randomUUID();

    // 1. Get a sentinel proof
    const proof = await this.acquireSentinelProof();

    // 2. POST
    const body = {
      action: 'next',
      messages: [{
        id: messageId,
        author: { role: 'user' },
        content: { content_type: 'text', parts: [prompt] },
        metadata: {},
      }],
      parent_message_id: parentMessageId,
      conversation_id: opts.conversationId ?? null,
      model,
      timezone_offset_min: -new Date(this.persona.fingerprint.timezone).getTimezoneOffset(),
      suggests: [],
      history_and_training_disabled: false,
      conversation_mode: { kind: 'primary_assistant' },
      force_parallel_search: false,
      force_use_search: false,
      ws_request_id: wsRequestId,
      arkose_token: proof.arkoseToken,
    };

    const res = await this.impersFetch('https://chatgpt.com/backend-api/conversation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'openai-sentinel-chat-requirements-token': proof.requirementsToken,
        'openai-sentinel-proof-token': proof.proofToken,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const text = res.body ? await res.text() : `http_${res.status}`;
      if (res.status === 429) throw new RateLimitedError();
      if (res.status === 403) throw new CfBlockedError();
      throw new PersonaError('send_http_' + res.status, text);
    }

    // 3. Parse SSE
    for await (const event of parseSSE(res.body as ReadableStream)) {
      if (event.done) break;
      if (event.error) {
        // Sentinel challenge re-prompted mid-stream
        if (/sentinel|proof|arkose/i.test(String(event.error))) {
          throw new PersonaError('sentinel_required', JSON.stringify(event.error));
        }
        throw new PersonaError('openai_error', JSON.stringify(event.error));
      }
      const m = event.message;
      if (!m || m.author?.role !== 'assistant') continue;

      const parts = m.content?.parts ?? [];
      const text = parts[0] ?? '';
      const adHtml = parts.find((p: any) => typeof p === 'string' && p.includes('data-ad-card-root')) as string | undefined;

      yield {
        kind: 'delta',
        conversationId: (event.conversation_id ?? opts.conversationId ?? '') as ConversationId,
        messageId: m.id as MessageId,
        parentMessageId,
        text,
        delta: text, // SSE sends cumulative; caller computes delta vs last seen
        model: m.metadata?.model_slug ?? model,
        html: adHtml,
        ads: adHtml ? extractAdsFromHtml(adHtml) : [],
      };
    }

    yield { kind: 'done', conversationId: '' as ConversationId, messageId: '' as MessageId, parentMessageId, text: '', delta: '', model };
  }

  // ─── Sentinel / PoW ────────────────────────────────────────

  private async acquireSentinelProof(): Promise<{ requirementsToken: string; proofToken: string; arkoseToken: string | null }> {
    // Step 1: ask the anonymous endpoint for requirements
    const res = await this.impersFetch('https://chatgpt.com/backend-anon/sentinel/chat-requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: this.auth.deviceId }),
    });
    if (!res.ok) {
      throw new PersonaError('sentinel_http_' + res.status, await res.text());
    }
    const req = await res.json() as {
      token: string;
      arkose?: { required: boolean; dx?: any };
      turnstile?: { required: boolean };
      proofofwork?: { required: boolean; seed: string; difficulty: string };
    };

    let proofToken = '';
    if (req.proofofwork?.required) {
      proofToken = await computeProofOfWork({
        seed: req.proofofwork.seed,
        difficulty: req.proofofwork.difficulty,
        userAgent: this.persona.fingerprint.userAgent,
        cores: this.persona.fingerprint.hardware.hardwareConcurrency,
        screen: `${this.persona.fingerprint.screen.width}x${this.persona.fingerprint.screen.height}`,
      });
    }

    return {
      requirementsToken: req.token,
      proofToken,
      arkoseToken: null, // not solved in V1
    };
  }
}

// ─── Helpers (in separate files) ──────────────────────────────────

// src/personas/chatgpt/sentinel.ts
export async function computeProofOfWork(opts: {
  seed: string; difficulty: string; userAgent: string; cores: number; screen: string;
}): Promise<string> {
  const { seed, difficulty, userAgent, cores, screen } = opts;
  const parseTime = Math.floor(Date.now() / 1000);
  const diffLen = difficulty.length;
  const config: [string, number, number, number, string] =
    [`${cores}|${screen}`, parseTime, 4294705152, 0, userAgent];
  for (let i = 0; i < 1_000_000; i++) {
    config[3] = i;
    const base = Buffer.from(JSON.stringify(config)).toString('base64');
    const hash = createHash('sha3-512').update(seed + base).digest();
    if (hash.toString('hex').substring(0, diffLen) <= difficulty) {
      return 'gAAAAAB' + base;
    }
  }
  throw new Error('proof-of-work: exceeded iteration budget');
}
```

The SSE parser (`parseSSE`) lives in `src/personas/chatgpt/messages.ts` and
is a faithful port of `waylaidwanderer/node-chatgpt-api`'s `postConversation()`
parser — it handles cumulative-vs-delta text correctly, recognizes
`[DONE]`, and yields typed events. **It is the most important piece to get
right** because every "stream" of text is a separate conversation in the
ChatGPT UI, and the parser is what tells the rest of the system "the model
just emitted this delta, the conversation id is X, the message id is Y".

### `extractAdsFromHtml` reuse

`extractAdsFromHtml` (currently in `src/scraper/client.ts:100-150`) is the
regex-based scraper that finds `data-ad-card-root="true"` markers in HTML
and pulls the title, body, advertiser name. **It works on any HTML, not
just browser DOMs** — it operates on raw text. So we can reuse it 1:1.

The ad HTML appears in the SSE stream as a part of the assistant's
`content.parts` array. We re-parse it client-side via the existing
extractor.

---

## 7. The browser fallback path

`BrowserPersonaRunner` is **much smaller** than the current `client.ts`.
It only does four things, and each of them runs to completion in 30-120s.

```ts
// src/personas/browser/runner.ts
import { chromium, firefox, type BrowserContext, type Page } from 'patchright';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { FingerprintInjector } from '@apify/fingerprint-injector';
import { FingerprintGenerator } from '@apify/fingerprint-generator';
import type { Persona, AuthState, PersonaId, Credentials } from '../types.js';

export interface BrowserRunnerOptions {
  /** Hook called with a freshly captured sessionToken. */
  onSessionToken: (id: PersonaId, token: string) => Promise<void>;
  /** Hook called with a freshly captured cfClearance + exp. */
  onCfClearance: (id: PersonaId, value: string, expSec: number) => Promise<void>;
}

export class BrowserPersonaRunner {
  private opts: BrowserRunnerOptions;

  constructor(opts: BrowserRunnerOptions) { this.opts = opts; }

  /**
   * One-time account creation. Drives the mail.tm + chatgpt.com flow.
   * Returns the new persona's id, credentials, and initial session token.
   */
  async signup(seed: PersonaSeed, mailtmToken: string): Promise<{
    id: PersonaId;
    credentials: Credentials;
    sessionToken: string;
    cfClearance: string;
    cfClearanceExp: number;
  }> { /* see src/personas/browser/signup.ts */ }

  /**
   * Re-authenticate an existing persona via email-code.
   * Requires the persona's mail.tm inbox to still be alive.
   */
  async reauth(persona: Persona, credentials: Credentials): Promise<{ sessionToken: string }> { /* ... */ }

  /**
   * Visit a known-good URL with the persona's fingerprint, capture cf_clearance.
   * Cheaper than reauth; only fixes Cloudflare-side state.
   */
  async refreshCfClearance(persona: Persona): Promise<{ cfClearance: string; cfClearanceExp: number }> { /* ... */ }

  /**
   * Solve an Arkose challenge if a high-value model demands it.
   * Returns the arkose_token string.
   */
  async solveArkose(persona: Persona): Promise<string> { /* ... */ }

  /**
   * Bring up a Playwright session that acts exactly as the persona
   * (with full persona fingerprint + cookies). Used for "I really need
   * the browser" cases — e.g. time-of-day-personalized ad inspection.
   * Returns a wrapper around Playwright's Page.
   */
  async actAsPersona(persona: Persona): Promise<BrowserSession> { /* ... */ }
}
```

The fingerprint is applied via `@apify/fingerprint-injector` and the
browser is `patchright` (a Playwright fork that doesn't leak CDP
`Runtime.enable` and `__pwInitScripts` artifacts). Stealth is applied via
`puppeteer-extra-plugin-stealth` *but* with a known-flawed list: the new
library patches the leaks that the current `client.ts` doesn't.

Per the Browser Fingerprinting report, the order of operations is:

1. Generate the fingerprint deterministically from `identity.fingerprintSeed`.
2. Launch `patchright` with `launchPersistentContext`, using
   `browser-profiles/<id>/chrome-profile/` as the `userDataDir` *only when
   we actually need persistent state for the browser* (we never do for
   `refreshCfClearance`).
3. Apply the fingerprint via `FingerprintInjector` to override
   `navigator.webdriver`, screen size, WebGL renderer, canvas, audio,
   `navigator.plugins`, `navigator.languages`, etc.
4. Set headers (`sec-ch-ua`, `Accept-Language`) via route interception.
5. Navigate; observe; capture cookies via `context.cookies()`.

The runner is invoked by the `PersonaManager` *only* when:

```ts
// In PersonaManager.ensureValidAccessToken:
if (e instanceof CfBlockedError) {
  log.warn('cf_blocked; launching browser to refresh');
  const result = await this.browser.refreshCfClearance(persona);
  await this.persistCfClearance(personaId, result);
  return this.validateSession(persona); // retry
}
if (e instanceof SessionExpiredError) {
  log.warn('session_expired; launching browser to re-auth');
  const creds = await this.loadCredentials(personaId);
  const result = await this.browser.reauth(persona, creds);
  await this.persistSessionToken(personaId, result.sessionToken);
  return this.validateSession(persona);
}
```

So the browser code is *the fallback*, not the main path. **The bulk of
the file is just the 4 functions above, each ~30-80 lines.** Compare to
the current `client.ts` which is 554 lines and 90% of it is DOM scraping
and selector retries — all of that goes away.

---

## 8. Integration with the existing codebase

### What stays exactly the same

- `src/scraper/client.ts` (Oxylabs / VerseOdin scraper).
- `src/scraper/verseodin.ts`.
- `src/scraper/types.ts` — `AdCard`, `ScraperResult`.
- `extractAdsFromHtml`, `hasAds`, `countAds` — we re-import from the new
  client and call the same function on the SSE chunks.
- All of `src/ads/`, `src/agent/`, `src/executor/`, `src/loop.ts`,
  `src/analyzer/` — they consume `ScraperResult`-shaped data and don't
  care which transport produced it.
- All `src/scripts/batch-probe*.ts` — but they get **rewired** to use the
  new `ChatGPTClient` (see below).

### What's new

```
src/personas/                          (entirely new)
src/personas/index.ts                  (public API)
src/personas/manager.ts
src/personas/chatgpt/...
src/personas/browser/...
src/personas/email/...
src/personas/proxy/...
src/personas/health/...
src/personas/observability/...
src/personas/seeds/
src/personas/types.ts
```

### What gets deleted

- `src/playwright-scraper/client.ts` (replaced by `chatgpt/client.ts`).
- `src/playwright-scraper/profiles.ts` (replaced by `personas/manager.ts`).
- `src/playwright-scraper/email.ts` (replaced by `personas/email/mailtm.ts`).
- `src/playwright-scraper/index.ts` (replaced by `src/personas/cli.ts`).
- `src/playwright-scraper/personas/crypto-trader.ts`,
  `defi-developer.ts`, `api-engineer.ts` (replaced by
  `personas/seeds/*-seed.ts`).
- `src/playwright-scraper/types.ts` (replaced by `personas/types.ts`).
- `browser-profiles/` directory on disk (replaced by `~/.openai-ads/personas/`).

### New CLI

```bash
# Persona management
pnpm personas --list
pnpm personas --create <seed-id>        # Browser-driven signup; writes identity+credentials+session
pnpm personas --status [<id>]
pnpm personas --validate <id>           # lightweight health probe (no browser)
pnpm personas --refresh-cf <id>         # browser-driven cf_clearance refresh
pnpm personas --reauth <id>             # browser-driven re-auth
pnpm personas --archive <id>
pnpm personas --health                  # status of all personas in one shot

# Probing (browserless, fast)
pnpm personas --probe <id> "<prompt>"   # single prompt, single persona
pnpm personas --converse <id> <file>    # sequence of prompts, accumulates history
pnpm personas --batch <id> <file>       # one prompt per line, fresh conv each

# Batch (concurrent across personas)
pnpm personas --multi-batch <file>      # file format: "persona_id|prompt" per line

# Diagnostics
pnpm personas --dump <id>               # print full persona state (sanitized)
pnpm personas --rotate <id>             # rotate to a fresh proxy
pnpm personas --audit <id>              # tail audit log
```

### The equivalent of `pnpm tsx src/scripts/batch-probe-crypto.ts`

Old version (`src/scripts/batch-probe-crypto.ts`):

```ts
import { probeAds, extractAdsFromHtml } from "../scraper/client.js";
// ... 50 prompts looped through Oxylabs ...
for (const prompt of PROMPTS) {
  const result = await probeAds(prompt, "United States");
  // ...
}
```

New version (rewritten to use the new `ChatGPTClient`):

```ts
// src/scripts/batch-probe-persona-crypto.ts
import { PersonaManager } from '../personas/manager.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const PROMPTS = [/* ... same 50 prompts ... */];
const PERSONA_ID = 'crypto-trader' as const;
const OUT_DIR = 'scraper-outputs-crypto-persona';

const pm = new PersonaManager({
  masterKey: process.env.PERSONA_MASTER_KEY!,
  impersonate: 'chrome131',
});

await mkdir(OUT_DIR, { recursive: true });
const client = await pm.getClient(PERSONA_ID);
let adsFound = 0;

for (let i = 0; i < PROMPTS.length; i++) {
  const prompt = PROMPTS[i]!;
  const num = String(i + 1).padStart(2, '0');
  process.stdout.write(`[${num}/50] `);

  try {
    const result: { ads: AdCard[]; html: string; elapsedMs: number } = {
      ads: [], html: '', elapsedMs: 0,
    };
    const start = Date.now();
    for await (const chunk of client.sendMessage(prompt)) {
      if (chunk.kind === 'delta' && chunk.html) {
        result.html += chunk.html;
        result.ads = chunk.ads; // extractAdsFromHtml inside the chunk
      }
    }
    result.elapsedMs = Date.now() - start;

    await writeFile(`${OUT_DIR}/${num}_${sanitize(prompt)}.html`, result.html);
    if (result.ads.length > 0) {
      adsFound++;
      for (const ad of result.ads) {
        console.log(`\n    🔴 AD: ${ad.advertiser} — "${ad.title}"`);
      }
    }
    console.log(`  ads=${result.ads.length} html=${result.html.length} t=${result.elapsedMs}ms`);
  } catch (e) {
    console.log(`✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
  }
}

console.log(`\nDONE. ${adsFound}/${PROMPTS.length} prompts had ads.`);
console.log(`HTML files saved to ${OUT_DIR}/`);
```

**Expected speedup:** the old version does ~50 prompts × ~10s each = 8-15
minutes (Oxylabs serial + 2s gap). The new version does ~50 prompts ×
~3-5s each = 3-5 minutes. And we get *real persona accounts* with
conversation history influencing the ad targeting, which is the whole
point of the persona system.

### New `package.json` scripts

```json
{
  "scripts": {
    "dev": "tsx src/loop.ts",
    "loop": "tsx src/loop.ts",
    "verify": "tsx src/scripts/verify.ts",
    "verify-scraper": "tsx src/scripts/verify-scraper.ts",
    "verify-verseodin": "tsx src/scripts/verify-verseodin.ts",
    "analyze": "tsx src/analyzer/index.ts",
    "analyze-oms": "tsx src/analyzer/index-v2.ts",
    "playwright": "tsx src/playwright-scraper/index.ts",
    "personas": "tsx src/personas/cli.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "playwright": "^1.60.0",
    "playwright-extra": "^4.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "zod": "^3.23.8",
    "impers": "^1.0.0",
    "tough-cookie": "^4.1.3",
    "jose": "^5.9.0",
    "patchright": "^1.50.0",
    "@apify/fingerprint-generator": "^2.0.0",
    "@apify/fingerprint-injector": "^2.0.0",
    "@apify/header-generator": "^2.0.0",
    "pino": "^9.5.0",
    "lru-cache": "^11.0.0"
  }
}
```

The existing `playwright-scraper/` is kept (deprecated) and its `pnpm
playwright` entry point keeps working, with a deprecation notice on the
first run. The new `pnpm personas` is the recommended path.

---

## 9. Migration plan

We migrate in **4 incremental steps** that keep the existing scraper
working at every step. Output dirs (`scraper-outputs-*`) are gitignored,
so there's no API contract to maintain — we just need to keep producing
*similar* `AdCard[]` results.

### Step 1 — Foundation: types, crypto, storage (no behavior change)

Build `src/personas/{types,crypto,storage}.ts` and a minimal
`PersonaManager` that can create/load/archive personas on disk (no
network calls). Add a new `~/.openai-ads/` dir layout, leave
`browser-profiles/` alone.

**Acceptance:** `pnpm personas --list` works (empty list).
`pnpm personas --create crypto-trader-test --dry-run` creates a persona
record on disk with no network calls.

**Risk:** low. No existing paths are touched.

### Step 2 — Browserless client: validate, getMe, listConversations

Build `src/personas/chatgpt/{client,auth,sentinel,messages,types}.ts`.
**Use an existing `__Secure-next-auth.session-token` captured by the
current Playwright flow** (manually export one cookie from a fresh
`browser-profiles/<id>/Default/Cookies` SQLite db, or call the current
`pnpm playwright --create-account crypto-trader` once, then export the
cookie via a small script).

Add `pnpm personas --validate <id>` and `pnpm personas --probe <id> "<p>"`.

**Acceptance:** with one captured session token, the browserless client
can call `/api/auth/session` successfully, return a fresh access token,
list conversations, and send a message. Ad extraction works on the
resulting SSE stream.

**Risk:** medium. We need to verify that `impers` with `chrome131` profile
actually passes Cloudflare's TLS check on our egress IP. Mitigation: have
a fallback to a real browser if validation fails.

### Step 3 — Browser fallback path: signup, reauth, cf_clearance

Build `src/personas/browser/{runner,signup,reauth,cf,arkose}.ts` and
`src/personas/email/mailtm.ts`. Wire it into `PersonaManager` so the
recovery paths (cf_blocked, session_expired) automatically fall back to
the browser.

**Acceptance:** `pnpm personas --create crypto-trader-2` end-to-end works
(no prior Playwright profile needed for the persona). Existing
`pnpm playwright --create-account` still works (deprecated path).

**Risk:** medium-high. Account creation is the most fickle flow. We
should not delete the old `playwright-scraper/` until we have at least
5 personas created through the new path without issues.

### Step 4 — Polish: batch, health loop, observability

Build `src/personas/health/{check,score}.ts`,
`src/personas/observability/{audit,log}.ts`, and the new batch script
variants. Add the `pnpm personas --multi-batch` mode. Wire health loop
into `loop.ts` or a new `pnpm personas:health` daemon.

**Acceptance:** `pnpm personas --health` shows live status of all
personas. `pnpm personas --audit crypto-trader` shows the last 50
audit entries.

**Risk:** low. Mostly additive.

### Step 5 — Deprecate the old path

Add a deprecation warning to the top of `pnpm playwright` and
`src/playwright-scraper/index.ts`. After 30 days (or after the user
confirms they have all personas they need on the new path), delete
`src/playwright-scraper/` entirely and `browser-profiles/` from disk.

---

## 10. Risks & open questions

### Known risks

1. **`impers` + `chrome131` profile: will it actually pass Cloudflare on
   our egress IP?** The community reports say yes, but this is an
   empirical question. **Mitigation:** in Step 2 we make the
   `--validate` command print a clear pass/fail; if it fails, we fall
   back to a `BrowserPersonaRunner.refreshCfClearance()` to get a
   `cf_clearance` cookie from a real browser, then continue with `impers`.
   The cookie is what matters most for the `backend-api` calls.

2. **Sentinel PoW changes.** OpenAI rotates the difficulty and the seed
   format every few months. The `computeProofOfWork` function above is a
   direct port of PawanOsman's and uses SHA3-512. **Mitigation:** keep
   this function isolated; if it stops working, replace it. The 4-arg
   config tuple format may need updating to match a new server-side
   format. (No public spec; we observe and adapt.)

3. **Arkose / FunCaptcha** is sometimes required, especially for `gpt-4`
   or `o1` traffic. V1 doesn't solve it; we set `arkose_token: null` and
   hope the server lets it slide. For high-value models, we may need
   step 3's `solveArkose()` to actually do something (e.g. via a paid
   bypass service). **For the ad-probing use case, `gpt-4o-mini` and
   `auto` are usually fine without it.**

4. **Persona-from-two-machines race.** If a single persona's session is
   used from two IPs simultaneously, Cloudflare will see IP churn and
   may invalidate `cf_clearance`. **Mitigation:** the per-persona mutex
   in `PersonaManager`. If the user really wants to scale horizontally,
   they need to either (a) pin each persona to a single machine, or
   (b) use a stable sticky-IP proxy and accept that `cf_clearance` will
   rotate more often.

5. **Account aging / cookie rotation.** `__Secure-next-auth.session-token`
   has a 30-day TTL. If we run a persona continuously, we need to
   re-auth every 30 days. The health-check loop should warn at T-7 days
   and re-auth at T-3 days. **For ad probing, 30 days of activity per
   persona is a lot of probes (~50K-200K).**

6. **Persona farm = TOS violation.** Creating dozens of ChatGPT accounts
   via disposable emails is a clear Terms of Service violation. The
   safer path for production is to use real accounts with paid plans
   that the user owns. **V1 of the dashboard supports "use your own
   account" mode** where you supply a session token captured manually
   and we never call the signup flow. The signup flow exists for
   development and demo purposes only.

7. **Mail.tm rate limits.** Free tier is 5-10 inboxes per IP per day.
   If we want to create 50 personas in one sitting, we need either (a)
   a paid mail.tm plan, (b) 1secmail as a backup, or (c) real email
   accounts. The `MailInbox` interface is provider-agnostic so we can
   swap.

8. **Cost.** Proxies: Oxylabs residential is ~$15/GB, BrightData is
   similar. Mail.tm paid is ~$1/mo for unlimited. `impers` itself is
   free. So the cost per persona-month is dominated by proxy bandwidth
   (maybe 100-500MB per active persona per month = $1.5-$7.50). For 50
   personas that's $75-$375/mo.

9. **Detection of automation via behavioral signals.** Even with a
   correct TLS fingerprint, sending 1000 messages in 1 hour from one
   account with perfectly regular intervals will get flagged. The
   behavioral model + per-persona jitter from the fingerprint seed
   mitigate this, but the user should still rate-limit their own usage.

10. **Session token leakage.** We are persisting the JWE in
    `session.json` (encrypted at rest). If `.openai-ads/` is on a shared
    filesystem (Dropbox, iCloud Drive, NFS), the master key
    (`PERSONA_MASTER_KEY` env var) must also be protected. **Best
    practice:** the master key is in `.env` (mode 0600), never committed,
    and not synced to cloud.

### Open questions for the user

- Do we need a "team" mode where multiple users share personas but each
  user has their own master key? (Suggests per-user encryption keys +
  role-based access to the persona store.)
- Do we need a "live mode" where we surface a "this persona's IP
  changed" alert? (Suggests an Egress-IP watcher that pings
  `https://api.ipify.org?format=json` on the proxy every N minutes.)
- How aggressively should we burn personas that look rate-limited?
  ("Banned" is a state machine; do we have a quarantine phase?)
- Should the `adsSeen` history include the conversation `id` it was
  seen in? (Yes for dedup; makes the file larger.)
- Should we encrypt `behavior.jsonl` too? (Probably yes — it contains
  timing data that could fingerprint the operator.)
- How do we handle the `__cf_bm` cookie? (We don't need to persist it;
  it's session-scoped. We just include it in requests if it's there.)
- Do we want a "shadow mode" where we run the browserless client
  alongside the browser and compare results? (Useful for the first
  month to detect drift; then turn off.)

---

## 11. Implementation plan — file by file, in priority order

These are the files to **create** (C) and **modify** (M), in the order
they should be tackled. Each step ends with a working CLI command that
exercises the new code.

### Phase 1 — Foundation (1-2 days)

| # | Type | Path | Purpose | Acceptance |
|---|---|---|---|---|
| 1.1 | C | `src/personas/types.ts` | All interfaces from §2 | `tsc --noEmit` passes |
| 1.2 | C | `src/personas/crypto.ts` | AES-GCM + HKDF key derivation | Unit test: encrypt/decrypt round-trip |
| 1.3 | C | `src/personas/storage.ts` | Atomic read/write of persona files | `pnpm personas --list` shows empty |
| 1.4 | C | `src/personas/lock.ts` | Per-persona async mutex | Unit test: concurrent calls serialized |
| 1.5 | C | `src/personas/registry.ts` | `~/.openai-ads/index.json` maintenance | Manual: `cat ~/.openai-ads/index.json` |
| 1.6 | C | `src/personas/seeds/{crypto-trader,defi-developer,api-engineer}-seed.ts` | Convert existing personas to `PersonaSeed` (immutable spec) | Unit test: each seed compiles |
| 1.7 | C | `src/personas/seeds/index.ts` | `PERSONA_SEEDS: PersonaSeed[]` | — |
| 1.8 | C | `src/personas/manager.ts` | Skeleton: create, load, list, archive | `pnpm personas --list` works on empty dir |
| 1.9 | C | `src/personas/cli.ts` | CLI parsing for all subcommands | `--help` shows usage |
| 1.10 | M | `package.json` | Add `personas` script, add `impers`, `tough-cookie`, `jose`, `pino`, `lru-cache`, `patchright`, `@apify/fingerprint-*` | `pnpm install` succeeds |
| 1.11 | C | `src/personas/tests/crypto.test.ts` | Round-trip test | `pnpm typecheck` passes |

### Phase 2 — Browserless client (3-5 days)

| # | Type | Path | Purpose | Acceptance |
|---|---|---|---|---|
| 2.1 | C | `src/personas/chatgpt/types.ts` | `ChatGpt*` types (different from `Persona*` types) | — |
| 2.2 | C | `src/personas/chatgpt/sentinel.ts` | `computeProofOfWork` | Unit test: known seed/difficulty produces valid output |
| 2.3 | C | `src/personas/chatgpt/messages.ts` | `parseSSE`, `MessageId` generator | Unit test: synthetic SSE stream parses correctly |
| 2.4 | C | `src/personas/chatgpt/auth.ts` | `validateSession`, `getAccessToken` helpers | Manual: `pnpm personas --validate <id>` works against a real session |
| 2.5 | C | `src/personas/chatgpt/client.ts` | `ChatGPTClient` class with `getMe`, `getAccountState`, `listConversations`, `sendMessage` (AsyncGenerator) | `pnpm personas --probe <id> "Hello"` returns ads from a real account |
| 2.6 | M | `src/personas/manager.ts` | Wire `getClient`, `probe`, `validate` | Manager is functional |
| 2.7 | M | `src/personas/cli.ts` | Add `--validate`, `--probe`, `--converse`, `--batch` subcommands | All four work |
| 2.8 | C | `src/personas/proxy/pool.ts` | `ProxyPool` with rotation logic | Unit test: round-robin, burn detection |
| 2.9 | C | `src/personas/proxy/oxylabs.ts` | Oxylabs-specific session-id handling | Manual: residential proxy assigned to persona |
| 2.10 | C | `src/personas/proxy/local.ts` | No-proxy fallback | Manual: works without proxy |
| 2.11 | C | `src/scripts/batch-probe-persona-crypto.ts` | Rewrite of `batch-probe-crypto.ts` to use the new client | Runs 50 prompts in < 5 min |
| 2.12 | C | `src/personas/tests/sentinel.test.ts` | PoW tests | — |
| 2.13 | C | `src/personas/tests/sse.test.ts` | SSE parser tests | — |

### Phase 3 — Browser fallback (3-5 days)

| # | Type | Path | Purpose | Acceptance |
|---|---|---|---|---|
| 3.1 | C | `src/personas/email/mailtm.ts` | mail.tm wrapper (refactor from current `email.ts`) | — |
| 3.2 | C | `src/personas/fingerprint.ts` | Deterministic fingerprint from seed via `@apify/fingerprint-generator` | Unit test: same seed → same fingerprint |
| 3.3 | C | `src/personas/browser/signup.ts` | Full email-code signup with `patchright` + fingerprint injector | Manual: `pnpm personas --create crypto-trader-2` succeeds end-to-end |
| 3.4 | C | `src/personas/browser/reauth.ts` | Re-auth via email-code for an existing persona | Manual: 30-day-old persona re-auths in < 90s |
| 3.5 | C | `src/personas/browser/cf.ts` | Refresh `cf_clearance` from a known-good URL | Manual: cf_blocked → fresh cf_clearance in < 30s |
| 3.6 | C | `src/personas/browser/arkose.ts` | Stub: returns null; TODO: actual solving | — |
| 3.7 | C | `src/personas/browser/runner.ts` | `BrowserPersonaRunner` orchestrator | — |
| 3.8 | M | `src/personas/manager.ts` | Auto-fallback to browser on `CfBlockedError` / `SessionExpiredError` | Manual: kill `cf_clearance` in a file, observe browser launch |
| 3.9 | C | `src/personas/observability/audit.ts` | Append to `audit/<yyyy-mm>.jsonl` with rotation | — |
| 3.10 | C | `src/personas/observability/log.ts` | `pino` setup with redaction (no sessionToken / accessToken in logs) | Manual: confirm redacted logs |

### Phase 4 — Polish & ops (1-2 days)

| # | Type | Path | Purpose | Acceptance |
|---|---|---|---|---|
| 4.1 | C | `src/personas/health/check.ts` | Background loop: probe each persona's `/api/auth/session` every N minutes | `pnpm personas:health` daemon runs |
| 4.2 | C | `src/personas/health/score.ts` | 0-100 healthScore function | Unit test |
| 4.3 | C | `src/personas/cli.ts` | Add `--health`, `--audit`, `--dump`, `--rotate` subcommands | All work |
| 4.4 | C | `src/scripts/batch-probe-persona-oms.ts` | Port `batch-probe-oms-loop1.ts` to use personas | Runs 100 prompts across 3 personas in < 10 min |
| 4.5 | C | `src/scripts/batch-probe-persona-concurrent.ts` | Multi-persona concurrent batch | Runs 100 prompts across 10 personas in < 5 min |
| 4.6 | M | `package.json` | Add `personas:health` script | `pnpm personas:health` works |
| 4.7 | C | `src/personas/tests/manager.test.ts` | End-to-end: create → validate → probe → archive | — |
| 4.8 | M | `src/personas/cli.ts` | Pretty-print tables, color output, progress bars | UX polish |

### Phase 5 — Deprecation (1 day, after 30-day soak)

| # | Type | Path | Purpose |
|---|---|---|---|
| 5.1 | M | `src/playwright-scraper/index.ts` | Add deprecation banner: "this CLI is deprecated, use `pnpm personas`" |
| 5.2 | M | `src/personas/cli.ts` | Add `pnpm personas --migrate-from-playwright <old-name>` to import an existing `browser-profiles/<name>/` into the new system |
| 5.3 | D | `src/playwright-scraper/` | Delete the directory (after user confirmation) |
| 5.4 | D | `browser-profiles/` | Delete from disk (after user confirmation) |

### Estimated total: 8-15 days of focused work

---

## 12. TL;DR

**What changes:** the account is a directory, not a browser. The browser
is a fallback, not the main path. 95% of operations are Node + `impers`.

**What stays the same:** `extractAdsFromHtml`, `AdCard`, `ScraperResult`,
all of `src/scraper/`, all of `src/ads/`, `src/agent/`, `src/executor/`,
`src/loop.ts`, `src/analyzer/`. The dashboard-facing API contract is
preserved.

**What gets faster:** probes go from 10-15s to 3-5s, batch (50 prompts)
goes from 8-15 min to 3-5 min, and we can run 10 personas in parallel
for the first time because we no longer have 10 Chromium processes.

**What gets more reliable:** session state survives a code change, an
OS restart, and a laptop swap (just copy `~/.openai-ads/`). Re-auth is
triggered automatically 7 days before session expiry. Banned personas
are quarantined. Health scores are continuous.

**What gets more honest:** the persona model now has *interests*,
*ad-relevance scores per conversation*, *health scores*, *proxy burn
state*, *behavioral samples*, and an *audit log* — all the things that
make a persona a "real" account, not a folder with a name on it.
