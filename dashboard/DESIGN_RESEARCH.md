# Dashboard Redesign — Design Research

Synthesis of 5 parallel research tracks: 2026 dashboard trends, ad-intel tool patterns, motion design, typography/color systems, and radical/unconventional directions.

---

## 1. The Recommended Aesthetic Direction

**"Bloomberg terminal redesigned by an Apple hardware team."**

A near-black control room where the only color is *signal*. Dense, monochrome, hairline-structured, with a single semantic accent. Not a pretty SaaS dashboard — an operator's instrument.

### The synthesis (4 layers)

| Layer | Direction | Why |
|---|---|---|
| **Functional base** | Hyper-Dense / Instrument-Panel | Agencies need to see everything at once. Tight spacing, tabular numerics, inline sparklines, drawers not pages. |
| **Semantic skin** | Mission Control / Surveillance Ops | Campaigns=assets, recommendations=alerts, change log=incident response, funnel diagnostics=investigation. Red/amber for anomalies, live ticker for alerts. |
| **Editorial voice** | Broadsheet / Newspaper | Overview = front page lead headline. Recommendations = leader column. "What's happening / why it matters / what to do next" IS editorial structure. |
| **Generative layer** | Living Canvas (selective) | Campaign→ad group→ad hierarchy as a node graph. Funnel as flow diagram. Creative Lab as gallery transitions. Not everywhere — only where the data is relational. |

### What we reject
- Generic SaaS "Notion aesthetic" (rounded cards, soft shadows, pastel)
- Pure cyberpunk/neon (fatiguing for 8-hour operators, reads as toy)
- Glassmorphism for its own sake (undercuts enterprise credibility)
- Gradients, decorative color, chart fills on non-primary series

---

## 2. Typography System

### Font stack
| Role | Font | Why |
|---|---|---|
| **Sans (all UI)** | Inter | Highest x-height at small sizes, tabular figures, variable weight 100-900. The "terminal that grew up" face. |
| **Mono (numbers/IDs)** | JetBrains Mono or Geist Mono | Locks numeric columns, reads as "data trust." IDs, timestamps, UTMs, JSON payloads. |
| **Display (optional)** | Inter 300, -0.04em tracking | Thin large = whisper, bold small = command. No serif needed for an operational tool. |

### Type scale (13px base, data-density optimized)

| Token | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 34px | 300 | -0.04em | Overview hero metric, page H1 |
| `h1` | 22px | 600 | -0.02em | Page titles |
| `h2` | 17px | 600 | -0.01em | Section titles |
| `h3` | 15px | 600 | 0 | Card titles |
| `body` | 13px | 400 | 0 | Default reading, table cells |
| `body-sm` | 12px | 400 | 0 | Dense table secondary |
| `label` | 11px | 600 | +0.04em, UPPERCASE | Eyebrows, column headers, status tags |
| `caption` | 11px | 400 | 0 | Footnotes, sync timestamps |
| `metric` | 28px | 300, tnum | -0.03em | KPI card big number |
| `mono` | 12px | 400 | 0 | IDs, payloads, UTMs |

### Numeric typography rules
- `font-variant-numeric: tabular-nums lining-nums` on all metric cells
- Right-align metrics, left-align entities, center-align status pills
- True monospace ONLY for: ad IDs, timestamps, UTM strings, JSON
- Deltas: mono, with `▲`/`▼` glyphs colored by semantic context (down=good for CPA, up=good for CTR)
- Big KPI numbers: weight 300 (not 700), `$` as muted prefix, amount in primary text

---

## 3. Color System

### Dark mode (default)

**Near-black, cool-cast undertone (hue 240). Not pure #000 (causes halation).**

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0a0b0d` | Page canvas |
| `--surface` | `#111317` | Cards, panels |
| `--surface-2` | `#16191e` | Elevated/nested, table headers |
| `--border` | `#1f2329` | Hairline dividers (1px) |
| `--border-strong` | `#2a2f37` | Active/hover borders, focus rings |
| `--text` | `#e6e8eb` | Primary text (17:1 contrast) |
| `--text-muted` | `#9aa1ac` | Secondary (7.5:1) |
| `--text-faint` | `#5c636f` | Disabled, footnotes |

### The single accent

**Teal-cyan `#3dd9c4`** — reads as "live data / signal detected." Underused vs generic blue-cyan (Grafana/Datadog). Technical, legible on near-black.

| Token | Hex | Role |
|---|---|---|
| `--accent` | `#3dd9c4` | Live status, active nav, focus rings, selected row, primary metric, primary CTA |
| `--accent-hover` | `#5ce2d0` | Hover state |
| `--accent-soft` | `rgba(61,217,196,0.12)` | Subtle fills: selected row, active tab |
| `--accent-fg` | `#04141a` | Text on solid accent |

**Accent discipline:** appears ONLY where meaning demands it. Never decorative, never section fill, never chart fill for non-primary series. If everything is accent, nothing is.

### Semantic / status (state, not decoration)

| Token | Hex | Meaning |
|---|---|---|
| `--positive` | `#34d399` | Good CPA, healthy tracking, winning creative |
| `--warning` | `#f5b942` | Pacing anomaly, weak hints, missing UTMs |
| `--negative` | `#f87171` | Broken landing page, high CPA, zero conversions |
| `--info` | `#60a5fa` | Neutral insight, informational recommendation |

### Light mode

| Token | Hex | Change |
|---|---|---|
| `--bg` | `#fbfbfc` | Off-white (reduces glare) |
| `--surface` | `#ffffff` | Cards |
| `--surface-2` | `#f4f5f7` | Nested/table headers |
| `--border` | `#e4e6ea` | Hairlines |
| `--text` | `#111317` | Primary |
| `--accent` | `#0d9b8a` | Darker teal for white contrast |
| Status colors | One step darker | `#059669` / `#d97706` / `#dc2626` / `#2563eb` |

### Chart palette (categorical, ordered)

| Series | Hex | Role |
|---|---|---|
| `--chart-1` | `#3dd9c4` | Accent / primary "story" series |
| `--chart-2` | `#9aa1ac` | Muted neutral / baseline |
| `--chart-3` | `#60a5fa` | Info blue |
| `--chart-4` | `#f5b942` | Warning amber |
| `--chart-5` | `#c084fc` | Sparingly violet |
| `--chart-6` | `#f87171` | Reserved for error/negative |

**Secret to premium charts:** let one series be accent (the story), the rest be gray `#9aa1ac`. Max 2-3 hues per chart.

---

## 4. Motion Design

### Core principles
1. **Motion is a design token layer** alongside color and typography — not polish applied at the end
2. **Every animation does one of three jobs:** feedback, continuity, hierarchy. Otherwise cut it.
3. **Linear easing is banned** for UI. Use critically-damped springs (ζ=1) for professional settle.
4. **Only animate `opacity`, `transform`, `filter`** — never width/height/margin (breaks 60fps)
5. **Honor `prefers-reduced-motion`** at root level

### Spring tokens

```ts
// Professional dashboard default (critically damped, no bounce)
const spring = { type: "spring", stiffness: 300, damping: 30 }

// Tactile tap (slight overshoot OK)
const tap = { type: "spring", stiffness: 500, damping: 30 }

// Heavy element (overdamped, conveys mass)
const heavy = { type: "spring", stiffness: 200, damping: 40 }
```

### Duration budget

| Interaction | Duration |
|---|---|
| Hover/focus | 150-200ms (must feel instant) |
| Button press | 100-150ms (tactile, snappy) |
| Modal/drawer/dropdown | 200-300ms |
| Full-page transition | 300-500ms (only when meaningful) |
| Anything >500ms | Must justify itself |

### Key patterns for this dashboard

| Pattern | Where | Technique |
|---|---|---|
| **Spring count-up KPIs** | Overview metric cards | Count from 0 to target with spring physics on first viewport entry. `tabular-nums` so digits don't jitter. |
| **Staggered card cascade** | Overview cards, recommendation feed | Each card slides in with opacity + vertical offset, delayed by index. `staggerChildren: 0.06`. |
| **Shared-element transitions** | Campaign row → detail, ad row → creative lab | Framer Motion `layout` prop / View Transitions API. The row morphs into the header. |
| **Theme toggle circle reveal** | Dark/light switch | View Transitions API — expanding circle wipes from toggle point outward. |
| **Sync indicator pulse** | Top bar sync chip | Breath animation while pulling OpenAI Ads data, settles with count-up on complete. |
| **Status badge morph** | Activate/pause/archive | Badge color springs to new state, row opacity eases, ChangeLog entry slides in. |
| **Token streaming** | "Generate hints" / creative generation | Content streams in like Perplexity/ChatGPT — reveals "thinking" process. |
| **Exit animations** | Dismiss recommendation, close drawer | The thing AI-coded apps miss. `AnimatePresence mode="wait"` so exit completes before enter. |
| **Scroll-reveal** | Recommendations, overview narrative | `whileInView` with `viewport={{ once: true }}`. One-shot, no re-fire. |
| **Skeleton screens** | Loading states | Match final layout shape. `linear` easing (the one sanctioned use). Shimmer pulse. |

### Implementation stack
- **Motion** (formerly framer-motion) — `whileInView`, `AnimatePresence`, `layout`, `staggerChildren`
- **View Transitions API** (native) — theme + route shared-element transitions
- **CSS `scroll-timeline`** — no-JS scroll choreography
- **Recharts** — spring-animated charts, reference lines

---

## 5. Ad-Intel-Specific UX Patterns

Borrowed from Meta Ad Library, Pathmatics, Similarweb, IndustryLens, Flares, AdCreative.ai, Krev, MTWSPY.

### Ad creative display
- **Expandable variant card** (Meta): group A/B variants under parent card. Solves "500 near-identical ads" problem.
- **Color/asset decomposition** (AdCreative.ai): dominant-color swatches, creative-insight score on each card.
- **Landing-page preview attached** (MTWSPY): creative + post-click destination as one connected object. One-click "see where this sends traffic."
- **"Remake/Clone" side panel** (Mintly/Krev): pick a winning ad → generate variants in same angle. Turns browsing into workflow.
- **"Next move" widget** (Krev): "Remake the winning hook with your product shot" — dashboard tells you the action, not just the number.

### Competitive landscape
- **Leaderboards ranked by spend/frequency** (Pathmatics): top advertisers in a category, sortable.
- **Share-of-voice side-by-side comparison** (Pathmatics/Similarweb): your brand vs competitors.
- **Confidence-scored signal cards** (IndustryLens/Flares): priority, confidence %, evidence drill-through, Apply/Dismiss. "65 raw signals → 15 actionable flares" noise-filter headline.
- **Cumulative-spend MoM delta** (Meta Ad Library 2026): rolling 12-month spend card. Jump = scale event.
- **Active-ad count as headline metric** ("~42 results") — tracked week-over-week.

### Filtering
- **Broad-first filter order** (Meta lesson): Campaign → Ad Group → Ad → Date → Status → Score. Starting narrow times out.
- **Bookmarkable URL-param searches**: every filter state shareable. Agencies maintain ~40 saved URLs per client.
- **OmniBox** (Pathmatics): single search box resolves any entity type (campaign/ad/advertiser/hint).
- **Persistent grid filter** (AppGoblin): changing filters recomputes grid in place without losing scroll.

### Recommendations (matches CONTEXT.md §7.7)
- **Confidence-scored signal cards** with priority, evidence, Apply/Dismiss
- **Noise-filter headline**: "N raw issues → M recommendations"
- **Source-evidence drill-through** on every recommendation
- **Time-grouped feed** (Today / Yesterday) — recon-style chronology
- **"Next move" callout** on each card — the action, not just the number

---

## 6. Radical Design Directions (catalog)

10 unconventional directions researched. Top picks for this dashboard:

### Tier 1 — Adopt as core

**Hyper-Dense / Instrument-Panel**
- Ultra-tight spacing, 13-14px body, tabular numerics, inline sparklines in table cells
- KPI cards 1/4 height of normal SaaS cards
- Stacked-block / heat-grid / treemap for mass comparison
- Drawers instead of new pages to keep context
- References: `github.com/amafjarkasi/hd-eui-core`, `designmd.app/library/data-dense-dashboard`

**Mission Control / Surveillance Ops**
- Near-black "Tactical Obsidian" with red+amber accent system for anomalies
- Live scrolling alert ticker for recommendations and tracking issues
- Dense status grids, blinking/heartbeat indicators for active syncs
- "CLASSIFIED"-style module headers with monospace tags
- References: `github.com/Willie-Conway/SOC-Simulator`, AuroraSOC, SENTINEL PRIME

**Editorial Broadsheet**
- 12-column broadsheet grid with named slots (lead, sidebar, masthead, folio)
- Serif display for headlines, grotesque for data, small-caps section labels
- Masthead: "THE GPT ADS DAILY — Vol. 1, No. 184 — June 19, 2026"
- Above-the-fold = overview KPIs as lead headline. Below = tables/diagnostics.
- Pull-quotes for the single most important recommendation.
- References: `mintlify.wiki/sagarsiwach/newspaper-designer-pretext`, NexusDaily

### Tier 2 — Selective use

**Generative / Living Canvas** (for hierarchy graph + funnel only)
- Campaign→ad group→ad as node-and-edge canvas, zoom/pan
- Flow diagrams replacing static tables for Recommendations and Funnel
- Reference: `github.com/justinstimatze/lucida`

**Terminal / CRT Phosphor** (for a "power user" mode if we build one)
- Phosphor green on near-black, scanlines, CLI-style command palette
- Table rows as log lines: `2026-06-19 09:14 CMP_ai_founder IMP=82100 CTR=2.0% STA=GOOD`
- Reference: `github.com/jeannesbryan/terminal`

### Tier 3 — Influence but don't adopt wholesale

**Swiss / International Typographic Extreme** — militant minimalism, B/W/single-red, mathematical grid. Influences our restraint.
**Neo-Brutalist / Pixel-Brutalist** — hard offset shadows, thick borders, stacked-block charts. The dotty pixel-brutalist sub-variant works for data viz.
**Cyberpunk / NERV Instrumentation** — neon HUD, clip-path panels. Too toy-like for primary product but NERV instrumentation sub-variant signals "precision instrument."
**Awwwards Cinematic Motion** — scroll-narrative overview, gallery transitions for Creative Lab. Selective only.

---

## 7. Component Inventory

### Layout
- 260px collapsible sidebar (icon-only collapse)
- Sticky header with breadcrumb, sync indicator, theme toggle, Cmd+K
- Max content width 1320px, 12-column grid
- Drawers (right-slide) for entity details, not page navigation

### Navigation
- Cmd+K command palette (search entities, run actions, jump to pages)
- OmniBox search (resolves campaign/ad/advertiser/hint in one box)
- View tabs with shared-element morph between views
- Bookmarkable URL params for every filter state

### Data display
- Dense tables: 13px body, tabular-nums on metrics, sticky header, row hover = surface-2 + 2px accent left border
- KPI cards: 28px weight-300 number, 11px uppercase label, inline sparkline, spring count-up
- Ad creative cards: creative + advertiser + score + triggering prompt + "days active" + impressions bucket
- Recommendation cards: priority + confidence % + evidence + Apply/Dismiss + "next move"
- Status pills: semantic text on rgba(0.12) tinted bg, 1px rgba(0.25) border
- Hairline borders everywhere, no shadows for elevation

### Charts
- Thin-line geometric (no fills, just strokes) — Swiss influence
- Accent = series 1 (the story), neutral gray = baseline
- Spring-animated reference lines, animated bars
- Sparklines inline in table cells
- Heat-grid / treemap for mass comparison

### Empty states
- No friendly illustrations, no gamification
- Monospace statement: "No ads observed in this dataset."
- Actionable: "Run probes to collect data →"

---

## 8. Binding Design Rules

1. **Dark default.** Near-black `#0a0b0d`, cool-cast. Light mode available but not primary.
2. **One accent.** Teal-cyan `#3dd9c4`. Appears only where meaning demands it.
3. **Hairlines, not shadows.** 1px `#1f2329` borders structure everything. Elevation is planar.
4. **Mono numbers.** `tabular-nums` on all metrics. True monospace for IDs/timestamps/UTMs.
5. **11px uppercase eyebrows.** All section kickers and column headers. The universal metadata register.
6. **Weight 300 for big numbers.** Thin large + bold small. Inverts SaaS loudness. Reads as confident.
7. **Springs, not linear.** Critically-damped (ζ=1) for professional settle. Motion as token layer.
8. **Dense by default.** 13px body, tight rows, inline sparklines, drawers not pages. Agencies see everything.
9. **Every recommendation carries evidence.** Confidence %, source data, Apply/Dismiss. No unsupported claims.
10. **`prefers-reduced-motion` honored.** Root guard. JS matchMedia gate on big reveals.

---

## 9. Key References

### Products to study
- **Linear** — calm, critically-damped springs, motion as tokens. The north star for professional feel.
- **Basedash** — pure-black canvas, recessed carbon cards, white-pill CTAs, Inter + Alpha Lyrae
- **Fey** — trading terminal, `#0b0b0b`, display weight 300 `-0.08em`, color=meaning
- **Trunk** — CI control room, single green dot accent, maximal restraint
- **Pathmatics 2.0** — restrained, dense, data-first. The credible enterprise look.
- **Similarweb** — traffic-share hero, AI-generated topics, natural-language search
- **Meta Ad Library** — expandable variant cards, impression buckets, broad-first filtering
- **IndustryLens / Flares** — confidence-scored signal cards, noise-filter headline

### Repos / frameworks
- `github.com/Willie-Conway/SOC-Simulator` — SOC dashboard, React+Recharts
- `github.com/nocoo/dotty` — pixel-brutalist monochrome dashboard
- `github.com/amafjarkasi/hd-eui-core` — hyper-dense enterprise UI
- `github.com/jeannesbryan/terminal` — terminal/CRT UI framework
- `github.com/TheGreatGildo/nerv-ui` — NERV operations console aesthetic
- `github.com/justinstimatze/lucida` — generative mission-control canvas
- `mintlify.wiki/sagarsiwach/newspaper-designer-pretext` — broadsheet layout engine

### Design systems
- `designmd.app/library/data-dense-dashboard` — data-dense design system
- `katagami.ai` — Swiss typographic monochrome
- `designmd.app/library/swiss-modernism-2-0` — Swiss Modernism 2.0

### Motion
- **Motion** (formerly framer-motion) — `npm i motion`
- **View Transitions API** — native theme/route transitions
- **Recharts** — spring-animated charts
- `linear.app/now` — "a calmer interface for a product in motion"
