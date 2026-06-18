# DESIGN.md — Brand & Design System

> The single source of truth for the look, feel, and motion of this product. Every screen, component, and animation must trace back to this document. When in doubt, this file wins.

---

## 0. What we're building (so design serves it)

A **competitive ad-intelligence terminal**. A user names their industry; we reveal what ads competitors are running inside ChatGPT, the exact prompts that trigger them, who's winning the conversation, and where the open lanes are. It is a *reconnaissance instrument*, not a marketing brochure. The design must feel like **looking through a lens at a hidden market** — precise, a little clandestine, undeniably premium.

---

## 1. Concept & Aesthetic Direction

### The one-line vision
> **"The Bloomberg Terminal had a child with a fine-art print."** Instrument-grade data, rendered with the restraint and craft of editorial print design.

### Named direction: **MONOCHROME RECON**
A disciplined black-and-white system — broadsheet typography, hairline rules, generous negative space — sitting on a living, dithered atmospheric field. One single functional accent (signal blue) used like a status light, never decoration. The product should feel **calm at rest and alive on interaction**: still like a printed page until you touch it, then it responds with mechanical precision.

### Why this direction (not generic AI SaaS)
The 2026 reference landscape splits into two camps: *techno-futurist* (neon + shaders + bento) and *editorial* (cream + serif + whitespace). We deliberately **fuse them**: editorial restraint as the skeleton, a single restrained GPU shader (Bayer dither) as the soul. This is rare — most products pick one. The fusion is our signature and our moat against looking like "default AI beige."

### The three feelings a visitor must have
1. **"This is serious."** — typographic authority, tabular numbers, zero fluff.
2. **"This is alive."** — the background breathes; numbers count up; the search bar physically travels.
3. **"I'm seeing something hidden."** — the reveal of competitor ads should feel like a curtain lifting on a private auction.

### Anti-patterns (banned)
- ❌ Inter / Roboto / Space Grotesk / system-ui as display type.
- ❌ Purple/violet gradients on white. Any rainbow palette.
- ❌ Glassmorphism, neumorphism, drop-shadow-everywhere card soup.
- ❌ Bento grids of equal rounded cards (the default AI dashboard look).
- ❌ Decorative stock illustration, 3D blobs, emoji as UI.
- ❌ More than ONE accent color. Ever.

---

## 2. Color System

Warm-neutral monochrome. **Never pure `#000`** on large fills — it reads cheap and vibrates against pure white. Near-black is `#0A0A0A`. The whole UI lives in a tight grayscale range; contrast comes from *weight and space*, not color.

### Ink scale (grayscale tokens)
```
--ink-950: #0A0A0A;   /* primary text on light; hero background */
--ink-900: #141414;
--ink-800: #1F1F1F;   /* elevated surfaces on dark */
--ink-700: #2E2E2E;
--ink-600: #525252;   /* secondary text */
--ink-500: #6B6B6B;
--ink-400: #A3A3A3;   /* muted / disabled / captions */
--ink-300: #C9C9C9;
--ink-200: #E5E5E5;   /* hairlines, borders */
--ink-100: #F2F2F2;   /* subtle fills, hover bg */
--ink-50:  #FAFAFA;   /* light page background */
--paper:   #FFFFFF;   /* card surface on light */
```

### The single accent — "Signal Blue"
```
--signal:      #1A3CFF;   /* the only chromatic color in the system */
--signal-dim:  #1A3CFF @ 12% alpha;  /* tints, hover halos */
```
**Usage law:** signal blue appears ONLY on genuine signal:
- High-intent indicators (`intent_score >= 7`)
- `coverage_gap.gap_value === "HIGH"` (the opportunity to seize)
- The active navigation indicator
- The search cursor / focus ring
- One word in the hero headline (the emphasis word)

Everything else — including charts, bars, "competition: high" — is grayscale weight. Scarcity is what makes the accent powerful.

### Semantic mapping (functional, not decorative)
| Meaning | Treatment |
|---|---|
| Competition: none | hairline outline, `--ink-300` |
| Competition: low | `--ink-400` fill |
| Competition: medium | `--ink-600` fill |
| Competition: high | `--ink-900` solid fill |
| Opportunity (blue ocean / HIGH gap) | `--signal` |
| Organic mention | outlined bar |
| Paid impression | solid `--ink-900` bar |

### Theme strategy: dual-tone, in motion
- **Hero = inverted** (`--ink-950` canvas, `--paper` text) — dramatic, cinematic, the "dark room before the reveal."
- **Dashboard = light** (`--ink-50` canvas, `--ink-950` text) — the "lights come up, data on the table."
- The **hero→dashboard transition animates between these two worlds** (see §6). The tonal flip *is* the reveal.

---

## 3. Typography

Three voices, each with a job. Distinctive, self-hosted (woff2 in `public/fonts`), variable where possible.

### Type families
- **Display — `Fraunces` (variable serif).** High-contrast, optical-size-aware "old-style" serif. Set headlines LARGE with tight tracking and high optical size (`opsz` max), low softness. This is the editorial soul — gives gravity no sans can. Italic for emphasis/eyebrows.
- **Body / UI — `Hanken Grotesk`.** Refined neutral grotesque without the Inter look. All interface text, labels, table cells, paragraphs. Generous line-height (1.5–1.6) for reading, tight (1.2) for UI.
- **Mono — `IBM Plex Mono`.** Every *raw artifact*: prompts, probe IDs, keyword arrays, advertiser URLs, the "01 /" section numbers, timestamps. Monospace = "this is captured machine data," reinforcing the forensic concept.

### Pairing law
Fraunces (display) + Hanken (body) + Plex Mono (data). Never let Hanken try to be a headline; never let Fraunces run as body. The contrast between *literary serif* and *clinical mono* is the whole personality.

### Type scale (fluid, clamp-based)
```
--text-hero:   clamp(3.5rem, 9vw, 9rem);     /* Fraunces, the headline */
--text-display:clamp(2.5rem, 5vw, 4.5rem);   /* Fraunces, section openers */
--text-h1:     2.25rem;   /* Fraunces */
--text-h2:     1.5rem;    /* Fraunces or Hanken 600 */
--text-h3:     1.125rem;  /* Hanken 600 */
--text-body:   1rem;      /* Hanken 400 */
--text-sm:     0.875rem;  /* Hanken 400/500 */
--text-xs:     0.75rem;   /* Hanken 500, labels */
--text-mono:   0.8125rem; /* Plex Mono, data */
--text-eyebrow:0.6875rem; /* Plex Mono, UPPERCASE, tracking 0.18em */
```

### Typographic rules
- **Numbers always `font-variant-numeric: tabular-nums`** + Plex Mono for big stats. Data must align in columns like a ledger.
- Display headlines: tracking `-0.02em` to `-0.03em` (compressed, engineered — borrowed from Vercel's discipline but on a serif).
- Eyebrows / kickers: Plex Mono, uppercase, letter-spacing `0.18em`, `--ink-400`.
- Section markers: `01 / OVERVIEW`, `02 / ADS RUNNING` in mono — the broadsheet device.
- Body max line length 66ch. Never full-width paragraphs.

---

## 4. Layout & Spatial System

### Grid
- **12-column, asymmetric.** Content is deliberately *offset*, not centered-everything. Lead with a wide first column and let data tables span 8–10 cols with a 2-col annotation rail.
- Max content width `1320px`; gutters `24px` mobile → `48px` desktop.
- **Hairline rules (1px `--ink-200`) are the primary structural device** — separate sections like rules in a newspaper, not boxes. Borders over fills, always.

### Spacing scale (8px base)
```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128
```
- Marketing/hero vertical rhythm: `96–128px` section padding (the Vercel "expensive emptiness").
- Dashboard density: tighter — `24–48px`, instrument-panel economy. Calm but not sparse.

### Elevation
- **No drop shadows by default.** Elevation = hairline border + a half-step background shift (`--paper` card on `--ink-50` page).
- Shadows appear ONLY on hover-lift, and softly (`0 8px 24px rgba(10,10,10,0.08)`).

### Radius
- Sharp-leaning: `--radius-sm: 2px`, `--radius-md: 4px`, `--radius-lg: 8px`. Cards `4px`. Nothing pill-shaped except intent/tag chips. The squareness reads "engineered," not "friendly app."

---

## 5. The Signature Background — Bayer Dither Field

This is the soul of "alive at rest." A **full-viewport WebGL canvas** rendering an ordered-dither (Bayer 8×8 matrix) over slow fractal-Brownian-motion noise. Monochrome by nature → perfectly on-brand. Renders <0.2ms even at 4K, ~3KB, zero network after load.

### Behavior
- **Hero:** dense, visible dither over near-black — like film grain on a dark photograph, slowly drifting. Mouse movement creates a subtle gravitational warp / ripple in the field (distance-attenuated). Clicking sends a quiet ripple ring outward.
- **Dashboard:** the same field but **dialed to ~3% opacity** behind the light canvas — present as texture, never competing with data.
- The transition **inverts the field's threshold** as the theme flips dark→light (the dots "develop" like a photograph in a darkroom — our reveal metaphor made literal).

### Fallbacks & guardrails
- `prefers-reduced-motion` → freeze the field to a static dithered still (no drift, no ripple).
- No WebGL / low-power → CSS fallback: a static SVG/PNG grain overlay (`mix-blend-mode: multiply`, 4% opacity, `pointer-events:none`).
- The field NEVER reduces text contrast below WCAG AA. Text always sits on a solid or near-solid ink/paper layer above the field.

### Secondary texture
A persistent **film-grain overlay** (`GrainOverlay`, fixed, `mix-blend-multiply`, 3–5%, pointer-events-none) on top of everything — kills any flat-SaaS feel even where the shader is faint.

---

## 6. Motion Language

Motion is **mechanical and confident**, never bouncy/playful. Think *precision instrument*, not *toy*. One spring preset, one easing curve, defined once in `motion/transitions.ts` and reused everywhere — coherence over variety. All non-trivial motion gated behind `useReducedMotion()`.

### Easing & timing tokens
```
--ease-out:   cubic-bezier(0.16, 1, 0.3, 1);   /* the house curve — decisive deceleration */
--ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
--spring:     { type: spring, stiffness: 260, damping: 30, mass: 1 }  /* Motion */
--dur-fast: 180ms;  --dur-base: 320ms;  --dur-slow: 600ms;
```

### Signature moments (where the budget goes)
1. **Hero load — staggered reveal.** `staggerChildren: 0.08`. Order: eyebrow (mono) → display headline (clip-path mask-reveal, line slides up under `overflow:hidden`) → search bar (scale 0.96→1 + fade) → suggestion chips (stagger). One orchestrated entrance beats scattered micro-animations.
2. **Hero → Dashboard — THE moment.** The search bar carries `layoutId="recon-search"` and **physically morphs** from hero-center into the compact search in the dashboard header. Simultaneously: theme flips dark→light, the dither field "develops" (threshold inverts), and dashboard content enters after the morph settles. This single transition is the product's wow.
3. **Number count-ups.** Every stat (`total_ads`, `ad_rate_pct`, shares) animates from 0 on `whileInView` via `useMotionValue`+`animate`+rounding. Tabular-nums so digits don't jitter width.
4. **Bar/meter growth.** `IntentMeter` and competitor bars animate `scaleX` 0→1, transform-origin left (GPU-cheap).
5. **Card reveals.** `whileInView`, `viewport={{once:true, margin:'-10%'}}`, `fadeUp` (y:16→0 + fade), index-based delay capped so long lists never lag.
6. **The "reveal" framing.** When ads first appear in the gallery, cards uncover with a brief clip-path wipe (left→right), echoing the "curtain lifting on a hidden auction" concept.

### Micro-interactions
- Ad cards: `whileHover` lift `y:-4` + soft shadow + hairline border brightens.
- Nav: active indicator is a shared-`layoutId` underline that slides between tabs.
- Buttons: background fills from one edge on hover (`--ink-950` wipe), text inverts to `--paper`.
- View switching: `AnimatePresence mode="wait"`, crossfade + 8px slide.

### Performance law
Transform & opacity only. Virtualize the prompts table; animate its container once, never per-row. The dither field is the only continuous animation; everything else is event/scroll-triggered.

---

## 7. Component Specs (the vocabulary)

### StatCard
Big tabular Plex-Mono numeral (count-up), Hanken label above in eyebrow style, optional delta in `--ink-400`. No box — separated by hairline rules in a row. Accent only if the stat is itself a signal.

### AdCreativeCard (the showpiece)
`--paper` surface, `4px` radius, hairline border. Layout:
- Top: advertiser name (Hanken 600) + a mono `SPONSORED` tag.
- Middle: ad title (Fraunces, small) + body (Hanken).
- Bottom rail (`--ink-100` inset): the **triggering prompt** in Plex Mono with a `▸ TRIGGERED BY` mono kicker — this is the load-bearing detail; treat it with reverence.
- Chips: persona, need, `IntentMeter`. Competitors-in-response as small mono tags.
- Hover: lift + reveal a faint signal-blue hairline at the base.

### IntentMeter
0–10 horizontal bar. Grayscale fill up to the value; if `>= 7`, the fill is signal blue. Mono numeral at the end. Animates `scaleX` on reveal.

### Tag / Pill
Pill (the only rounded thing). Mono text, uppercase, `0.1em` tracking. Variants: competition level (grayscale weight), gap_value (HIGH = signal), intent. Outlined by default, filled when "active."

### CompetitorRow
A ledger row: rank (mono) · company (Hanken) · a split bar (outlined organic + solid paid) · total share (mono, right-aligned, tabular). Expand → drawer with sample copy & prompts (mono, truncation-safe with ellipsis).

### SearchBar (hero centerpiece)
Oversized. A single hairline-underlined input (no box — just a baseline rule that thickens + turns signal blue on focus), Fraunces-scale placeholder ("name your industry…"), a blinking mono caret. Typeahead suggestions drop as a hairline-separated mono list. Carries `layoutId="recon-search"`.

### HairlineRule / SectionHeading
Section heads: mono number `02 /` + Fraunces title on a full-width hairline rule. The recurring broadsheet beat.

### Empty states
Editorial, never cute. Blue-ocean empty: a centered mono line — *"NO ZERO-AD HIGH-INTENT CLUSTERS DETECTED."* — on the dither field. Confidence, not apology.

---

## 8. Voice & Microcopy

Terse, technical, confident. Reconnaissance log, not marketing.
- Labels in mono uppercase: `ADS OBSERVED`, `TRIGGERED BY`, `COVERAGE GAP`, `BLUE OCEAN`.
- Numbers lead sentences. ("12.9% of prompts surfaced an ad.")
- Hero headline candidate: *"See the ads **hiding** inside ChatGPT."* (emphasis word = signal blue, italic Fraunces).
- No exclamation marks. No "Welcome!" No emoji. The tone is a quiet expert handing you a dossier.

---

## 9. Accessibility (non-negotiable)
- WCAG AA contrast on all text; the dither field never sits directly behind body text without a solid layer.
- Full keyboard nav; visible focus = signal-blue ring.
- `prefers-reduced-motion`: freeze dither, disable count-ups/reveals/morph (instant state swap), keep layout.
- Respect tabular-nums and real `<table>` semantics for the prompts explorer (screen-reader friendly).
- Hit targets ≥ 44px; chips remain legible at min size.

---

## 10. Design Tokens (implementation contract → Tailwind / CSS vars)

```ts
// tailwind.config.ts theme.extend (abridged)
colors: { ink: { 950:'#0A0A0A',900:'#141414',800:'#1F1F1F',700:'#2E2E2E',
                 600:'#525252',500:'#6B6B6B',400:'#A3A3A3',300:'#C9C9C9',
                 200:'#E5E5E5',100:'#F2F2F2',50:'#FAFAFA' },
         paper:'#FFFFFF', signal:'#1A3CFF' },
fontFamily: { display:['Fraunces','serif'], sans:['Hanken Grotesk','sans-serif'],
              mono:['IBM Plex Mono','monospace'] },
borderRadius: { sm:'2px', md:'4px', lg:'8px' },
// spacing uses default 8px scale; ease/dur tokens as CSS vars in index.css
```

---

## 11. The Litmus Test

Before shipping any screen, ask:
1. Could this be mistaken for a generic AI dashboard template? → If yes, it fails.
2. Is the accent used only on true signal? → If it's decorative, remove it.
3. Does it feel like a *precision instrument revealing something hidden*? → If it feels like a brochure, push harder.
4. At rest, is it calm and editorial? On interaction, does it feel alive and mechanical? → Both must be true.
5. Do the numbers align like a ledger (tabular, mono)? → Data must look authoritative.

If all five pass, it's on brand.
