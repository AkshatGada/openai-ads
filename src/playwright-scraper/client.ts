import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Page, BrowserContext, Browser } from "playwright";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import type { AdCard } from "../scraper/types.js";
import { extractAdsFromHtml } from "../scraper/client.js";
import { loadProfileMeta, saveProfileMeta, loadCredentials } from "./profiles.js";
import type { PlaywrightProbeResult, PlaywrightProbeOptions, PersonaCredentials } from "./types.js";

// Apply stealth plugin to avoid bot detection
const stealth = StealthPlugin();
// Remove evasions that break headless ChatGPT — keep core fingerprint masking
stealth.enabledEvasions = new Set([
  "chrome.runtime",
  "iframe.contentWindow",
  "navigator.plugins",
  "navigator.webdriver",
  "user-agent-override",
]);

chromium.use(stealth);

const PROFILES_DIR = join(process.cwd(), "browser-profiles");
const OUTPUT_DIR = join(process.cwd(), "playwright-outputs");

function profilePath(persona: string): string {
  return join(PROFILES_DIR, persona);
}

/**
 * Launch a persistent browser context for a persona profile.
 * Profile data (cookies, localStorage, etc.) is saved to browser-profiles/<name>/.
 */
export async function launchProfile(
  persona: string,
  opts: { headless?: boolean } = {},
): Promise<{ page: Page; context: BrowserContext; browser: Browser }> {
  const userDataDir = profilePath(persona);
  if (!existsSync(userDataDir)) {
    mkdirSync(userDataDir, { recursive: true });
  }

  const { headless = true } = opts;

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });

  const page = context.pages()[0] ?? (await context.newPage());

  // Navigate to ChatGPT — will reuse cookies if profile exists
  const url = context.pages().length > 1 || (await page.url()) === "about:blank" ? "https://chatgpt.com" : page.url();
  if (page.url() !== "https://chatgpt.com" && !page.url().startsWith("https://chatgpt.com/")) {
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  // Wait for page to be interactive
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const browser = context.browser();
  if (!browser) throw new Error("Browser not available from context");
  return { page, context, browser };
}

/**
 * Send a single prompt on an already-open ChatGPT page.
 * Waits for the response to complete, then captures HTML including any ads.
 */
export async function sendPrompt(
  page: Page,
  prompt: string,
  opts: { waitForAds?: boolean; adTimeoutMs?: number; newChat?: boolean } = {},
): Promise<{ html: string; ads: AdCard[] }> {
  const { waitForAds = true, adTimeoutMs = 5000, newChat = true } = opts;

  // If newChat, click "New chat" button to start fresh
  if (newChat) {
    try {
      const newChatBtn = page.locator('a[href="/"], button:has-text("New chat"), [aria-label="New chat"]').first();
      if (await newChatBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await newChatBtn.click();
        await page.waitForTimeout(1500);
      }
    } catch {
      // New chat button not found — continue in current chat
    }
  }

  // Type prompt into the textarea — try multiple selectors
  const textareaSelectors = [
    "#prompt-textarea",
    "textarea[placeholder*='Ask']",
    "textarea[id*='prompt']",
    "[contenteditable='true'][data-placeholder]",
    "[contenteditable='true']",
    "textarea",
  ];

  let textarea = null;
  for (const sel of textareaSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      textarea = el;
      break;
    }
  }
  if (!textarea) throw new Error("Could not find prompt textarea on ChatGPT page");

  await textarea.click();
  await page.waitForTimeout(300);
  await textarea.fill(prompt);
  await page.waitForTimeout(500);

  // Click send — try multiple selectors
  const sendSelectors = [
    '[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button:has(svg):not([disabled])',
    'button[type="submit"]',
  ];

  let sendBtn = null;
  for (const sel of sendSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      sendBtn = el;
      break;
    }
  }
  if (!sendBtn) throw new Error("Could not find send button on ChatGPT page");

  await sendBtn.click();

  // Wait for response: stop button disappears when streaming ends
  try {
    await page.locator('[data-testid="stop-button"], button[aria-label*="Stop"]').first().waitFor({
      state: "visible",
      timeout: 5000,
    });
    await page.locator('[data-testid="stop-button"], button[aria-label*="Stop"]').first().waitFor({
      state: "hidden",
      timeout: 120000,
    });
  } catch {
    // Stop button may not appear — wait for response to settle
    await page.waitForTimeout(15000);
  }

  // Wait additional time for ad cards to render
  if (waitForAds) {
    try {
      await page.waitForFunction(
        () =>
          document.querySelector('[data-ad-card-root="true"]') !== null ||
          document.querySelector('[role="link"][tabindex="0"]') !== null,
        { timeout: adTimeoutMs },
      );
    } catch {
      // No ad cards appeared — this is fine, most prompts don't get ads
    }
    await page.waitForTimeout(2000);
  } else {
    await page.waitForTimeout(3000);
  }

  const html = await page.content();
  const ads = extractAdsFromHtml(html);

  return { html, ads };
}


// ══════════════════════════════════════════════════════════════
// Account signup, login, and session management
// ══════════════════════════════════════════════════════════════

/**
 * Complete ChatGPT account creation flow:
 * 1. Create temp email via Mail.tm
 * 2. Sign up on chatgpt.com
 * 3. Wait for verification email
 * 4. Verify the account
 * Returns credentials ready for storage.
 */
export async function createChatGPTAccount(
  prefix: string,
  page: Page,
): Promise<PersonaCredentials> {
  const { createInbox, getToken, waitForMessage, extractVerifyLink, getMessageBody } = await import("./email.js");

  console.log("  Creating temp email via Mail.tm...");
  const inbox = await createInbox(prefix);
  console.log(`  ✓ ${inbox.address}`);

  console.log("  Signing up on ChatGPT...");
  await signupOnPage(page, inbox.address, inbox.password);

  console.log("  Waiting for verification email...");
  const token = await getToken(inbox.address, inbox.password);
  const msg = await waitForMessage(token, 120000, "OpenAI");

  const fullMsg = await getMessageBody(token, msg.id);
  const verifyLink = extractVerifyLink(fullMsg);

  if (!verifyLink) {
    console.log(`  ⚠ Could not extract verification link.`);
    console.log(`  Subject: ${msg.subject} | From: ${msg.from}`);
    throw new Error("Could not extract verification link from email. Check manually.");
  }

  console.log("  Verifying account...");
  await verifyEmail(page, verifyLink);
  console.log("  ✓ Account verified");

  return {
    email: inbox.address,
    password: inbox.password,
    mailTmId: inbox.id,
    mailTmToken: token,
    createdAt: new Date().toISOString(),
  };
}

/** Fill and submit the ChatGPT signup form. */
export async function signupOnPage(page: Page, email: string, password: string): Promise<void> {
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const signupSelectors = [
    'button:has-text("Sign up")',
    'a:has-text("Sign up")',
    '[data-testid="signup-button"]',
    'text=Sign up',
  ];

  let clicked = false;
  for (const sel of signupSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    await page.goto("https://chatgpt.com/auth/signup", { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
  if (!(await emailInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    throw new Error("Could not find email input on signup page");
  }

  await emailInput.click();
  await emailInput.fill(email);
  await page.waitForTimeout(500);

  const contBtn = page.locator('button:has-text("Continue"), button[type="submit"], input[type="submit"]').first();
  if (await contBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await contBtn.click();
    await page.waitForTimeout(2000);
  }

  const pwdInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
  if (await pwdInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pwdInput.click();
    await pwdInput.fill(password);
    await page.waitForTimeout(500);

    const submitBtn = page.locator('button:has-text("Continue"), button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
    }
  }

  await page.waitForTimeout(3000);
}

/** Open the verification link to confirm the ChatGPT account. */
export async function verifyEmail(page: Page, verifyLink: string): Promise<void> {
  await page.goto(verifyLink, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  if (page.url().startsWith("https://chatgpt.com/")) return;

  const confirmBtn = page.locator('button:has-text("Verify"), button:has-text("Confirm"), button:has-text("Continue")').first();
  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(3000);
  }
}

/** Log into an existing ChatGPT account using stored credentials. */
export async function loginToAccount(page: Page, email: string, password: string): Promise<void> {
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const alreadyLoggedIn = await page.locator('textarea[placeholder*="Ask"], [contenteditable="true"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyLoggedIn) return;

  const loginSelectors = [
    'button:has-text("Log in")',
    'a:has-text("Log in")',
    'text=Log in',
  ];

  let clicked = false;
  for (const sel of loginSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    await page.goto("https://chatgpt.com/auth/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(email);
    await page.waitForTimeout(500);
    const btn = page.locator('button:has-text("Continue"), button[type="submit"]').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
  }

  const pwdInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
  if (await pwdInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pwdInput.fill(password);
    await page.waitForTimeout(500);
    const btn = page.locator('button:has-text("Continue"), button[type="submit"]').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(3000);
    }
  }

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

/** Auto-login if credentials exist and session has expired. */
export async function ensureLoggedIn(page: Page, persona: string): Promise<void> {
  const needsLogin = await page.locator('button:has-text("Log in"), a:has-text("Log in")').first().isVisible({ timeout: 2000 }).catch(() => false);
  if (!needsLogin) {
    const hasChat = await page.locator('textarea[placeholder*="Ask"], [contenteditable="true"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (hasChat) return;
  }

  const creds = loadCredentials(persona);
  if (!creds) return;

  console.log(`  Auto-login with: ${creds.email}`);
  await loginToAccount(page, creds.email, creds.password);
}

/**
 * Probe ChatGPT with a single prompt using a persistent persona profile.
 * The profile accumulates conversation history across calls.
 */
export async function probeWithProfile(
  prompt: string,
  opts: PlaywrightProbeOptions = {},
): Promise<PlaywrightProbeResult> {
  const { persona = "default", headless = true, waitForAds = true, adTimeoutMs = 5000, newChat = true, loginIfNeeded = true } = opts;

  const { page, browser } = await launchProfile(persona, { headless });

  let result: PlaywrightProbeResult;
  try {
    if (loginIfNeeded) {
      await ensureLoggedIn(page, persona);
    }
    const { html, ads } = await sendPrompt(page, prompt, { waitForAds, adTimeoutMs, newChat });
    result = {
      prompt,
      html,
      ads,
      persona,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }

  // Update profile metadata
  updateProfileMeta(persona);

  return result;
}

/**
 * Send a sequence of prompts through the same profile, accumulating conversation history.
 * Returns results for each prompt. The profile stays open between prompts.
 */
export async function converseWithProfile(
  prompts: string[],
  persona = "default",
  opts: { headless?: boolean } = {},
): Promise<PlaywrightProbeResult[]> {
  const { headless = true } = opts;
  const { page, browser } = await launchProfile(persona, { headless });
  const results: PlaywrightProbeResult[] = [];

  try {
    // First prompt: new chat
    for (let i = 0; i < prompts.length; i++) {
      const isFirst = i === 0;
      const { html, ads } = await sendPrompt(page, prompts[i]!, {
        waitForAds: isFirst ? true : false, // only wait for ads on first prompt (saves time)
        newChat: isFirst,
      });
      results.push({
        prompt: prompts[i]!,
        html,
        ads,
        persona,
        timestamp: new Date().toISOString(),
      });
      // Brief pause between prompts
      if (i < prompts.length - 1) {
        await page.waitForTimeout(2000);
      }
    }
  } finally {
    await browser.close();
  }

  updateProfileMeta(persona);
  return results;
}

/**
 * Save a probe result to the output directory.
 */
export function saveResult(result: PlaywrightProbeResult, batch?: string): string {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const dir = batch ? join(OUTPUT_DIR, batch) : OUTPUT_DIR;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const ts = result.timestamp.replace(/[:.]/g, "-");
  const fname = `${result.persona}_${ts}.html`;
  const fpath = join(dir, fname);
  writeFileSync(fpath, result.html);
  return fpath;
}

function updateProfileMeta(persona: string): void {
  const meta = loadProfileMeta(persona);
  meta.conversations++;
  meta.lastUsed = new Date().toISOString();
  saveProfileMeta(persona, meta);
}
