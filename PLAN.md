# Master Product Plan — Industry Ad-Intelligence Platform

> The whole-system roadmap. How the **frontend** (built first) connects to the existing **scrapers**, **analyzer**, **data pipeline**, and a future **backend**. The frontend build itself is detailed in a separate frontend-only plan (a dedicated plan-mode session) — this file is the integration map and sequencing, not the component-by-component build.
>
> Brand/design is governed by **`design.md`** ("Monochrome Recon") — binding for all UI.
> The prior OMS Analyzer V2 plan that lived here is preserved in git: `git show HEAD:PLAN.md`.

---

## North Star

A user names their **industry** (first: real estate) → sees what ads competitors run inside ChatGPT for that industry: the **ad creatives** (advertiser, title, body), the **prompts that triggered them**, who's winning, and where the open lanes (blue ocean / coverage gaps) are.

**Strategy: frontend first.** Build the complete, beautiful frontend against the *real data shapes* (mock data standing in), then wire each upstream piece behind it. The frontend is the product surface and the forcing function for everything else.

---

## System map (what exists vs. what's new)

```
                         ┌──────────────────────────────────────────┐
   EXISTING (works)      │                NEW                        │
                         │                                           │
  ┌─────────────┐        │   ┌──────────────┐     ┌───────────────┐  │
  │  Scrapers   │        │   │   Frontend    │     │  (future)     │  │
  │ Oxylabs     │        │   │  web/  React  │◄────│  Backend/API  │  │
  │ VerseOdin   │──HTML─▶ │   │  "Monochrome  │ JSON│  serves JSON  │  │
  │ Personas v2 │        │   │   Recon"      │     │  per industry │  │
  └─────────────┘        │   └──────────────┘     └───────────────┘  │
        │                │          ▲                      ▲          │
        ▼                │          │ reads                │ reads    │
  ┌─────────────┐        │   per-industry JSON      data/<industry>-  │
  │ Analyzer v2 │──JSON─▶ │   (patterns + probes)    {patterns,probes}│
  │ clean→classify        │                                           │
  │ →patterns   │        └──────────────────────────────────────────┘
  └─────────────┘
   src/analyzer/*-v2.ts        web/                        (TBD)
```

- **Scrapers** (`src/scraper/`, `src/personas/`) — probe ChatGPT, emit raw HTML. *Done.*
- **Analyzer v2** (`src/analyzer/*-v2.ts`) — HTML → `ProbeRecordV2[]` + `PatternSummary`. *Done.* This is the **data contract** the frontend consumes (`src/analyzer/types-v2.ts`).
- **Frontend** (`web/`) — *build first, this milestone.* Consumes per-industry JSON. No backend dependency; loads JSON via an industry registry.
- **Backend/API** — *future.* A thin server that serves `data/<industry>-{patterns,probes}.json` over HTTP (and later triggers live scrapes). The frontend's `loader` is designed so swapping "import JSON" → "fetch from API" is a one-module change.

---

## The data contract (the seam between frontend and everything else)

Defined in `src/analyzer/types-v2.ts`; the frontend mirrors it verbatim in `web/src/lib/types.ts`.
- `ProbeRecordV2` — one probe: `prompt`, `ads[{advertiser,title,body}]`, `has_ads`, `persona`, `primary_need`, `intent_score` (0–10), `known_competitors_in_response[]`, `chatgpt_response`, `citations[]`, etc.
- `PatternSummary` — aggregates: `total_probes/ads/ad_rate_pct`, `ad_density_by_persona/need[]`, `competitor_frequency[]`, `blue_ocean[]`, `coverage_gaps[]`, `advertisers[]`, etc.
- Per-industry data = `{ patterns: PatternSummary, probes: ProbeRecordV2[] }`. **Any source (mock, analyzer output, or API) that satisfies this contract drops in unchanged.**

Key facts to honor: `data/` is gitignored (frontend copies its own committed fixtures); probes JSON is a **bare array**; `blue_ocean` rule = `intent_score>=7 && !has_ads`.

---

## Phased roadmap

### ▶ Phase 1 — Frontend (build NOW, mock data) — *covered by the separate frontend plan*
Complete "Monochrome Recon" frontend in `web/` (Vite + React + TS + Motion + Tailwind), isolated from the tsx CLI. Hero (search) → dashboard morph; 5 views (Overview, Ads Gallery, Competitors, Blue Ocean/Gaps, Prompts Explorer). Consumes per-industry JSON via an `IndustryRegistry`. Ships with two datasets: a hand-authored **real-estate** sample + copied **OMS** fixtures (proves multi-industry).
**Done when:** the dashboard is fully designed/animated and renders both industries from local JSON; `design.md` litmus test passes; `pnpm web:build` green; root `pnpm typecheck` untouched.
**Detailed build steps live in the dedicated frontend plan, NOT here.**

### Phase 2 — Real real-estate data (wire the pipeline behind the UI)
Generate real-estate prompts (industry personas × needs), run them through the existing scraper (Oxylabs/VerseOdin or personas), feed the HTML to a real-estate variant of the analyzer, and emit `real-estate-{patterns,probes}.json`. Swap the mock fixture for real output — **no frontend change** (same contract).
**Includes:** generalize the analyzer's OMS-specific classifier (`src/analyzer/classifier-v2.ts`) into industry-pluggable persona/need/competitor lists (real-estate first).

### Phase 3 — Backend / serving layer
Thin HTTP server (Hono/Fastify) serving `data/<industry>-*.json`. Frontend `loader.ts` switches from static `import()` to `fetch()`. Optionally an "industries available" endpoint so the search bar is data-driven.

### Phase 4 — Live & multi-industry scale
"Refresh / scan a new industry" triggers a scrape+analyze job (queue + progress UI). Add more industries by adding prompt sets + classifier configs. Optional: persistence, caching, auth for an agency/client view.

### Phase 5 — Close the loop back to Ads (optional, ties to the original product)
Feed discovered gaps/blue-ocean + suggested context_hints into the OpenAI Ads side (`src/ads/`, `src/agent/`) — from "see what competitors do" to "launch against the gaps."

---

## How the frontend is built to make later phases cheap
- **Registry + loader indirection:** `web/src/lib/registry.ts` maps `IndustryId → load()`. Today `load()` dynamic-imports JSON; in Phase 3 it becomes `fetch('/api/industries/<id>')`. One file changes.
- **Strict contract mirror:** frontend types mirror `types-v2.ts`, so analyzer output flows in untouched.
- **Industry-agnostic views:** OMS-specific widgets gated behind `industryId==='oms'`; everything else renders from the generic contract.
- **Isolation:** `web/` is its own package; nothing in `src/` imports it. The scraper/analyzer/CLI keep working independently.

---

## Open decisions deferred to later phases (not now)
- Backend framework choice (Phase 3).
- Live-scrape job/queue UX (Phase 4).
- Whether the analyzer config becomes a per-industry JSON or stays code (Phase 2).
- Auth / multi-tenant client views (Phase 4+).

---

## Status
- ✅ Scrapers, Analyzer v2, data contract — exist.
- ✅ `design.md` — committed brand spec ("Monochrome Recon").
- ⏭ **Next: open a dedicated frontend plan-mode session and build Phase 1.** This file stays as the integration reference.
