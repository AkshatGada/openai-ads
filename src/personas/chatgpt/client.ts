// ChatGPTClient — the browserless HTTP client for ChatGPT.
//
// Talks to chatgpt.com via a TLS-impersonating fetcher (impers) with
// the persona's fingerprint as headers. No Playwright, no Chromium.
//
// Reuses `extractAdsFromHtml` from `src/scraper/client.ts` for ad
// detection on the SSE-stream ad HTML chunks.

import { randomUUID } from "node:crypto";
import { decodeJwt } from "jose";
import { extractAdsFromHtml } from "../../scraper/client.js";
import { AdCard } from "../../scraper/types.js";
import {
  AuthState,
  ChatGptPlan,
  ConversationId,
  ConversationSummary,
  MessageId,
  Persona,
  ProbeOptions,
  ProbeResult,
  StreamChunk,
  ValidationResult,
} from "../types.js";
import { parseSSE } from "./messages.js";
import { computeProofOfWork } from "./sentinel.js";
import {
  AccountCheckSchema,
  ConversationsListSchema,
  MeResponseSchema,
  SessionResponseSchema,
} from "./types.js";

// ─── Errors ──────────────────────────────────────────────────────
export class PersonaError extends Error {
  constructor(
    public code: string,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "PersonaError";
  }
}
export class SessionExpiredError extends PersonaError {
  constructor(reason: string) {
    super("session_expired", `Session expired: ${reason}`);
  }
}
export class CfBlockedError extends PersonaError {
  constructor() {
    super("cf_blocked", "Cloudflare challenge; cf_clearance refresh required");
  }
}
export class BannedError extends PersonaError {
  constructor() {
    super("banned", "Account banned");
  }
}
export class RateLimitedError extends PersonaError {
  constructor(public retryAfterMs?: number) {
    super("rate_limited", "Per-model rate limit hit");
  }
}

// ─── HTTP fetcher interface ──────────────────────────────────────
// We accept any function matching `(url, init) => Promise<{status, headers, body, text}>`.
// In production this is `impers` (with TLS impersonation). In tests
// (and in this build before the user installs `impers`) it's global `fetch`.
export interface HttpFetcher {
  (url: string, init: HttpRequestInit): Promise<HttpResponse>;
}

export interface HttpRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  /** Optional proxy URL. Used by `impers` in production. */
  proxy?: string;
  /** TLS impersonation profile (e.g. "chrome131"). */
  impersonate?: string;
  /** Request timeout in ms. */
  timeoutMs?: number;
}

export interface HttpResponse {
  status: number;
  ok: boolean;
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

// ─── Default fetcher: global fetch (Node 18+) ────────────────────
// Good enough for the case where the user has captured a cf_clearance
// manually. For TLS fingerprinting against Cloudflare, swap in `impers`.
export const defaultFetcher: HttpFetcher = async (url, init) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), init.timeoutMs ?? 30_000);
  try {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: init.headers,
      body: typeof init.body === "string" ? init.body : init.body ? Buffer.from(init.body) : undefined,
      signal: controller.signal,
    });
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      body: res.body,
      text: () => res.text(),
      json: () => res.json(),
    };
  } finally {
    clearTimeout(t);
  }
};

// ─── The client ──────────────────────────────────────────────────
export interface ChatGPTClientOptions {
  fetcher?: HttpFetcher;
  impersonate?: string;
  proxyUrl?: string;
  onRequest?: (info: { method: string; url: string; ms: number; status: number }) => void;
}

export class ChatGPTClient {
  private accessTokenCache: { token: string; exp: number } | null = null;
  private opts: Required<Pick<ChatGPTClientOptions, "fetcher" | "impersonate">> &
    Omit<ChatGPTClientOptions, "fetcher" | "impersonate">;

  constructor(
    private readonly persona: Persona,
    private auth: AuthState,
    options: ChatGPTClientOptions = {},
  ) {
    this.opts = {
      fetcher: options.fetcher ?? defaultFetcher,
      impersonate: options.impersonate ?? "chrome131",
      proxyUrl: options.proxyUrl,
      onRequest: options.onRequest,
    };
  }

  // ─── HTTP plumbing ───────────────────────────────────────────
  private async chatgptFetch(
    path: string,
    init: HttpRequestInit = {},
  ): Promise<HttpResponse> {
    const url = new URL(path, "https://chatgpt.com").toString();
    const headers: Record<string, string> = {
      "User-Agent": this.persona.fingerprint.userAgent,
      "Accept-Language": this.persona.fingerprint.languages.join(","),
      "oai-language": this.persona.fingerprint.locale,
      "oai-device-id": this.auth.deviceId,
      ...(init.headers ?? {}),
    };
    if (this.persona.identity.client.browser === "chrome") {
      headers["sec-ch-ua"] = this.persona.fingerprint.secChUa;
      headers["sec-ch-ua-mobile"] = this.persona.fingerprint.secChUaMobile;
      headers["sec-ch-ua-platform"] = this.persona.fingerprint.secChUaPlatform;
      if (this.persona.fingerprint.secChUaFullVersionList) {
        headers["sec-ch-ua-full-version-list"] =
          this.persona.fingerprint.secChUaFullVersionList;
      }
    }
    if (this.auth.sessionToken) {
      headers["Cookie"] = `__Secure-next-auth.session-token=${this.auth.sessionToken}`;
      if (this.auth.cfClearance) headers["Cookie"] += `; cf_clearance=${this.auth.cfClearance}`;
      if (this.auth.puid) headers["Cookie"] += `; _puid=${this.auth.puid}`;
    }

    const start = Date.now();
    const res = await this.opts.fetcher(url, {
      ...init,
      headers,
      impersonate: this.opts.impersonate,
      proxy: this.opts.proxyUrl,
      timeoutMs: init.timeoutMs ?? 60_000,
    });
    this.opts.onRequest?.({
      method: init.method ?? "GET",
      url,
      ms: Date.now() - start,
      status: res.status,
    });
    return res;
  }

  // ─── Session validation ─────────────────────────────────────
  async validateSession(): Promise<ValidationResult> {
    const res = await this.chatgptFetch("/api/auth/session", {
      headers: { Accept: "application/json" },
    });
    if (res.status === 403) {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) throw new CfBlockedError();
      throw new PersonaError("http_403", `unexpected 403 (${ct})`);
    }
    if (!res.ok) {
      throw new PersonaError("http_" + res.status, `validate http_${res.status}`);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) throw new CfBlockedError();
    const data = SessionResponseSchema.parse(await res.json());
    if (!data.accessToken) throw new SessionExpiredError("empty_session");

    const claims = decodeJwt(data.accessToken);
    this.accessTokenCache = {
      token: data.accessToken,
      exp: (claims.exp as number) ?? 0,
    };

    return {
      valid: true,
      accessToken: data.accessToken,
      accessTokenExp: (claims.exp as number) ?? 0,
      profile: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name ?? null,
            image: data.user.image ?? data.user.picture,
          }
        : undefined,
      userId: data.userId ?? data.user?.id,
      orgId: data.orgId,
    };
  }

  /** Lazily fetch a fresh access token. */
  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessTokenCache && this.accessTokenCache.exp > now + 60) {
      return this.accessTokenCache.token;
    }
    const v = await this.validateSession();
    if (!v.accessToken) throw new SessionExpiredError("no_access_token");
    return v.accessToken;
  }

  // ─── Profile / plan / state ─────────────────────────────────
  async getMe(): Promise<{
    plan: ChatGptPlan;
    isPaid: boolean;
    expiresAt: string | null;
    email: string;
    userId: string;
    orgId?: string;
  }> {
    const token = await this.getAccessToken();
    const res = await this.chatgptFetch("/backend-api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new PersonaError("getMe_http_" + res.status, await safeText(res));
    }
    const me = MeResponseSchema.parse(await res.json());
    return {
      plan: me.account_plan.subscription_plan,
      isPaid: me.account_plan.is_paid_subscription_active,
      expiresAt: me.account_plan.subscription_expires_at ?? null,
      email: me.email,
      userId: me.id,
      orgId: me.default_org_id,
    };
  }

  async getAccountState(): Promise<import("../types.js").AccountState> {
    const token = await this.getAccessToken();
    const res = await this.chatgptFetch(
      "/backend-api/accounts/check/v4-2023-04-27?action=account_state",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      throw new PersonaError("account_check_http_" + res.status, await safeText(res));
    }
    const data = AccountCheckSchema.parse(await res.json());
    return data.account_state as import("../types.js").AccountState;
  }

  // ─── Conversations ──────────────────────────────────────────
  async listConversations(
    opts: { offset?: number; limit?: number } = {},
  ): Promise<ConversationSummary[]> {
    const token = await this.getAccessToken();
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 20;
    const res = await this.chatgptFetch(
      `/backend-api/conversations?offset=${offset}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      throw new PersonaError("list_http_" + res.status, await safeText(res));
    }
    const data = ConversationsListSchema.parse(await res.json());
    return data.items.map((it) => ({
      conversationId: it.id as ConversationId,
      title: it.title ?? "(untitled)",
      createdAt: new Date(it.create_time * 1000).toISOString(),
      updatedAt: new Date(it.update_time * 1000).toISOString(),
      messageCount: 0,
      topics: [],
      adRelevance: 0,
      preview: "",
      hadAds: false,
    }));
  }

  // ─── Send a message (SSE) ───────────────────────────────────
  async *sendMessage(
    prompt: string,
    opts: {
      model?: string;
      conversationId?: ConversationId;
      parentMessageId?: MessageId;
    } = {},
  ): AsyncGenerator<StreamChunk, void, void> {
    const token = await this.getAccessToken();
    const model = opts.model ?? "auto";
    const parentMessageId = (opts.parentMessageId ?? (randomUUID() as MessageId));
    const messageId = randomUUID() as MessageId;
    const wsRequestId = randomUUID();

    // 1. Sentinel proof
    const proof = await this.acquireSentinelProof();

    // 2. POST
    const body = {
      action: "next",
      messages: [
        {
          id: messageId,
          author: { role: "user" },
          content: { content_type: "text", parts: [prompt] },
          metadata: {},
        },
      ],
      parent_message_id: parentMessageId,
      conversation_id: opts.conversationId ?? null,
      model,
      timezone_offset_min: this.persona.fingerprint.timezoneOffsetMin,
      suggests: [],
      history_and_training_disabled: false,
      conversation_mode: { kind: "primary_assistant" },
      force_parallel_search: false,
      force_use_search: false,
      ws_request_id: wsRequestId,
      arkose_token: proof.arkoseToken,
    };

    const res = await this.chatgptFetch("/backend-api/conversation", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "openai-sentinel-chat-requirements-token": proof.requirementsToken,
        ...(proof.proofToken
          ? { "openai-sentinel-proof-token": proof.proofToken }
          : {}),
      },
      body: JSON.stringify(body),
      timeoutMs: 180_000,
    });

    if (!res.ok || !res.body) {
      const text = res.body ? await res.text() : `http_${res.status}`;
      if (res.status === 429) throw new RateLimitedError();
      if (res.status === 403) throw new CfBlockedError();
      throw new PersonaError("send_http_" + res.status, text);
    }

    // 3. Parse SSE → yield chunks
    let lastText = "";
    let conversationId: ConversationId = (opts.conversationId ?? ("") as ConversationId);
    let finalMessageId: MessageId = messageId;

    for await (const event of parseSSE(res.body)) {
      if (event.done) break;
      if (event.error) {
        const code = String((event.error as any)?.code ?? "openai_error");
        throw new PersonaError(code, JSON.stringify(event.error));
      }
      const m = event.message;
      if (!m || m.author?.role !== "assistant") continue;
      const parts = (m.content?.parts ?? []) as unknown[];
      const textPart = parts.find((p) => typeof p === "string") as string | undefined;
      const htmlPart = parts.find(
        (p) => typeof p === "string" && (p as string).includes("data-ad-card-root"),
      ) as string | undefined;
      const text = textPart ?? "";
      const delta = text.startsWith(lastText) ? text.slice(lastText.length) : text;
      lastText = text;
      if (event.conversation_id) conversationId = event.conversation_id as ConversationId;
      if (m.id) finalMessageId = m.id as MessageId;
      const ads: AdCard[] = htmlPart ? extractAdsFromHtml(htmlPart) : [];

      yield {
        kind: "delta",
        conversationId,
        messageId: finalMessageId,
        parentMessageId,
        text,
        delta,
        model: m.metadata?.model_slug ?? model,
        html: htmlPart,
        ads,
      };
    }

    yield {
      kind: "done",
      conversationId,
      messageId: finalMessageId,
      parentMessageId,
      text: lastText,
      delta: "",
      model,
    };
  }

  /** High-level: send a prompt, collect the final result + ads. */
  async probe(prompt: string, opts: ProbeOptions = {}): Promise<ProbeResult> {
    const start = Date.now();
    const healthBefore = this.auth.health;
    let text = "";
    let html = "";
    const allAds: AdCard[] = [];
    let conversationId: ConversationId | null = (opts.conversationId ?? null) as ConversationId | null;
    let messageId: MessageId | null = null;
    let model = opts.model ?? "auto";

    for await (const chunk of this.sendMessage(prompt, opts)) {
      if (chunk.kind === "error") {
        throw new PersonaError(chunk.code, chunk.message);
      }
      if (chunk.kind === "done") {
        if (chunk.conversationId) conversationId = chunk.conversationId;
        if (chunk.messageId) messageId = chunk.messageId;
        model = chunk.model;
        continue;
      }
      if (chunk.kind === "delta") {
        text = chunk.text;
        if (chunk.html) html += chunk.html;
        if (chunk.ads) allAds.push(...chunk.ads);
        if (chunk.conversationId) conversationId = chunk.conversationId;
        if (chunk.messageId) messageId = chunk.messageId;
        model = chunk.model;
      }
    }

    // Dedupe ads by (advertiser + title) since SSE can re-emit the same card.
    const seen = new Set<string>();
    const dedupedAds = allAds.filter((ad) => {
      const k = `${ad.advertiser}::${ad.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      prompt,
      conversationId,
      messageId,
      text,
      html,
      ads: dedupedAds,
      model,
      elapsedMs: Date.now() - start,
      meta: {
        accountState: this.auth.accountState,
        plan: this.auth.plan,
        healthBefore,
      },
    };
  }

  // ─── Sentinel / PoW ─────────────────────────────────────────
  private async acquireSentinelProof(): Promise<{
    requirementsToken: string;
    proofToken: string;
    arkoseToken: string | null;
  }> {
    const res = await this.chatgptFetch("/backend-anon/sentinel/chat-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: this.auth.deviceId }),
    });
    if (!res.ok) {
      throw new PersonaError("sentinel_http_" + res.status, await safeText(res));
    }
    const req = (await res.json()) as {
      token: string;
      arkose?: { required: boolean };
      turnstile?: { required: boolean };
      proofofwork?: { required: boolean; seed: string; difficulty: string };
    };

    let proofToken = "";
    if (req.proofofwork?.required) {
      const result = await computeProofOfWork({
        seed: req.proofofwork.seed,
        difficulty: req.proofofwork.difficulty,
        userAgent: this.persona.fingerprint.userAgent,
        cores: this.persona.fingerprint.hardware.hardwareConcurrency,
        screen: `${this.persona.fingerprint.screen.width}x${this.persona.fingerprint.screen.height}`,
      });
      proofToken = result.proofToken;
    }

    return {
      requirementsToken: req.token,
      proofToken,
      arkoseToken: null,
    };
  }
}

async function safeText(res: HttpResponse): Promise<string> {
  try {
    return await res.text();
  } catch {
    return `http_${res.status}`;
  }
}
