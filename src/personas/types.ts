// ────────────────────────────────────────────────────────────────────
// Persona v2 — opinionated, version-tagged, scoped for multi-client use.
// ────────────────────────────────────────────────────────────────────
//
// All persistent types. Branded id types prevent id-mixing bugs.
// All state is split into separately-encrypted files on disk.

import { z } from "zod";

export const PERSONA_VERSION = 2 as const;
export const PERSONA_STORAGE_VERSION = 2 as const;

// ─── Branded id types ─────────────────────────────────────────────
export type PersonaId = string & { readonly __brand: "PersonaId" };
export type ConversationId = string & { readonly __brand: "ConversationId" };
export type MessageId = string & { readonly __brand: "MessageId" };

export const asPersonaId = (s: string): PersonaId => s as PersonaId;
export const asConversationId = (s: string): ConversationId => s as ConversationId;
export const asMessageId = (s: string): MessageId => s as MessageId;

// ─── Plan / state enums ────────────────────────────────────────────
export const ChatGptPlanEnum = z.enum([
  "free",
  "go",
  "plus",
  "pro",
  "team",
  "enterprise",
  "unknown",
]);
export type ChatGptPlan = z.infer<typeof ChatGptPlanEnum>;

export const AccountStateEnum = z.enum([
  "OK",
  "TRIAL_AVAILABLE",
  "BANNED",
  "RATE_LIMITED",
  "SOFT_BANNED",
  "MFA_REQUIRED",
  "UNKNOWN",
]);
export type AccountState = z.infer<typeof AccountStateEnum>;

export const SessionHealthEnum = z.enum([
  "healthy",
  "cf_blocked",
  "session_expired",
  "banned",
  "rate_limited",
  "mfa_required",
  "unknown",
]);
export type SessionHealth = z.infer<typeof SessionHealthEnum>;

export const ProxyProviderEnum = z.enum([
  "oxylabs",
  "brightdata",
  "webshare",
  "smartproxy",
  "local",
  "tor",
]);
export type ProxyProvider = z.infer<typeof ProxyProviderEnum>;

export const InboxProviderEnum = z.enum(["mail.tm", "1secmail", "imap"]);
export type InboxProvider = z.infer<typeof InboxProviderEnum>;

export const OsEnum = z.enum(["macos", "windows", "linux"]);
export type Os = z.infer<typeof OsEnum>;

export const BrowserEnum = z.enum(["chrome", "edge", "safari", "firefox"]);
export type Browser = z.infer<typeof BrowserEnum>;

// ═══════════════════════════════════════════════════════════════════
// Identity (immutable, copied from a PersonaSeed at create time)
// ═══════════════════════════════════════════════════════════════════
export interface PersonaIdentity {
  /** Stable slug-cased id used in paths. e.g. "crypto-trader-us-east". */
  id: PersonaId;
  /** Human-readable label for the dashboard. */
  label: string;
  /** Free-form description; what this persona is "for". */
  description: string;
  /** IAB-style or custom topic tags for ad-relevance scoring. */
  interests: string[];
  /** Optional persona "story" consumed by the seed-conversation generator. */
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
    os: Os;
    browser: Browser;
    browserVersion: number;       // e.g. 131
    isMobile: boolean;
  };
  /** A seed used to deterministically derive the fingerprint. */
  fingerprintSeed: string;
  createdAt: string;             // ISO
  createdBy?: string;            // user/agent id
  tags: string[];                // free-form: ["finance", "high-intent"]
}

// ═══════════════════════════════════════════════════════════════════
// Credentials (encrypted at rest)
// ═══════════════════════════════════════════════════════════════════
export interface PersonaCredentials {
  /** Email used to log in to chatgpt.com. */
  email: string;
  /** Password, if the account has one. Null for email-code-only accounts. */
  password: string | null;
  /** mail.tm mapping (or other disposable inbox provider). */
  mailInbox: {
    provider: InboxProvider;
    address: string;
    inboxId: string;
    /** AES-GCM of the bearer token, base64. */
    tokenCipher: string;
    lastCheckedAt: string;
  } | null;
  /** Optional: ChatGPT "team" or "org" id for Team plans. */
  orgId?: string;
  /** ISO timestamp when the account was first created. */
  accountCreatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Auth state (live, volatile)
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// Fingerprint (deterministic, NOT secret)
// ═══════════════════════════════════════════════════════════════════
// Generated from identity.fingerprintSeed via @apify/fingerprint-generator
// at persona-create time, then stored. All fields are stable across the
// persona's life. Changing the seed = creating a new persona.
export interface Fingerprint {
  userAgent: string;
  secChUa: string;             // e.g. '"Chromium";v="131", "Not_A Brand";v="24"'
  secChUaMobile: "?0" | "?1";
  secChUaPlatform: string;     // e.g. '"macOS"'
  secChUaFullVersionList?: string;

  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelRatio: number;
  };
  viewport: { width: number; height: number };

  locale: string;
  timezone: string;
  timezoneOffsetMin: number;

  hardware: {
    deviceMemory: number;
    hardwareConcurrency: number;
    maxTouchPoints: number;
  };
  platform: string;            // e.g. "MacIntel"

  webgl: {
    vendor: string;
    renderer: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
  };
  canvas: { noiseSeed: string };
  audio: { noiseSeed: string };

  fonts: string[];
  plugins: string[];
  languages: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Behavioral model (used when we DO launch the browser)
// ═══════════════════════════════════════════════════════════════════
export interface BehavioralModel {
  /** Mean words-per-minute when typing prompts. */
  typingWpm: number;
  /** Std-dev of typingWpm. */
  typingWpmStddev: number;

  /** Inter-action delay distribution (in ms). */
  interActionDelayMs: { mean: number; stddev: number };

  /** Daily active hours (24h clock, in declared.timezone). */
  activeHours: { start: number; end: number };

  /** Past observed mouse-curve samples (capped at N=200). */
  mouseCurveSamples: Array<{ t: number; x: number; y: number }>;

  /** Past observed typing-interval samples (capped at N=200). */
  typingSamples: Array<{ promptId: string; wpm: number; charIntervals: number[] }>;
}

// ═══════════════════════════════════════════════════════════════════
// Proxy assignment
// ═══════════════════════════════════════════════════════════════════
export interface ProxyAssignment {
  provider: ProxyProvider;
  /** Session id for sticky-IP residential proxies. */
  sessionId: string;
  /** Human-readable description of what this proxy yields. */
  description?: string;
  /** Egress IP/geo we observed the LAST time we used this proxy. */
  lastEgress?: { ip: string; country: string; region?: string; city?: string; tz?: string };
  /** True if the proxy has been flagged / banned / is no longer working. */
  burned: boolean;
  burnedReason?: string;
  burnedAt?: string;
  /** ISO timestamp this proxy was assigned. */
  assignedAt: string;
  /** Last health check. */
  lastHealthCheckAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Conversation history (compressed)
// ═══════════════════════════════════════════════════════════════════
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
  /** True if this conversation produced ad impressions (from SSE). */
  hadAds: boolean;
  /** Advertisers seen in this conversation, if any. */
  advertisers?: string[];
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

// ═══════════════════════════════════════════════════════════════════
// Operational metadata
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// Audit (append-only)
// ═══════════════════════════════════════════════════════════════════
export const AuditActionEnum = z.enum([
  "created",
  "credentials_stored",
  "session_obtained",
  "session_refreshed",
  "session_expired",
  "cf_clearance_refreshed",
  "cf_clearance_expired",
  "proxy_rotated",
  "proxy_burned",
  "fingerprint_updated",
  "rate_limited",
  "banned",
  "recovered",
  "used",
  "conversation_synced",
  "seeded",
  "archived",
  "health_check_ok",
  "health_check_failed",
  "browser_invoked",
]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

export interface AuditEntry {
  ts: string;
  action: AuditAction;
  reason?: string;
  meta?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// The "public" Persona object — what's safe to keep in plaintext
// ═══════════════════════════════════════════════════════════════════
export interface Persona {
  version: typeof PERSONA_VERSION;
  identity: PersonaIdentity;
  fingerprint: Fingerprint;
  proxy: ProxyAssignment;
  behavioral: BehavioralModel;
  history: ConversationHistory;
  operational: OperationalMeta;
}

// ═══════════════════════════════════════════════════════════════════
// Storage envelope (one file per concern on disk)
// ═══════════════════════════════════════════════════════════════════
export interface PersonaOnDisk {
  /** identity.json — public. */
  public: Persona;
  /** credentials.json — AES-GCM ciphertext (base64). */
  credentialsCipher: EncryptedBlob;
  /** session.json — AES-GCM ciphertext (base64). */
  sessionCipher: EncryptedBlob;
  /** audit/<yyyy-mm>.jsonl — append-only. */
  audit: AuditEntry[];
}

export interface EncryptedBlob {
  /** base64-encoded ciphertext */
  ciphertext: string;
  /** base64-encoded IV (12 bytes for GCM) */
  iv: string;
  /** base64-encoded auth tag (16 bytes for GCM) */
  tag: string;
  /** algorithm identifier for forward-compat. */
  alg: "aes-256-gcm";
  /** KDF identifier (HKDF-SHA256) + salt (base64) used to derive the key. */
  kdf: { name: "hkdf-sha256"; salt: string; info: string };
  /** ISO timestamp when the blob was sealed. */
  sealedAt: string;
  /** The wrapped type identifier, e.g. "PersonaCredentials" | "AuthState". */
  wraps: "PersonaCredentials" | "AuthState";
}

// ═══════════════════════════════════════════════════════════════════
// Index (fast lookups)
// ═══════════════════════════════════════════════════════════════════
export interface PersonaIndexEntry {
  id: PersonaId;
  label: string;
  plan: ChatGptPlan;
  health: SessionHealth;
  lastUsed: string;
  healthScore: number;
  totalProbes: number;
  tags: string[];
}

export interface PersonaIndex {
  version: typeof PERSONA_STORAGE_VERSION;
  updatedAt: string;
  personas: Record<string, PersonaIndexEntry>;
}

// ═══════════════════════════════════════════════════════════════════
// Seeds (immutable spec used to mint a Persona)
// ═══════════════════════════════════════════════════════════════════
export interface PersonaSeed {
  id: string;                    // becomes the initial id
  label: string;
  description: string;
  interests: string[];
  backstory?: string;
  declared: PersonaIdentity["declared"];
  client: PersonaIdentity["client"];
  /** Initial seed-prompts to send during account creation warmup. */
  seedPrompts: string[];
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Runtime types (not persisted)
// ═══════════════════════════════════════════════════════════════════
export interface ValidationResult {
  valid: boolean;
  accessToken?: string;
  accessTokenExp?: number;
  profile?: {
    id: string;
    email: string;
    name: string | null;
    image?: string;
  };
  userId?: string;
  orgId?: string;
  reason?: string;
}

export interface ProbeOptions {
  model?: string;
  conversationId?: ConversationId;
  parentMessageId?: MessageId;
  /** Persist the resulting conversation to disk. */
  persist?: boolean;
}

export type StreamChunk =
  | {
      kind: "delta";
      conversationId: ConversationId;
      messageId: MessageId;
      parentMessageId: MessageId;
      text: string;            // cumulative
      delta: string;           // text since last chunk
      model: string;
      /** Ad HTML if the assistant emitted any. */
      html?: string;
      /** Parsed ads from the html field. */
      ads?: import("../scraper/types.js").AdCard[];
    }
  | {
      kind: "done";
      conversationId: ConversationId;
      messageId: MessageId;
      parentMessageId: MessageId;
      text: string;
      delta: string;
      model: string;
    }
  | {
      kind: "error";
      code: string;
      message: string;
    };

export interface ProbeResult {
  prompt: string;
  conversationId: ConversationId | null;
  messageId: MessageId | null;
  text: string;
  html: string;
  ads: import("../scraper/types.js").AdCard[];
  model: string;
  elapsedMs: number;
  meta: {
    accountState: AccountState;
    plan: ChatGptPlan;
    healthBefore: SessionHealth;
  };
}

export interface PersonaHealthReport {
  id: PersonaId;
  health: SessionHealth;
  healthScore: number;
  accountState: AccountState;
  plan: ChatGptPlan;
  lastValidatedAt: string;
  issues: string[];
}
