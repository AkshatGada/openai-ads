# 2026 Ad-Intelligence Dashboard — What Content & Data Points to Surface

Research conducted via the Exa search API across 8 queries (competitive ad intelligence data points, creative analysis dashboard metrics, advertiser competitive landscape, share of voice, frequency/reach/impressions, ad copy analysis, keyword/prompt advertising analytics, ad fatigue/creative performance). This document extracts **what to show, in what order, and what interpretation layer to put on top**, then maps it onto a ChatGPT-Ads-specific dashboard.

Companion to `DESIGN_RESEARCH_2026.md` (visual system) and `CONTEXT.md` (product brief). Where the design doc answers *how it looks*, this one answers *what it contains and why*.

---

## 0. Executive Thesis

The research converges on one rule across every source (AdMapix, Superscale, Adthena, AdSpyder, espressio, Browsi/AdExchanger, AdFuse, hawky, convince.pro, Automads, Triple Whale, Mentova, Allmond, SOV Tracker):

> **Raw metrics are worthless without context, comparison, and a recommended action.** The dashboards users pay for do not show "CTR = 2.1%." They show "CTR = 2.1%, down 38% vs. your first-72h baseline, vs. 6.11% category avg, with frequency 4.2 — refresh by day 10 or expect -30% ROAS." Every surface must carry a *baseline*, a *benchmark*, and a *next action*.

Three structural demands repeat across the literature:

1. **Ad longevity is the master performance proxy** (AdMapix, benly, adlibrary.com, oscom.ai). When you can't see spend or conversions for competitors (always true for ChatGPT Ads), *how long an ad survives* is the closest thing to a profitability signal. Ads running 30+ days are "almost always profitable"; ads killed in <7 days failed testing.
2. **The intelligence is in the delta, not the snapshot** (themarketingjuice, AdMapix, espressio). A single pull of competitor ads is "almost worthless." Value comes from tracking *change over time*: new ads launched, ads killed, copy edited, landing pages swapped, spend direction.
3. **Fatigue is the #1 controllable CPA driver and it fires 3-7 days before ROAS moves** (hawky, theremarkableagency, AdFuse, convince.pro, Mintec). The dashboard's job is to surface *leading* indicators (CTR decay, CPM creep, frequency growth, hook-rate drop) before the *lagging* one (ROAS/CPA) turns red.

For a **ChatGPT Ads** dashboard specifically, substitute the platform primitives:
- "Keyword" -> **context hint / prompt cluster** (the OpenAI Ads semantic-targeting unit).
- "Auction Insights overlap" -> **which advertisers appear on the same prompts/contexts as you**.
- "Share of Voice" -> **share of ChatGPT-ad impressions (and share of AI-answer mentions)** across a prompt/category set.
- "Ad Library" -> the crawl/sync layer already in the repo (chatgpt-scraper, scraper-outputs-*).

---

## 1. The 8-Level Dashboard Content Map

| Level | Surface | Primary question it answers | Master metric |
|---|---|---|---|
| L0 | Overview / Command Center | "How is the whole ChatGPT-ad market doing, and where do I act?" | Active advertisers / ad rate |
| L1 | Advertiser Ranking (Landscape) | "Who's in the market, how hard, and how do I rank them?" | Share of Voice |
| L2 | Advertiser Detail | "What is this one advertiser actually doing?" | Active ad count + longevity |
| L3 | Creative / Ad-level Analysis | "Which ads win, and why?" | Fatigue score + creative score |
| L4 | Copy Analysis | "What hooks/angles/CTAs convert in this market?" | Hook effectiveness |
| L5 | Context Hint / Prompt Analytics | "Which prompts/contexts is the market buying?" | Prompt overlap rate |
| L6 | Fatigue & Freshness Monitor | "What's dying and what needs replacing?" | Fatigue score 0-100 |
| L7 | Gaps & Opportunities | "Who's NOT here and where's the white space?" | Coverage gap % |

The rest of this document specifies each level.

---

## 2. L0 — Overview / Command Center Summary Stats

### 2.1 What summary stats belong here
Drawn from every competitive-intel overview surface (Adthena market reports, MediaRadar 360, SOV Tracker command center, AdFire cross-platform KPI strip):

**Market-wide counters (the "market is alive" pulse):**
- **Total active advertisers** in the tracked prompt/category set (unique)
- **Total active ads** (active creative units, not paused/archived)
- **New advertisers last 7d / 30d** (entrants — first ad seen)
- **Departed advertisers last 7d / 30d** (went dark — no active ad for N days)
- **Ad rate / velocity** = new ads launched per day (rolling 7d) + its trend arrow
- **Median ad lifespan** in market (days) — the freshness pulse
- **Unique landing pages** in market + new/changed count

**Your-position counters:**
- **Your Share of Voice** (0-100) + week delta
- **Your rank** out of N active advertisers
- **Competitor gap** (points between you and #1)
- **Your active ad count vs. market median**
- **Your median ad age vs. market median** (are you staler than the market?)

**Health/anomaly strip (always-on):**
- Tracking-health % (UTM coverage, reachable landing pages)
- Ads in fatigue red-zone (fatigue score >= 70)
- Ads launched today / killed today
- Spend anomalies (your own) — only if you have first-party spend

### 2.2 Overview sections (the "what should I do today" rail)
- **Performance trend** (impressions / SOV / ad-rate, 30-90d)
- **Top movers** — biggest weekly SOV gainers and losers (Adthena's "10 biggest industry movers" pattern)
- **New entrants** — advertisers who launched their first ChatGPT ad this week (early-warning for new competition)
- **Recommended actions** — 2-4 ranked items (AdFire's "morning dashboard shows the 2-4 highest-impact actions" model)
- **Tracking issues** — broken landing pages, missing UTMs, stripped redirects

### 2.3 What it should *not* show on L0
- Individual ad thumbnails (too granular — belongs at L3)
- Raw spend for competitors (you don't have it; estimated spend is unreliable outside EU political ads — espressio, themarketingjuice)
- A wall of charts with no labels (the explicit anti-pattern in DESIGN_RESEARCH_2026.md section 1.2)

---

## 3. L1 — Advertiser Ranking (Competitive Landscape)

### 3.1 How to rank/prioritize advertisers
The literature is unanimous on the ranking axes and their priority order. Synthesizing Adthena (Share of Clicks / Share of Spend / Share of Impressions), Google Auction Insights (Impression Share, Overlap Rate, Position Above Rate, Outranking Share), and themarketingjuice (frequency + recency of changes = budget confidence):

**Rank by Share of Voice first, then break ties / add color with:**

| Rank signal | What it is | Why it matters | Reliability |
|---|---|---|---|
| **Share of Voice (primary)** | % of total tracked impressions (or ad-presence) an advertiser commands | The single best market-position number | High (computable from your crawl) |
| **Ad volume** | Active ad count | Proxy for testing intensity & budget | High |
| **Ad longevity** | Median days active | Proxy for profitability (survivors are winners) | High |
| **Freshness / recency** | Days since last new ad launch | Recency of strategic commitment | High |
| **Category coverage** | # of distinct prompt-clusters the advertiser appears on | Breadth of intent capture | High |
| **Estimated spend (secondary, flagged)** | Direction only — up/steady/down | Budget confidence signal | Low — show as band, never precise $ |

**Recommended composite ranker:**

    AdvertiserScore = 0.45*SOV + 0.20*log(ad_volume) + 0.20*longevity_score
                    + 0.10*freshness_score + 0.05*coverage_score

All components normalized 0-100. Sort the landscape table by this; let the user re-sort by any column.

### 3.2 Landscape table columns
Mirror Adthena's "Top 10 by Share of Clicks / Spend / Impressions + biggest movers" structure, plus fatigue-aware additions:

| Column | Source |
|---|---|
| Advertiser (domain/brand) | crawl |
| Status (Active / Paused-all / Went-dark N days ago) | derived |
| Active ads | crawl |
| New ads (7d) | delta |
| Median ad age (days) | derived |
| Share of Voice % | computed |
| SOV delta (7d) | delta |
| Prompt clusters covered | derived |
| Overlap-with-you % | derived (your prompts intersect theirs) |
| First seen / Last seen | crawl |
| Estimated spend direction (up/steady/down) | derived from ad-volume + longevity trend, flagged as estimate |
| Threat level (Low/Med/High) | derived |
| Actions (drill in, track, set alert) | UI |

### 3.3 Insights to attach at the row level (the "why" layer)
- "Surging" badge: SOV delta > +X pts in 7d
- "Went dark" badge: was active, now 0 active ads for >= 7d (opportunity — they left the market)
- "New entrant" badge: first seen <= 14d ago
- "Heavy tester" badge: ad volume > 2x market median AND median lifespan < market median (testing hard, killing fast)
- "Dominant but stale" badge: high SOV + median ad age > 1.5x market median (vulnerable — ripe to be displaced)
- "Overlapping threat" badge: overlap-with-you % > 60%

### 3.4 The landscape insight users expect (beyond the table)
From AdExchanger/Browsi and themarketingjuice: users don't want "who spends the most." They want **how spend is being deployed** and **what the market is avoiding**. Surface:
- "Progressive is buying attention more efficiently than larger spenders" -> translate to: *Advertiser X has a lower effective CPM-band than peers at higher SOV — they win the auction, not just the budget.*
- "The absence of a message is as revealing as the message itself" -> a *messages-avoided* panel (see L7).

---

## 4. L2 — Advertiser Detail

### 4.1 Header cards
- Active ads, median lifespan, SOV rank, prompt clusters covered, first-seen, last-new-ad
- Ad-rate sparkline (new ads per week, 12 weeks) — the "are they scaling or coasting?" tell
- SOV trend sparkline (12 weeks)

### 4.2 Sections
1. **Active ad inventory** — every live ad, sorted by lifespan desc (longevity = winner proxy). Show: thumbnail/preview, title, body preview, target URL, creative angle tag, days running, fatigue score, first-seen.
2. **Creative rotation timeline** — Gantt-style bars: each ad's run window. Instantly shows testing cadence, kill patterns, concurrent variants. (The single most-quoted "intelligence" view in the research — benly, adlibrary.com, espressio.)
3. **Prompt/cluster coverage map** — which contexts they appear on, with SOV per cluster. Reveals where they concentrate vs. spread.
4. **Landing-page set** — every distinct target URL, with UTM status, redirect count, HTTPS, status code, and which ads point to it. (AdMapix funnel dimension + CONTEXT.md section 5.6.)
5. **Copy angle distribution** — donut of their creative angles (outcome / pain / curiosity / social-proof / urgency / offer / ICP / comparison / educational / utility). Shows their hypothesis portfolio.
6. **Change history** — copy edits, landing-page swaps, pauses, launches (the delta log — themarketingjuice: "the value is in tracking change over time").
7. **Inferred strategy** — AI-generated one-paragraph read: positioning (price/speed/authority/social-proof/fear), primary offer, dominant angle, funnel maturity. (BrandBrahma "Ad Strategy Breakdown" module.)
8. **Threat assessment vs. you** — overlap %, where they beat you, where you beat them.

### 4.3 Per-ad rows inside the detail view
Same schema as L3 below, because L2 is the gateway to L3.

---

## 5. L3 — Creative / Ad-level Analysis (the Creative Lab)

### 5.1 What metrics are most valuable
Combine Triple Whale's Creative Analysis Dashboard, Automads' creative-first reporting, Madgicx Creative Insights, Tracify, and AdFire's 30+ dimension scoring. Split into **performance** and **creative-quality** groups.

**Performance metrics (per ad):**
- Impressions, clicks, CTR, CPC, CPM, spend (first-party only)
- Conversions, conversion rate, CPA, ROAS (first-party only)
- Hook rate / thumb-stop rate (first 3s) — *the leading fatigue indicator*
- Hold rate / avg watch time (if video)
- Frequency (per-ad, 7d / 30d)
- Days running + days-since-launch buckets
- CTR delta vs. first-72h baseline
- CPM delta vs. first-72h baseline
- **Fatigue score 0-100** (see section 8)

**Creative-quality dimensions (AdFire's GPT-4o vision model, directly portable to our GPT-4o stack):**
- Face detection: count, emotion, prominence
- Dominant colors & contrast ratio, color harmony
- CTA visibility: detected, size, contrast, position
- Text density & readability: coverage %, reading time, mobile font score
- Mobile optimization: aspect ratio, safe-zone compliance
- Emotional tone
- Message-match to landing page (promise vs. page headline)
- Clickbait risk

**Strategic/structural tags (the "concept not campaign" view from Automads):**
- Creative angle (outcome / pain / curiosity / social-proof / urgency / offer / ICP / comparison / educational / utility)
- Hook type (question / statistic / story / curiosity-gap / pain-callout / bold-claim)
- Format (static / UGC / demo / testimonial / listicle)
- Concept/hook cluster (AI-grouped, not manual)

### 5.2 Creative analysis dimensions that matter (the requested four)
1. **Copy angle** -> tag + score (see L4)
2. **CTA** -> detect, score visibility/contrast/position, classify type (Sign up / Try free / Book demo / Read more / Get the guide / Start now)
3. **Landing page** -> URL, message-match score, status, redirect chain, UTM completeness, form/CTA presence (CONTEXT.md section 5.6 + AdMapix funnel dimension)
4. **Format/asset** -> type, aspect ratio, asset fatigue, which other ads reuse it (CONTEXT.md section 5.5)

### 5.3 The creative table (L3 default view)
Sort by fatigue score asc (act on dying first) *or* by ROAS desc (scale winners). Columns:
Ad - Angle - Hook type - Format - Status - Days running - Frequency(7d) - CTR - CTR delta vs baseline - CPM delta - Hook rate - ROAS/CPA - Fatigue score - Creative score - Landing-page match - Actions (preview / generate variants / pause / apply UTMs).

### 5.4 Insights beyond raw data (the L3 intelligence layer)
- **Winner diagnosis**: "Strong performer. Generate 5 variants with same outcome-driven angle." (CONTEXT.md section 5.4.)
- **Clickbait trap**: "High CTR (3.4%) + low conversion rate (1.1%) -> landing page doesn't support the promise; traffic quality suspect." (CONTEXT.md section 5.4.)
- **Element-level fatigue fix**: not "refresh the ad" but "the hook is dead, body still works -> swap opening line only" (AdFuse refresh-batch template).
- **Concept clustering**: "Your 3 UGC-demo ads average 2.1% CTR vs. 0.9% for statics -> scale UGC-demo concept" (Automads).
- **Asset reuse warning**: same asset in 8 ads, asset fatigue rising -> diversify.

---

## 6. L4 — Copy Analysis

### 6.1 The decomposition (from AdsMAA AI Copy Analysis + adlibrary.com hook-decoding + BrandBrahma)
Every ad copy breaks into:
- **Hook** (type, text, effectiveness rating, improvement ideas)
- **Body / value prop** (structure, claims, specificity)
- **Proof** (social proof, stats, authority, none)
- **CTA** (type, strength, position)
- **Tone** (urgent / aspirational / educational / playful / authoritative / fearful)
- **Persuasion technique** (scarcity, reciprocity, authority, social proof, loss-aversion, anchoring)
- **Audience signal** (who the copy implies it's for — maps to context-hint quality)

### 6.2 Copy-level scoring dimensions (AdFire + AdsMAA + CONTEXT.md section 12)
Clarity - Specificity - Audience relevance - CTA strength - Outcome strength - Landing-page match - Clickbait risk - Conversion intent. Output a 0-100 composite + per-dimension bars + a one-line diagnosis.

### 6.3 What insights users expect at the copy layer
- **Repeating-phrase detection across the market**: "7 of 9 active advertisers use 'AI' + 'free' in the hook -> oversaturated angle, differentiate." (AdMapix raw-signal table.)
- **Hook-type leaderboard**: which hook types correlate with longevity in *this* market.
- **Copy diff over time**: "Advertiser X edited their hook from curiosity -> outcome-driven on Jun 12 — strategy shift."
- **Message-match gap**: promise in copy vs. headline on landing page (score 0-100 + missing-keyword list).

### 6.4 The gap-reading skill (themarketingjuice — "Reading the Gaps")
> "What a competitor avoids saying tells you where they are vulnerable."

Surface a **Messages Avoided** panel: topics/claims present in the market *except* for advertiser X. E.g., "No active advertiser mentions 'enterprise SSO' -> open positioning lane."

---

## 7. L5 — Context Hint / Prompt Analytics (ChatGPT-specific)

This is the ChatGPT-Ads equivalent of the Google Ads **keyword / auction-insights** layer (Q3, Q7 research) merged with CONTEXT.md section 5.3 (Context Hint Lab). It is the flagship differentiator.

### 7.1 Metrics per context-hint / prompt-cluster
From Google Auction Insights (Impression Share, Overlap Rate, Position Above Rate, Outranking Share, Top-of-Page Rate) + Google Merchant `competitive_visibility_competitor_view` (rank, ads_organic_ratio, page_overlap_rate, higher_position_rate, relative_visibility) + Hopkin keyword performance (quality score, match type, search impression share), adapted:

- **Impressions served on this prompt/context** (your share + market total)
- **Your impression share %** on the prompt
- **# advertisers present** on the prompt (competition density)
- **Overlap rate** with each competitor (how often you both show)
- **Position-above rate** (how often a competitor shows above you — if ChatGPT ranking is observable)
- **Prompt search volume / frequency** (how often users hit this prompt class)
- **Prompt intent class** (commercial / informational / navigational / comparison)
- **Conversion intent score** (heuristic)
- **Context-hint quality score** (CONTEXT.md section 11: specificity, intent clarity, commercial relevance, audience clarity, landing-page alignment, creative alignment, overlap risk, vagueness risk)

### 7.2 The prompt-cluster table (L5 default)
Columns: Prompt/context cluster - Intent class - Advertisers present - Your SOV - Your overlap w/ top competitor - Avg position - Prompt volume band - Conversion intent - Hint-quality score - Status (owned / contested / gap) - Actions (add hints, generate hints, score, split ad group).

### 7.3 Insights users expect
- **Keyword/prompt gap analysis** (BrandBrahma, Adthena): high-intent prompts *not* covered by you but covered by competitors -> ranked by ROI potential.
- **Overlap alarm**: two of your own ad groups compete on the same prompt -> split/merge (CONTEXT.md section 5.3).
- **Vague-hint detector**: one-word / generic hints flagged (CONTEXT.md section 11).
- **Suggested new hints** generated from landing-page copy + winning ad copy (CONTEXT.md section 5.3).
- **Negative-context suggestions**: prompts where you show but convert poorly -> exclude.

### 7.4 AI-search SOV extension
The research surfaced a whole adjacent category — **AI Share of Voice** (SOV Tracker, Mentova, Allmond, Pi Datametrics): measuring brand mentions inside ChatGPT/Claude/Gemini/Perplexity *answers*, not just ads. For a ChatGPT-Ads dashboard this is a natural adjacency: show **paid SOV (ad impressions)** vs. **organic AI-answer SOV (mentions)** side by side. A brand can dominate paid and be invisible in organic answers, or vice versa — that gap is a flagship insight.

---

## 8. L6 — Fatigue & Freshness Monitor

### 8.1 The leading-indicator model (consensus across Q8)
ROAS/CPA is **lagging** and moves 3-7 days *after* the real signal. Watch these **leading** indicators, daily, in this order of usefulness (adverdly, hawky, theremarkableagency):

1. **CTR decay** vs. first-72h baseline
2. **CPM creep** vs. first-72h baseline
3. **Frequency growth** (7d, 30d)
4. **Hook-rate drop** (first-3s attention)

### 8.2 The fatigue score (0-100) — adopt the AdFuse formula verbatim

    FatigueScore = Days_running(0..25) + Frequency_7d(0..30)
                 + CTR_delta_vs_72h(0..25) + CPM_rise_vs_72h(0..20)

      >= 70  -> retire
      40-69  -> refresh (swap hook / format / angle, keep concept)
      < 40   -> hold

Component scales (AdFuse):
- Days running: linear 0 (day 1) -> 25 (day 21)
- Frequency 7d: 0 below 1.5, 30 above 4.0, scaled between
- CTR delta: 0 if flat, 25 if down >= 50% vs first 72h
- CPM rise: 0 if flat, 20 if up >= 40% vs first 72h

### 8.3 The three failure modes (adverdly — critical distinction)
Top-level metrics look identical for all three; the fix differs. The dashboard must label *which* fatigue it is:
- **Creative wear-out** -> frequency high, CTR dropping, ad still relevant but stale. Fix: refresh creative (hook/format/angle), keep concept.
- **Audience saturation** -> frequency moderate, reached the convertible tail. Fix: expand audience / new context hints, *not* new creative.
- **Offer fatigue** -> creative fine, audience fresh, but the trade no longer wins (competitor shipped better offer). Fix: change the offer, not the ad.

### 8.4 Refresh cadence guidance (AdFuse + Mintec)
- Spend >= £5k/day -> refresh every 5-10 days, 6-10 variations
- £1k-£5k/day -> every 7-14 days, 4-6 variations
- < £1k/day -> every 14-21 days, 3-4 variations
- Trigger is **unique reach ~60% of target audience**, not calendar days.
- Meta Andromeda compressed the window from 6-8 weeks (2023) to 2-3 weeks (2026); ChatGPT Ads novelty dynamics likely similar -> plan for short lifespans.
- Peak performance within ~72h of launch, then -15 to -25% effectiveness over next 7-14d (TheOptimizer via theremarkableagency).

### 8.5 The monitor view
- Heatmap: ads x days, colored by fatigue score. Red zone pops.
- "Dying this week" list: ads with fatigue slope > threshold, sorted by spend-at-risk.
- "Needs variant ready" list: ads in 40-69 band with a countdown to projected red-zone.
- Refresh-batch generator: for each refreshing ad, produce 6 variations (3 hook, 2 format, 1 net-new angle) — AdFuse template.

---

## 9. L7 — Gaps & Opportunities (who's NOT advertising)

### 9.1 The four gap types to surface
1. **Advertiser gaps** — known competitors / category players with **zero active ChatGPT ads**. (oscom.ai / themarketingjuice: the absence is the signal.) Rank by: how likely they *should* be here (presence on Meta/Google per cross-platform audit), market size, and how long they've been absent.
2. **Prompt/context gaps** — high-intent prompts with few or no advertisers. Rank by intent score x prompt volume.
3. **Message/angle gaps** — angles/claims no active advertiser uses (the "Messages Avoided" panel from section 6.4). Open positioning lanes.
4. **Landing-page feature gaps** — e.g., nobody offers a self-serve trial CTA; everybody gates a demo. Funnel-shape gap.

### 9.2 Opportunity cards (each gap -> a recommended action)
Per CONTEXT.md section 7.7 + BrandBrahma counter-plays:
- Priority - Entity - Problem - Evidence - Suggested action - Confidence - [Apply] [Dismiss]
- Example: "Prompt cluster 'developer api comparison' has 2 advertisers, intent=high, volume=high, your SOV=0 -> enter now; suggested context hints: [...]."

### 9.3 The "went dark" feed
Advertisers who were active in the last 90d and now have 0 active ads. Two reads: (a) they failed -> the market is harder than it looks; (b) they left a vacuum -> your moment to scale SOV cheaply.

---

## 10. The Insights Layer — What Users Expect Beyond Raw Data

Synthesizing every source, the insights users actually pay for (ranked by how often they're cited):

| Insight type | What it says | Source pattern |
|---|---|---|
| **Baseline + delta** | "down 38% vs your first-72h" — every metric shown against its own launch baseline | hawky, theremarkableagency, AdFuse |
| **Benchmark vs market/industry** | "6.11% Google Search avg CTR; 13.48 median Meta CPM" — every metric against category norm | 1ClickReport 2026 benchmarks |
| **Longevity-as-profitability** | "running 41 days -> likely profitable; killed in 4d -> failed test" | benly, adlibrary.com, oscom.ai |
| **Efficiency not budget** | "wins the auction, not the budget — lower effective CPM at higher SOV" | AdExchanger/Browsi |
| **Pattern/repetition** | "7/9 advertisers use the same hook -> oversaturated, differentiate" | AdMapix, adlibrary.com |
| **Absence/gap** | "nobody mentions enterprise SSO -> open lane" | themarketingjuice |
| **Fatigue forecast** | "projected red-zone in 4 days at current slope" | AdFuse, hawky |
| **Failure-mode diagnosis** | "this is audience saturation, not creative wear-out -> expand audience, don't refresh" | adverdly |
| **Message-match gap** | "ad promises X, landing page says Y -> -score" | AdMapix funnel, CONTEXT.md |
| **Next-best-action** | ranked 2-4 actions with one-tap apply | AdFire, KlindrOS |
| **Delta/change log** | "edited hook Jun 12, swapped landing page Jun 15 — strategy shift" | themarketingjuice, espressio |

### 10.1 The "every metric needs three friends" rule
From the consensus: a metric is only useful when accompanied by (a) its **baseline** (own launch value), (b) its **benchmark** (market/industry), and (c) its **trend/delta** (7d, 30d direction with arrow). A bare number is a bug.

### 10.2 Benchmarks to seed the system (1ClickReport 2026)
- Google Ads Search avg CTR: **6.11%**
- Meta Ads median CPM: **$13.48**
- Organic CTR at Position 1: **28.5%**
- Strong marketing ROI ratio: **5:1**
Use these as default category benchmarks until ChatGPT-Ads-specific norms emerge from your own crawl; then replace with live market medians computed from the tracked advertiser set.

---

## 11. Cross-Cutting: 2026 Industry Benchmarks to Build In
From 1ClickReport "Marketing KPI Benchmarks 2026" — context is what turns raw metrics into decisions ("A 3% CTR sounds decent until you learn the industry average is 6.11%"). The dashboard should auto-attach the relevant benchmark to every metric card:
- Search CTR, Display CTR, Meta CTR by industry
- CPC by industry (legal ~$87 CPA vs. others)
- CPM by industry
- ROAS targets (5:1 strong)
- Conversion-rate norms
Display as a faint second line under each KPI: "vs 6.11% cat. avg" with up/down coloring.

---

## 12. The 5-Dimension Competitor Analysis Framework (AdMapix) — adopt as the L2 skeleton
AdMapix's 2026 model is the cleanest skeleton for the Advertiser Detail page (and for any per-advertiser report export):

1. **Creative** — formats, concepts, hooks, visual style, longevity
2. **Messaging** — angles, value props, tone, offers, proof
3. **Channel** — where they run (for us: which prompt clusters / surfaces)
4. **Budget** — ad volume, run duration, freshness, spend *direction* (not $)
5. **Funnel** — landing pages, CTAs, UTM discipline, form/offer maturity

Each dimension gets a scored sub-card (0-100) and feeds the composite AdvertiserScore in section 3.1.

---

## 13. Data Collection & Normalization Schema (espressio blueprint)
espressio's 2026 monitor-competitor-spend blueprint gives a directly-usable normalized schema. Adopt it:

    advertiser | platform | creative_id | first_seen | last_seen
    est_spend_range | creative_text | cta | landing_url
    angle | hook_type | format | status | days_running
    fatigue_score | creative_score | hint_set | utm_status
    landing_status_code | redirect_count | has_https

- Sync creatives **daily**; compute the **weekly delta** with an LLM pass that clusters by angle, flags new creatives, and produces a brief.
- Treat spend numbers as **estimates**; track **direction and creative volume**, not exact dollars.
- Keep a **human reviewer** between any AI-generated alert and an automated action.

---

## 14. Mapping Back to CONTEXT.md
This research validates and sharpens the existing product brief:

| CONTEXT.md concept | Research-backed upgrade |
|---|---|
| Campaign/AdGroup/Ad hierarchy (section 3) | Add **advertiser/landscape** as a peer level above campaign — the competitive view is missing from CONTEXT.md |
| Context Hint Lab (section 5.3) | Promote to L5 flagship; add prompt-cluster SOV, overlap rate, gap analysis (auction-insights vocabulary) |
| Creative Lab (section 5.4) | Add AdFire's 30+ vision dimensions + fatigue score + concept clustering |
| Landing page diagnostics (section 5.6) | Add message-match score + "funnel-shape gap" as an L7 opportunity type |
| Recommendation engine (section 10) | Rules get baselines + benchmarks + failure-mode labels (section 10 above) |
| Overview page (section 7.1) | Add market-wide counters: total advertisers, ad rate, median lifespan, new/departed (section 2.1) |
| ChangeLog (section 5.8) | Extend to **competitor** change log — their edits/swaps are intelligence, not just yours |

**Net new surface to add to the 8-page IA:** a **Landscape / Competitors** page (L1) between Overview and Campaigns. This is the single biggest gap in the current CONTEXT.md IA — every source treats competitive landscape as a first-class peer to your-own-performance, not a sub-tab.

---

## 15. Build Priority (recommended)

1. **L0 Overview** + **L1 Landscape** with SOV ranking — the crawl data already exists (scraper-outputs-*). Highest perceived value, lowest model risk.
2. **L6 Fatigue Monitor** with the AdFuse 0-100 score — purely first-party + crawl-derived, deterministic, immediately actionable.
3. **L3 Creative Lab** scoring (reuse the GPT-4o vision stack already referenced in the repo).
4. **L5 Context Hint / Prompt Analytics** — the flagship differentiator; needs prompt-cluster inference.
5. **L7 Gaps & Opportunities** — emerges naturally once L1 + L5 exist.
6. **L4 Copy Analysis** + **L2 Advertiser Detail** inferred-strategy — the LLM-heavy layers last, after the deterministic foundations are trusted.

---

## 16. Sources Index (by query)

- **Q1 competitive ad intelligence data points:** AdSpyder (competitor-ad-audit), AdMapix (5-dimension framework), Superscale (digital ad intelligence), AdMapix (advertising intelligence guide), oscom.ai (ad libraries), adlibrary.com (analysis manual), espressio (monitor competitor ad spend 2026), AdExchanger/Browsi (competitive signals in auctions).
- **Q2 creative analysis dashboard metrics:** Triple Whale (Creative Analysis Dashboard), Tracify, Automads (creative analytics), AdsMAA (Creative Intelligence Hub), GoMarble template, Madgicx (Creative Insights), AdFire (GPT-4o vision, 30+ dimensions), AdFire (Ad Performance Dashboard).
- **Q3 advertiser competitive landscape metrics:** Adthena (market share), Adthena (PPC market share reports), Google Merchant API (competitive_visibility_competitor_view), Semrush (competitive landscape), AdExchanger/Browsi, ExposeProfits (Auction Insights), 1ClickReport (KPI benchmarks 2026), DigitalNomadsHQ (Auction Insights 2026).
- **Q4 share of voice:** markstent/ESOV (ESOV = SOV - SOM), MediaRadar 360, CommerceIQ (Market Insights), SOV Tracker (AI visibility), Pi Datametrics (SOV tool), AtTheRate (Amazon SOV), Mentova (AI SOV), Allmond (AI SOV).
- **Q5 frequency/reach/impressions:** Intentwise (DSP reach & impression frequency), Chartud (Meta+Google Looker template), PorterMetrics (Meta Ads template), Google CM360 (Unique Reach reports), Google Ads (measuring reach & frequency), Adwave (dashboard guide), PorterMetrics (Facebook audience report).
- **Q6 ad copy analysis:** AdsMAA (AI Copy Analysis), AdMapix (5-dimension), benly (competitor ad analysis guide), get-ryze (competitor ads analysis), AdSpyder (competitor ad audit), themarketingjuice (reading the gaps), adlibrary.com (ads spy guide 2026), BrandBrahma (AI competitor ad spy).
- **Q7 keyword/prompt advertising analytics:** OpenMoves (ChatGPT o3 Google Ads analysis), InsightfulPipe (Keyword Performance Analyzer), Google Ads MCP (VS Code marketplace), ncosentino/google-keyword-planner-mcp, Karooya (Google Ads AI prompts), Hopkin (google_ads_get_keyword_performance), Factors.ai (AI prompts for Google Ads), Google Ads API (keyword_view).
- **Q8 ad fatigue:** convince.pro (ad fatigue metrics), hawky (identify & fix creative fatigue), pixelplot (creative fatigue guide), theremarkableagency (detect ad creative fatigue early), adverdly (diagnose ad fatigue), Admiral Media (creative fatigue curve), AdFuse (DTC creative fatigue playbook — the 0-100 score), Mintec (Meta Andromeda fatigue).

---

*End of document. 16 sections. Generated from 64 Exa results across 8 queries on 2026-06-19.*
