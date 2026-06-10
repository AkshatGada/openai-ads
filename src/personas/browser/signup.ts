// Browser-driven signup flow.
//
// SECURITY NOTE: this module launches Chromium with automation plugins
// and visits mail.tm + chatgpt.com. It will trip EDR products.
// Only run on machines where this is acceptable.

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { BrowserContext, Page, Browser } from "patchright";
import { Fingerprint } from "../types.js";

export interface LaunchOptions {
  headless?: boolean;
  userDataDir: string;
  proxy?: { server: string; username?: string; password?: string };
  fingerprint: Fingerprint;
}

export interface LaunchedBrowser {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close(): Promise<void>;
}

/** Launch patchright (or playwright as fallback) with the persona's fingerprint. */
export async function launchBrowser(opts: LaunchOptions): Promise<LaunchedBrowser> {
  if (!existsSync(opts.userDataDir)) mkdirSync(opts.userDataDir, { recursive: true });

  // Lazy import so the module is only loaded when the browser is actually used.
  // This means the rest of the package can be imported on a machine without
  // the browser binaries installed.
  const { chromium } = await import("patchright");

  const context = await chromium.launchPersistentContext(opts.userDataDir, {
    headless: opts.headless ?? true,
    viewport: { width: opts.fingerprint.viewport.width, height: opts.fingerprint.viewport.height },
    userAgent: opts.fingerprint.userAgent,
    ...(opts.proxy
      ? {
          proxy: {
            server: opts.proxy.server,
            ...(opts.proxy.username ? { username: opts.proxy.username } : {}),
            ...(opts.proxy.password ? { password: opts.proxy.password } : {}),
          },
        }
      : {}),
  });

  const page = context.pages()[0] ?? (await context.newPage());
  const browser = context.browser();
  if (!browser) throw new Error("Browser not available from context");

  return {
    browser,
    context,
    page,
    async close() {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Sign-up via email-code flow:
 *  1. Visit chatgpt.com/auth/login
 *  2. Enter email
 *  3. Click "Continue" — ChatGPT sends a 6-digit code to the inbox
 *  4. (Caller captures the code from mail.tm separately.)
 */
export async function signUpViaEmailCode(page: Page, email: string, _password: string): Promise<void> {
  await page.goto("https://chatgpt.com/auth/login", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(3_000);

  // Email field
  const emailInput = page
    .locator('input[type="email"], input[name="email"], input[id="email"]')
    .first();
  if (!(await emailInput.isVisible({ timeout: 5_000 }).catch(() => false))) {
    throw new Error("Could not find email input on auth page");
  }
  await emailInput.click();
  await emailInput.fill(email);
  await page.waitForTimeout(500);

  const contBtn = page
    .locator('button:has-text("Continue"), button[type="submit"], input[type="submit"]')
    .first();
  if (await contBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await contBtn.click();
  }

  // Wait for the 6-digit code input to appear (means "we sent you a code")
  const codeInput = page
    .locator('input[name="code"], input[inputmode="numeric"], input[autocomplete="one-time-code"]')
    .first();
  await codeInput.waitFor({ state: "visible", timeout: 60_000 });
}

/** Type the 6-digit code into the code input and submit. */
export async function completeCodeEntry(page: Page, code: string): Promise<void> {
  const codeInput = page
    .locator('input[name="code"], input[inputmode="numeric"], input[autocomplete="one-time-code"]')
    .first();
  await codeInput.click();
  await codeInput.fill(code);
  await page.waitForTimeout(500);

  const submitBtn = page
    .locator('button:has-text("Continue"), button:has-text("Verify"), button:has-text("Submit"), button[type="submit"]')
    .first();
  if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await submitBtn.click();
  }

  // Wait for navigation back to chatgpt.com (the verification succeeds when
  // the page transitions to the main app).
  try {
    await page.waitForURL((u) => u.toString().startsWith("https://chatgpt.com/") && !u.toString().includes("/auth/"), {
      timeout: 30_000,
    });
  } catch {
    // Some flows don't redirect; just wait for the page to settle.
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  }
  await page.waitForTimeout(2_000);
}

/** Read all cookies for chatgpt.com from the context. */
export async function captureSessionCookies(
  context: BrowserContext,
): Promise<Record<string, string>> {
  const cookies = await context.cookies("https://chatgpt.com");
  const out: Record<string, string> = {};
  for (const c of cookies) out[c.name] = c.value;
  return out;
}
