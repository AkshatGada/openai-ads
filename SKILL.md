# OpenAI Ads Scraper Skill

This skill covers the ChatGPT scraper integration used to probe the OpenAI Ads auction and detect competitor ads on the free tier of ChatGPT.

## System overview

We use [Oxylabs ChatGPT Scraper](https://oxylabs.io/products/scraper-api/serp/chatgpt) to send prompts to ChatGPT and capture fully-rendered HTML. This lets us observe which ads appear for specific conversational contexts, effectively reverse-engineering the OpenAI Ads auction.

```
Synthetic prompt → Oxylabs headless browser → ChatGPT free tier → Raw HTML → Ad detection
```

## Architecture

```
src/scraper/
├── types.ts          # ScraperRequest, AdCard, ScraperResult, OxylabsResponse types
├── client.ts         # Core client: probeChatGPT, probeContent, probeAds, probeBatch, extractAdsFromHtml, countAds, hasAds
```

```
src/scripts/
├── verify-scraper.ts         # Single-probe connectivity test
├── diagnose-ads.ts           # Save raw HTML for ad markup inspection
├── batch-probe.ts            # Generic batch runner (original 50 AI IDE prompts)
├── batch-probe-crypto.ts     # 50 crypto/trading platform prompts
├── batch-probe-finance.ts    # 50 financial services prompts
```

## Oxylabs API parameters

| Parameter | Values | Default |
|---|---|---|
| `source` | `"chatgpt"` | required |
| `prompt` | string (max 4000) | required |
| `parse` | `true`/`false` | `false` |
| `search` | `true`/`false` | `true` |
| `geo_location` | country string | `"United States"` |
| `render` | enforced | always on |
| `callback_url` | URL | — |
| `user_agent_type` | `desktop`/`mobile`/`tablet` | — |

**Key modes:**
- `parse: false` — returns raw rendered HTML (needed for ad detection)
- `parse: true` — returns structured ChatGPT response text only (no ads)
- Free tier = anonymous (no login). Ads only appear on free tier; Plus/Pro/Business users never see ads.

## Core API functions (from `src/scraper/client.ts`)

```ts
// Content-only probe (ChatGPT's answer, no ad detection)
probeContent(prompt, geo_location?) → ScraperResult

// Ad probe — raw HTML with ad extraction
probeAds(prompt, geo_location?) → { prompt, html, ads: AdCard[] }

// Batch content probes (parallel, concurrency-limited)
probeBatch(prompts[], opts?) → ScraperResult[]

// Batch ad probes (parallel, concurrency-limited)
probeAdsBatch(prompts[], opts?) → { prompt, ads, html }[]

// Extract structured ad cards from HTML
extractAdsFromHtml(html) → AdCard[]

// Quick ad presence check
hasAds(html) → boolean

// Count ad cards in HTML
countAds(html) → number
```

## Ad detection — what we discovered

### The real ad markup on ChatGPT free tier

After probing with `parse: false` and inspecting the raw HTML, the ad structure is:

```html
<!-- Advertiser header -->
<div class="flex items-center gap-3 ...">
  <p class="... font-medium">Robinhood</p>
  <p class="...">Sponsored</p>
</div>

<!-- Ad card -->
<div role="link" tabindex="0" data-ad-card-root="true" ...>
  <p class="... font-medium ...">Put Your Cash to Work</p>
  <p class="... line-clamp-2 ...">Intuitive trading tools to build your strategy.</p>
</div>
```

### Detection patterns

| Pattern | Reliable? | Notes |
|---|---|---|
| `data-ad-card-root="true"` | **Yes** | The definitive marker. Use for counting and locating ad cards. |
| `"Sponsored"` | **Yes** | Always present as the ad label. Look inside `<p>` tags, not system prompt text. |
| `utm_source=openai_ads` | **Not yet observed** | Speculative — expected in ad target URLs but hasn't appeared in our probes. |
| `chat_card` | **Not observed** | This is the OpenAI Ads API term for ad creatives but does NOT appear in the ChatGPT frontend HTML. |

### Extraction logic (`extractAdsFromHtml`)

1. Split HTML on `data-ad-card-root="true"` to find each ad card
2. For each card, extract:
   - **Title**: `<p>` with `font-medium` class inside the card
   - **Body**: `<p>` with `line-clamp-2` class inside the card
   - **Advertiser**: `<p>` immediately above the nearest `<p>Sponsored</p>` before the card
3. Target URL: not directly extractable from HTML (ads use JS click handlers, not `<a>` tags)

## Batch probe conventions

### Running a batch
```bash
# Start a batch in background
rm -rf scraper-outputs-<name> && nohup pnpm tsx src/scripts/batch-probe-<name>.ts > batch-probe-<name>.log 2>&1 &

# Monitor progress
tail -f batch-probe-<name>.log
```

### Batch script template
Each batch script follows this pattern:
1. Define 50 prompts as a `PROMPTS` array inside the script
2. Loop through prompts, calling `probeAds(prompt, "United States")`
3. Save each HTML response to `scraper-outputs-<category>/NN_<sanitized-prompt>.html`
4. Log format per prompt:
   - No ads: `[01/50] · html=480453`
   - Ads found: `[15/50] 🔴 AD: Robinhood — "Put Your Cash to Work"` / `ads=1 html=542891`
   - Error: `[xx/50] ✗ <error message>`
5. 2-second delay between requests
6. Print summary at end: `DONE. 3/50 prompts had ads.`

### Output directories
- `scraper-outputs-crypto/` — crypto/trading platform prompts (50)
- `scraper-outputs-finance/` — financial services prompts (50)
- `scraper-outputs/` — AI IDE/coding tool prompts (50, first batch)

All in `.gitignore` — never commit scraper outputs.

## What we've probed and results

### Batch 1: AI IDE / coding tools (50 prompts)
- **Category**: AI coding assistants (Cursor, Copilot, Windsurf, etc.)
- **Result**: 0 ads across all 50 prompts
- **Location**: `scraper-outputs/`
- **Script**: `src/scripts/batch-probe.ts`

### Batch 2: Crypto/Trading APIs (50 prompts)
- **Category**: Crypto exchange APIs, algo trading, stock trading, forex
- **Result**: 1 ad detected — **Robinhood** on prompt #15
- **Prompt that triggered ad**: "I'm comparing KuCoin, Gate.io, and MEXC API limits — which exchange has the most generous rate limits for trading bots?"
- **Location**: `scraper-outputs-crypto/`
- **Script**: `src/scripts/batch-probe-crypto.ts`

### Batch 3: Financial Services (50 prompts, running)
- **Category**: Investing apps, banking, credit cards, budgeting, insurance, mortgages
- **Result**: In progress
- **Location**: `scraper-outputs-finance/`
- **Script**: `src/scripts/batch-probe-finance.ts`

## Advertisers discovered

| Company | Category | Prompt context | Ad copy |
|---|---|---|---|
| **Robinhood** | Financial services / trading | Crypto exchange API comparison | "Put Your Cash to Work" / "Intuitive trading tools to build your strategy." |

## Official OpenAI Ads advertisers (from landing page)

According to [ads.openai.com](https://ads.openai.com), early advertisers include:
- **Best Buy** — consumer electronics
- **Lowe's** — home improvement
- **VistaPrint** — business printing/design

These have NOT yet been observed in our probes, suggesting they may target different conversational contexts.

## Allowed ad categories (from OpenAI Ad Policies)

- Household & consumer goods (open)
- Local services (open)
- Travel & entertainment (open)
- Digital products & education (open)
- Financial services (restricted, case-by-case)
- Healthcare & medicine (restricted, case-by-case)
- Legal services (restricted, case-by-case)

Prohibited: crypto-specific, gambling, political, adult content, alcohol/tobacco, wellness claims.

## Generating prompts for a new batch

Prompts should mimic natural conversational research — the kind of exploratory/comparison queries that trigger ads:

**Style template:**
- "I'm looking for [product/service] that [specific need]"
- "Which [category] is best for [use case]?"
- "Compare [X] vs [Y] vs [Z] for [scenario]"
- "What's the best [product] with [feature]?"
- "I need a [service] that [requirement]"

**Category selection priority** (based on confirmed advertisers and ad policy openness):
1. Consumer electronics (Best Buy)
2. Home improvement (Lowe's)
3. Digital products/SaaS (VistaPrint)
4. Financial services (Robinhood confirmed)
5. Travel
6. Local services

## Credentials

Credentials are stored in `.env` (gitignored):

```
OXYLABS_USERNAME=<username>
OXYLABS_PASSWORD=<password>
OXLABS_BASE_URL=https://realtime.oxylabs.io/v1/queries
```

Read from `src/config.ts:oxylabs` block. Never hard-code credentials.

## Next probe categories to try

Based on confirmed early adopters, the highest-probability categories for ad detection:
- **Consumer electronics** — "best laptop for programming", "4K TV under $1000"
- **Home improvement** — "best power tools for DIY", "how to renovate a kitchen on a budget"
- **Digital products/business tools** — "best website builder 2025", "best business card printing"
