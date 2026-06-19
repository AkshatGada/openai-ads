# 2026 Dashboard Design Research — Competitive Ad-Intelligence Dashboard

Research conducted via Exa search API across 8 queries (best dashboard UI 2026, data visualization, premium fintech, Bloomberg terminal redesign, competitive intelligence, Awwwards, dark mode, monochrome). This document extracts concrete, build-ready design directions for the OpenAI Ads optimization dashboard.

---

## 0. Executive Summary — The Winning Direction

The 2026 cutting edge for data-heavy, decision-driving dashboards converges on one archetype: **a dark, dense, monochrome command surface with a single semantic accent color, monospace numerics, hairline borders instead of shadows, and an operational "what should I do next" layer on top of raw metrics.**

This is the "Twilight Trading Floor" thesis (KlindrOS) applied to ad intelligence. It rejects the consumer-SaaS "Notion aesthetic" (soft pastels, big whitespace, rounded everything, friendly illustrations) in favor of a financial-workstation feel. This maps perfectly onto the OpenAI Ads dashboard goal: an *optimization operating system* for agencies who live in the tool for hours and move budget on its signals.

**Recommended synthesis (3 reference systems to blend):**
1. **KlindrOS Twilight Trading Floor** — philosophy: dark-default, density, semantic color discipline, 3-question screens, role-based views, real-time refresh.
2. **Basedash** — visual system: pure-black canvas, recessed carbon cards, white-pill action buttons, serif display + Inter body, violet/green used only on data.
3. **dotty** — component craft: cool-monochrome tokens (hue 220), 2-layer cards, pixel bar charts, sharp+round radius rule.

---

## 1. Layout & Information Architecture

### 1.1 The dominant 2026 pattern
Source: artofstyleframe.com, SaaSFrame, sanjaydey.com (all 2026)

> "The strongest dashboard pattern in 2026 combines sidebar navigation (240–280px), a card-based metric strip (4–6 KPIs), and a flexible content grid using CSS Grid with `auto-fill`. Prioritize information density over whitespace — dashboard users are power users who want data, not breathing room."

- **Navigation: collapsible left sidebar, 240–280px.** Top-nav is dead for dashboards (15–40 sections don't fit horizontally; hamburger defeats the purpose). Linear, Vercel, Stripe, Grafana all converged here.
- **Modified F-pattern scanning.** Top-left quadrant = highest-value real estate → reserve for the **North Star Metric** (for us: conversions / CPA, not CTR).
- **Card-based KPI strip: 4–6 metrics** across the top of every view.
- **Content grid: CSS Grid `auto-fill`** for flexible density.
- **Information density > whitespace.** Deliberately busier than marketing screenshots; operators cover more ground per session.

### 1.2 The 3-question screen rule (KlindrOS)
Every view must answer within 5 seconds for a familiar user, in this order:
1. **What is happening?**
2. **Why?**
3. **What should I do?**

If a screen can't answer all three, it's broken and must be redesigned. This directly matches the CONTEXT.md mandate: "Every major page should answer: What is happening? Why does it matter? What should I do next?"

### 1.3 Operational, not static
- Dashboards are **cockpits, not reports**. Every element earns its pixels by enabling a decision or action.
- **Next Best Action** widgets baked into the dashboard (not a separate page only). e.g. instead of "Sales are down 10%", show "Sales down 10% → [Pause underperformer] [Reallocate $50]".
- **Empty states as CTAs**, not blank charts: "No conversions yet — apply standardized UTMs to start attribution."
- **Progressive disclosure**: one primary task per screen, details on drill-in.
- **Max 3 clicks to any action.** Hidden features are deprecated features — remove, don't bury.
- **Role-based views as structure, not personalization**: CMO → Executive Command Center; media buyer → Campaign/Ad Group command; creative lead → Creative Lab. Same data, different surfaces. Maps to CONTEXT.md's 8 pages but with role-aware landing.

### 1.4 Recommended IA for the OpenAI Ads dashboard
- Persistent left sidebar (260px, collapsible to ~64px icon rail).
- Top: account switcher + date-range filter + global search/command palette (Cmd+K).
- Each page: KPI strip (4–6 cards) → primary content grid → recommendations rail (right drawer or inline).
- Detail pages use **entity drawers** (slide-over) rather than full navigation, to preserve context.

---

## 2. Color Systems

### 2.1 The 2026 consensus: dark-default, near-monochrome, one semantic accent
Across the top systems (Basedash, Trunk, dotty, KlindrOS, Linear, Vercel, Resend, Warp, Raycast, Axiom), the pattern is remarkably consistent:

| System | Canvas | Card surface | Accent | Philosophy |
|---|---|---|---|---|
| **Basedash** | `#000000` Void | `#050607` Carbon (recessed wells) | Violet `#9984d8` + Mint `#3fcb7f` (data only) | White-pill buttons; no shadows; serif display |
| **Trunk** | `#000000` Obsidian | `#08090b` Carbon | Single green `#22c550` signal | "One green signal light"; hairline borders do the work |
| **dotty** | `hsl(220 14% 5%)` | `hsl(220 10% 9%)` | Green `--success` only | Cool-monochrome hue 220, sat 4–14% |
| **KlindrOS** | `#020617` / `#0B1F3A` deep blue | elevated panels | Electric Blue `#3A8DFF` (interactive only) | Semantic color discipline |
| **Linear** | near-black | acid-lime accent | — | "Midnight command deck" |
| **basalt** | 3-tier luminance L0→L1→L2 | — | — | Depth via luminance, not borders |

### 2.2 The "no-shadows" rule (Basedash, Trunk)
> "Do not add box-shadows to cards — the dark surface system relies on near-identical values and no shadow language. Elevation is communicated through near-identical surface values (#000000 canvas → #050607 card) that read as recessed wells rather than raised panels. The contrast ratio between these two values is deliberately minimal (~0.5%) so cards feel carved into the void, not floating above it."

**Borders and luminance steps do the work shadows used to do.** This is a defining 2026 trait.

### 2.3 Cool-monochrome token system (dotty — copy this)
Every gray shares **hue 220** for consistent cool tonality. Avoids the "dirty gray" look of pure `hsl(0 0% …)`.

```
--background   220 14% 96% (light) / 220 14% 5%  (dark)
--foreground   220 14% 10% (light) / 220 6% 93%  (dark)
--card         220 20% 100%(light) / 220 10% 9%  (dark)   /* inner surface */
--muted        220 10% 93% (light) / 220 8% 15%  (dark)   /* outer surface */
--border       220 8% 88%  (light) / 220 6% 22%  (dark)
```

### 2.4 Semantic color discipline (KlindrOS — the key lesson)
Each color carries **one meaning across the entire system**. Users build muscle memory within hours.
- **Electric Blue `#3A8DFF`** — interactive elements, CTAs, links. *Never* used for data semantics.
- **Success Green `#22C55E`** — positive metrics, growth, healthy thresholds. *Never* interactive.
- **Warning Amber `#F59E0B`** — caution, degrading performance, attention required.
- **Error Red `#EF4444`** — critical alerts, failures, at-risk scores. *Never* interactive.

> "When the system breaks its own rules, the user has to relearn the interface every session."

**Accessibility note:** Bloomberg published CVD (color-vision-deficient) preset themes in 2025; plan for substitute colors from day one. Don't rely on red/green alone — pair with icon + label.

### 2.5 Recommended palette for the OpenAI Ads dashboard
- **Canvas:** `#0A0E14` (deep blue-black, between KlindrOS and Basedash)
- **Card surface:** `#11161F` (recessed well, ~0.5% lighter than canvas)
- **Border/hairline:** `#1F2733` (cool graphite)
- **Primary text:** `#E6EAF0`
- **Secondary text:** `#8B95A7`
- **Interactive accent:** `#3A8DFF` (blue) — links, CTAs, focus rings, selected rows
- **Positive (conversions, ROAS wins):** `#22C55E`
- **Warning (degrading CTR, CPA drifting):** `#F59E0B`
- **Critical (broken landing page, zero conversions, tracking failure):** `#EF4444`
- **Data-viz secondary (charts):** violet `#9984D8` + the above semantics; never decorative.
- **No shadows.** Luminance steps + 1px hairline borders only.

---

## 3. Typography

### 3.1 The dominant stack: sans body + mono numerics + (optional) serif display
2026's premium dashboards split typography by *function*, not just hierarchy:

| System | Body / UI | Numerics | Display |
|---|---|---|---|
| **dotty** | Inter | IBM Plex Mono (`font-mono-num`) | DM Sans |
| **Finaura** | Inter | Martian Mono | Instrument Serif (editorial headlines) |
| **Basedash** | Inter (−0.03em tracking) | Inter (weight 600 for numbers) | Alpha Lyrae serif @ exactly 48px |
| **basalt** | Inter 14px base | Inter Medium (heavier numerals read as data) | DM Sans display |
| **KlindrOS** | Inter (Semibold headers, Medium numbers, Regular body) | Inter Medium | — |
| **Elite Admin** | Plus Jakarta Sans | — | — |

### 3.2 Key principles
- **Inter is the default — for good reason.** Designed for screen rendering at 11–12px; many beautiful fonts fall apart below 14px, Inter doesn't. Variable weight axis lets you mix Semibold/Medium/Regular in tight spaces without changing family. Open license.
- **Monospace for all numeric data.** Stats, metrics, percentages, CPA, spend, counts → tabular figures. This is the single most distinctive "data terminal" move. Options: IBM Plex Mono, Martian Mono, JetBrains Mono, Geist Mono.
- **Numeric weight trick (KlindrOS):** Inter *Medium* for numeric values produces a slightly heavier numeral that "reads as data rather than running text. Users feel it without naming it."
- **Tight tracking on dark (Basedash):** `−0.03em` letter-spacing across all Inter sizes — tight tracking is part of the system voice on dark surfaces.
- **Optional editorial serif for headlines only** (Basedash Alpha Lyrae, Finaura Instrument Serif). Used at exactly one display size (~48px) for hero/section titles — gives a "literary anchor" / "editorial accent" against the monochrome interface. Use sparingly or skip for a purer terminal feel.
- **Display type that "whispers" (Trunk):** weight 300, tight tracking at display sizes; "snaps to attention at body sizes."

### 3.3 Recommended type scale (Basedash-derived, Major Second 1.125)
| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display (hero/section) | 48px | 400 serif *or* 600 sans | 1.0 | — |
| Heading | 34px | 600 | 1.2 | −1.02px |
| Heading-sm | 30px | 600 | 1.2 | −0.9px |
| Subheading | 24px | 500 | 1.25 | −0.6px |
| Body-lg | 18px | 400 | 1.56 | −0.54px |
| Body | 16px | 400 | 1.5 | −0.48px |
| Body-sm (table dense) | 14px | 400 | 1.43 | −0.42px |
| Caption/label | 12px | 500 | 1.5 | −0.36px |
| **Metric value (mono)** | 28–34px | 500 mono | 1.0 | tabular |
| **Table cell (mono)** | 13–14px | 400 mono | 1.3 | tabular |

Recommended fonts: **Inter** (UI/body) + **IBM Plex Mono** or **Geist Mono** (all numerics) + optional **Instrument Serif** (display only, for the "premium editorial" moment on Overview/Recommendations).

---

## 4. Data Display Patterns

### 4.1 Tables are back — dense, terminal-grade
The Bloomberg-inspired renaissance (Neuberg 516 panels, OpenTerminalUI, BLMTRM, Fortress) proves dense tables beat pretty charts for operators. Key traits:
- **High row density**, small row height, tight cell padding.
- **Monospace numeric columns** with right-aligned tabular figures.
- **Color-coded data fields** packed edge-to-edge (Bloomberg signature) — but with the semantic discipline from §2.4.
- **Sparklines inline in cells** (Apex/Zenith dashboards: "stats cards with sparkline charts").
- **Sticky header + sticky first column** for wide entity tables (campaigns, ad groups, ads).
- **Inline status pills** (Active/Paused/Archived, Review status, Tracking health) — 999px radius, 1px border, 4×12px padding, 13px Inter weight 500.
- **Sort + filter + CSV export** as table primitives (TanStack Table pattern from Apex).

### 4.2 KPI metric cards (the 4–6 strip)
Synthesis of Basedash "Metric Display Card" + Apex "sparkline stat cards":
- 16px border-radius, `#050607`-style recessed background, 16–20px padding.
- **Title:** Inter 14px, secondary color.
- **Large number:** Inter 34px weight 600 (or mono 28px) — the North Star.
- **Delta indicator:** semantic color (+% in green/red) + absolute value below in secondary text.
- **Sparkline** filling the lower portion (7D/30D/90D toggle).
- **Live status dot** (8px mint circle + "Live" label) for real-time metrics.
- **No box-shadow.** Border + luminance only.

### 4.3 Chart patterns
- **Recharts** is the 2026 default for React dashboards (Zenith, Apex, dotty all use it). D3 for custom visualizations (KlindrOS).
- **Stacked-block / pixel bar charts** (dotty) — bars rendered as columns of discrete squares, reinforcing a pixel-grid aesthetic. Distinctive and on-trend.
- **Candlestick/area/line** for time-series (spend, CTR, CPA trends) with synchronized crosshairs across multi-panel workstations (OpenTerminalUI).
- **Donut for distribution** (traffic sources, ad-status breakdown, creative-angle mix) — Apex standard.
- **Funnel chart** for conversion funnel (CONTEXT.md requires this).
- **Heatmap** for spending patterns (shadcn-fintech "spending heatmap") — maps to ad-group × day performance.
- **Charts use ONLY semantic colors** (violet/green/red/amber) — never decorative rainbow palettes.

### 4.4 The 2-layer card pattern (dotty — signature visual element)
Every card is a stacked construction:
1. **Outer container** — `bg-muted` (cool-gray base), `--radius-card` (14px).
2. **Inner content area** — `bg-card`, `--radius-widget` (10px), 1px border, floating inside.
3. **Exposed gray zone** — the gap between inner/outer holds secondary content (footers, labels, metadata).

> "Depth is communicated through luminance layers, not shadows or gradients."

This is perfect for ad cards: outer = ad identity/status; inner = creative preview + metrics; exposed zone = UTM/tracking status + recommendation badge.

### 4.5 Sharp + round radius rule (dotty)
Deliberate tension between rigid frame and soft content:
- **Large layout containers** (sidebar, main wrapper): **0px radius** — hard architectural edges.
- **Page cards:** 14px (`--radius-card`).
- **Inner widgets:** 10px (`--radius-widget`).
- **Small controls** (buttons, search, nav items, badges, `kbd`): `rounded-lg` (Basedash uses 6px for buttons/inputs, 16px for cards, 999px for badges — "card is a container, button is a tool").

---

## 5. Motion & Interaction

### 5.1 Real-time refresh as a first principle (KlindrOS)
> "KlindrOS refreshes via WebSocket connections, with new data appearing in cells within seconds of arriving in the backend. Components must handle streaming updates without re-renders that break user focus. Tables must update specific cells without scrolling away from the user's current position. Charts must animate transitions smoothly enough that they do not interrupt decision-making. Getting this right took longer than the visual design."

**For us:** insight snapshots are daily, but spend/clicks/CTR can tick near-real-time. Plan cell-level updates, not page reloads.

### 5.2 Interaction patterns from the research
- **Command palette (Cmd+K)** — universal in 2026 dashboards (Zenith, Apex, BLMTRM uses `/`). Quick nav to any campaign/ad group/ad; run actions ("pause ad_123").
- **Command-bar keyboard nav** (BLMTRM: press `/` to open) — power-user acceleration, very Bloomberg.
- **Split / resizable panes** (BLMTRM "split workspace", OpenTerminalUI "multi-panel chart workstations with synchronized crosshairs") — for comparing two ad groups or creatives side by side.
- **Drag-and-drop panel arrangement** (Neuberg 516 panels, shadcn-fintech drag-and-drop layout) — let operators customize their cockpit.
- **Drill-up/drill-down** through the hierarchy (FutureSightIQ, IndustryLens "drill into any signal's source evidence in seconds") — Campaign → Ad Group → Ad → Creative → Landing Page → Conversion Event. Every number is a link to its provenance.
- **Source-drilldown** (IndustryLens) — every recommendation links to the evidence (impressions, CTR, spend, conversion data) that produced it. Critical for trust.
- **Hover-to-reveal capabilities** (Godel Terminal "hover any capability") — progressive disclosure on dense grids.
- **Smooth chart transitions** — animate data updates without interrupting scanning.
- **Sticky header navigation** (Aqtos) — context persists while scrolling long tables.

### 5.3 What NOT to do (KlindrOS, explicitly)
- **No onboarding animations** — no fly-in tutorials, no confetti, no congratulatory illustrations. "The interface assumes you are here to work."
- **No engagement gamification** — no streaks, badges, progress meters for arbitrary metrics. "The only progress that matters is whether your KScore improved, your campaigns hit targets, and your team made decisions faster."
- **No friendly empty states** — "No data" + one-line explanation of how to populate it. No smiling cartoons, no "You got this!" Operators find these patronizing within their first hour.

This matches CONTEXT.md's terse, action-oriented tone exactly.

---

## 6. Competitive Intelligence Patterns (directly applicable)

### 6.1 IndustryLens — the strongest CI dashboard reference
Four views, each built for a different moment:
1. **Weekly Briefing** — every insight linked to its source, grouped by competitor, with the recommendation it feeds.
2. **Campaign Intelligence** — every ad competitors run (LinkedIn, Meta, Google), creative variants, run length, keyword overlap. *Live, updated weekly.*
3. **Battlecards** — auto-updated per competitor; positioning gaps, objection handlers, latest moves. No manual maintenance.
4. **Insight Feed** — every tracked signal in one filterable stream. Sort by recency, confidence, or competitor. Drill into source evidence.

UI signature: **priority signal cards** with category tag (PRICING/ADVERTISING/MESSAGING), competitor name, **confidence %**, and a one-line description. "⚠ High priority · 2" badge at top.

**Apply to OpenAI Ads:** Replace "competitor" with "campaign/ad group/ad". The signal-card pattern maps directly to our Recommendations page: each recommendation = a signal card with category, entity, confidence, evidence drilldown, and Apply/Dismiss.

### 6.2 Intercept template — "make the dashboard feel like the product"
- Opens with animated terminal code snippet, blooms into a live-feel dashboard data grid.
- Visitors **sort, filter, hover** a simulated data grid instead of reading bullet points.
- Every scroll section reveals a new intelligence layer.
- **Lesson:** the UI itself should demonstrate intelligence, not describe it. Recommendations should be *acted on in-place*, not copied to another tool.

### 6.3 Confidence scoring on every signal
Both IndustryLens (94%, 88%, 91%) and FutureSightIQ surface **confidence scores** on intelligence. CONTEXT.md's Recommendation schema already includes `confidence` — make it a visible, sortable first-class citizen.

### 6.4 "Always on, not just Monday"
> "The weekly briefing lands in Slack and email — but the dashboard is always on. Filter by competitor, sort by confidence, and drill into any signal's source evidence in seconds."

The dashboard is the source of truth; notifications are derivative. Don't build a notification tool — build the always-on command surface.

---

## 7. Notable Examples — Reference Board

### Primary references (steal from these)
| Product | URL | Why it matters |
|---|---|---|
| **KlindrOS** | klindros.com/blog/inside-the-twilight-trading-floor… | Marketing-ops dashboard that explicitly chose Bloomberg aesthetic. 5 principles, semantic color, role-based views, real-time. *Closest analog to our product.* |
| **Basedash** | basedash.com (refero.design/style/77b723ca…) | Full design-system spec: void-black canvas, carbon cards, white-pill buttons, serif+Inter, violet/green data-only. *Copy the token system.* |
| **dotty** | github.com/nocoo/dotty (dotty.hexly.ai) | Open-source cool-monochrome dashboard. 2-layer cards, pixel bar charts, sharp+round radius rule, Inter+Plex Mono. *Copy component patterns.* |
| **Trunk** | trunk.io (refero.design style 48971df7) | "Monochrome control room with one green signal light." Hairline borders, no shadows, weight-300 display. *Copy the restraint.* |
| **basalt** | github.com/nocoo/basalt (basalt.hexly.ai) | 3-tier luminance hierarchy (L0→L1→L2), matte dark, Inter 14px + DM Sans. *Copy the depth system.* |

### Bloomberg-class references
| Product | URL | Why |
|---|---|---|
| **Neuberg** | github.com/KoNananachan/Neuberg | Open-source Bloomberg, 516 drag-and-drop panels, TypeScript/React. |
| **Godel Terminal** | godelterminal.com | Browser-based, familiar commands, $996/seat. "Every company, in one screen." |
| **OpenTerminalUI** | github.com/Hitheshkaranth/OpenTerminalUI | Terminal-style shell, multi-panel chart workstations, synchronized crosshairs. |
| **BLMTRM** | github.com/thompson0012/blmtrm | Hacker-style terminal, command bar (`/`), split workspace, AI agent inline. |
| **Fortress Dashboard** | fortress-shadcn.dashboardpack.com | Bloomberg-inspired institutional finance, Next.js + shadcn/ui + Tailwind v4. 57+ pages, 13 finance pages. *Same stack we'd use.* |

### Fintech premium references
| Product | URL | Why |
|---|---|---|
| **shadcn-fintech** | github.com/abderrahimghazali/shadcn-fintech | Next.js 16 + shadcn/ui + Tailwind v4, open-source, drag-and-drop, live ticker, spending heatmap. *Closest stack match.* |
| **Finaura** | mansknow.com/finaura… | 60 screens; **Instrument Serif + Martian Mono + Inter** = premium fintech aesthetic. *Copy the type trio.* |
| **Flowpay** | elements.envato.com/flowpay… | "Elite Financial" — white workspace, deep obsidian accents, elegant serif. Light-mode alternative. |

### Award-winning / inspirational
| Product | URL | Why |
|---|---|---|
| **beQ Dashboard** | ux-design-awards.com/winners/2026-1-beq… | UX Design Awards 2026 winner. "Restructured IA, simplified vocabulary, removed cognitive overload, minimal accessible design system." *The anti-density counterpoint — use for the Recommendations/Conversions pages.* |
| **Algorithmic Trading Dashboard** | awwwards.com/sites/algorithmic-trading-dashboard | Awwwards Nominee Mar 2026 (ZeeFrames). Font & color scheme reference. |
| **WhisperNode Analytics** | awwwards.com/inspiration/analytics-dashboard-whispernode-1 | Awwwards element: web3, data viz, dark. |
| **Aqtos** | awwwards.com/inspiration/dashboard-overview-aqtos-the-boss | Sticky header, hero animation, dashboard/saas/product. |
| **Doppler (UI kit)** | behance.net/gallery/246220767 | "Deep contrast, tactical typography, glowing neon gradients" for data-intelligence platforms. |
| **Fintech Floating Interactive Cards** | ui-syntax.com/design/fintech-dashboard-floating-interactive-cards | "Masterclass in modern dashboard design… fluid transitions, strategic use of depth." |

### Awwwards data-viz collection
- awwwards.com/websites/data-visualization/ — curated winning data-viz sites.

---

## 8. Recommended Design Direction for the OpenAI Ads Dashboard

### 8.1 Design language name
**"Signal Floor"** — a dark, monochrome command surface for ad-intelligence operators, where the only color that matters is the semantic signal (win/warn/critical) and the next action.

### 8.2 The 7 binding rules
1. **Dark is the default, not an option.** Canvas `#0A0E14`; plan light mode but ship dark first.
2. **Density over whitespace.** Sidebar 260px, dense tables, KPI strip of 5–6, multi-panel grids. Accept looking busy in screenshots.
3. **Every screen answers What / Why / What next** in 5 seconds. Recommendations are first-class, not a separate buried page.
4. **Semantic color is sacred.** Blue=interactive, Green=win, Amber=warn, Red=critical. Each meaning, one color, forever. Charts use these + violet only.
5. **No shadows.** Luminance steps (canvas → card → inner-widget) + 1px hairline borders define depth.
6. **Mono numerics, sans prose.** Every number (CPA, CTR, spend, conversions, scores) in monospace tabular figures. Body/labels in Inter.
7. **Every number links to its evidence.** Drill from any metric to the entity, then to the source data/recommendation that explains it.

### 8.3 Typography
- **Inter** — all UI/body (−0.02em tracking), weights 400/500/600.
- **Geist Mono or IBM Plex Mono** — all numeric data, tabular figures.
- **Instrument Serif** — display only, Overview hero + Recommendations section titles (the "premium editorial" moment). 48px, weight 400, line-height 1.0.

### 8.4 Component inventory to build first
1. **Sidebar** (260px collapsible) with account switcher + 8 nav sections.
2. **KPI strip card** (2-layer: title + mono value + semantic delta + sparkline + live dot).
3. **Dense data table** (sticky header/first col, mono numerics, inline status pills, sparkline cells, sort/filter/CSV).
4. **Signal/recommendation card** (IndustryLens pattern: category tag, entity, confidence %, evidence drilldown, Apply/Dismiss).
5. **Entity drawer** (slide-over for campaign/ad group/ad/creative detail).
6. **Context-hint chip + score gauge** (flagship — the Context Hint Lab).
7. **Creative preview card** (2-layer: creative content inner, status/match-score outer).
8. **Funnel chart** + **trend chart** (Recharts, semantic colors only).
9. **Command palette** (Cmd+K) — nav + actions ("pause ad", "apply UTMs").
10. **ChangeLog timeline** — every write action logged, terminal-style.

### 8.5 What to deliberately reject
- Consumer-SaaS "Notion aesthetic": pastel gradients, big whitespace, rounded-everything, friendly illustrations.
- Onboarding animations, confetti, gamification streaks/badges.
- Friendly empty-state cartoons and "You got this!" affirmations.
- Decorative rainbow chart palettes.
- Box-shadows for elevation.
- Light mode as default.
- Static report-style dashboards with no action layer.

---

## 9. Sources (full list)

**Dashboard trends 2026**
- saasframe.io/blog/the-anatomy-of-high-performance-saas-dashboard-design-2026-trends-patterns
- artofstyleframe.com/blog/dashboard-design-patterns-web-apps/
- muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/
- think.design/blog/dashboard-design-in-2026-dos-and-donts/
- sanjaydey.com/saas-dashboard-design-users-love/
- 925studios.co/blog/saas-dashboard-design-examples-2026

**Data visualization**
- behance.net/gallery/246220767 (Doppler UI kit)
- ui-syntax.com/design/fintech-dashboard-floating-interactive-cards
- wrappixel.com/blog/best-dashboard-designs

**Fintech**
- github.com/abderrahimghazali/shadcn-fintech
- mansknow.com/finaura-premium-fintech-dashboard-ui-kit/
- elements.envato.com/flowpay-wealth-management-portfolio-dashboard-kit-V6JB6Q2
- creativemarket.com/E-sam/292245408-Overpay-Finance-Dashboard-UI-Kit
- fortress-shadcn.dashboardpack.com/
- design.rip/ai-powered-finance-management-dashboard-ui-kit

**Bloomberg / terminals**
- godelterminal.com/
- github.com/KoNananachan/Neuberg
- github.com/Hitheshkaranth/OpenTerminalUI
- klindros.com/blog/inside-the-twilight-trading-floor-the-design-system-behind-klindros
- pypi.org/project/fincept-terminal/
- github.com/thompson0012/blmtrm

**Competitive intelligence**
- layers.to/layers/cmbh1xo1w000ql40c8a064cej (Denton Bishop)
- industry-lens.com/features/dashboard
- rocket.new/templates/intercept-powerful-competitiveintelligence-landing-page-template
- rivalyze.io/resource-center/competitive-intelligence-dashboard
- crystalmunson.myportfolio.com/compintel-ai-case-study
- pushstudio.one/fsiq

**Awwwards / awards**
- awwwards.com/sites/algorithmic-trading-dashboard
- awwwards.com/annual-awards-2025
- awwwards.com/inspiration/analytics-dashboard-whispernode-1
- ux-design-awards.com/winners/2026-1-beq-dashboard-smart-investment-reward-control
- awwwards.com/websites/data-visualization/
- awwwards.com/inspiration/dashboard-overview-aqtos-the-boss

**Dark mode**
- adminuiux.com/dark-mode-admin-template/
- bootstrapmade.com/appdashboard-bootstrap-admin-dashboard-template/
- mycreativetemplates.com/template/quillcockpitly-premium-angular-17-admin-dashboard-template/
- bootstrapmade.com/elite-admin-bootstrap-admin-dashboard-template/
- dashboardpack.com/theme-details/apex-dashboard-nextjs/
- zenith-shadcn.dashboardpack.com/

**Monochrome (highest-signal)**
- github.com/nocoo/dotty (dotty.hexly.ai) — cool monochrome, 2-layer cards, pixel bars
- styles.refero.design/style/48971df7-919d-453c-9d0b-4600cd24c583 (Trunk) — one green signal
- styles.refero.design/style/77b723ca-9583-4349-9b5e-2ef8b4fde002 (Basedash) — full token spec
- github.com/Ayoub-glitsh/black-admin-dashboard — strict black & white
- dashboardpack.com/theme-details/zenith-dashboard-laravel/ — achromatic, zero chroma base
- github.com/nocoo/basalt (basalt.hexly.ai) — 3-tier luminance hierarchy
