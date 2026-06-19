# Dashboard UX Flow — Complete Specification

## North Star

**A user lands on the dashboard, types an industry, and instantly sees which companies are running ads on ChatGPT — and on what exact prompts those ads appear.**

Every screen, button, and interaction serves this flow. The dashboard is a search-first discovery tool, not a management console.

---

## The Primary Flow (60 seconds to insight)

```
LANDING (not blank)
  → TYPE INDUSTRY (or select from directory)
    → INDUSTRY OVERVIEW (ad rate, top advertisers, ad count)
      → CLICK ADVERTISER (split pane opens)
        → SEE THEIR ADS (creatives + triggering prompts)
          → CLICK AD (drawer opens)
            → SEE EXACT PROMPT + CHATGPT RESPONSE + AD CREATIVE
              → ACTION: save, export, compare, share
```

### Timing targets
| Step | Target |
|---|---|
| Landing to typing | < 3s (page load + search focused) |
| Typing to industry results | < 1s (instant, from pre-loaded data) |
| Results to first advertiser drill | < 5s (user scanning) |
| Advertiser to ad detail | < 1s (drawer slide) |
| Ad to triggering prompt | < 1s (same drawer, scroll) |
| Total: landing to "aha" | < 60s |

---

## Screen 1 — Landing / Home

### What the user sees
A search-first surface. NOT a blank dashboard. NOT a login wall. The search bar is the hero.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  GPT ADS LIBRARY                    [⌘K]  [dark/light] │
│                                                       │
│                                                       │
│              Who's advertising on ChatGPT?            │
│                                                       │
│         ╔═════════════════════════════════════╗       │
│         ║  Search an industry or topic...     ║       │
│         ║  e.g. "crypto exchanges"            ║       │
│         ╚═════════════════════════════════════╝       │
│                                                       │
│         Or browse:                                    │
│         [Stablecoin & Payments] [Pre-IPO Stocks]      │
│         [Real Estate] [Crypto Exchanges] [+ Add]      │
│                                                       │
│  ───────────────────────────────────────────────────  │
│  RECENTLY PROBED                                      │
│  Stablecoin & Payments · 116 probes · 9 ads found     │
│  SpaceX Pre-IPO · 100 probes · 5 ads found             │
│  Bybit Exchange · 100 probes · 8 ads found             │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Elements
| Element | Purpose | Behavior |
|---|---|---|
| **Search bar (hero)** | Primary entry point | Focused on load. Type → instant autocomplete from industry registry + aliases. Enter → loads industry. |
| **Industry chips** | Quick access to existing datasets | Click → loads that industry's data instantly |
| **+ Add chip** | Initiate new industry probe | Opens modal: "What industry do you want to probe?" → creates new dataset entry (triggers scrape flow) |
| **Recently probed list** | Show what's available | Each row: industry name, probe count, ad count, last updated. Click → loads. |
| **⌘K hint** | Power user entry | Opens command palette (search industries, jump to advertisers, run actions) |
| **Dark/light toggle** | Theme switch | Circle reveal animation via View Transitions API |

### Search bar behavior
- **Pre-query (empty, focused):** Show placeholder + recent searches below the bar
- **As you type (150ms debounce):** Instant fuzzy match against industry registry. Shows matching industries + aliases. E.g. "crypto" → matches "Crypto Exchanges", "Stablecoin & Payments" (alias: crypto)
- **No match:** Shows "No industry found. Probe a new one? →" which opens the new-industry modal
- **Enter:** Loads the selected industry → transitions to Screen 2

### What happens when data doesn't exist yet
If the user types an industry we haven't probed:
1. Search shows: "No data for 'AI tools' yet. Probe it now? →"
2. Click → modal: "Probe 'AI tools'" with persona count, estimated time, cost
3. Confirm → starts batch probe in background → returns to landing with "Probe running..." indicator
4. When complete → notification appears → click loads the new industry

---

## Screen 2 — Industry Overview

### What the user sees
The moment an industry loads, the user sees a pulse: how active is this market on ChatGPT?

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  GPT ADS LIBRARY  /  Stablecoin & Payments    [⌘K] [◐]    │
│  ───────────────────────────────────────────────────────  │
│  [Ads] [Prompts] [Advertisers] [Landscape]                │
│  ───────────────────────────────────────────────────────  │
│                                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │   116  │ │    9   │ │   5    │ │  7.8%  │ │   4    │  │
│  │ PROBES │ │  ADS   │ │ADVERT- │ │AD RATE │ │  ORG   │  │
│  │        │ │FOUND   │ │ISERS   │ │        │ │MENTIONS│  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
│                                                           │
│  AD DENSITY BY PERSONA                                    │
│  Developer integrating payments  ████████░░  12% 3 ads    │
│  Treasury manager seeking yield  ████░░░░░░  5%  1 ad     │
│  SMB owner needing payments      ██░░░░░░░░  3%  0 ads    │
│  Investor researching stablecoins██████░░░░  8%  2 ads    │
│                                                           │
│  ───────────────────────────────────────────────────────  │
│  WHO'S ADVERTISING                WHO'S MENTIONED         │
│  (paid)                           (organic, no ad)        │
│                                                           │
│  #  ADVERTISER    ADS  SHARE      #  COMPANY    MENTIONS  │
│  01 Mastercard     3   ████       01 Circle      47       │
│  02 BestMoney      2   ███        02 Stripe      38       │
│  03 Astra          1   ██         03 Ripple      29       │
│  04 wolfSSL        1   ██         04 Chainlink   22       │
│  05 Rippling       1   ██         05 Compound    18       │
│                                                           │
│  BLUE OCEAN (high intent, zero ads)                       │
│  "how to accept stablecoin payments on my website"        │
│  "cheapest way to receive USDC from clients"              │
│  "stablecoin treasury management for small business"      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Elements & behaviors

| Section | What it shows | Interaction |
|---|---|---|
| **KPI strip** | Probes, ads found, unique advertisers, ad rate %, organic mention count | Spring count-up on viewport entry. Tabular nums. |
| **Ad density by persona** | Bar chart: which user personas trigger ads most | Click a bar → filters to that persona's prompts |
| **Who's advertising (paid)** | Ranked table of advertisers running ads, sorted by ad count | Click a row → Screen 3 (advertiser detail, split pane) |
| **Who's mentioned (organic)** | Companies ChatGPT recommends without ads | Click a row → shows which prompts mentioned them |
| **Blue ocean** | High-intent prompts with zero ads — the gap | Click a prompt → shows the full ChatGPT response for that prompt |

### View tabs
| Tab | Content |
|---|---|
| **Ads** | Gallery of all ad creatives found in this industry (Screen 2a) |
| **Prompts** | All probed prompts ranked by intent + ad surfacing (Screen 2b) |
| **Advertisers** | Paid vs organic leaderboard (Screen 2c) |
| **Landscape** | Competitive landscape: who's in, who's missing, where the gaps are |

### URL state
```
/?industry=stablecoin-payments&view=overview
```
Every view change updates the URL. Back button works. Shareable.

---

## Screen 2a — Ads Gallery

### What the user sees
Every ad creative observed in this industry, as cards.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  GPT ADS LIBRARY / Stablecoin & Payments  [⌘K] [◐]       │
│  [Ads] [Prompts] [Advertisers] [Landscape]                │
│  ───────────────────────────────────────────────────────  │
│  Filter: [All advertisers ▾]  [All personas ▾]  [Clear]  │
│  ───────────────────────────────────────────────────────  │
│  9 creatives observed                                     │
│                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ Mastercard  │ │ BestMoney   │ │ Astra       │         │
│  │ "Secure     │ │ "Compare    │ │ "Financial  │         │
│  │ cross-border│ │ lending     │ │ tools for   │         │
│  │ payments"   │ │ rates"      │ │ SMBs"       │         │
│  │             │ │             │ │             │         │
│  │ Triggered   │ │ Triggered   │ │ Triggered   │         │
│  │ by: "how to │ │ by: "best   │ │ by: "crypto │         │
│  │ send money   │ │ loan rates  │ │ payments    │         │
│  │ overseas..."│ │ online"     │ │ for small   │         │
│  │             │ │             │ │ business"   │         │
│  │ [View detail]│ │ [View detail]│ │ [View detail]│        │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Ad creative card
Each card shows:
| Element | Content |
|---|---|
| Advertiser name | Bold, top of card |
| Ad title | The ad headline |
| Ad body | Preview (truncated, click to expand) |
| Triggering prompt | The exact prompt that surfaced this ad (truncated) |
| Persona tag | Which user persona this prompt maps to |
| View detail button | Opens Screen 4 (ad detail drawer) |

### Filters
- **Advertiser dropdown:** All / Mastercard / BestMoney / etc. (with counts)
- **Persona dropdown:** All / Developer / Treasury / SMB / Investor (with counts)
- **Active filter chips:** Show above gallery, each removable with ×
- **Clear all:** One click resets

### Card interaction
- **Hover:** Subtle elevation (surface-2 + border-strong), 150ms
- **Click "View detail":** Opens right drawer (Screen 4) with full ad + prompt + ChatGPT response
- **Click card body:** Same as View detail

---

## Screen 2b — Prompts View

### What the user sees
Every probed prompt, ranked by value (intent score + whether an ad surfaced).

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Ads] [Prompts] [Advertisers] [Landscape]                │
│  ───────────────────────────────────────────────────────  │
│  [Search prompts...]  [☐ Ads only]  [By value ▾]         │
│  ───────────────────────────────────────────────────────  │
│  116 probed                                               │
│                                                           │
│  01 ██████████ "how to accept stablecoin payments..."     │
│     developer · integrating payments · intent: 9 · 2 ads  │
│                                                           │
│  02 █████████░ "cheapest way to receive USDC from..."     │
│     smb · receiving payments · intent: 8 · 0 ads          │
│                                                           │
│  03 ████████░░ "best stablecoin for business treasury"    │
│     treasury · yield · intent: 7 · 1 ad                   │
│                                                           │
│  ...                                                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Row elements
| Element | Content |
|---|---|
| Rank number | Position in sorted list |
| Value bar | Visual width proportional to rank score (intent + ad bonus) |
| Prompt text | Full prompt (truncated, click to expand) |
| Persona tag | Which persona |
| Need tag | Primary need category |
| Intent score | 0-10 numeric |
| Ad count | "2 ads" or "—" if none |

### Interactions
| Action | Result |
|---|---|
| **Search prompts** | Filters by text match (instant, 150ms debounce) |
| **Ads only toggle** | Shows only prompts that surfaced ads |
| **Sort: By value** | intent_score + ad_bonus + ad_count |
| **Sort: By intent** | Pure intent score |
| **Click a row** | Opens drawer (Screen 5) with full ChatGPT response + ads + citations |

---

## Screen 2c — Advertisers View

### What the user sees
Split: who's paying (running ads) vs who's mentioned organically (ChatGPT recommends them but they don't pay).

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Ads] [Prompts] [Advertisers] [Landscape]                │
│  ───────────────────────────────────────────────────────  │
│  RUNNING ADS (3)                    MENTIONED ORGANICALLY │
│                                    (no ad, 22 companies)  │
│  ┌──────────────┐                  01  Circle      47    │
│  │ Mastercard   │                  02  Stripe      38    │
│  │ 3 ads        │                  03  Ripple      29    │
│  │ 4 appearances│                  04  Chainlink   22    │
│  │ [View ads →] │                  05  Compound    18    │
│  └──────────────┘                  06  Aave        15    │
│  ┌──────────────┐                  07  MakerDAO    14    │
│  │ BestMoney    │                  ...                    │
│  │ 2 ads        │                                         │
│  │ 3 appearances│                                         │
│  └──────────────┘                                         │
│  ┌──────────────┐                                          │
│  │ Astra        │                                          │
│  │ 1 ad         │                                          │
│  └──────────────┘                                          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Paid advertiser card
| Element | Content |
|---|---|
| Company name | Bold |
| Ad count | Number of unique ad creatives |
| Appearances | Total times their ads appeared across prompts |
| "View ads →" | Opens Screen 3 (advertiser detail) |

### Organic leaderboard
| Element | Content |
|---|---|
| Rank | Position by mention count |
| Company name | The company ChatGPT recommended |
| Mention count | How many prompts referenced them |
| Click row | Shows which prompts mentioned this company (filter prompts view) |

### Key insight this surface delivers
The split itself is the insight: **Circle is recommended 47 times but doesn't pay for a single ad. Mastercard pays for 3 ads but is recommended 0 times organically.** That's the competitive intelligence.

---

## Screen 3 — Advertiser Detail (Split Pane)

### What the user sees
When the user clicks a paid advertiser, a split pane opens. Left: list of their ads. Right: detail of the selected ad.

### Layout
```
┌──────────────────────────────────────────────────────────┐
│  GPT ADS LIBRARY / Stablecoin & Payments / Mastercard     │
│  [Ads] [Prompts] [Advertisers] [Landscape]                │
│  ──────────────────────────────────────────────────────── │
│  ← Back to industry                                       │
│                                                           │
│  MASTERCARD                                               │
│  3 ads · 4 appearances · 0 organic mentions               │
│                                                           │
│  ┌────────────────────┐  ┌────────────────────────────┐  │
│  │ AD CREATIVES       │  │ AD DETAIL                   │  │
│  │                    │  │                             │  │
│  │ ● Secure cross-    │  │ "Secure cross-border        │  │
│  │   border payments  │  │  payments"                  │  │
│  │   [SELECTED]       │  │                             │  │
│  │                    │  │ Mastercard                  │  │
│  │ ○ Send money       │  │                             │  │
│  │   overseas faster  │  │ Body: "Send payments to     │  │
│  │                    │  │ 160+ countries with..."     │  │
│  │ ○ Multi-currency   │  │                             │  │
│  │   account          │  │ TRIGGERED BY:               │  │
│  │                    │  │ "how to send money          │  │
│  └────────────────────┘  │  overseas without high      │  │
│                          │  fees"                      │  │
│                          │                             │  │
│                          │ PERSONA: Developer          │  │
│                          │ NEED: Cross-border payments │  │
│                          │ INTENT: 8/10                │  │
│                          │                             │  │
│                          │ [View full ChatGPT response]│  │
│                          │ [See all triggering prompts] │  │
│                          └────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Left pane: ad list
| Element | Behavior |
|---|---|
| Ad title (truncated) | Click → loads in right pane |
| Selected state | Accent left border + surface-2 bg |
| Scroll | Independent of right pane |

### Right pane: ad detail
| Element | Content |
|---|---|
| Ad title | Full headline |
| Advertiser | Company name |
| Ad body | Full body copy |
| Triggered by | The exact prompt that surfaced this ad |
| Persona | Classified user type |
| Need | Primary need category |
| Intent score | 0-10 |
| "View full ChatGPT response" | Opens Screen 5 (prompt drawer) |
| "See all triggering prompts" | Shows all prompts that surfaced this ad |

### Navigation
| Action | Result |
|---|---|
| **← Back to industry** | Returns to industry overview, restores scroll/filters |
| **Click another ad in left pane** | Updates right pane, URL updates |
| **Breadcrumb** | `Library / Stablecoin & Payments / Mastercard` — each crumb is clickable |

### URL state
```
/?industry=stablecoin-payments&view=advertiser&advertiser=mastercard&ad=ad_001
```

---

## Screen 4 — Ad Detail Drawer (Right Slide-Over)

### What the user sees
From the Ads Gallery, clicking "View detail" on a card opens a right drawer with the full ad + the exact prompt + the ChatGPT response.

### Layout
```
                                    ┌──────────────────────┐
                                    │  AD DETAIL         ✕  │
                                    │                      │
                                    │  Mastercard          │
                                    │  "Secure cross-      │
                                    │   border payments"   │
                                    │                      │
                                    │  Body:               │
                                    │  "Send payments to   │
                                    │  160+ countries..."  │
                                    │                      │
                                    │  ──────────────────  │
                                    │  TRIGGERED BY:       │
                                    │                      │
                                    │  "how to send money  │
                                    │  overseas without    │
                                    │  high fees"          │
                                    │                      │
                                    │  Persona: Developer  │
                                    │  Intent: 8/10        │
                                    │  Structure: question │
                                    │                      │
                                    │  ──────────────────  │
                                    │  CHATGPT RESPONSE:   │
                                    │                      │
                                    │  "To send money      │
                                    │  overseas without    │
                                    │  high fees, consider │
                                    │  these options:      │
                                    │  1. Wise (formerly   │
                                    │  TransferWise)...    │
                                    │  2. Revolut...       │
                                    │  3. Mastercard...    │
                                    │  [AD APPEARS HERE]"  │
                                    │                      │
                                    │  ──────────────────  │
                                    │  CITATIONS:          │
                                    │  • wise.com          │
                                    │  • revolut.com       │
                                    │                      │
                                    │  ──────────────────  │
                                    │  [Save] [Export]     │
                                    │  [Compare] [Share]   │
                                    │                      │
                                    └──────────────────────┘
```

### Drawer elements
| Element | Content |
|---|---|
| Advertiser + title + body | Full creative |
| Triggered by | Exact prompt |
| Classification | Persona, need, intent score, prompt structure |
| ChatGPT response | Full text of what ChatGPT answered (with ad placement visible) |
| Citations | Sources ChatGPT referenced |
| Action buttons | Save, Export, Compare, Share |

### Action buttons
| Button | Behavior |
|---|---|
| **Save** | Adds to user's saved/swipe file (localStorage for V1) |
| **Export** | Downloads this ad + prompt + response as JSON or PDF |
| **Compare** | Opens comparison view — select another ad to compare side-by-side |
| **Share** | Copies shareable URL to clipboard |

### Drawer behavior
| Action | Result |
|---|---|
| **Slide in** | 250ms spring from right edge |
| **Escape / ✕ / click outside** | Slides out, restores focus to triggering card |
| **Scroll** | Independent scroll within drawer, body scroll locked |
| **Reduced motion** | Instant show/hide |

---

## Screen 5 — Prompt Detail Drawer

### What the user sees
From the Prompts view, clicking a row opens a drawer with the full prompt + full ChatGPT response + any ads that appeared + citations.

### Layout
```
                                    ┌──────────────────────┐
                                    │  PROMPT DETAIL     ✕  │
                                    │                      │
                                    │  [developer]         │
                                    │  [question]          │
                                    │  [ad surfaced]       │
                                    │                      │
                                    │  ──────────────────  │
                                    │  PROMPT:             │
                                    │                      │
                                    │  "how to accept      │
                                    │  stablecoin payments  │
                                    │  on my website"      │
                                    │                      │
                                    │  ──────────────────  │
                                    │  CHATGPT RESPONSE:   │
                                    │                      │
                                    │  "To accept          │
                                    │  stablecoin payments  │
                                    │  on your website,    │
                                    │  you can use:        │
                                    │  1. Circle...        │
                                    │  2. Coinbase...      │
                                    │  3. USDC...          │
                                    │  [AD: Mastercard]"   │
                                    │                      │
                                    │  ──────────────────  │
                                    │  ADS SURFACED (2):   │
                                    │                      │
                                    │  ┌─────────────────┐ │
                                    │  │ Mastercard      │ │
                                    │  │ "Secure cross-  │ │
                                    │  │ border payments"│ │
                                    │  │ [View ad →]     │ │
                                    │  └─────────────────┘ │
                                    │  ┌─────────────────┐ │
                                    │  │ BestMoney       │ │
                                    │  │ "Compare lending│ │
                                    │  │ rates"          │ │
                                    │  │ [View ad →]     │ │
                                    │  └─────────────────┘ │
                                    │                      │
                                    │  ──────────────────  │
                                    │  CITATIONS:          │
                                    │  • circle.com        │
                                    │  • usdc.org          │
                                    │                      │
                                    │  [Save] [Export]     │
                                    │  [Share]             │
                                    │                      │
                                    └──────────────────────┘
```

### Key difference from Ad Detail Drawer
This drawer is prompt-centric. It shows what ChatGPT answered AND all ads that appeared. The user can click any ad to jump to the Ad Detail Drawer. This is the "which prompts trigger ads" view.

---

## Screen 6 — Landscape View

### What the user sees
The competitive landscape: who's in, who's missing, where the gaps are.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Ads] [Prompts] [Advertisers] [Landscape]                │
│  ───────────────────────────────────────────────────────  │
│                                                           │
│  COMPETITIVE MAP                                          │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │                    ADVERTISING                    │    │
│  │                    ┌──────────┐                   │    │
│  │                    │Mastercard│                   │    │
│  │                    │  3 ads   │                   │    │
│  │         ┌──────────┤BestMoney ├──────────┐        │    │
│  │         │Astra     │  2 ads   │ wolfSSL  │        │    │
│  │         │  1 ad    └──────────┘  1 ad    │        │    │
│  │         └──────────────────────────────────┘        │    │
│  │                                                    │    │
│  │  ─── NOT ADVERTISING BUT RECOMMENDED ──────────   │    │
│  │                                                    │    │
│  │  Circle  Stripe  Ripple  Chainlink  Compound       │    │
│  │  Aave    MakerDAO Uniswap  Curve    Compound       │    │
│  │                                                    │    │
│  │  ─── NEITHER ADVERTISING NOR RECOMMENDED ───────  │    │
│  │                                                    │    │
│  │  [Your company could be here]                      │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  GAPS & OPPORTUNITIES                                     │
│                                                           │
│  High-intent prompts with ZERO ads:                       │
│  • "how to accept stablecoin payments on my website"      │
│    (intent: 9, 0 ads, 14 organic mentions of Circle)      │
│  • "cheapest way to receive USDC from clients"             │
│    (intent: 8, 0 ads, 0 organic mentions)                 │
│  • "stablecoin treasury management for small business"     │
│    (intent: 7, 0 ads, 3 organic mentions of Stripe)       │
│                                                           │
│  [Probe these prompts →]                                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Sections
| Section | Content |
|---|---|
| **Competitive map** | Visual: advertising companies (top) → recommended but not paying (middle) → completely absent (bottom) |
| **Gaps & opportunities** | High-intent prompts with zero ads, sorted by intent score |
| **"Probe these prompts"** | Action button to run more probes on the gap prompts |

### The insight this delivers
1. **Who's paying** — the actual advertisers (small list)
2. **Who's recommended but not paying** — the companies ChatGPT favors (they're getting free traffic)
3. **Who's absent** — the blue ocean (neither paying nor recommended)
4. **Where the gaps are** — specific prompts with high intent but zero ads

---

## Command Palette (⌘K)

### What it does
Global search + navigation + actions, accessible from anywhere.

### Layout
```
                    ┌──────────────────────────────┐
                    │  Search or jump to...         │
                    │  ──────────────────────────── │
                    │  RECENT                       │
                    │  → Stablecoin & Payments      │
                    │  → Mastercard (advertiser)    │
                    │  → "how to accept stable..."  │
                    │                               │
                    │  INDUSTRIES                   │
                    │  → Stablecoin & Payments      │
                    │  → SpaceX Pre-IPO             │
                    │  → Crypto Exchanges           │
                    │  → Real Estate                │
                    │                               │
                    │  ACTIONS                      │
                    │  → Probe new industry         │
                    │  → Export current view         │
                    │  → Toggle theme               │
                    │                               │
                    │  ↑↓ navigate · ⏎ select · esc │
                    └──────────────────────────────┘
```

### Behavior
| State | Behavior |
|---|---|
| **Open** | ⌘K or Ctrl+K from anywhere. Input focused. |
| **Type** | 150ms debounce. Fuzzy match across: industries, advertisers, prompts, actions. |
| **Navigate** | ↑↓ keys. Virtual focus (aria-activedescendant). |
| **Select** | Enter → navigates to selected entity or runs action. |
| **Close** | Escape or click outside. |

---

## Complete Button Reference

### Global buttons
| Button | Location | Behavior |
|---|---|---|
| ⌘K | Header | Opens command palette |
| Theme toggle (◐) | Header | Dark/light circle reveal |
| ← Back | Detail views | Returns to parent, restores state |
| ✕ Close | Drawers | Closes drawer, restores focus |

### Search & filter buttons
| Button | Location | Behavior |
|---|---|---|
| Search input | Landing, Overview, Prompts | Type → instant results |
| Advertiser filter | Ads gallery | Dropdown, multiselect, with counts |
| Persona filter | Ads gallery, Prompts | Dropdown, with counts |
| "Ads only" toggle | Prompts | Shows only prompts with ads |
| Sort toggle | Prompts | By value / By intent |
| Filter chip × | Anywhere with filters | Removes one filter |
| "Clear all" | Anywhere with filters | Removes all filters |

### Action buttons
| Button | Location | Behavior |
|---|---|---|
| View detail | Ad card | Opens ad detail drawer |
| View full response | Ad detail | Opens prompt detail drawer |
| View ads → | Advertiser card | Opens advertiser detail (split pane) |
| Save | Ad/Prompt drawer | Saves to swipe file (localStorage) |
| Export | Ad/Prompt drawer | Downloads JSON/PDF |
| Compare | Ad drawer | Opens comparison mode |
| Share | Ad/Prompt drawer | Copies URL to clipboard |
| Probe these prompts | Landscape | Runs new probes on gap prompts |
| + Add industry | Landing | Opens new industry probe modal |

### Navigation
| Element | Behavior |
|---|---|
| View tabs (Ads/Prompts/Advertisers/Landscape) | Switch view, update URL, animate transition |
| Breadcrumb | Click any crumb → navigate to that level |
| Industry chips (landing) | Click → load industry |
| Recently probed (landing) | Click → load industry |

---

## State Management

### URL parameters (shareable, bookmarkable)
```
/?industry=stablecoin-payments
 &view=ads|prompts|advertisers|landscape
 &advertiser=mastercard
 &ad=ad_001
 &prompt=prompt_042
 &f_advertiser=mastercard,bestmoney
 &f_persona=developer
 &sort=value|intent
 &ads_only=true|false
 &tab=ads|prompts|advertisers|landscape
```

### What's stored in URL
| Param | Purpose |
|---|---|
| `industry` | Which industry dataset is loaded |
| `view` | Which tab/view is active |
| `advertiser` | Selected advertiser (split pane) |
| `ad` | Selected ad (detail) |
| `prompt` | Selected prompt (detail) |
| `f_*` | Active filters |
| `sort` | Sort mode |
| `ads_only` | Boolean filter |

### What's stored in localStorage
| Key | Purpose |
|---|---|
| `theme` | dark/light preference |
| `recent_industries` | Last 5 visited industries |
| `recent_searches` | Last 10 searches in command palette |
| `saved_ads` | User's swipe file |
| `scroll_positions` | Per-industry scroll restoration |

### What's stored in memory only
| Key | Purpose |
|---|---|
| `drawer_open` | Whether detail drawer is open |
| `split_pane_width` | User-adjusted pane width |
| `expanded_rows` | Which table rows are expanded |

---

## Empty & Zero-Result States

### No industry data yet
```
┌───────────────────────────┐
│  No data for "AI tools"   │
│                           │
│  Probe this industry?     │
│  ~100 prompts · ~15 min   │
│  ~$2.50 in API costs      │
│                           │
│  [Probe now]  [Maybe later]│
└───────────────────────────┘
```

### No ads found in industry
```
┌───────────────────────────┐
│  0 ads observed            │
│  across 116 probes         │
│                           │
│  This is a blue ocean.    │
│  No one is advertising    │
│  on ChatGPT for this      │
│  industry yet.            │
│                           │
│  [View high-intent prompts]│
└───────────────────────────┘
```

### No search results
```
┌───────────────────────────┐
│  No matches for "xyz"     │
│                           │
│  Try:                     │
│  • Broader terms           │
│  • Different industry      │
│  • Clear filters           │
│                           │
│  [Clear filters]           │
└───────────────────────────┘
```

### Probe still running
```
┌───────────────────────────┐
│  Probe running...          │
│                           │
│  42/100 prompts complete   │
│  ████████░░░░░░░░          │
│                           │
│  3 ads found so far        │
│                           │
│  [View partial results]    │
└───────────────────────────┘
```

---

## Loading States

| State | Pattern |
|---|---|
| **Industry loading** | Skeleton cards for KPI strip + table rows. Shimmer pulse. Linear easing. |
| **Ad gallery loading** | Skeleton card grid (same shape as final cards) |
| **Drawer loading** | Skeleton text lines inside drawer |
| **Search typing** | Previous results stay visible (stale-while-revalidate). No blank flash. |
| **Probe running** | Progress bar + count + partial results available |

---

## Transitions & Animations

| Transition | Duration | Easing | Technique |
|---|---|---|---|
| Landing → industry overview | 400ms | Spring (stiff 300, damp 30) | Theme morph + staggered card cascade |
| View tab switch | 250ms | Spring | AnimatePresence mode="wait" — exit then enter |
| Drawer open | 250ms | Spring | Slide from right, opacity fade |
| Drawer close | 200ms | Spring | Slide right, opacity fade |
| KPI count-up | 800ms | Spring | 0 → target, tabular-nums |
| Card hover | 150ms | ease-out | Surface-2 bg + border-strong |
| Card click | 100ms | Spring (stiff 500) | Scale 0.98 press feedback |
| Filter chip add | 200ms | Spring | Scale + opacity in |
| Filter chip remove | 150ms | ease-in | Scale + opacity out |
| Theme toggle | 400ms | ease-in-out | View Transitions API circle reveal |
| Row stagger (tables) | 40ms per row | ease-out | Cascading opacity + translateY |
| Command palette open | 200ms | Spring | Scale + opacity from center |
| Breadcrumb navigation | 300ms | Spring | Shared-element layout transition |

---

## Accessibility

| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | All interactive elements reachable via Tab. Arrow keys for lists. Enter to select. Escape to close. |
| **Screen reader** | aria-live for result counts. aria-activedescendant for command palette. Proper roles for tabs, drawers, tables. |
| **Focus management** | Focus moves to drawer on open, returns to trigger on close. Focus trap within modals. |
| **Color contrast** | All text ≥ AAA on dark. Accent ≥ AAA. Status colors ≥ AA. |
| **Reduced motion** | `prefers-reduced-motion` → instant show/hide, no count-up, no stagger. |
| **Font scaling** | Rem-based. Works at 200% zoom. |

---

## Mobile Responsive

| Screen | Mobile adaptation |
|---|---|
| Landing | Search bar full-width. Chips wrap. Recent list stacks. |
| Industry overview | KPI strip → 2x3 grid. Tables → cards. Landscape map stacks vertically. |
| Ads gallery | Single column. Cards full-width. |
| Prompts | Full-width rows. Drawer → bottom sheet. |
| Advertiser detail (split pane) | Becomes stacked: ad list on top, detail below. Or drawer overlay. |
| Drawers | Slide from bottom (bottom sheet) instead of right. |
| Command palette | Full-screen modal. |
| Filters | Behind "Filters (n)" button → slide-out drawer. |

---

## The Complete User Journey

### First-time user
1. **Lands on page** → sees search bar + industry chips + recent activity
2. **Clicks "Stablecoin & Payments"** chip → industry loads
3. **Sees KPI strip** count up: 116 probes, 9 ads, 5 advertisers, 7.8% ad rate
4. **Scans "Who's Advertising"** → sees Mastercard with 3 ads
5. **Clicks Mastercard** → split pane opens with ad list on left, first ad on right
6. **Reads the ad** → "Secure cross-border payments"
7. **Sees "Triggered by"** → "how to send money overseas without high fees"
8. **Clicks "View full ChatGPT response"** → drawer opens showing what ChatGPT answered and where the ad appeared
9. **Realizes:** Mastercard is the only payment company advertising on ChatGPT for stablecoin-related prompts. Circle is recommended 47 times but pays nothing.
10. **Clicks Share** → copies URL → sends to team

### Power user
1. **Hits ⌘K** → types "crypto" → selects "Crypto Exchanges"
2. **Goes to Landscape tab** → sees competitive map
3. **Sees blue ocean prompts** → clicks "Probe these prompts"
4. **Exports the gap list** → sends to content team
5. **Saves 3 ads** to swipe file → compares them side-by-side

### Agency user
1. **Lands** → types "pre-IPO stocks" → no data yet
2. **Clicks "Probe now"** → background scrape starts
3. **Gets notified** when complete → loads results
4. **Goes to Advertisers tab** → sees Attio and WSJ are the only advertisers
5. **Goes to Prompts tab** → filters "Ads only" → sees which 5 prompts triggered ads
6. **Exports** the prompt + ad pairs → builds ad strategy document for client

---

## Success Metrics

| Metric | Target |
|---|---|
| Time to first insight (landing → seeing an ad) | < 60s |
| Time to find a specific advertiser | < 10s (via search or ⌘K) |
| Time to see which prompts trigger ads | < 30s (click advertiser → see triggered prompts) |
| Time to share results with team | < 5s (Share button → URL copied) |
| Sessions where user explores >1 view | > 60% |
| Sessions where user exports or saves | > 20% |
| Command palette usage (power users) | > 40% of sessions |
