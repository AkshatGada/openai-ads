// Structured logger for the persona system.
//
// Re-exports pino with a default config that:
// - pretty-prints to stdout
// - redacts sessionToken, accessToken, session, cf_clearance, cookies
// - has a child-logger-per-persona factory

import pino, { type Logger } from "pino";

const REDACT_PATHS = [
  "sessionToken",
  "session_token",
  "accessToken",
  "access_token",
  "cfClearance",
  "cf_clearance",
  "cookie",
  "cookies",
  "auth.sessionToken",
  "auth.accessToken",
  "auth.cfClearance",
  "auth.puid",
  "credentials.password",
  "credentials.tokenCipher",
  "*.sessionToken",
  "*.accessToken",
  "*.cfClearance",
  "*.password",
  "*.tokenCipher",
];

let root: Logger | null = null;

export function getLogger(): Logger {
  if (!root) {
    root = pino({
      level: process.env.LOG_LEVEL ?? "info",
      redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
      base: { svc: "personas" },
    });
  }
  return root;
}

export function childLogger(bindings: Record<string, unknown>): Logger {
  return getLogger().child(bindings);
}
