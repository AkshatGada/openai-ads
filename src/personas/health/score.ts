// Persona health score (0-100). Pulls together the bits we know.

import { AuthState, OperationalMeta, Persona, PersonaHealthReport, SessionHealth } from "../types.js";

export interface ScoreInputs {
  persona: Persona;
  auth: AuthState;
  /** Was the last session probe successful? */
  lastSessionValid: boolean;
  /** Was the last /api/auth/session probe cf-blocked? */
  lastCfBlocked: boolean;
  /** Recent window of session-valid ratios (0..1). */
  sessionSuccessWindow: number;
  /** Recent window of ad-yield (ads per probe, 0..1 typically). */
  recentAdYield: number;
}

export function computeHealthScore(i: ScoreInputs): number {
  let s = 100;

  // 1. Health state
  switch (i.auth.health) {
    case "healthy":
      // no penalty
      break;
    case "unknown":
      s -= 20;
      break;
    case "cf_blocked":
      s -= 40;
      break;
    case "session_expired":
      s -= 60;
      break;
    case "mfa_required":
      s -= 30;
      break;
    case "rate_limited":
      s -= 25;
      break;
    case "banned":
      s = 0;
      break;
  }

  // 2. Account state
  switch (i.auth.accountState) {
    case "OK":
      break;
    case "TRIAL_AVAILABLE":
      break;
    case "RATE_LIMITED":
      s -= 20;
      break;
    case "SOFT_BANNED":
      s -= 50;
      break;
    case "BANNED":
      s = 0;
      break;
    case "MFA_REQUIRED":
      s -= 25;
      break;
    case "UNKNOWN":
      s -= 5;
      break;
  }

  // 3. cf_clearance expiry
  if (!i.auth.cfClearance) s -= 15;
  else if (i.auth.cfClearanceExp) {
    const daysLeft = (i.auth.cfClearanceExp - Date.now() / 1000) / 86_400;
    if (daysLeft < 1) s -= 20;
    else if (daysLeft < 7) s -= 10;
  }

  // 4. sessionToken expiry
  if (!i.auth.sessionToken) s -= 30;
  else {
    // sessionToken TTL is ~30d from sessionStartedAt
    const startedAt = Date.parse(i.auth.sessionStartedAt);
    if (!isNaN(startedAt)) {
      const daysLeft = (startedAt + 30 * 86_400_000 - Date.now()) / 86_400_000;
      if (daysLeft < 1) s -= 25;
      else if (daysLeft < 7) s -= 10;
    }
  }

  // 5. session-success window
  s -= Math.round(20 * (1 - i.sessionSuccessWindow));

  // 6. proxy burned
  if (i.persona.proxy.burned) s -= 30;

  return Math.max(0, Math.min(100, Math.round(s)));
}

export function issuesFor(i: ScoreInputs): string[] {
  const out: string[] = [];
  if (i.auth.health === "banned") out.push("Account banned");
  if (i.auth.health === "rate_limited") out.push("Rate limited");
  if (i.auth.health === "cf_blocked") out.push("Cloudflare blocked; needs cf_clearance refresh");
  if (i.auth.health === "session_expired") out.push("Session expired; needs re-auth");
  if (i.auth.health === "mfa_required") out.push("MFA required");
  if (!i.auth.cfClearance) out.push("No cf_clearance on file");
  if (!i.auth.sessionToken) out.push("No sessionToken on file");
  if (i.persona.proxy.burned) out.push(`Proxy burned: ${i.persona.proxy.burnedReason ?? "?"}`);
  if (i.sessionSuccessWindow < 0.7)
    out.push(`Low session-success rate: ${(i.sessionSuccessWindow * 100).toFixed(0)}%`);
  return out;
}

export function buildReport(i: ScoreInputs): PersonaHealthReport {
  return {
    id: i.persona.identity.id,
    health: i.auth.health,
    healthScore: computeHealthScore(i),
    accountState: i.auth.accountState,
    plan: i.auth.plan,
    lastValidatedAt: i.auth.lastValidatedAt,
    issues: issuesFor(i),
  };
}
