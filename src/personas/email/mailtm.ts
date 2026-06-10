// Mail.tm API wrapper — disposable email inboxes for ChatGPT account signup.
// Provider-agnostic MailInbox interface lives in src/personas/types.ts.

const MAILTM_BASE = "https://api.mail.tm";

export interface TempInbox {
  id: string;
  address: string;
  password: string;
}

export interface InboxMessage {
  id: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  createdAt: string;
}

export async function listDomains(): Promise<string[]> {
  const res = await fetch(`${MAILTM_BASE}/domains`);
  if (!res.ok) throw new Error(`mail.tm domains error ${res.status}`);
  const data = (await res.json()) as { "hydra:member": Array<{ id: string; domain: string }> };
  return data["hydra:member"].map((d) => d.domain);
}

export async function createInbox(prefix?: string): Promise<TempInbox> {
  const domains = await listDomains();
  if (domains.length === 0) throw new Error("mail.tm: no domains available");
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
    throw new Error(`mail.tm create account error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: string; address: string };
  return { id: data.id, address: data.address, password };
}

export async function getToken(address: string, password: string): Promise<string> {
  const res = await fetch(`${MAILTM_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) throw new Error(`mail.tm token error ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function listMessages(token: string): Promise<InboxMessage[]> {
  const res = await fetch(`${MAILTM_BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`mail.tm messages error ${res.status}`);
  const data = (await res.json()) as {
    "hydra:member": Array<{
      id: string;
      from: Record<string, unknown>;
      subject: string;
      text: string;
      html: string[];
      createdAt: string;
    }>;
  };
  return data["hydra:member"].map((m) => ({
    id: m.id,
    from: extractFrom(m.from),
    subject: m.subject,
    text: m.text,
    html: Array.isArray(m.html) ? m.html.join("") : String(m.html ?? ""),
    createdAt: m.createdAt,
  }));
}

export async function waitForMessage(
  token: string,
  timeoutMs = 120_000,
  expectedSubject?: string,
): Promise<InboxMessage> {
  const start = Date.now();
  const interval = 5_000;
  while (Date.now() - start < timeoutMs) {
    const msgs = await listMessages(token);
    if (msgs.length > 0) {
      let target = msgs[0]!;
      if (expectedSubject) {
        const m = msgs.find((x) =>
          x.subject.toLowerCase().includes(expectedSubject.toLowerCase()),
        );
        if (m) target = m;
      }
      return target;
    }
    await sleep(interval);
  }
  throw new Error(`mail.tm: no message received within ${timeoutMs / 1000}s`);
}

export async function getMessage(token: string, id: string): Promise<InboxMessage> {
  const res = await fetch(`${MAILTM_BASE}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`mail.tm message ${id} error ${res.status}`);
  const m = (await res.json()) as {
    id: string;
    from: Record<string, unknown>;
    subject: string;
    text: string;
    html: string[];
    createdAt: string;
  };
  return {
    id: m.id,
    from: extractFrom(m.from),
    subject: m.subject,
    text: m.text,
    html: Array.isArray(m.html) ? m.html.join("") : String(m.html ?? ""),
    createdAt: m.createdAt,
  };
}

/** Extract a 6-digit verification code from a message body. */
export function extractVerificationCode(msg: InboxMessage): string | null {
  const body = msg.html || msg.text;
  // Try subject first (some providers put the code there)
  const subjMatch = msg.subject.match(/\b(\d{6})\b/);
  if (subjMatch) return subjMatch[1]!;
  // Then body
  const bodyMatch = body.match(/\b(\d{6})\b/);
  if (bodyMatch) return bodyMatch[1]!;
  return null;
}

/** Extract a verification link from an email body. */
export function extractVerifyLink(msg: InboxMessage): string | null {
  const body = msg.html || msg.text;
  const patterns = [
    /(https?:\/\/chatgpt\.com\/[^\s"<>]+verify[^\s"<>]*)/i,
    /(https?:\/\/auth\.openai\.com\/[^\s"<>]+)/i,
    /(https?:\/\/chat\.openai\.com\/[^\s"<>]+)/i,
    /href=["'](https?:\/\/[^"'\s]+(?:verify|confirm|activate)[^"'\s]*)["']/i,
  ];
  for (const p of patterns) {
    const m = body.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function extractFrom(from: Record<string, unknown>): string {
  if (typeof from === "string") return from;
  if (from && typeof from === "object") {
    return String((from.name as string) ?? (from.address as string) ?? "unknown");
  }
  return "unknown";
}

function generatePassword(length: number): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  pwd += "A1!a";
  return pwd;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
