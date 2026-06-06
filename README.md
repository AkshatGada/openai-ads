# OpenAI Ads Agent

An agentic ad-campaign manager built on the [OpenAI Ads API](https://developers.openai.com/ads). An LLM (Minimax) acts as a media buyer for a business: it researches the business, plans campaigns, and iterates loop-by-loop to **maximize leads** (clicks → newsletter/form signups).

## How it works

```
Research → Plan (LLM → JSON ActionPlan) → Guardrails → Human approval → Execute (Ads API) → Measure (Insights) → Learn (history) → loop
```

- **Human-in-the-loop:** the LLM only *proposes* a structured `ActionPlan`. A deterministic executor validates it against hard guardrails and asks you to approve before any API call.
- **Dry-run by default:** with `ADS_LIVE_MODE=false`, every object is created `paused` and nothing is ever activated, so no money is spent while you build trust.
- **Memory:** each loop's actions + performance snapshot are stored in `runs/<project>.json` and fed back to the planner next cycle.

## Layout

| Path | Role |
|---|---|
| `src/ads/` | Typed OpenAI Ads API client (campaigns, ad groups, ads, upload, insights) |
| `src/agent/` | LLM media-buyer: Minimax client, research, planner, prompts |
| `src/executor/` | Guardrails + the safe execution gate (approval, dry-run) |
| `src/store/` | History store (the agent's memory) |
| `src/loop.ts` | Orchestrator |
| `src/scripts/verify.ts` | Read-only connectivity check |

## Setup

```bash
cp .env.example .env   # fill in OPENAI_ADS_API_KEY and MINIMAX_API_KEY
pnpm install
pnpm verify            # read-only: prints account hierarchy
pnpm loop              # research → plan → approve → execute (dry-run)
```

> Uses **pnpm** (see `packageManager` in `package.json`).

## Guardrails (dry-run defaults)

Max $5/day budget, max $1.00/click bid, max 25% budget/bid increase per loop, all objects created paused. Edit in `src/executor/guardrails.ts`.

## Going live

Only after you've reviewed the paused objects and cleared account review (currently the account is rejected for `missing_favicon`): set `ADS_LIVE_MODE=true`. The planner can then activate objects and real spend begins.
