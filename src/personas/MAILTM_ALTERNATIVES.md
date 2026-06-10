# Disposable Email API Alternatives to mail.tm

> **Audience:** anyone extending or hardening the persona system's
> `BrowserPersonaRunner.signup()` / `.reauth()` paths, which today use
> `mail.tm` (https://docs.mail.tm) for the disposable inbox.
>
> **Status:** snapshot from research conducted June 2026. Some
> services change pricing, auth, or shut down without notice. Always
> re-verify before integrating.

---

## 0. Why this document exists

The persona system needs a **disposable email inbox** for one specific
reason: when ChatGPT's signup flow asks for an email and sends a
6-digit verification code, the system needs to read that code
programmatically. It does this in two places:

- `BrowserPersonaRunner.signup()` — full email-code account creation
- `BrowserPersonaRunner.reauth()` — full re-auth via email code

Both are `[BROWSER]` commands. Both need mail.tm (or an equivalent)
to receive the code. Day-to-day probing (`--probe`, `--batch`, etc.)
**does not use this** — those flows use a captured `sessionToken`
and talk to ChatGPT directly from Node. So the mail dependency is
**only invoked 0-2 times per persona lifetime** (once at signup, once
every ~30 days for reauth).

That low call volume means mail.tm is fine for our needs today, but
**if mail.tm is down, rate-limited, or shut down, the system loses
its ability to create new personas and refresh dead sessions.** This
document is the contingency plan.

---

## 1. Quick verdict

| Service | Free? | API? | JSON body? | Programmatic signup? | ≥5 inboxes/day? | Multi-domain? | 2026 status | Swap difficulty |
|---|---|---|---|---|---|---|---|---|
| **mail.tm** (current) | ✅ | ✅ REST | ✅ | ✅ | ✅ | ✅ | ✅ live | 1 (reference) |
| **1secmail.com** | ✅ | ✅ REST | ✅ | ✅ anonymous | ✅ | ✅ 8+ | ✅ live, **but Cloudflare blocks many DCs** | 1 |
| **Guerrilla Mail** | ✅ | ⚠️ JSON-RPC | ✅ | ✅ anonymous | ✅ | ✅ 9+ | ✅ live, HTTP-only | 4 |
| **maildrop.cc** | ✅ | ✅ GraphQL | ✅ | ✅ anonymous | ⚠️ 10-msg cap, 24h | ❌ single | ✅ live, greylisting | 3 |
| **temp-mail.io** | ❌ | ✅ REST | ✅ | ❌ paywalled | ❌ | ✅ | ✅ live | 2 (if you pay) |
| **Mailsac** | ✅ | ✅ REST | ✅ | ⚠️ public mailboxes | ⚠️ 1,500 ops/mo | ✅ | ✅ live, no CC | 2 |
| **MailSlurp** | ⚠️ | ✅ REST | ✅ | ✅ | ❌ 30 inboxes/mo | ⚠️ paid | ✅ live, JS SDK | 2 |
| **Mailtrap** | ❌ | ✅ | n/a | n/a | n/a | n/a | sandbox for *sending* | 5 (wrong tool) |
| **Yopmail / Mailnesia / Mohmal / tempmail.com** | ✅ | ❌ | ❌ | n/a | n/a | n/a | no public API | 5 (screen-scrape only) |
| **Self-host (mailcow)** | ✅ you-host | depends | depends | ✅ | unlimited | your own | ✅ 12.9k★ GPLv3 | 5 (1-week project) |

**Recommended:** keep mail.tm as primary, add **1secmail.com** as
hot standby.

---

## 2. The candidates that pass

### 2.1 mail.tm (current — the reference)

- **Base URL:** `https://api.mail.tm`
- **Auth:** bearer token (no API key, no signup)
- **Sign up:** `POST /accounts` — instant, no captcha, no rate limit
- **Login:** `POST /token` → JWT bearer
- **List domains:** `GET /domains` → pick one
- **List messages:** `GET /messages?page=1`
- **Read message:** `GET /messages/{id}` → returns `{text, html, ...}`
- **Free tier:** 8 QPS, no daily cap, no message-retention cap published
- **Captcha:** none
- **Multi-domain:** yes, ~10 domains
- **2026 status:** live, has an OpenAPI spec at `https://docs.mail.tm`

```bash
# create inbox
curl -X POST https://api.mail.tm/accounts \
  -H 'content-type: application/json' \
  -d '{"address":"my-test@wwjmp.com","password":"some-strong-pw"}'
# → { "id": "...", "address": "my-test@wwjmp.com" }

# get token
curl -X POST https://api.mail.tm/token \
  -H 'content-type: application/json' \
  -d '{"address":"my-test@wwjmp.com","password":"some-strong-pw"}'
# → { "token": "eyJ...", "id": "..." }

# list messages
curl https://api.mail.tm/messages \
  -H 'Authorization: Bearer <token>'

# read one message
curl https://api.mail.tm/messages/<id> \
  -H 'Authorization: Bearer <token>'
```

**Why it's #1:** no signup, no captcha, bearer token, multi-domain,
JSON body, 8 QPS, no daily cap. The shape of the API maps cleanly to
our current `src/personas/email/mailtm.ts` module.

### 2.2 1secmail.com (best drop-in)

- **Base URL:** `https://www.1secmail.com/api/v1/?action=...`
- **Auth:** none (anonymous)
- **Sign up:** no signup — you compose `<login>@<domain>` and start
  receiving
- **List domains:** `?action=getDomainList`
- **Generate random inbox:** `?action=genRandomMailbox&count=1`
- **List messages:** `?action=getMessages&login=X&domain=Y`
- **Read message:** `?action=readMessage&login=X&domain=Y&id=Z`
- **Free tier:** no published rate limit; messages persist on the
  server but may be evicted under load
- **Captcha:** none
- **Multi-domain:** 8+ (`1secmail.com`, `1secmail.net`,
  `1secmail.org`, `wwjmp.com`, `esiix.com`, `xojxe.com`, `yoggm.com`,
  `mrhzqx.com`)
- **2026 status:** live; site behind Cloudflare, datacenter IPs may
  be challenged

```bash
# list available domains
curl 'https://www.1secmail.com/api/v1/?action=getDomainList'
# ["1secmail.com","1secmail.net","1secmail.org","wwjmp.com",...]

# generate a random inbox
curl 'https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'
# ["abc123xyz@1secmail.com"]

# list messages for an inbox
curl 'https://www.1secmail.com/api/v1/?action=getMessages&login=abc123xyz&domain=1secmail.com'
# [{"id":12345,"from":"noreply@foo.com","subject":"Verify your email","date":"2026-06-11 10:00:00"}]

# read one message
curl 'https://www.1secmail.com/api/v1/?action=readMessage&login=abc123xyz&domain=1secmail.com&id=12345'
# {
#   "id": 12345,
#   "from": "noreply@foo.com",
#   "subject": "Verify your email",
#   "date": "2026-06-11 10:00:00",
#   "attachments": [],
#   "body": "Your code is 482910",
#   "textBody": "Your code is 482910",
#   "htmlBody": "<p>Your code is <b>482910</b></p>"
# }
```

**Migration deltas from mail.tm:**
- No `/token` step — you just track `(login, domain, messageId)`.
- No `/me` or `/accounts/{id}` — inboxes are stateless.
- The mailbox is anonymous. Any process that knows
  `<login>@<domain>` can read its messages. **Treat the login string
  as a secret** (or append a random suffix and encrypt the whole
  `address` field in `credentials.bin`).
- Cloudflare may 403 datacenter IPs. Test from your real egress
  before betting on it.

### 2.3 Guerrilla Mail (most reliable, ugliest API)

- **Base URL:** `http://api.guerrillamail.com/ajax.php` (HTTP, not HTTPS)
- **Auth:** session cookie `PHPSESSID` (no API key)
- **Sign up:** no signup — `get_email_address` returns a random one
- **Address TTL:** 60 minutes (call `extend` to push to 2h)
- **List messages:** `f=check_email&seq=N`
- **Read message:** `f=fetch_email&email_id=N`
- **Free tier:** no published rate limit
- **Captcha:** none
- **Multi-domain:** 9+ (`sharklasers.com`, `guerrillamail.com`,
  `guerrillamail.net`, `grr.la`, etc.)
- **2026 status:** live, owned by Jamit Software since 2006

```bash
# "create" inbox — returns a random one
curl -c /tmp/gm.cookies \
  'http://api.guerrillamail.com/ajax.php?f=get_email_address&lang=en&ip=127.0.0.1&agent=NodeScript/1.0'
# {"email_addr":"sdvbkdkz@sharklasers.com","email_timestamp":1749638400,"sid_token":"..."}

# list messages
curl -b /tmp/gm.cookies \
  'http://api.guerrillamail.com/ajax.php?f=check_email&seq=0&ip=127.0.0.1&agent=NodeScript/1.0'
# {"list":[{"mail_id":"1","mail_from":"...","mail_subject":"Verify your email","mail_excerpt":"Your code is 482910"}]}

# read one message (body is HTML-escaped; image URLs go through res.php)
curl -b /tmp/gm.cookies \
  'http://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=1&ip=127.0.0.1&agent=NodeScript/1.0'
# {"mail_id":"1","mail_from":"...","mail_subject":"...","mail_body":"<div>Your code is 482910</div>"}
```

**Migration deltas from mail.tm:**
- API is HTTP — credentials and message bodies travel cleartext.
  Fine for throwaway inboxes, awkward if you care.
- Need a `GuerrillaSession` class to hold the `PHPSESSID` cookie.
- 60-min TTL means long-lived inboxes need an `extend` loop.

### 2.4 maildrop.cc (clean GraphQL, but limited)

- **Endpoint:** `POST https://api.maildrop.cc/graphql`
- **Auth:** none
- **Sign up:** no signup — any mailbox name at `@maildrop.cc` works
- **Retention:** mailboxes hold ≤10 messages, destroyed after 24h idle
- **Greylisting:** first email from a new sender may take 15 min
- **Multi-domain:** ❌ single domain (`maildrop.cc`)
- **2026 status:** live, by Heluna (spam-filter company)

```bash
# list messages in a mailbox
curl -X POST https://api.maildrop.cc/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"query { inbox(mailbox:\"mytestbox\") { id headerfrom subject date } }"}'
# {"data":{"inbox":[{"id":"AIm59ihdGy","headerfrom":"noreply@foo.com","subject":"Verify","date":"..."}]}}

# read one message (must call separately to get body)
curl -X POST https://api.maildrop.cc/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"query { message(mailbox:\"mytestbox\", id:\"AIm59ihdGy\") { id headerfrom subject date data html } }"}'
# {"data":{"message":{"id":"AIm59ihdGy","data":"Your code is 482910\n","html":"<p>Your code is <b>482910</b></p>"}}}

# service health check
curl -X POST https://api.maildrop.cc/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ status ping(message:\"hi\") }"}'
# {"data":{"status":"OK","ping":"pong hi"}}
```

**Why not higher:** 10-msg cap and 24h idle TTL make this unsuitable
for long-lived inboxes. Greylisting means the first signup retry can
take 15 min.

---

## 3. The candidates that fail one or more hard requirements

| Service | Why it fails |
|---|---|
| **temp-mail.io** (API) | Paywalled. Web UI is free, but the REST API requires a premium subscription. |
| **MailSlurp** | Free tier = 30 inboxes/month, 200 inbound emails/month. Below our 5/day threshold. |
| **Mailsac** | Free tier = 1,500 ops/month (~50/day across all calls). Doable but tight. |
| **Mailtrap** | Sandbox for *sending* test emails. Not a receive-inbox service. |
| **Yopmail** | No public API in 2026. Web-only. |
| **Mailnesia** | No public API. RSS feed only. |
| **Mohmal** | No public API. Web-only. |
| **EmailOnDeck** | No public API. JS-only site. |
| **tempmail.com** | Site is a click-through ad wall, no real product. |
| **Internxt temp mail** | Has internal API endpoints, but undocumented. Will break without notice. |
| **Inboxbear** | Site times out in 2026. Appears abandoned. |
| **Anonbox (CCC)** | Tor-only by design. Useless from a datacenter. |
| **SimpleLogin / SL Plus** | Alias service, not a temp-mail service. Wrong product. |
| **Self-host mailcow** | You'd need to run your own mailserver with your own domain, IP, warmup. 1-week minimum project. Only worth it at scale (>1000 inboxes/day). |

---

## 4. How to swap providers (if needed)

The persona system already has provider-agnostic plumbing. The
`InboxProviderEnum` in `src/personas/types.ts` lists `"mail.tm" |
"1secmail" | "imap"` as valid values. The interface that the
`BrowserPersonaRunner` consumes is:

```ts
// src/personas/email/mailtm.ts (the shape any new provider must match)
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
export async function createInbox(prefix?: string): Promise<TempInbox>;
export async function getToken(address: string, password: string): Promise<string>;
export async function listMessages(token: string): Promise<InboxMessage[]>;
export async function waitForMessage(
  token: string,
  timeoutMs?: number,
  expectedSubject?: string,
): Promise<InboxMessage>;
export async function getMessage(token: string, id: string): Promise<InboxMessage>;
export function extractVerificationCode(msg: InboxMessage): string | null;
```

A new provider is a single file like `src/personas/email/onesecmail.ts`
that exports the same function shape. Then change the imports in:

- `src/personas/browser/runner.ts` — `import { ... } from "../email/mailtm.js"`

The change is ~80 lines of new code, no other files touched.

### Concrete sketch — `onesecmail.ts`

```ts
// src/personas/email/onesecmail.ts
const BASE = "https://www.1secmail.com/api/v1/";

// 1secmail is anonymous: no token, no signup, no password.
// We track (login, domain) and return the full address as the "id".
export async function listDomains(): Promise<string[]> {
  const r = await fetch(`${BASE}?action=getDomainList`);
  if (!r.ok) throw new Error(`1secmail domain list error ${r.status}`);
  return r.json() as Promise<string[]>;
}

export async function createInbox(prefix?: string): Promise<TempInbox> {
  // Pick a random mailbox name
  const r = await fetch(`${BASE}?action=genRandomMailbox&count=1`);
  if (!r.ok) throw new Error(`1secmail create error ${r.status}`);
  const [address] = (await r.json()) as string[];
  const [login, domain] = address.split("@");
  return { id: address, address, password: "" };
}

export async function getToken(_address: string, _password: string): Promise<string> {
  // 1secmail has no auth — return empty token; pass login+domain around instead.
  return "";
}

export async function listMessages(token: string): Promise<InboxMessage[]> {
  // `token` here is actually the address string (we stuff it in the same field).
  const [login, domain] = token.split("@");
  const r = await fetch(`${BASE}?action=getMessages&login=${login}&domain=${domain}`);
  if (!r.ok) throw new Error(`1secmail list error ${r.status}`);
  const list = (await r.json()) as Array<{ id: number; from: string; subject: string; date: string }>;
  return list.map((m) => ({
    id: String(m.id),
    from: m.from,
    subject: m.subject,
    text: "",
    html: "",
    createdAt: m.date,
  }));
}

export async function getMessage(token: string, id: string): Promise<InboxMessage> {
  const [login, domain] = token.split("@");
  const r = await fetch(`${BASE}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
  if (!r.ok) throw new Error(`1secmail read error ${r.status}`);
  const m = (await r.json()) as { id: number; from: string; subject: string; date: string; body: string; textBody: string; htmlBody: string };
  return {
    id: String(m.id),
    from: m.from,
    subject: m.subject,
    text: m.textBody ?? m.body ?? "",
    html: m.htmlBody ?? "",
    createdAt: m.date,
  };
}

export async function waitForMessage(
  token: string,
  timeoutMs = 120_000,
  expectedSubject?: string,
): Promise<InboxMessage> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const msgs = await listMessages(token);
    if (msgs.length > 0) {
      let target = msgs[0]!;
      if (expectedSubject) {
        const m = msgs.find((x) => x.subject.toLowerCase().includes(expectedSubject.toLowerCase()));
        if (m) target = m;
      }
      // Fetch the full body (listMessages doesn't include it)
      return await getMessage(token, target.id);
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error(`1secmail: no message within ${timeoutMs / 1000}s`);
}

export function extractVerificationCode(msg: InboxMessage): string | null {
  const subjectMatch = msg.subject.match(/\b(\d{6})\b/);
  if (subjectMatch) return subjectMatch[1]!;
  const bodyMatch = (msg.text + msg.html).match(/\b(\d{6})\b/);
  if (bodyMatch) return bodyMatch[1]!;
  return null;
}
```

If you also need Guerrilla Mail or maildrop.cc, the same shape works
— wrap the API in this function set, change the one import, done.

---

## 5. Provider health checks

Before relying on any provider, probe it from your actual egress IP:

```bash
# mail.tm
curl -X POST https://api.mail.tm/accounts -H 'content-type: application/json' \
  -d '{"address":"health-check@'$(curl -s https://api.mail.tm/domains | jq -r '.[0].domain')'","password":"check"}' -o /dev/null -w '%{http_code}\n'

# 1secmail
curl -s 'https://www.1secmail.com/api/v1/?action=getDomainList' -o /dev/null -w '%{http_code}\n'

# Guerrilla Mail
curl -s -c /tmp/gm.cookies 'http://api.guerrillamail.com/ajax.php?f=get_email_address&lang=en&ip=127.0.0.1&agent=healthcheck' -o /dev/null -w '%{http_code}\n'

# maildrop.cc
curl -s -X POST https://api.maildrop.cc/graphql -H 'content-type: application/json' \
  -d '{"query":"{ status }"}' | jq -r '.data.status'
```

If you get 200/OK from all four, you have provider diversity. If only
mail.tm works, fine — the system has a single dependency, and the
archival workflow (`pnpm personas --archive` + re-create) absorbs a
day-long outage.

---

## 6. Decision matrix

| Use case | Pick |
|---|---|
| Default / "just works" | **mail.tm** |
| Add a hot standby to the same Node service | **1secmail.com** (easiest) |
| Need a stable mailbox that survives mail.tm going down | **Guerrilla Mail** (longest-running, but HTTP-only) |
| Need a long-lived mailbox with grep-friendly body | **maildrop.cc** (GraphQL, plaintext `data` field) — but single-domain, 10-msg cap, 24h TTL |
| Production / business use, willing to pay | **Mailsac** ($18/mo, real SLA) |
| Already paying for temp-mail.io premium | **temp-mail.io API** (REST matches mail.tm 1:1) |
| Need >1000 inboxes/day | **Self-host mailcow** (you supply domain + IP + warmup) |

For our persona system specifically, the realistic upgrade path is:
1. Stay on mail.tm.
2. If mail.tm is degraded, add 1secmail.com as a fallback (the
   runner takes whichever provider returns first).
3. If both are down for >24h, run signup manually in a browser,
   capture the session token, and inject it as described in §8 of
   the SKILL.md.
