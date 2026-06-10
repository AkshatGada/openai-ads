// ProxyPool — assigns a per-persona ProxyAssignment.
//
// We use one pool of "rotating" sessions per provider. For residential
// sticky-IP providers (Oxylabs, BrightData, Smartproxy) we issue a stable
// session id and let the upstream decide the egress IP. For "local" or
// "tor" we just return a no-op.

import { randomUUID } from "node:crypto";
import { ProxyAssignment, ProxyProvider } from "../types.js";

export interface ProxyPoolOptions {
  provider: ProxyProvider;
  /** Oxylabs customer username (without the `customer-` prefix). */
  oxylabsUsername?: string;
  oxylabsPassword?: string;
  /** Pre-existing residential pool size. Used for health reports. */
  poolSize?: number;
}

export class ProxyPool {
  private assignments = new Map<string, ProxyAssignment>();

  constructor(public readonly opts: ProxyPoolOptions) {}

  /** Assign a proxy for a persona id. Idempotent — same id → same proxy. */
  assign(personaId: string): ProxyAssignment {
    const existing = this.assignments.get(personaId);
    if (existing && !existing.burned) return existing;
    const fresh: ProxyAssignment = {
      provider: this.opts.provider,
      sessionId: this.makeSessionId(personaId),
      description: this.description(),
      burned: false,
      assignedAt: new Date().toISOString(),
    };
    this.assignments.set(personaId, fresh);
    return fresh;
  }

  /** Get the proxy URL for a given assignment (consumed by `impers`). */
  proxyUrlFor(a: ProxyAssignment): string | undefined {
    if (a.provider === "local" || a.provider === "tor") return undefined;
    if (a.provider === "oxylabs" && this.opts.oxylabsUsername) {
      // impers expects a standard http:// URL with embedded auth.
      // The session id is appended as the proxy "username" so the upstream
      // routes this connection to the same egress IP each time.
      const u = this.opts.oxylabsUsername;
      const p = this.opts.oxylabsPassword ?? "";
      return `http://customer-${u}-cc-US-sessid-${a.sessionId}:${p}@pr.oxylabs.io:7777`;
    }
    return undefined;
  }

  /** Mark a proxy burned (will be re-issued on next assign). */
  markBurned(personaId: string, reason: string): void {
    const a = this.assignments.get(personaId);
    if (!a) return;
    a.burned = true;
    a.burnedReason = reason;
    a.burnedAt = new Date().toISOString();
  }

  /** Force a rotation (e.g. after IP flag). */
  rotate(personaId: string): ProxyAssignment {
    const a = this.assignments.get(personaId);
    if (a) {
      a.burned = true;
      a.burnedReason = "manual rotation";
      a.burnedAt = new Date().toISOString();
    }
    return this.assign(personaId);
  }

  private makeSessionId(personaId: string): string {
    // Sticky session id: stable per persona, but with a random tail so
    // colliding personas on the same upstream pool get different IPs.
    const tail = randomUUID().slice(0, 8);
    return `${personaId}-${tail}`;
  }

  private description(): string {
    switch (this.opts.provider) {
      case "oxylabs":
        return "Oxylabs residential sticky (cc-US)";
      case "brightdata":
        return "BrightData residential";
      case "webshare":
        return "Webshare datacenter";
      case "smartproxy":
        return "Smartproxy ISP";
      case "tor":
        return "Tor (slow, not recommended)";
      case "local":
      default:
        return "no proxy (local egress)";
    }
  }
}

/** Build a pool from environment variables. */
export function poolFromEnv(): ProxyPool {
  const username = process.env.OXYLABS_PROXY_USERNAME ?? process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PROXY_PASSWORD ?? process.env.OXYLABS_PASSWORD;
  return new ProxyPool({
    provider: username ? "oxylabs" : "local",
    oxylabsUsername: username,
    oxylabsPassword: password,
  });
}
