// Mail.tm API wrapper — free temporary email service, no API key required
// Used to create disposable inboxes for ChatGPT account signup

const MAILTM_BASE = "https://api.mail.tm";

export interface TempEmail {
  id: string;
  address: string;
  password: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  createdAt: string;
}

/** Get available domains from Mail.tm. */
export async function getDomains(): Promise<string[]> {
  const res = await fetch(`${MAILTM_BASE}/domains`);
  if (!res.ok) throw new Error(`Mail.tm domains error ${res.status}`);
  const data = (await res.json()) as { "hydra:member": Array<{ id: string; domain: string }> };
  return data["hydra:member"].map((d) => d.domain);
}

/** Create a temp email inbox. Password is auto-generated. */
export async function createInbox(prefix?: string): Promise<TempEmail> {
  const domains = await getDomains();
  if (domains.length === 0) throw new Error("Mail.tm: no domains available");

  const domain = domains[0]!;
  const random = Math.random().toString(36).slice(2, 8);
  const address = prefix ? `${prefix}-${random}@${domain}` : `user-${random}@${domain}`;
  const password = generatePassword(16);

  const res = await fetch(`${MAILTM_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mail.tm create account error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id: string; address: string };
  return { id: data.id, address: data.address, password };
}

/** Get auth token for reading messages. */
export async function getToken(address: string, password: string): Promise<string> {
  const res = await fetch(`${MAILTM_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });

  if (!res.ok) throw new Error(`Mail.tm token error ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

/** Fetch messages for an inbox. */
export async function getMessages(token: string): Promise<EmailMessage[]> {
  const res = await fetch(`${MAILTM_BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Mail.tm messages error ${res.status}`);
  const data = (await res.json()) as { "hydra:member": Array<{ id: string; from: Record<string, unknown>; subject: string; text: string; html: string[]; createdAt: string }> };

  return data["hydra:member"].map((m) => ({
    id: m.id,
    from: extractFromValue(m.from),
    subject: m.subject,
    text: m.text,
    html: Array.isArray(m.html) ? m.html.join("") : String(m.html ?? ""),
    createdAt: m.createdAt,
  }));
}

/** Wait for a verification email to arrive, polling until found or timeout. */
export async function waitForMessage(
  token: string,
  timeoutMs = 120000,
  expectedSubject?: string,
): Promise<EmailMessage> {
  const start = Date.now();
  const interval = 5000;

  while (Date.now() - start < timeoutMs) {
    const messages = await getMessages(token);
    if (messages.length > 0) {
      // Find the most relevant message
      let target = messages[0]!;
      if (expectedSubject) {
        const match = messages.find((m) => m.subject.toLowerCase().includes(expectedSubject.toLowerCase()));
        if (match) target = match;
      }
      return target;
    }
    await sleep(interval);
  }

  throw new Error(`Mail.tm: no message received within ${timeoutMs / 1000}s`);
}

/** Extract a verification/confirmation link from an email body. */
export function extractVerifyLink(message: EmailMessage): string | null {
  // Try HTML first, then plain text
  const body = message.html || message.text;

  // Common verification link patterns
  const patterns = [
    /(https?:\/\/chatgpt\.com\/[^\s"<>]+verify[^\s"<>]*)/i,
    /(https?:\/\/auth\.openai\.com\/[^\s"<>]+)/i,
    /(https?:\/\/chat\.openai\.com\/[^\s"<>]+)/i,
    /href=["'](https?:\/\/[^"'\s]+(?:verify|confirm|activate)[^"'\s]*)["']/i,
    /(https?:\/\/[^\s"<>]+(?:verify|confirm|activate)[^\s"<>]*)/i,
    // Generic link extraction from HTML <a> tags
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.global) {
      // For global regex, find the first match that looks like a verification link
      const matches = [...body.matchAll(pattern)];
      for (const m of matches) {
        const url = m[1]!;
        if (url && url.length > 30 && !url.includes("unsubscribe")) return url;
      }
    } else {
      const match = body.match(pattern);
      if (match?.[1]) return match[1];
    }
  }

  return null;
}

/** Get the full message body for a specific message by ID. */
export async function getMessageBody(token: string, messageId: string): Promise<EmailMessage> {
  const res = await fetch(`${MAILTM_BASE}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Mail.tm message ${messageId} error ${res.status}`);
  const m = (await res.json()) as { id: string; from: Record<string, unknown>; subject: string; text: string; html: string[]; createdAt: string };

  return {
    id: m.id,
    from: extractFromValue(m.from),
    subject: m.subject,
    text: m.text,
    html: Array.isArray(m.html) ? m.html.join("") : String(m.html ?? ""),
    createdAt: m.createdAt,
  };
}

function extractFromValue(from: Record<string, unknown>): string {
  if (typeof from === "string") return from;
  if (from && typeof from === "object") {
    return String((from.name as string) ?? (from.address as string) ?? "unknown");
  }
  return "unknown";
}

function generatePassword(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure at least one uppercase, lowercase, digit, special
  pwd += "A1!a";
  return pwd;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
