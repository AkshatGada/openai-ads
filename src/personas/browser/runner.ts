// Browser-based recovery for persona accounts.
//
// USE WITH CAUTION: launching Chromium with automation plugins will
// be flagged by EDR products (CrowdStrike Falcon, etc.). Only run
// this on a machine where you trust the EDR / IT posture.
//
// This module is only invoked explicitly via:
//   pnpm personas --create <seed-id>     (signup)
//   pnpm personas --reauth <id>          (full re-auth)
//   pnpm personas --refresh-cf <id>      (cf_clearance refresh)
//
// It is NOT invoked by the day-to-day --probe / --batch paths.

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  AuthState,
  Persona,
  PersonaCredentials,
  PersonaId,
  PersonaSeed,
} from "../types.js";
import {
  createInbox,
  extractVerificationCode,
  extractVerifyLink,
  getMessage,
  getToken,
  waitForMessage,
} from "../email/mailtm.js";
import { chromeProfileDir, ensurePersonaDir } from "../storage.js";
import { generateFingerprint } from "../fingerprint.js";

export interface BrowserRunnerOptions {
  /** Headless mode. Default true. */
  headless?: boolean;
  /** Per-persona proxy. */
  proxy?: { server: string; username?: string; password?: string };
  /** Where to put the persistent context. Default: persona's chrome-profile dir. */
  userDataDir?: string;
}

/**
 * BrowserPersonaRunner is the *fallback* path. The manager invokes it
 * only on session-expiry, cf_blocked, or for first-time signup.
 */
export class BrowserPersonaRunner {
  constructor(public readonly opts: BrowserRunnerOptions = {}) {}

  /**
   * Drive the email-code signup flow.
   * Returns the captured credentials + initial auth state.
   */
  async signup(seed: PersonaSeed): Promise<{
    credentials: PersonaCredentials;
    auth: AuthState;
  }> {
    // 1. Create a mail.tm inbox
    const inbox = await createInbox(seed.id);
    const password = randomUUID();
    const token = await getToken(inbox.address, inbox.password);

    // 2. Launch patchright (or playwright as fallback) and drive the signup UI
    const { launchBrowser, signUpViaEmailCode, captureSessionCookies } = await import(
      "./signup.js"
    );
    const browser = await launchBrowser({
      headless: this.opts.headless ?? true,
      userDataDir: this.opts.userDataDir ?? join(chromeProfileDir(asPid(seed.id)), "firefox-profile"),
      proxy: this.opts.proxy,
      fingerprint: generateFingerprint(seed, seed.id + "-" + Date.now()),
    });
    try {
      const { page, context } = browser;
      await signUpViaEmailCode(page, inbox.address, password);

      // 3. Wait for the 6-digit code in the inbox
      const msg = await waitForMessage(token, 180_000, "OpenAI");
      const fullMsg = await getMessage(token, msg.id);
      const code = extractVerificationCode(fullMsg);
      if (!code) {
        throw new Error("Could not extract 6-digit code from OpenAI signup email");
      }

      // 4. Type the code
      const { completeCodeEntry } = await import("./signup.js");
      await completeCodeEntry(page, code);

      // 5. Capture cookies
      const cookies = await captureSessionCookies(context);
      const sessionToken = cookies["__Secure-next-auth.session-token"];
      if (!sessionToken) {
        throw new Error("Signup completed but no __Secure-next-auth.session-token captured");
      }
      const cfClearance = cookies["cf_clearance"] ?? null;

      const credentials: PersonaCredentials = {
        email: inbox.address,
        password,
        mailInbox: {
          provider: "mail.tm",
          address: inbox.address,
          inboxId: inbox.id,
          tokenCipher: "", // sealed below
          lastCheckedAt: new Date().toISOString(),
        },
        accountCreatedAt: new Date().toISOString(),
      };

      const auth: AuthState = {
        sessionToken,
        accessToken: null,
        accessTokenExp: null,
        cfClearance,
        cfClearanceExp: cfClearance ? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 : null,
        deviceId: randomUUID(),
        puid: cookies["_puid"] ?? null,
        lastValidatedAt: new Date().toISOString(),
        health: "healthy",
        sessionStartedAt: new Date().toISOString(),
        accountState: "UNKNOWN",
        plan: "unknown",
      };

      return { credentials, auth };
    } finally {
      await browser.close();
    }
  }

  /** Re-authenticate an existing persona via email-code. */
  async reauth(
    persona: Persona,
    credentials: PersonaCredentials,
    mailToken: string,
  ): Promise<{
    sessionToken: string;
    cfClearance?: string;
    cfClearanceExp?: number;
  }> {
    if (!credentials.mailInbox) {
      throw new Error("No mail.tm inbox stored on this persona; cannot reauth via email code");
    }
    const { launchBrowser, captureSessionCookies, signUpViaEmailCode, completeCodeEntry } =
      await import("./signup.js");
    const browser = await launchBrowser({
      headless: this.opts.headless ?? true,
      userDataDir: this.opts.userDataDir ?? join(chromeProfileDir(asPid(persona.identity.id)), "firefox-profile"),
      proxy: this.opts.proxy,
      fingerprint: persona.fingerprint,
    });
    try {
      const { page, context } = browser;
      await signUpViaEmailCode(page, credentials.email, credentials.password ?? "");
      const { waitForMessage, getMessage, extractVerificationCode } = await import("../email/mailtm.js");
      const msg = await waitForMessage(mailToken, 120_000, "OpenAI");
      const fullMsg = await getMessage(mailToken, msg.id);
      const code = extractVerificationCode(fullMsg);
      if (!code) throw new Error("Could not extract 6-digit code from reauth email");
      await completeCodeEntry(page, code);
      const cookies = await captureSessionCookies(context);
      const sessionToken = cookies["__Secure-next-auth.session-token"];
      if (!sessionToken) {
        throw new Error("Reauth completed but no __Secure-next-auth.session-token captured");
      }
      return {
        sessionToken,
        cfClearance: cookies["cf_clearance"],
        cfClearanceExp: cookies["cf_clearance"]
          ? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
          : undefined,
      };
    } finally {
      await browser.close();
    }
  }

  /** Refresh cf_clearance by visiting a known-good URL. */
  async refreshCfClearance(
    persona: Persona,
  ): Promise<{ cfClearance: string; cfClearanceExp: number }> {
    const { launchBrowser, captureSessionCookies } = await import("./signup.js");
    const browser = await launchBrowser({
      headless: this.opts.headless ?? true,
      userDataDir: this.opts.userDataDir ?? join(chromeProfileDir(asPid(persona.identity.id)), "chrome-profile"),
      proxy: this.opts.proxy,
      fingerprint: persona.fingerprint,
    });
    try {
      // Inject the session token + cookies
      const { page, context } = browser;
      await context.addCookies([
        {
          name: "__Secure-next-auth.session-token",
          value: "", // will be injected by caller via the manager
          domain: ".chatgpt.com",
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "None",
        } as any,
      ]);
      // Visit chatgpt.com — Cloudflare will issue a fresh cf_clearance
      await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(5_000);
      const cookies = await captureSessionCookies(context);
      const cf = cookies["cf_clearance"];
      if (!cf) {
        throw new Error("Could not capture cf_clearance after 5s wait");
      }
      return {
        cfClearance: cf,
        cfClearanceExp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };
    } finally {
      await browser.close();
    }
  }
}

function asPid(s: string): PersonaId {
  return s as PersonaId;
}
