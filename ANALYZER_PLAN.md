# Ad Intelligence Analyzer — Design Plan

## Current Data Inventory

| Batch | Prompts | Ads Found | Advertisers |
|---|---|---|---|
| `scraper-outputs-crypto/` | 50 | 4 | BestMoney, Anakin (2x), MongoDB |
| `scraper-outputs-finance/` | 50 | 1 | BestMoney |
| `scraper-outputs-crypto-api/` | ~29 (in progress) | 1 | Tinfoil |
| `scraper-outputs-finance-api/` | ~37 (in progress) | 0 | — |
| AI IDE batch (first run) | 50 | 0 | — |

**Total: ~166 probes, 6 ad hits, 5 unique advertisers.**

---

## What the Analyzer Should Do

### Core questions to answer

1. **Which prompt features trigger ads?** — keywords, topic categories, intent type, question format
2. **Which advertisers bid on which contexts?** — per-advertiser topic coverage map
3. **When do ads appear?** — time-of-day patterns, ad density per topic
4. **How competitive is each topic?** — ad density = competition score
5. **Which topics have zero ads?** — blue-ocean opportunities for our own campaigns
6. **How do advertisers' ad copies relate to the prompt?** — relevance alignment scoring
7. **What budget/investment levels can be inferred?** — frequency × coverage analysis

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     DATA INGESTION                           │
│  scrape-probes/          src/analyzer/ingest.ts              │
│  ├─ scraper-outputs-*/   → reads all HTML files              │
│  ├─ batch-probe-*.log    → reads timestamps                  │
│  └─ generates unified JSON database                          │
└──────────────────────┬───────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  FEATURE EXTRACTION                          │
│  src/analyzer/extract.ts                                     │
│  ├─ Prompt classification (topic, category, intent)           │
│  ├─ Keyword extraction (n-grams, TF-IDF)                     │
│  ├─ Ad card extraction (advertiser, title, body)              │
│  ├─ ChatGPT response extraction (what the AI answered)       │
│  └─ Response-to-prompt relevance scoring                      │
└──────────────────────┬───────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   PATTERN ENGINE                             │
│  src/analyzer/patterns.ts                                    │
│  ├─ Ad trigger correlation: which prompt features → ads?     │
│  ├─ Advertiser-to-topic mapping: who bids where?             │
│  ├─ Ad density scoring: competition per topic                │
│  ├─ Time-series analysis: when do ads appear?                │
│  ├─ Creative analysis: how ads match prompts                 │
│  └─ Gap analysis: high-intent topics with zero ads            │
└──────────────────────┬───────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     OUTPUT                                   │
│  src/analyzer/report.ts                                      │
│  ├─ JSON report: structured findings                         │
│  ├─ Terminal dashboard: live analysis view                   │
│  └─ CSV export: topic × advertiser matrix                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Model

```ts
interface ProbeRecord {
  id: string;                    // "crypto-34"
  prompt: string;                // full prompt text
  batch: string;                 // "crypto", "finance", etc.
  timestamp: string;             // ISO timestamp from log
  geo_location: string;          // "United States"
  html_path: string;             // file path to saved HTML
  html_size: number;             // bytes
  has_ads: boolean;              // true if ads detected
  ads: AdRecord[];               // extracted ad cards
  chatgpt_response: string;      // ChatGPT's answer (extracted from HTML)
  chatgpt_links: string[];       // links cited in response
}

interface AdRecord {
  advertiser: string;            // "BestMoney"
  title: string;                 // "Best Trading Platforms 2026"
  body: string;                  // "Compare Stock Trading Platforms Online."
  category: string;              // "lead-gen" | "dev-tool" | "consumer" | "enterprise"
}

interface PromptFeatures {
  keywords: string[];            // extracted keywords (API, exchange, trading, etc.)
  topics: string[];              // topic tags (crypto, forex, banking, dev-tools)
  intent_type: string;           // "comparison", "how-to", "what-is", "recommendation"
  question_format: string;       // "which-is-best", "i-need", "compare-x-vs-y", "looking-for"
  contains_api: boolean;         // explicit "API" mention
  contains_comparison: boolean;  // "vs", "compare", "best", "which"
  contains_brand: boolean;       // specific company names mentioned
  word_count: number;
  sentiment: string;             // "neutral", "urgent", "exploratory"
}
```

---

## Pattern Detection Rules (V1 — heuristic)

### Rule 1: API keyword → dev tool ads
```
IF prompt.contains("API") AND ad.advertiser IN ["Anakin", "MongoDB", "Tinfoil"]
→ Pattern: "API triggers dev-tool advertisers regardless of prompt topic"
Confidence: HIGH (4/4 dev-tool ads appeared on API prompts)
```

### Rule 2: Financial comparison → lead-gen ads
```
IF prompt.intent_type == "comparison" AND prompt.topics ∩ ["forex", "loan", "mortgage", "trading"]
AND NOT prompt.contains("API")
→ Pattern: "Pure financial comparison triggers lead-gen/comparison-site ads"
Confidence: MEDIUM (1 hit, needs more data)
```

### Rule 3: Ad density per topic
```
ad_density = ads_found / probes_in_topic
```
| Topic | Probes | Ads | Density | Competition |
|---|---|---|---|---|
| crypto + API | ~30 | 4 | 13% | LOW |
| finance + no API | ~50 | 1 | 2% | VERY LOW |
| crypto + no API | ~20 | 0 | 0% | NONE — blue ocean |
| finance + API | ~37 | 0 | 0% | NONE — blue ocean |

### Rule 4: Advertiser repeat frequency
```
IF same advertiser appears on 2+ prompts with SAME ad copy
→ "Single broad campaign, context-hint matched loosely"
Example: Anakin (2 hits, identical ad)

IF same advertiser appears on 2+ prompts with DIFFERENT ad copy matching prompt category
→ "Multiple campaigns OR dynamic ad variants"
Example: BestMoney (2 hits, different ads: "Trading Platforms" vs "Home Equity Loans")
```

### Rule 5: Blue ocean detection
```
blue_ocean_score = (commercial_intent × volume_estimate) / (1 + ad_density)

Top blue ocean topics:
- finance + API prompts        → 0 ads, high intent → SCORE: HIGH
- crypto-only (no API) prompts  → 0 ads, high intent → SCORE: HIGH
- banking/savings prompts       → 0 ads, medium intent → SCORE: MEDIUM
```

---

## How Much Data Is Needed

### Minimum viable (now)
- **166 probes, 5 advertiser types, 6 ad hits** — enough for V1 heuristics
- Can already detect: API → ads pattern, advertiser types, blue ocean topics
- Limitation: small sample means low statistical confidence

### Good (next level)
- **500+ probes** across 10+ topic categories
- **3+ runs per prompt** at different times/days → time-series analysis
- **Multiple geos** (US, UK, India, Germany) → geo-ad-density mapping
- **Repeat sampling**: same prompts probed daily for 1 week → budget pacing inference

### Production-grade
- **2,000+ probes** across 20+ categories, 5+ geos, 7+ days
- **ML classifier** trained on prompt → ad trigger probability
- **Real-time monitoring**: probe a set of 100 "canary" prompts every 6 hours
- **Advertiser fingerprinting**: identify when new advertisers enter, when existing ones change creatives

---

## Implementation Plan

### Phase 1 — Unified Probe Database (build now)

File: `src/analyzer/ingest.ts`

```ts
// Walk all scraper-outputs-*/ directories
// Parse log files for timestamps
// Extract ads from HTML
// Classify each prompt
// Output: data/probes.json — unified array of ProbeRecord[]
```

**Effort**: ~150 lines. Uses existing `extractAdsFromHtml` + new classification logic.

### Phase 2 — Pattern Engine (build now)

File: `src/analyzer/patterns.ts` + `src/analyzer/report.ts`

- Keyword extraction from prompts
- Topic classification (crypto, finance, dev-tools, etc.)
- Rule-based pattern matching (the 5 rules above)
- Gap/opportunity analysis
- Terminal report output

**Effort**: ~300 lines.

### Phase 3 — Scheduled Re-probing

File: `src/scripts/scheduled-probe.ts`

- Define a "canary set" of 20 high-signal prompts (the ones that triggered ads before)
- Run every 6 hours
- Detect: new advertisers, creative changes, ad appearance/disappearance
- Alert if ad density changes significantly

**Effort**: ~100 lines.

### Phase 4 — ML Classifier (later)

Train a simple model:
- Input: prompt features (keywords, intent, category, question format)
- Output: probability of ad appearing, predicted advertiser type
- Training data: 500+ labeled probes

---

## File Structure After Build

```
src/analyzer/
├── types.ts           # ProbeRecord, AdRecord, PromptFeatures, AnalysisReport
├── ingest.ts          # Walk output dirs + logs → unified probes.json
├── classify.ts        # Prompt classification (keyword extraction, intent, topic)
├── patterns.ts        # Pattern matching rules engine
├── report.ts          # Terminal dashboard + JSON/CSV export
└── index.ts           # CLI entry: npx tsx src/analyzer/index.ts

data/
└── probes.json        # Generated by ingest.ts — all probe records

src/scripts/
└── scheduled-probe.ts # Re-probe canary prompts on interval
```

---

## CLI Usage

```bash
# Ingest all existing probe data
pnpm analyze --ingest

# Run pattern analysis and print report
pnpm analyze --report

# Full pipeline: ingest + analyze + print
pnpm analyze

# Export to CSV for spreadsheet analysis
pnpm analyze --export

# Show live ad density by topic
pnpm analyze --topics
```

---

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OpenAI Ads Intelligence Analyzer
  166 probes · 5 advertisers · 6 ad hits · 4 batches
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AD DENSITY BY TOPIC
  crypto+API  ████████░░░░░░░░░░  13% (4/30)  LOW competition
  finance     ██░░░░░░░░░░░░░░░░   2% (1/50)  VERY LOW
  crypto      ░░░░░░░░░░░░░░░░░░   0% (0/20)  BLUE OCEAN
  finance+API ░░░░░░░░░░░░░░░░░░   0% (0/37)  BLUE OCEAN

ADVERTISER COVERAGE MAP
  Anakin Tech     ████  2 hits  "API" + any topic
  BestMoney       ████  2 hits  Financial comparison (varied ad copy)
  MongoDB          ██   1 hit   "API" + data/infra topics
  Tinfoil           ██   1 hit   "API" + dev-tool topics
  Robinhood        ██   1 hit   "API" + trading topics

TRIGGER PATTERNS (confidence)
  "API" keyword → dev tool ad          HIGH (4/4)
  Financial comparison → lead-gen ad   MEDIUM (1/1 — more data needed)
  Trading intent → fintech ad           LOW (1/5 — sparse)

TOP BLUE OCEAN OPPORTUNITIES
  1. finance+API (37 probes, 0 ads) — HIGH commercial intent
  2. crypto-only (20 probes, 0 ads) — HIGH commercial intent
  3. banking/savings (10 probes, 0 ads) — MEDIUM intent
  4. credit cards (10 probes, 0 ads) — MEDIUM intent
  5. insurance (5 probes, 0 ads) — MEDIUM intent
  6. stock trading (8 probes, 0 ads) — LOW intent (too broad?)

ESTIMATED AUCTION DEPTH
  Overall ad fill rate: 3.6% (6/166)
  Perceived advertiser count: 5
  Auction thinness: VERY THIN — most contexts have 0 bidders
  Implication: First-mover advantage in almost every category
```

---

## Next Steps

1. Build `src/analyzer/` with Phase 1 + Phase 2
2. Run `pnpm analyze` to generate first report
3. Continue running batches to fill data gaps
4. Add scheduled re-probing for time-series analysis
5. Use output to start deploying our own campaigns in blue-ocean topics
