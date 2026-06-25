# ChatGPT Ads Library — Guide for Forks

This dashboard shows which companies are running ads inside ChatGPT, for any industry you probe. It's a self-contained React frontend that reads JSON data files. No backend, no database.

If you fork this and have your own probe data for a different niche, here's how to add it.

---

## Architecture (30-second version)

```
Scraper (verseodin/oxylabs)
  → sends prompts to ChatGPT
  → saves HTML files to scraper-outputs-<niche>/
    → Cleaner (cleaner-v2.ts)
      → extracts prompt, response, ads, citations from HTML
      → writes data/<niche>-probes.json
        → Classifier (classifier-v2.ts)
          → labels persona, need, intent score, competitor mentions
          → updates data/<niche>-probes.json
            → Insights (insights-v2.ts)
              → aggregates into patterns
              → writes data/<niche>-patterns.json
                → Dashboard (dashboard/)
                  → loads the two JSON files
                  → renders advertisers, ads, prompts views
```

Two JSON files per niche is all the dashboard needs:
- `dashboard/src/data/<niche>-probes.json` — one probe per row
- `dashboard/src/data/<niche>-patterns.json` — aggregated stats

---

## Step 1: Collect probe data

You need HTML files from ChatGPT responses. Each HTML file is one ChatGPT conversation where you sent a prompt and got a response (which may or may not contain ads).

### Option A: Use the built-in scraper

The repo includes two scraper clients:

**VerseOdin** (recommended — faster, higher success rate):
```ts
// src/scraper/verseodin.ts
import { probeAds, countAds } from "../scraper/verseodin.js";

const result = await probeAds("how to buy spacex stock before ipo", "US");
// result.html — full ChatGPT page HTML
// result.ads — extracted ad cards [{ advertiser, title, body }]
// result.text — ChatGPT response text
```

**Oxylabs** (alternative — serial, lower cost):
```ts
// src/scraper/client.ts
import { probeAds } from "../scraper/client.js";

const result = await probeAds("how to buy spacex stock before ipo", "United States");
// result.html, result.ads
```

### Write a batch probe script

Copy `src/scripts/batch-probe-preipo-spacex-verseodin.ts` as a template. Change:
- `PROMPTS` array — your niche's prompts
- `OUT_DIR` — `scraper-outputs-<your-niche>`
- `CONCURRENCY` — 8 for VerseOdin, 5 for Oxylabs

Run it:
```bash
pnpm tsx src/scripts/batch-probe-<your-niche>.ts
```

### Prompt writing rules

- No brand names of the product you're researching (let the ads surface naturally)
- Sound like real ChatGPT users — questions, not search queries
- Mix short and long prompts
- Cover different user personas (beginner, pro, comparison shopper)
- 50-100 prompts is a good dataset size

### Environment variables

Create a `.env` file in the repo root:
```
VERSEODIN_API_KEY=your_key_here
OXYLABS_USERNAME=your_username
OXYLABS_PASSWORD=your_password
```

---

## Step 2: Clean HTML → JSON

The cleaner extracts structured data from raw HTML files.

### Write a cleaner for your niche

The existing cleaner (`src/analyzer/cleaner-v2.ts`) is hardcoded to OMS directories. For a new niche, either:

**Option A — Generalize the existing cleaner:**

```ts
// Change SRC_DIRS to your output directory
const SRC_DIRS = ["scraper-outputs-<your-niche>"];
const OUT_FILE = "data/<your-niche>-probes-v2.json";
```

Then run:
```bash
pnpm tsx -e "import { cleanProbes } from './src/analyzer/cleaner-v2.js'; cleanProbes();"
```

**Option B — Write JSON directly (if you have data from another source):**

Skip the scraper entirely. Create two JSON files by hand or from your own pipeline. See the data schema below.

### Probe JSON schema

Each entry in `*-probes.json` must match `ProbeRecordV2`:

```typescript
{
  "id": "L1-001",                    // unique string
  "prompt": "how to buy spacex stock", // the question sent to ChatGPT
  "status": "ok",                    // "ok" or "failed"
  "failed_reason": null,             // reason if failed

  // Extracted from ChatGPT response:
  "chatgpt_response": "To buy SpaceX...", // full response text
  "citations": [{ "url": "...", "title": "..." }], // sources referenced
  "response_length": 2500,           // character count
  "has_search": false,               // did ChatGPT use web search?

  // Ads found in the response:
  "ads": [
    {
      "advertiser": "Robinhood",
      "title": "Trade stocks commission-free",
      "body": "Start investing today..."
    }
  ],
  "has_ads": true,                   // convenience: ads.length > 0
  "advertiser_name": "Robinhood",    // first advertiser or null
  "ad_copy": "Trade stocks...",      // first ad title or null
  "html_size_kb": 2300,              // size of source HTML

  // Classification (from classifier or manual):
  "persona": "retail_investor",      // who asked this?
  "primary_need": "stock_purchase",  // what are they trying to do?
  "intent_score": 7,                 // 0-10, how close to a purchase decision?
  "known_competitors_in_prompt": [],   // competitor names mentioned in the prompt
  "known_competitors_in_response": ["Robinhood", "Fidelity"], // in the response
  "contains_oms_language": false,    // niche-specific signal (rename as needed)
  "oms_signals_found": [],           // niche-specific signals
  "prompt_structure": "question",    // question|comparison|statement|mixed
  "contains_api": false,             // mentions API/developer?
  "contains_compliance": false,      // mentions regulation/compliance?
  "contains_competitor": false,      // names a specific competitor?
  "word_count": 5                    // prompt word count
}
```

### Minimal valid probe (if building from scratch)

If you just want to get data in fast, the only fields the dashboard strictly needs:

```json
{
  "id": "p001",
  "prompt": "your prompt text",
  "status": "ok",
  "chatgpt_response": "the response text",
  "citations": [],
  "response_length": 500,
  "has_search": false,
  "ads": [{ "advertiser": "Company", "title": "Ad title", "body": "Ad body" }],
  "has_ads": true,
  "advertiser_name": "Company",
  "ad_copy": "Ad title",
  "html_size_kb": 100,
  "persona": "unknown",
  "primary_need": "unknown",
  "intent_score": 5,
  "known_competitors_in_prompt": [],
  "known_competitors_in_response": ["Company"],
  "contains_oms_language": false,
  "oms_signals_found": [],
  "prompt_structure": "question",
  "contains_api": false,
  "contains_compliance": false,
  "contains_competitor": false,
  "word_count": 4
}
```

---

## Step 3: Classify probes (optional but recommended)

The classifier labels each probe with persona, need, intent score, and competitor mentions. It's regex-based — no LLM needed.

### Adapt the classifier for your niche

Edit `src/analyzer/classifier-v2.ts`:

```ts
// 1. Add your niche's known competitors
const KNOWN_COMPETITORS = [
  "Robinhood", "Fidelity", "Charles Schwab", "Vanguard", // your niche
];

// 2. Add persona patterns (regex → label)
const PERSONA_PATTERNS = [
  { pattern: /beginner|new.*invest|first.*stock/i, persona: "beginner_investor" },
  { pattern: /day.*trad|scalp|options/i, persona: "active_trader" },
  // ...your personas
];

// 3. Add need patterns (regex → label)
const NEED_PATTERNS = [
  { pattern: /buy|purchase|invest.*in/i, need: "purchase" },
  { pattern: /compare|vs|which.*best/i, need: "comparison" },
  // ...your needs
];
```

Run:
```bash
pnpm tsx -e "
import { readFileSync, writeFileSync } from 'fs';
import { classifyProbes } from './src/analyzer/classifier-v2.js';
const probes = JSON.parse(readFileSync('data/<your-niche>-probes-v2.json', 'utf8'));
const classified = classifyProbes(probes);
writeFileSync('data/<your-niche>-probes-v2.json', JSON.stringify(classified, null, 2));
"
```

### Intent scoring

The classifier scores 0-10 based on regex signals:
- Mentions price/cost/buy → +2
- Names a specific competitor → +2
- Uses comparison language → +1
- Contains urgency words → +1
- etc.

For better scoring, use an LLM to rate each prompt's buying intent. The current regex approach maxes at ~6/10.

---

## Step 4: Generate patterns JSON

The insights layer aggregates probes into the `PatternSummary` shape the dashboard needs.

### Run the insights generator

```bash
pnpm tsx -e "
import { readFileSync, writeFileSync } from 'fs';
import { computePatterns } from './src/analyzer/insights-v2.js';
const probes = JSON.parse(readFileSync('data/<your-niche>-probes-v2.json', 'utf8'));
const patterns = computePatterns(probes);
writeFileSync('data/<your-niche>-patterns.json', JSON.stringify(patterns, null, 2));
"
```

### Patterns JSON schema

The `*-patterns.json` file must match `PatternSummary`. The key fields the dashboard uses:

```typescript
{
  "generated_at": "2026-06-10T18:45:20.492Z",
  "total_probes": 100,          // total probes in dataset
  "total_success": 95,          // probes with status "ok"
  "total_failed": 5,
  "total_ads": 8,               // probes that had ads
  "ad_rate_pct": 8.4,           // total_ads / total_success * 100

  // Used by Advertisers view (paid vs organic split)
  "competitor_frequency": [
    { "company": "Robinhood", "organic_mentions": 12, "paid_impressions": 3, "total_share": 15 }
  ],

  // Used by Advertisers view (paid card detail drawer)
  "advertisers": [
    { "advertiser": "Robinhood", "hits": 5, "sample_prompts": ["..."], "sample_copy": ["..."] }
  ],

  // Used by Prompts view (value ranking)
  "ad_density_by_persona": [
    { "persona": "beginner", "probes": 20, "ads": 2, "rate": 10, "competition": "medium" }
  ],

  // Other fields are used by Landscape view (currently disabled but available)
  "ad_density_by_need": [...],
  "ad_density_by_structure": [...],
  "intent_by_persona": [...],
  "intent_by_need": [...],
  "coverage_gaps": [...],
  "blue_ocean": [...],
  "response_quality": [...],
  "prompt_structure_effectiveness": [...],
  "oms_language_penetration": { "pct_with_oms_language": 0, "top_oms_signals": [] }
}
```

### Quick start: generate patterns from any probe JSON

If your probes are minimal (just prompt + ads), you can generate patterns with this script:

```bash
pnpm tsx -e "
import { readFileSync, writeFileSync } from 'fs';
import { computePatterns } from './src/analyzer/insights-v2.js';
const probes = JSON.parse(readFileSync('data/<your-niche>-probes.json', 'utf8'));
const patterns = computePatterns(probes);
writeFileSync('data/<your-niche>-patterns.json', JSON.stringify(patterns, null, 2));
console.log('Patterns written:', patterns.total_probes, 'probes,', patterns.total_ads, 'ads');
"
```

---

## Step 5: Register the niche in the dashboard

Two changes to make your niche appear in the dashboard.

### 1. Copy JSON files into the dashboard data folder

```bash
cp data/<your-niche>-probes.json dashboard/src/data/<your-niche>-probes.json
cp data/<your-niche>-patterns.json dashboard/src/data/<your-niche>-patterns.json
```

### 2. Register in `dashboard/src/lib/registry.ts`

```ts
export type IndustryId = "real-estate" | "oms" | "<your-niche>";  // add your id

export const INDUSTRIES: Record<IndustryId, IndustryEntry> = {
  // ...existing entries...

  "<your-niche>": {
    id: "<your-niche>",
    label: "Your Niche Label",           // shown in chips + industry page title
    tagline: "100 probes · 8 ads · 3 advertisers",  // shown in search autocomplete
    aliases: ["your niche", "keyword1", "keyword2"], // search aliases
    load: async () => {
      const [patterns, probes] = await Promise.all([
        import("../data/<your-niche>-patterns.json"),
        import("../data/<your-niche>-probes.json"),
      ]);
      return {
        patterns: patterns.default as unknown as PatternSummary,
        probes: probes.default as unknown as ProbeRecordV2[],
      };
    },
  },
};
```

That's it. The niche now appears in:
- Search autocomplete (via aliases)
- Industry chips on the landing page
- The full dashboard with all 3 tabs (Advertisers, Ads, Prompts)

---

## Step 6: Deploy to Vercel

The dashboard is a static Vite app. Vercel deployment takes 2 minutes.

### From the Vercel dashboard

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → "Add New Project" → import your repo
3. Configure:
   - **Root Directory:** `dashboard`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `pnpm build` (auto-detected from package.json)
   - **Output Directory:** `dist` (auto-detected)
4. Click "Deploy"

### From the CLI

```bash
npm i -g vercel          # install Vercel CLI
cd dashboard
vercel                   # follow prompts — links to your Vercel account
vercel --prod            # deploy to production
```

### Important: data files are bundled

The JSON data files in `dashboard/src/data/` are imported via dynamic `import()`, which Vite bundles as separate chunks. This means:
- All data ships in the client bundle (no server needed)
- Large datasets (>500KB probes JSON) will create large chunks — Vite warns but it works
- For very large datasets, consider a fetch()-based loader instead of import()

### Custom domain

In Vercel dashboard → Settings → Domains → add your domain. Vercel handles SSL automatically.

### Environment variables

The dashboard itself needs no environment variables. All data is bundled at build time. The scraper (which runs locally, not on Vercel) needs `VERSEODIN_API_KEY` or `OXYLABS_*` in your local `.env`.

---

## Full workflow summary

```bash
# 1. Write prompts for your niche
#    → edit src/scripts/batch-probe-<niche>.ts

# 2. Run the scraper (local, needs API keys in .env)
pnpm tsx src/scripts/batch-probe-<niche>.ts
#    → saves HTML to scraper-outputs-<niche>/

# 3. Clean HTML → probes JSON
pnpm tsx -e "import { cleanProbes } from './src/analyzer/cleaner-v2.js'; cleanProbes();"
#    → writes data/<niche>-probes-v2.json

# 4. Classify probes (label persona, need, intent)
pnpm tsx -e "
import { readFileSync, writeFileSync } from 'fs';
import { classifyProbes } from './src/analyzer/classifier-v2.js';
const p = JSON.parse(readFileSync('data/<niche>-probes-v2.json','utf8'));
writeFileSync('data/<niche>-probes-v2.json', JSON.stringify(classifyProbes(p), null, 2));
"

# 5. Generate patterns JSON
pnpm tsx -e "
import { readFileSync, writeFileSync } from 'fs';
import { computePatterns } from './src/analyzer/insights-v2.js';
const p = JSON.parse(readFileSync('data/<niche>-probes-v2.json','utf8'));
writeFileSync('data/<niche>-patterns.json', JSON.stringify(computePatterns(p), null, 2));
"

# 6. Copy to dashboard
cp data/<niche>-probes-v2.json dashboard/src/data/<niche>-probes.json
cp data/<niche>-patterns.json dashboard/src/data/<niche>-patterns.json

# 7. Register in dashboard/src/lib/registry.ts (see Step 5)

# 8. Test locally
cd dashboard && pnpm dev

# 9. Deploy
vercel --prod
```

---

## Data source alternatives

You don't have to use the built-in scraper. Any data source works as long as you produce the two JSON files in the right schema.

### Alternative 1: Manual collection
Open ChatGPT in a browser, send prompts, screenshot ads, transcribe into JSON manually. Works for small datasets (10-20 probes).

### Alternative 2: Browser automation
Use Playwright/Puppeteer to automate ChatGPT sessions. The repo has a Playwright scraper at `src/playwright-scraper/` but it's more complex to set up than the API scrapers.

### Alternative 3: Third-party ad intelligence
If you have access to Meta Ad Library, Pathmatics, or Similarweb data, transform it into the probe schema. Each "probe" becomes a search query + the ads that appeared for it.

### Alternative 4: API endpoint (future)
The registry's `load()` function currently uses dynamic `import()` for local JSON. To switch to a live API, change it to `fetch()`:

```ts
load: async () => {
  const res = await fetch(`/api/industries/<your-niche>`);
  return res.json();
}
```

This is the future-API seam — the rest of the dashboard doesn't care where data comes from.

---

## File reference

| File | Purpose |
|---|---|
| `dashboard/src/data/*.json` | Bundled data files (probes + patterns per niche) |
| `dashboard/src/lib/registry.ts` | Industry registry — add new niches here |
| `dashboard/src/lib/types.ts` | Data schema (ProbeRecordV2, PatternSummary) |
| `dashboard/src/lib/derive.ts` | Derives ad gallery items from probes |
| `dashboard/src/lib/format.ts` | Display helpers (decodeEntities, humanize, pct) |
| `dashboard/src/lib/theme.ts` | Dark/light theme hook |
| `dashboard/src/components/` | React components (Header, Landing, cards, etc.) |
| `dashboard/src/views/` | View components (AdsGallery, Prompts, Advertisers) |
| `src/scraper/verseodin.ts` | VerseOdin scraper client |
| `src/scraper/client.ts` | Oxylabs scraper client + ad extraction |
| `src/analyzer/cleaner-v2.ts` | HTML → probes JSON |
| `src/analyzer/classifier-v2.ts` | Labels probes (persona, need, intent) |
| `src/analyzer/insights-v2.ts` | Aggregates probes → patterns JSON |
| `src/analyzer/types-v2.ts` | Backend data schema (mirrors dashboard types) |
| `src/scripts/batch-probe-*.ts` | Batch scraper scripts (one per niche) |
