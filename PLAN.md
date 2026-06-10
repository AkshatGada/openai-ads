# OMS Analysis Pipeline V2 — Architecture Plan

## Goal

Turn 100 ChatGPT probe HTMLs into actionable ad intelligence for Polygon OMS — with exactly one LLM call. Every other layer is deterministic code.

---

## Layers Overview

```
100 HTMLs (~230MB)
    │
    ▼
LAYER 0: VALIDATION (Code)
    Filters corrupted probes, validates extracted data
    │
    ▼
LAYER 1: CLEANER (Code — $0, <2s)
    HTML → raw structured JSON
    │
    ▼
LAYER 1.5: CLASSIFIER (Code — $0, <100ms)
    Labels: persona, need, intent_score, competitor mentions
    │
    ▼
LAYER 2: PATTERNS (Code — $0, <100ms)
    Aggregation: ad density, competitor freq, coverage gaps, blue ocean
    │
    ▼
LAYER 3: LLM SYNTHESIS (1 call — ~$0.001, ~5s)
    Unknown competitors, context hints, gap narrative, ad groups
    │
    ▼
LAYER 4: REPORT (Code — $0, instant)
    Terminal dashboard + JSON + Markdown export
    │
    ▼
LAYER 5: ADS API BRIDGE (Code)
    Context hints → campaign config → ready for OpenAI Ads API
```

---

## Layer 0: Validation (`validator.ts` or inline in cleaner)

**Before processing**, validate each HTML file:

| Check | Action if fails |
|---|---|
| `response_length > 50` | Mark as `status: "failed"`, exclude from LLM input |
| `prompt.length > 20` | Mark as `status: "failed"` |
| `html_size_kb < 100` | Mark as `status: "failed"` (likely error page, not ChatGPT) |
| `chatgpt_response` contains "Log in" or "Sign up" | Mark as `status: "failed"` (session expired, got auth page) |

Failed probes are still saved to JSON but flagged. Excluded from LLM input. Included in counts (X/100 failed).

---

## Layer 1: Cleaner (`src/analyzer/cleaner-v2.ts`)

**Input**: HTML files from `scraper-outputs-oms-loop1/NNN_*.html`
**Output**: `data/oms-probes-v2.json`

**Extracts per probe (pure regex, no LLM)**:

```
Field                Source
─────────────────────────────────────────────
id                   filename (001, 002...)
prompt               filename → strip NNN_ prefix, _ → space
chatgpt_response     everything after "ChatGPT said", tags stripped,
                     preserve paragraph breaks (double newline for <p>),
                     max 3000 chars
citations            <a href="...">text</a> tags inside response section,
                     extract href + innerText, deduplicate
response_length      char count of stripped response
has_search           citations.length > 0
ads                  extractAdsFromHtml(html)
has_ads              ads.length > 0
advertiser           ads[0].advertiser if present, else null
ad_copy              ads[0].title if present, else null
html_size_kb         html.length / 1024
status               "ok" | "failed"
failed_reason        string if status=failed
```

**Citation extraction regex**: `/href=["'](https?:\/\/[^"'\s]+)["'][^>]*>([^<]+)<\/a>/g` — applied to the response section (between "ChatGPT said" and the next major UI element).

**Response preservation**: Keep paragraph breaks (`<p>` → `\n\n`) and heading marks (`<h2>` → `## `) before stripping. This preserves structure for the LLM.

**Runtime**: ~2 seconds for 100 files. **Cost**: $0.

---

## Layer 1.5: Classifier (`src/analyzer/classifier-v2.ts`)

**Input**: `data/oms-probes-v2.json`
**Output**: Same file enriched with classification fields

### Persona Classification

Priority order (first match wins). If a prompt could match multiple, the first pattern that hits takes it:

```
Priority  Pattern                                      → Persona
─────────────────────────────────────────────────────────────────
1         "remittance|remit.*send|cross.border.*consumer" → remittance_founder
2         "marketplace|sellers|gig.*economy|creator.*plat" → marketplace_cto
3         "neobank|fintech.*platform|payment.*platform"    → fintech_pm
4         "bank.*treasury|enterprise.*payment|institution" → enterprise_buyer
5         none matched                                     → unknown
```

Persona 4 (enterprise_buyer) is from the "in the bank" set — included for future loops but not a primary focus for Loop 1.

### Primary Need Classification

First match wins (ordered by specificity):

```
Priority  Pattern                                              → Primary Need
─────────────────────────────────────────────────────────────────────────────
1         "remit|send.*home|cross.border.*family"                → remittance
2         "pay.*sellers|disburse|payout.*global|pay.*contract"   → disbursement
3         "virtual.*account|dollar.*account|named.*account"      → virtual_accounts
4         "onramp|off.ramp|cash.*in|cash.*out|fund.*wallet"     → onramp
5         "vs\\b|compare|alternativ|Circle|Coinbase|which.*better" → comparison
6         "API.*integrat|REST.*endpoint|webhook|sandbox"         → developer_eval
7         none matched                                           → unknown
```

### Intent Scoring (heuristic, 0-10)

```
Signal                                            Points  Rationale
──────────────────────────────────────────────────────────────────────
Prompt > 150 words                                +2      Research depth
Mentions specific rails (ACH|SEPA|PIX|UPI|SPEI)   +2      Technical buyer
Mentions compliance (KYC|AML|regulat|complian)    +2      Has legal/risk team
Contains "API" + "integrate" or "API" + "build"   +3      Developer evaluating tools
Contains "vs"|"compare"|"alternative"|"better"    +3      Active comparison = near decision
Contains dollar amounts or percentages            +2      Budget sensitivity = has budget
Mentions competitor by name (Circle|Coinbase|...) +2      Already in-market
Mentions scale ("thousands"|"millions"|"5000")    +2      Significant volume = serious buyer
Mentions timeline ("Q3"|"this year"|"soon"|"now")  +3      Urgency
Contains OMS API language (fiatToCrypto|cryptoTo   +2      Exact match with OMS terminology
  Fiat|virtual account|deposit code|idempoten|quote lock)
Ends with question mark                            +1      Seeking vendor recommendation
──────────────────────────────────────────────────────────────────────
MAX TOTAL                                          10    (capped)
```

**Intent tiers**: 
- 8-10: Active buyer — bid $5-7 CPC
- 5-7: Evaluating — bid $3-5 CPC
- 1-4: Casual research — bid $2-3 CPC or skip

### Known Competitor Matching

Regex against both prompt text AND chatgpt_response (organic mentions = what ChatGPT recommends):

```
Known list (seed — grows from LLM Layer 3):
Circle, Coinbase, Fireblocks, Paxos, Stripe, Cybrid, Conduit,
BlindPay, Ripple, Stellar, ZeroHash, BitPay, Wyre, MoonPay,
Transak, Ramp, Chainalysis, Elliptic, CipherTrace

Fields added:
  known_competitors_in_prompt: string[]     // user mentioned these
  known_competitors_in_response: string[]   // ChatGPT mentioned these
```

### OMS Language Detection

Check if prompt contains OMS-specific terminology from docs:

```
OMS language signals:
fiatToCrypto, cryptoToFiat, virtual account, deposit code, 
idempotency key, quote lock, endorsement, webhook event,
custodial wallet, sub-2-second, native USDC, sandbox environment

→ Field: contains_oms_language: boolean
→ Field: oms_signals_found: string[]
```

### Prompt Structure Classification

```
Pattern                            → Structure
───────────────────────────────────────────
"I need...", "Looking for...",     → need_statement
  "We need..."
"What is...", "Which...",          → question
  "How do..."
"Compare...", "X vs Y...",         → comparison
  "Alternative to..."
"Does anyone...", "Has anyone..."  → validation
Other                              → mixed
```

**Runtime**: <100ms. **Cost**: $0.

---

## Layer 2: Pattern Detection (`src/analyzer/insights-v2.ts`)

**Input**: Enriched `data/oms-probes-v2.json`
**Output**: `data/oms-patterns-v2.json`

### 1. Ad Density by Persona + Need

```
persona × need → probes → ads → ad_rate → competition_level
competition_level: "none" (0%), "low" (<2%), "medium" (2-5%), "high" (>5%)
```

### 2. Ad Density by Prompt Structure

```
structure → probes → ads → ad_rate
→ Which question format triggers the most ads?
```

### 3. Competitor Frequency (Organic + Paid)

```
company → organic_mentions (in ChatGPT responses) 
       → paid_impressions (in ad cards)
       → total_share_of_voice
```

### 4. Intent Score Distribution

```
persona → min/avg/max intent → best_performing_persona
need → min/avg/max intent → highest_intent_needs
structure → min/avg/max intent → best_prompt_structures
```

### 5. Dynamic Coverage Gap Matrix

For each OMS capability (keyword list), scan ALL responses for mentions. Cross-reference against competitor mentions to determine if capability is covered (a competitor is mentioned alongside it), partially covered (competitor mentioned but gap language present), or uncovered (no competitor covers this capability language).

```
OMS Capability (keywords)          Coverage   Competitors    Gap Value
─────────────────────────────────────────────────────────────────────
Virtual bank accounts              Covered    Cybrid,Conduit Low
  (virtual account, named account)
ACH→USDC auto-conversion           Covered    Cybrid,Conduit Low
  (auto.convert, ACH.*USDC)
Full fiat↔crypto in one API        Partial    Cybrid         Medium
  (single.*API.*fiat.*crypto)
Disbursement to 40+ countries      UNCOVERED   —              HIGH ←
  (disburse.*country, pay.*global)
Cash-in at retail                  UNCOVERED   —              HIGH ←
  (cash.*deposit, retail.*location)
Sub-2-second finality              UNCOVERED   —              HIGH ←
  (second.*finality, instant.*settle)
KYC endorsements                   Covered    Cybrid         Low
  (endorsement, KYC.*gate)
Webhooks + idempotency keys        UNCOVERED   —              MEDIUM ←
  (webhook, idempotency)
```

### 6. Blue Ocean Candidates

```
probes with intent ≥ 7 AND has_ads = false
→ ranked by (intent_score × persona_commercial_value)
→ top N candidates become ad group targets
```

### 7. Response Quality Metrics

```
persona → avg_response_length, avg_citations, pct_has_search
structure → avg_response_length
→ Does ChatGPT give better answers to certain persona/structure combos?
  If marketplace CTO prompts get 40% longer responses, those prompts
  are higher-value ad targets (ChatGPT takes them more seriously).
```

### 8. OMS Signal Penetration

```
% of probes containing OMS language signals
→ Are buyers using language that matches OMS's API?
→ If <20%, ad copy needs to educate before selling.
→ If >50%, ad copy can go straight to technical features.
```

**Runtime**: <100ms. **Cost**: $0.

---

## Layer 3: LLM Synthesis (`src/analyzer/synthesize.ts`)

**Input**: `data/oms-patterns-v2.json` + summarized probe records from `data/oms-probes-v2.json`
**Output**: `data/oms-synthesis-v2.json`

**Single LLM call** using existing Minimax client (`src/agent/llm.ts` → `chatJson<T>`).

**Temperature**: 0.3 (analytical extraction, not creative).

**Graceful degradation**: If `MINIMAX_API_KEY` is not set, skip this layer. Report is generated from Layers 1-2 data only, with a note: "LLM synthesis skipped — set MINIMAX_API_KEY for deeper insights."

### Prompt Template

```
SYSTEM:
You are analyzing ChatGPT conversation probes about stablecoin payment 
infrastructure. Your output feeds an OpenAI Ads campaign for Polygon's 
Open Money Stack (OMS).

OMS capabilities:
- Vertically integrated stablecoin payments API: fiat ramps, custodial 
  wallets, KYC, stablecoin settlement, bank off-ramps — all in one.
- Virtual bank accounts per customer (ACH auto-converts to USDC)
- Cross-border disbursements in local currency across 40+ countries
- Sub-2-second finality on Polygon Chain, $0.002 avg tx cost
- Cash-in at 50K+ retail locations, cash-out via ATM codes
- Webhooks, idempotency keys, RBAC, SSO, sandbox/live environments
- $54B stablecoin volume processed, 159M wallets, 6 years in production
- Used by Revolut, Stripe, Flutterwave

USER:
I analyzed 100 probes that mimicked real OMS buyer conversations across 
3 personas: fintech PMs, marketplace CTOs, and remittance founders.

PATTERN SUMMARY:
[ad density by persona, competitor freq table, coverage gap matrix,
 blue ocean candidates, persona performance stats, prompt structure data]

PROBE RECORDS (100 probes, summarized):
For each: id, persona, need, intent_score, ads_found, advertiser,
  prompt (first 120 chars), response_summary (first 80 chars),
  known_competitors_mentioned

TASKS — return JSON:

1. NEW COMPETITORS: Read every response summary. If you find a company 
   or API product NOT in this known list mentioned 3+ times, add to 
   new_competitors[].
   Known list: [Circle, Coinbase, Fireblocks, Paxos, Stripe, Cybrid,
   Conduit, BlindPay, Ripple, Stellar, ZeroHash, BitPay, Wyre, MoonPay,
   Transak, Ramp, Chainalysis, Elliptic, CipherTrace]

2. CONTEXT HINTS: Generate exactly 10 context hints using the buyer's 
   actual language from the highest-intent probes. Each hint = persona 
   description + specific need + constraint. Do not use generic phrases 
   like "stablecoin payments" — use the exact terminology buyers used.

3. GAP NARRATIVE: In 2 paragraphs, describe the capabilities OMS has 
   that ChatGPT NEVER mentions organically. This is OMS's unique 
   advertising positioning — what can OMS do that ChatGPT's recommended 
   products cannot?

4. AD GROUPS: Propose 3-4 ad groups. Each: name, target persona, 
   estimated intent range, top context hint, recommended max CPC.

5. PROMPT STRUCTURE INSIGHT: Which question format ("I need X..." vs 
   "What is the best X..." vs "Compare X vs Y") produced the highest 
   intent scores? This directly informs ad copy strategy.

Return:
{
  "new_competitors": ["..."],
  "context_hints": ["hint1", ..., "hint10"],
  "gap_narrative": "...",
  "ad_groups": [
    {"name": "...", "persona": "...", "intent_range": "7-10", 
     "top_hint": "...", "cpc": 5}
  ],
  "best_prompt_structure": "...",
  "structure_insight": "..."
}
```

**Token budget**: Prompt (~1K) + pattern summary (~2K) + 100 probes × 200 chars avg (~20K) = ~23K input tokens. Response ~1-2K tokens. Well within Minimax limits.

**Runtime**: ~5-10 seconds. **Cost**: ~$0.001-0.002 (1 Minimax call).

---

## Layer 4: Report (`src/analyzer/report-v2.ts`)

**Input**: All JSON outputs from Layers 1-3
**Output**: Terminal dashboard + `data/oms-report-v2.json` + optional Markdown export

### Terminal Dashboard Format

```
══════════════════════════════════════════════════════════════════
  OMS AD INTELLIGENCE — Loop 1
  100 probes · 3 personas · {advertiser_count} advertisers · 
  {ad_rate}% ad fill rate
  {failed_count} probes failed validation (excluded from LLM input)
  LLM synthesis: {completed|skipped}
══════════════════════════════════════════════════════════════════

AUCTION LANDSCAPE
  Overall ad fill rate: X/100 (X%)
  Advertisers detected: [company names]
  Status: WIDE OPEN / LOW COMPETITION / CROWDED

AD DENSITY BY PERSONA
  persona    probes  ads  rate  competition
  ─────────────────────────────────────────
  fintech_pm   33      X    X%    ...
  mktplace_cto 33      X    X%    ...
  remit_fndr   34      X    X%    ...

AD DENSITY BY PROMPT STRUCTURE
  structure        probes  ads  rate
  ────────────────────────────────────
  need_statement     XX     X    X%
  question           XX     X    X%
  comparison         XX     X    X%

ORGANIC COMPETITION (ChatGPT's recommendations)
  company          mentions  direction
  ─────────────────────────────────────
  Cybrid             14      ↑ competitor
  Circle              9      ↑ competitor  
  Conduit            11      ↑ competitor
  [unknown from LLM]  5      NEW — not in known list

OMS COVERAGE GAPS (what ChatGPT doesn't recommend that OMS does)
  capability                      gap_value
  ─────────────────────────────────────────
  Disbursement to 40+ countries    HIGH ←
  Cash-in at retail locations      HIGH ←
  Sub-2-second finality            HIGH ←
  Webhooks + idempotency keys      MEDIUM ←

BLUE OCEAN (high intent, zero ads)
  rank  persona       need             probes  avg_intent
  ─────────────────────────────────────────────────────────
  1     mktplace_cto  disbursement      11      7.5
  2     fintech_pm    virtual_accounts   9      6.8
  3     remit_fndr    remittance         8      7.1

PERSONA PERFORMANCE
  persona        avg_intent  avg_resp_len  %_has_search  ads
  ───────────────────────────────────────────────────────────
  mktplace_cto      7.2         2400          85%         0
  fintech_pm        6.8         2100          72%         1
  remit_fndr        6.5         1900          68%         0

RECOMMENDED AD GROUPS (from LLM Layer 3)
  [ad_group_name] — persona: [...], intent: X-X, max CPC $X
    top hint: "..."

TOP 10 CONTEXT HINTS (from LLM Layer 3)
  1. "..." (from probe #XX, intent 9)
  ...10 total

GAP NARRATIVE (from LLM Layer 3)
  [2 paragraphs]

══════════════════════════════════════════════════════════════════
  Generated: {timestamp}
  Next loop: Review → adjust strategy → probe → analyze again
══════════════════════════════════════════════════════════════════
```

---

## Layer 5: Ads API Bridge (`src/analyzer/bridge.ts` — future)

The output JSON from Layer 4 maps directly to OpenAI Ads API campaign creation:

```
Layer 4 output                    → Ads API parameter
─────────────────────────────────────────────────────
ad_groups[].name                  → Ad Group name
ad_groups[].persona               → Context hints (persona-targeted)
ad_groups[].cpc                   → max_bid_usd
ad_groups[].top_hint              → First context hint in the ad group
context_hints[]                   → context_hints[] array per ad group
gap_narrative                     → Ad creative copy source material

Output file: data/oms-campaign-config.json
Ready to feed into src/ads/campaigns.ts, src/ads/adGroups.ts, src/ads/ads.ts
```

---

## CLI

```
pnpm analyze-oms
  → validator scans HTMLs, flags failures
  → cleaner-v2 reads HTMLs → data/oms-probes-v2.json
  → classifier-v2 enriches → marks as "enriched"
  → insights-v2 computes patterns → data/oms-patterns-v2.json
  → synthesize.ts calls LLM (if API key set) → data/oms-synthesis-v2.json
  → Prints report (terminal + JSON + Markdown optional)

pnpm analyze-oms --no-llm
  → Skips Layer 3. Report from Layers 1-2 only.

pnpm analyze-oms --export
  → Also writes data/oms-report-v2.md for sharing with Polygon.
```

---

## Files to Build

| File | Lines | Depends On |
|---|---|---|
| `src/analyzer/cleaner-v2.ts` | 100 | `extractAdsFromHtml` from `src/scraper/client.js` |
| `src/analyzer/classifier-v2.ts` | 80 | None (pure logic) |
| `src/analyzer/insights-v2.ts` | 120 | `data/oms-probes-v2.json` |
| `src/analyzer/synthesize.ts` | 100 | `chatJson` from `src/agent/llm.js`, `config.llm` |
| `src/analyzer/report-v2.ts` | 100 | All JSON outputs |
| `src/analyzer/index-v2.ts` (CLI) | 40 | All above |
| `src/analyzer/types-v2.ts` (shared types) | 80 | None |
| **Total** | **~620 lines** | |

## Cost

| Layer | Method | Cost |
|---|---|---|
| Validator | Pure code | $0 |
| Cleaner | Pure code | $0 |
| Classifier | Pure code | $0 |
| Insights | Pure code | $0 |
| LLM Synthesis | 1 Minimax call | ~$0.001 |
| Report | Pure code | $0 |
| **Total** | | **~$0.001** |

## The Loop

```
LOOP 1 (now)
  100 probes → analyze-oms → report card
  → Launch ad groups 1-3 from blue ocean candidates
  → Budget: $50/day test

LOOP 2 (week 2)
  50 probes — re-probe winners + adjacent language exploration
  → analyze-oms → compare with Loop 1 → detect shifts
  → Adjust bids on active ad groups
  → A/B test ad copy against winning context hints

LOOP 3+ (ongoing)
  20 probes/day — 10 canary (re-probe winners), 10 exploration (new language)
  → Weekly full analysis
  → Competitive alerts: if a competitor enters on your signal, adjust
  → Context hint rotation every 2 weeks
  → Monthly full landscape refresh (50 probes)

STOP CONDITION
  When live conversion data from actual ads becomes more informative than 
  probe data. At that point, the loop shifts from probe-driven to 
  conversion-driven. The analyzer monitors the auction; the campaign 
  optimizes from form submissions and waitlist signups.
```

---

## Data Files (all gitignored)

```
data/oms-probes-v2.json         Cleaned + classified probe records
data/oms-patterns-v2.json       Aggregated patterns (ad density, competitor freq, etc.)
data/oms-synthesis-v2.json      LLM-generated insights (context hints, gaps, ad groups)
data/oms-report-v2.json         Final report (all layers merged)
data/oms-report-v2.md           Optional Markdown export for sharing
data/oms-campaign-config.json   Future: direct feed into OpenAI Ads API
```
