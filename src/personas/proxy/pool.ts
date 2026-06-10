// ProxyPool — assigns a per-persona ProxyAssignment with US ISP sticky IP.
//
// We use Oxylabs ISP proxies (isp.oxylabs.io) for static residential IPs
// that don't rotate within a session. Each persona gets its own sticky
// session id → its own stable US egress IP. Reusing the same sessid
// renews the sticky window. Different personas → different sessids →
// different IPs.
//
// US-only by default (cc-US). Per-persona geo not yet wired.

import { randomUUID } from "node:crypto";
import { ProxyAssignment, ProxyProvider } from "../types.js";

export type ProxyType = "isp" | "residential" | "datacenter";

export interface ProxyPoolOptions {
  /** Oxylabs customer username (without the "customer-" prefix). */
  oxylabsUsername?: string;
  oxylabsPassword?: string;
  /** Which Oxylabs product to use. Default: "isp". */
  type?: ProxyType;
  /** Country code to inject into the proxy username. Default: "US". */
  country?: string;
  /** State code, e.g. "us-ca" for California. Optional. */
  state?: string;
  /** City, e.g. "los_angeles". Optional. */
  city?: string;
  /** Session TTL in minutes. Oxylabs ISP supports up to 30 min sticky. */
  sessionTtlMin?: number;
  /** If true, return no proxy (useful for local testing). */
  disabled?: boolean;
}

/** Oxylabs endpoint by proxy type. ISP=static residential; residential=rotating pool. */
function endpointFor(type: ProxyType): { host: string; port: number } {
  switch (type) {
    case "isp":
      return { host: "isp.oxylabs.io", port: 8001 };
    case "residential":
      return { host: "pr.oxylabs.io", port: 7777 };
    case "datacenter":
      return { host: "dc.oxylabs.io", port: 8001 };
  }
}

export class ProxyPool {
  private assignments = new Map<string, ProxyAssignment>();

  constructor(public readonly opts: ProxyPoolOptions) {}

  /**
   * Assign a proxy for a persona id. Idempotent — same id → same proxy
   * (unless it's been marked burned, in which case a fresh session is issued).
   */
  assign(personaId: string): ProxyAssignment {
    const existing = this.assignments.get(personaId);
    if (existing && !existing.burned) return existing;
    const fresh: ProxyAssignment = {
      provider: "oxylabs",
      sessionId: this.makeSessionId(personaId),
      description: this.description(),
      burned: false,
      assignedAt: new Date().toISOString(),
    };
    this.assignments.set(personaId, fresh);
    return fresh;
  }

  /**
   * Get the proxy URL for a given assignment. Returned in the format
   * impers / curl-impersonate expect: http://user:pass@host:port.
   *
   * Returns undefined if proxy is disabled or no credentials.
   */
  proxyUrlFor(a: ProxyAssignment): string | undefined {
    if (this.opts.disabled) return undefined;
    if (!this.opts.oxylabsUsername) return undefined;
    const u = this.opts.oxylabsUsername;
    const p = this.opts.oxylabsPassword ?? "";
    const { host, port } = endpointFor(this.opts.type ?? "isp");
    const locationParts = [this.opts.country?.toLowerCase() ?? "us"];
    if (this.opts.state) locationParts.push(this.opts.state.toLowerCase());
    if (this.opts.city) locationParts.push(this.opts.city.toLowerCase());
    const location = locationParts.join("-");
    return `http://customer-${u}-cc-${location}-sessid-${a.sessionId}-sesstime-${this.sessionTtlMin()}:${p}@${host}:${port}`;
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

  /** Update the lastEgress info (call this after observing a real request). */
  recordEgress(personaId: string, info: NonNullable<ProxyAssignment["lastEgress"]>): void {
    const a = this.assignments.get(personaId);
    if (!a) return;
    a.lastEgress = info;
    a.lastHealthCheckAt = new Date().toISOString();
  }

  /** Get the current assignment for inspection. */
  get(personaId: string): ProxyAssignment | undefined {
    return this.assignments.get(personaId);
  }

  private makeSessionId(personaId: string): string {
    // Stable per persona, with random tail so distinct personas on the
    // same upstream pool get distinct egress IPs.
    return `${personaId}-${randomUUID().slice(0, 8)}`;
  }

  private sessionTtlMin(): number {
    return this.opts.sessionTtlMin ?? 30;
  }

  private description(): string {
    const t = this.opts.type ?? "isp";
    const c = this.opts.country ?? "US";
    const loc =
      this.opts.state || this.opts.city
        ? ` (${[c, this.opts.state, this.opts.city].filter(Boolean).join("-")})`
        : ` (${c})`;
    return `Oxylabs ${t} sticky${loc}, TTL ${this.sessionTtlMin()}min`;
  }
}

/**
 * Build a pool from environment variables.
 * Respects OXYLABS_PROXY_USERNAME / OXYLABS_PROXY_PASSWORD.
 * Optional: OXYLABS_PROXY_TYPE (isp|residential|datacenter, default isp).
 * Optional: OXYLABS_PROXY_STATE, OXYLABS_PROXY_CITY.
 * Optional: OXYLABS_PROXY_TTL_MIN.
 * If PERSONA_PROXY_DISABLED=true, builds a no-op pool.
 */
export function poolFromEnv(): ProxyPool {
  const username = process.env.OXYLABS_PROXY_USERNAME ?? process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PROXY_PASSWORD ?? process.env.OXYLABS_PASSWORD;
  const typeEnv = (process.env.OXYLABS_PROXY_TYPE ?? "isp").toLowerCase();
  const type: ProxyType =
    typeEnv === "residential" || typeEnv === "datacenter" ? typeEnv : "isp";
  const ttl = parseInt(process.env.OXYLABS_PROXY_TTL_MIN ?? "30", 10);
  return new ProxyPool({
    oxylabsUsername: username,
    oxylabsPassword: password,
    type,
    country: process.env.OXYLABS_PROXY_COUNTRY ?? "US",
    state: process.env.OXYLABS_PROXY_STATE,
    city: process.env.OXYLABS_PROXY_CITY,
    sessionTtlMin: ttl,
    disabled: process.env.PERSONA_PROXY_DISABLED === "true",
  });
}
