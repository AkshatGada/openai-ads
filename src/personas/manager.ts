// PersonaManager — orchestrates create/load/list/archive/probe/validate
// for the v2 persona system. Browserless path is the default; the browser
// runner (Phase 3) is invoked only on recovery paths.

import { randomUUID } from "node:crypto";
import { LRUCache } from "lru-cache";
import { PersonaCrypto } from "./crypto.js";
import { PersonaLock } from "./lock.js";
import { ProxyPool } from "./proxy/pool.js";
import {
  appendAudit,
  appendBehaviorSample,
  ensureHome,
  ensurePersonaDir,
  readAudit,
  readEncryptedBlob,
  readIdentity,
  updateIndex,
  writeConversation,
  writeEncryptedBlob,
  writeIdentity,
} from "./storage.js";
import {
  asPersonaId,
  AuthState,
  Persona,
  PersonaCredentials,
  PersonaId,
  PERSONA_VERSION,
  SessionHealth,
} from "./types.js";
import { summarize } from "./registry.js";
import { getSeed } from "./seeds/index.js";

export interface PersonaManagerOptions {
  masterKeyHex: string;
  /** impers TLS profile name, e.g. "chrome131". */
  impersonate?: string;
  /** Optional: how many personas to keep decrypted in memory. */
  maxInMemory?: number;
  /** Path to the personas home directory (default ~/.openai-ads). */
  home?: string;
  /** Proxy pool. If omitted, proxies are not used. */
  proxyPool?: ProxyPool;
  /** Optional: lazy-injected ChatGPTClient factory (Phase 2). */
  clientFactory?: ClientFactory;
  /** Optional: lazy-injected BrowserPersonaRunner (Phase 3). */
  browserFactory?: BrowserFactory;
}

export type ClientFactory = (
  persona: Persona,
  auth: AuthState,
  ctx: { proxyUrl?: string },
) => ChatGPTClientLike;
export type BrowserFactory = (opts: { proxy?: { server: string; username?: string; password?: string } }) => BrowserRunnerLike;

export interface ChatGPTClientLike {
  validateSession(): Promise<import("./types.js").ValidationResult>;
  getMe(): Promise<{
    plan: import("./types.js").ChatGptPlan;
    isPaid: boolean;
    expiresAt: string | null;
    email: string;
    userId: string;
    orgId?: string;
  }>;
  getAccountState(): Promise<import("./types.js").AccountState>;
  listConversations(opts?: { offset?: number; limit?: number }): Promise<
    import("./types.js").ConversationSummary[]
  >;
  sendMessage(
    prompt: string,
    opts?: {
      model?: string;
      conversationId?: import("./types.js").ConversationId;
      parentMessageId?: import("./types.js").MessageId;
    },
  ): AsyncGenerator<import("./types.js").StreamChunk, void, void>;
  extractAds?(html: string): import("../scraper/types.js").AdCard[];
}

export interface BrowserRunnerLike {
  refreshCfClearance(
    persona: Persona,
  ): Promise<{ cfClearance: string; cfClearanceExp: number }>;
  reauth(
    persona: Persona,
    credentials: PersonaCredentials,
    mailToken: string,
  ): Promise<{ sessionToken: string; cfClearance?: string; cfClearanceExp?: number }>;
  signup(
    seed: import("./types.js").PersonaSeed,
  ): Promise<{
    credentials: PersonaCredentials;
    auth: AuthState;
  }>;
}

export class PersonaManager {
  readonly crypto: PersonaCrypto;
  readonly lock = new PersonaLock();
  readonly impersonate: string;
  readonly proxyPool?: ProxyPool;
  private readonly lru: LRUCache<PersonaId, Persona>;
  private readonly authCache = new Map<PersonaId, AuthState>();
  private readonly clientFactory?: ClientFactory;
  private readonly browserFactory?: BrowserFactory;

  constructor(public readonly opts: PersonaManagerOptions) {
    this.crypto = new PersonaCrypto(opts.masterKeyHex);
    this.impersonate = opts.impersonate ?? "chrome131";
    this.lru = new LRUCache({ max: opts.maxInMemory ?? 50 });
    this.proxyPool = opts.proxyPool;
    this.clientFactory = opts.clientFactory;
    this.browserFactory = opts.browserFactory;
  }

  /** Compute the proxy URL for a persona (or undefined if no pool / no creds). */
  proxyUrlFor(id: PersonaId): string | undefined {
    if (!this.proxyPool) return undefined;
    const assignment = this.proxyPool.assign(id);
    return this.proxyPool.proxyUrlFor(assignment);
  }

  /** Rotate a persona's proxy (mark current burned, get a new sessid). */
  async rotateProxy(id: PersonaId): Promise<void> {
    if (!this.proxyPool) throw new Error("No proxy pool configured");
    this.proxyPool.rotate(id);
    // Persist the new assignment on the persona record.
    const persona = await this.load(id);
    persona.proxy = this.proxyPool.assign(id);
    await this.persistPersona(persona);
    await this.audit(id, "proxy_rotated", "manual rotation");
  }

  /** Update the lastEgress info after observing a real request. */
  async recordEgress(
    id: PersonaId,
    info: NonNullable<import("./types.js").ProxyAssignment["lastEgress"]>,
  ): Promise<void> {
    if (!this.proxyPool) return;
    this.proxyPool.recordEgress(id, info);
    const persona = await this.load(id);
    persona.proxy = this.proxyPool.get(id) ?? persona.proxy;
    await this.persistPersona(persona);
  }

  // ─── Bootstrap ────────────────────────────────────────────────
  async init(): Promise<void> {
    await ensureHome();
  }

  // ─── Identity / records ──────────────────────────────────────
  async load(id: PersonaId): Promise<Persona> {
    const cached = this.lru.get(id);
    if (cached) return cached;
    const persona = await readIdentity(id);
    this.lru.set(id, persona);
    return persona;
  }

  async loadAuth(id: PersonaId): Promise<AuthState> {
    const cached = this.authCache.get(id);
    if (cached) return cached;
    const blob = await readEncryptedBlob(
      // Lazy import to avoid circular at module init
      (await import("./storage.js")).sessionPath(id),
    );
    const auth = this.crypto.open<AuthState>(blob, { personaId: id, masterKeyHex: this.opts.masterKeyHex });
    this.authCache.set(id, auth);
    return auth;
  }

  async loadCredentials(id: PersonaId): Promise<PersonaCredentials> {
    const { credentialsPath } = await import("./storage.js");
    const blob = await readEncryptedBlob(credentialsPath(id));
    return this.crypto.open<PersonaCredentials>(blob, {
      personaId: id,
      masterKeyHex: this.opts.masterKeyHex,
    });
  }

  async persistAuth(id: PersonaId, auth: AuthState): Promise<void> {
    const blob = this.crypto.seal(auth, {
      personaId: id,
      masterKeyHex: this.opts.masterKeyHex,
      wraps: "AuthState",
    });
    const { sessionPath } = await import("./storage.js");
    await writeEncryptedBlob(sessionPath(id), blob);
    this.authCache.set(id, auth);
  }

  async persistCredentials(id: PersonaId, creds: PersonaCredentials): Promise<void> {
    const blob = this.crypto.seal(creds, {
      personaId: id,
      masterKeyHex: this.opts.masterKeyHex,
      wraps: "PersonaCredentials",
    });
    const { credentialsPath } = await import("./storage.js");
    await writeEncryptedBlob(credentialsPath(id), blob);
  }

  async persistPersona(persona: Persona): Promise<void> {
    await writeIdentity(persona.identity.id, persona);
    this.lru.set(persona.identity.id, persona);
    await updateIndex((idx) => ({
      ...idx,
      personas: { ...idx.personas, [persona.identity.id]: summarize(persona) },
    }));
  }

  // ─── Audit ───────────────────────────────────────────────────
  async audit(
    id: PersonaId,
    action: import("./types.js").AuditAction,
    reason?: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await appendAudit(id, {
      ts: new Date().toISOString(),
      action,
      reason,
      meta,
    });
  }

  async readRecentAudit(id: PersonaId, limit = 50): Promise<import("./types.js").AuditEntry[]> {
    return readAudit(id, limit);
  }

  // ─── Behavior samples ────────────────────────────────────────
  async recordBehavior(id: PersonaId, sample: unknown): Promise<void> {
    await appendBehaviorSample(id, sample);
  }

  // ─── Conversations ───────────────────────────────────────────
  async persistConversation(id: PersonaId, conversationId: string, body: unknown): Promise<void> {
    await writeConversation(id, conversationId, body);
  }

  // ─── Client access (Phase 2 hook) ───────────────────────────
  async getClient(
    id: PersonaId,
    opts: { autoFallbackToBrowser?: boolean } = {},
  ): Promise<ChatGPTClientLike> {
    if (!this.clientFactory) {
      throw new Error(
        "PersonaManager has no clientFactory; Phase 2 ChatGPTClient not wired in this build",
      );
    }
    return this.lock.run(id, async () => {
      const persona = await this.load(id);
      const auth = await this.ensureValidSession(id, persona, {
        autoFallbackToBrowser: opts.autoFallbackToBrowser ?? true,
      });
      const proxyUrl = this.proxyUrlFor(id);
      return this.clientFactory!(persona, auth, { proxyUrl });
    });
  }

  /**
   * Validate the session without auto-falling-back to the browser.
   * Used by `pnpm personas --validate` so the user can see "session
   * expired" as a clean error, not an unexpected browser launch.
   */
  async validateNoFallback(id: PersonaId): Promise<AuthState> {
    if (!this.clientFactory) {
      throw new Error("PersonaManager has no clientFactory");
    }
    return this.lock.run(id, async () => {
      const persona = await this.load(id);
      return this.ensureValidSession(id, persona, { autoFallbackToBrowser: false });
    });
  }

  // ─── Browser fallback (Phase 3 hook) ────────────────────────
  async recoverWithBrowser(
    id: PersonaId,
    reason: "cf_blocked" | "session_expired",
  ): Promise<void> {
    if (!this.browserFactory) {
      throw new Error(
        `Cannot recover: PersonaManager has no browserFactory (reason=${reason}). Build with browser support or refresh cf_clearance / re-auth manually.`,
      );
    }
    const persona = await this.load(id);
    const proxyUrl = this.proxyUrlFor(id);
    const proxy = proxyUrl
      ? (() => {
          const u = new URL(proxyUrl);
          return {
            server: `${u.protocol}//${u.hostname}:${u.port}`,
            username: decodeURIComponent(u.username),
            password: decodeURIComponent(u.password),
          };
        })()
      : undefined;
    const browser = this.browserFactory({ proxy });
    if (reason === "cf_blocked") {
      const { cfClearance, cfClearanceExp } = await browser.refreshCfClearance(persona);
      const auth = await this.loadAuth(id);
      auth.cfClearance = cfClearance;
      auth.cfClearanceExp = cfClearanceExp;
      auth.lastValidatedAt = new Date().toISOString();
      auth.health = "healthy";
      await this.persistAuth(id, auth);
      await this.audit(id, "cf_clearance_refreshed", "auto-fallback");
    } else {
      const creds = await this.loadCredentials(id);
      // Re-derive the mail.tm token so we can read the reauth code.
      // NOTE: the token is sealed at rest. In a production build, we'd
      // unseal it here. For now we require the operator to provide one
      // via OPENAI_PERSONA_<ID>_MAIL_TOKEN (or we surface a clear error).
      const envKey = `OPENAI_PERSONA_${id.toUpperCase().replace(/-/g, "_")}_MAIL_TOKEN`;
      const mailToken = process.env[envKey] ?? "";
      if (!mailToken) {
        throw new Error(
          `Cannot reauth: mail.tm token for ${id} not in ${envKey}. ` +
            `Set it in .env to allow browser-driven reauth.`,
        );
      }
      const existing = await this.loadAuth(id);
      const result = await browser.reauth(persona, creds, mailToken);
      const auth: AuthState = {
        sessionToken: result.sessionToken,
        accessToken: null,
        accessTokenExp: null,
        cfClearance: result.cfClearance ?? existing.cfClearance ?? null,
        cfClearanceExp: result.cfClearanceExp ?? existing.cfClearanceExp ?? null,
        deviceId: existing.deviceId,
        puid: existing.puid,
        lastValidatedAt: new Date().toISOString(),
        health: "healthy",
        sessionStartedAt: new Date().toISOString(),
        accountState: "UNKNOWN",
        plan: existing.plan,
      };
      await this.persistAuth(id, auth);
      await this.audit(id, "session_refreshed", "auto-fallback after expiry");
    }
  }

  /**
   * Ensure the auth state has a valid (non-expired) accessToken. Refreshes
   * via /api/auth/session if needed. Falls back to the browser if the
   * session-token itself is dead or Cloudflare is blocking.
   *
   * `opts.autoFallbackToBrowser` defaults to TRUE; pass FALSE to surface
   * the error without launching a browser (used by --validate).
   */
  async ensureValidSession(
    id: PersonaId,
    persona: Persona,
    opts: { autoFallbackToBrowser?: boolean } = {},
  ): Promise<AuthState> {
    const autoFallback = opts.autoFallbackToBrowser ?? true;
    let auth = await this.loadAuth(id);
    const now = Math.floor(Date.now() / 1000);
    if (auth.accessToken && auth.accessTokenExp && auth.accessTokenExp > now + 60) {
      return auth;
    }
    if (!this.clientFactory) {
      return auth; // best-effort: caller will surface error
    }
    const proxyUrl = this.proxyUrlFor(id);
    const client = this.clientFactory(persona, auth, { proxyUrl });
    try {
      const v = await client.validateSession();
      auth.accessToken = v.accessToken ?? null;
      auth.accessTokenExp = v.accessTokenExp ?? null;
      auth.lastValidatedAt = new Date().toISOString();
      auth.health = v.valid ? "healthy" : "session_expired";
      await this.persistAuth(id, auth);
      await this.audit(id, "session_refreshed", "via /api/auth/session");
      return auth;
    } catch (e: any) {
      const reason = classifyAuthError(e);
      auth.health = reason;
      auth.lastValidatedAt = new Date().toISOString();
      await this.persistAuth(id, auth);
      if (
        autoFallback &&
        (reason === "cf_blocked" || reason === "session_expired") &&
        this.browserFactory
      ) {
        await this.audit(id, "browser_invoked", `auto-recover from ${reason}`);
        await this.recoverWithBrowser(id, reason);
        return this.loadAuth(id);
      }
      throw e;
    }
  }
}

function classifyAuthError(e: any): SessionHealth {
  const code = e?.code ?? e?.message ?? "";
  if (code === "cf_blocked") return "cf_blocked";
  if (code === "session_expired") return "session_expired";
  if (code === "banned") return "banned";
  if (code === "rate_limited") return "rate_limited";
  return "unknown";
}

// ─── Browser-driven creation (signs up a real account) ──────────
export interface CreateWithBrowserOptions {
  /** Override the persona id (defaults to seed.id). */
  id?: string;
  /** Override fingerprint seed. */
  fingerprintSeed?: string;
  /** Tags to add. */
  tags?: string[];
  createdBy?: string;
}

/**
 * Sign up a real ChatGPT account and persist everything.
 * Requires a `browserFactory` to be supplied at construction time.
 * Will use the resulting account's `cf_clearance` and `sessionToken`
 * to seed the auth state.
 */
export async function createWithBrowser(
  seedId: string,
  pm: PersonaManager,
  opts: CreateWithBrowserOptions = {},
): Promise<{ id: PersonaId; label: string }> {
  const seed = getSeed(seedId);
  if (!seed) throw new Error(`Unknown seed: ${seedId}`);
  if (!pm["browserFactory" as keyof PersonaManager]) {
    throw new Error(
      "PersonaManager has no browserFactory; cannot create accounts on this build",
    );
  }
  // Indirect through the public surface to keep the private field private.
  const factory = (pm as any).browserFactory as BrowserFactory | undefined;
  if (!factory) throw new Error("PersonaManager has no browserFactory");

  const runner = factory({});
  const { credentials, auth } = await runner.signup(seed);

  // Seal the mail.tm token (which lives in credentials.mailInbox) before
  // persisting, so it can be used for reauth later.
  const sealedMailToken = pm.crypto.seal(
    (credentials.mailInbox?.tokenCipher as unknown as string) ?? "",
    {
      personaId: opts.id ?? seed.id,
      masterKeyHex: pm.opts.masterKeyHex,
      wraps: "PersonaCredentials", // not used directly; we re-seal creds below
    },
  );
  if (credentials.mailInbox) {
    credentials.mailInbox.tokenCipher = sealedMailToken.ciphertext;
  }

  // Build a real Persona with a generated fingerprint
  const fingerprintSeed = opts.fingerprintSeed ?? `${seed.id}-${Date.now().toString(36)}`;
  const { generateFingerprint } = await import("./fingerprint.js");
  const fp = generateFingerprint(seed, fingerprintSeed);

  const id = asPersonaId(opts.id ?? seed.id);
  const persona: Persona = {
    version: PERSONA_VERSION,
    identity: {
      id,
      label: seed.label,
      description: seed.description,
      interests: seed.interests,
      backstory: seed.backstory,
      declared: seed.declared,
      client: seed.client,
      fingerprintSeed,
      createdAt: new Date().toISOString(),
      createdBy: opts.createdBy,
      tags: [...seed.tags, ...(opts.tags ?? [])],
    },
    fingerprint: fp,
    proxy: {
      provider: "local",
      sessionId: `local-${id}-${Date.now()}`,
      description: "no proxy",
      burned: false,
      assignedAt: new Date().toISOString(),
    },
    behavioral: {
      typingWpm: 65,
      typingWpmStddev: 12,
      interActionDelayMs: { mean: 1200, stddev: 400 },
      activeHours: { start: 9, end: 23 },
      mouseCurveSamples: [],
      typingSamples: [],
    },
    history: { summaries: [], adsSeen: { total: 0, byAdvertiser: {}, byTopic: {} } },
    operational: {
      lastUsed: new Date(0).toISOString(),
      totalProbes: 0,
      totalConversations: 0,
      sessionSuccessRate: 1.0,
      recentAdYield: 0,
      healthScore: 100,
      flags: [],
    },
  };

  await pm.persistPersona(persona);
  await pm.persistCredentials(id, credentials);
  await pm.persistAuth(id, auth);
  await pm.audit(id, "created", `browser signup from seed ${seedId}`);
  await pm.audit(id, "session_obtained", "via browser signup");

  return { id, label: persona.identity.label };
}

// ─── Convenience: mint a fresh persona from a seed (no network) ───
export interface MintOptions {
  /** Override id; defaults to seed.id. */
  id?: string;
  /** Override fingerprint seed; defaults to `<id>-<random>`. */
  fingerprintSeed?: string;
  /** Tags to add. */
  tags?: string[];
  createdBy?: string;
  /** Stub fingerprint if the real generator isn't wired (Phase 1 default). */
  fingerprint?: import("./types.js").Fingerprint;
}

export function makePersonaFromSeed(
  seedId: string,
  opts: MintOptions = {},
): { persona: Persona; credentials: PersonaCredentials; auth: AuthState } {
  const seed = getSeed(seedId);
  if (!seed) throw new Error(`Unknown seed: ${seedId}`);
  const id = asPersonaId(opts.id ?? seed.id);
  const fingerprintSeed = opts.fingerprintSeed ?? `${seed.id}-${randomUUID().slice(0, 8)}`;

  const fingerprint: import("./types.js").Fingerprint =
    opts.fingerprint ??
    defaultFingerprintFor(seed, fingerprintSeed);

  const persona: Persona = {
    version: PERSONA_VERSION,
    identity: {
      id,
      label: seed.label,
      description: seed.description,
      interests: seed.interests,
      backstory: seed.backstory,
      declared: seed.declared,
      client: seed.client,
      fingerprintSeed,
      createdAt: new Date().toISOString(),
      createdBy: opts.createdBy,
      tags: [...seed.tags, ...(opts.tags ?? [])],
    },
    fingerprint,
    proxy: {
      provider: "local",
      sessionId: `local-${id}-${Date.now()}`,
      description: "no proxy (Phase 1 default)",
      burned: false,
      assignedAt: new Date().toISOString(),
    },
    behavioral: {
      typingWpm: 65,
      typingWpmStddev: 12,
      interActionDelayMs: { mean: 1200, stddev: 400 },
      activeHours: { start: 9, end: 23 },
      mouseCurveSamples: [],
      typingSamples: [],
    },
    history: {
      summaries: [],
      adsSeen: { total: 0, byAdvertiser: {}, byTopic: {} },
    },
    operational: {
      lastUsed: new Date(0).toISOString(),
      totalProbes: 0,
      totalConversations: 0,
      sessionSuccessRate: 1.0,
      recentAdYield: 0,
      healthScore: 50,
      flags: [],
    },
  };

  const credentials: PersonaCredentials = {
    email: "",
    password: null,
    mailInbox: null,
    accountCreatedAt: new Date().toISOString(),
  };

  const auth: AuthState = {
    sessionToken: "",
    accessToken: null,
    accessTokenExp: null,
    cfClearance: null,
    cfClearanceExp: null,
    deviceId: randomUUID(),
    puid: null,
    lastValidatedAt: new Date(0).toISOString(),
    health: "unknown",
    sessionStartedAt: new Date().toISOString(),
    accountState: "UNKNOWN",
    plan: "unknown",
  };

  return { persona, credentials, auth };
}

/** A plausible default fingerprint; replaced by the Apify generator in Phase 3. */
function defaultFingerprintFor(
  seed: import("./types.js").PersonaSeed,
  fingerprintSeed: string,
): import("./types.js").Fingerprint {
  const isMac = seed.client.os === "macos";
  const ua = isMac
    ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  return {
    userAgent: ua,
    secChUa: '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
    secChUaMobile: "?0",
    secChUaPlatform: isMac ? '"macOS"' : '"Windows"',
    secChUaFullVersionList: '"Chromium";v="131.0.0.0", "Not_A Brand";v="24.0.0.0", "Google Chrome";v="131.0.0.0"',
    screen: { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, colorDepth: 30, pixelRatio: 2 },
    viewport: { width: 1440, height: 900 },
    locale: seed.declared.locale,
    timezone: seed.declared.timezone,
    timezoneOffsetMin: -new Date(seed.declared.timezone).getTimezoneOffset() || 0,
    hardware: { deviceMemory: 16, hardwareConcurrency: 10, maxTouchPoints: 0 },
    platform: isMac ? "MacIntel" : "Win32",
    webgl: {
      vendor: "Google Inc. (Apple)",
      renderer: "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)",
      unmaskedVendor: "Apple Inc.",
      unmaskedRenderer: "Apple M1 Pro",
    },
    canvas: { noiseSeed: fingerprintSeed },
    audio: { noiseSeed: fingerprintSeed },
    fonts: ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia"],
    plugins: ["PDF Viewer", "Chrome PDF Viewer"],
    languages: [seed.declared.locale, seed.declared.locale.split("-")[0] ?? "en"],
  };
}
