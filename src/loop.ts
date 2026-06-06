// End-to-end orchestrator: research → plan → approve → execute → measure → learn.
// Run with: npm run loop
import { research, type BusinessInput } from "./agent/research.js";
import { plan } from "./agent/planner.js";
import { execute } from "./executor/executor.js";
import { account, insights, normalizeRows } from "./ads/insights.js";
import { campaigns } from "./ads/campaigns.js";
import { adGroups } from "./ads/adGroups.js";
import { ads } from "./ads/ads.js";
import { loadState, saveState, type ProjectState, type LoopRecord } from "./store/history.js";
import { microsToUsd, type BusinessProfile } from "./types.js";
import type { PriorValues } from "./executor/guardrails.js";
import { config } from "./config.js";

// ── The business this run manages. Edit or load from a file/CLI as you grow. ──
const PROJECT_ID = "sushi-bangalore";
const BUSINESS: BusinessInput = {
  url: "https://lucario.com/",
  details: `Lucario's Cafe — a sushi restaurant in Bangalore (Bengaluru), India.
Sells fresh sushi, Japanese cuisine, and offers dine-in plus an email newsletter signup for offers.
Goal: get people to click through to the website and sign up for the newsletter / booking form.
Audience: foodies, young professionals, and date-night/dinner planners in Bangalore.`,
};

/** Pull the current account hierarchy so the planner can reference real ids. */
async function snapshotExisting() {
  const cmps = await campaigns.list();
  const existing = {
    campaigns: cmps.map((c) => ({ id: c.id, name: c.name, status: c.status })),
    adGroups: [] as Array<{ id: string; name: string; status: string; max_bid_micros: number }>,
    ads: [] as Array<{ id: string; name: string; status: string; review?: string }>,
  };
  const prior: PriorValues = { campaignDailyBudgetUsd: {}, adGroupMaxBidUsd: {} };

  for (const c of cmps) {
    if (c.budget.daily_spend_limit_micros) {
      prior.campaignDailyBudgetUsd[c.id] = microsToUsd(c.budget.daily_spend_limit_micros);
    }
    const groups = await adGroups.list(c.id);
    for (const g of groups) {
      existing.adGroups.push({ id: g.id, name: g.name, status: g.status, max_bid_micros: g.bidding_config.max_bid_micros });
      prior.adGroupMaxBidUsd[g.id] = microsToUsd(g.bidding_config.max_bid_micros);
      const adList = await ads.list(g.id);
      for (const ad of adList) {
        existing.ads.push({ id: ad.id, name: ad.name, status: ad.status, review: ad.review_status ?? ad.review?.status });
      }
    }
  }
  return { existing, prior };
}

async function main() {
  console.log(`\n🍣 Ads Agent — project "${PROJECT_ID}" — mode: ${config.liveMode ? "LIVE 🔴" : "DRY-RUN 🟢"}`);

  // Confirm the account is reachable + surface review gates up front.
  const acct = await account.get();
  if (acct.review && acct.review.status === "rejected") {
    console.log(`⚠️  Account review REJECTED (${acct.review.reason ?? "unknown"}). Ads will NOT serve until resolved — but we can still build paused.`);
  }

  // Load or initialize project state (the agent's memory).
  let state = await loadState(PROJECT_ID);
  let profile: BusinessProfile;
  if (state) {
    profile = state.profile;
    console.log(`Loaded state: ${state.loops.length} prior loop(s).`);
  } else {
    console.log("No prior state — researching the business...");
    profile = await research(BUSINESS);
    state = { profile, refs: {}, loops: [] };
    console.log(`Profile: ${profile.name} — ${profile.category} (${profile.location ?? "?"})`);
  }

  // Snapshot current performance + existing objects.
  const { existing, prior } = await snapshotExisting();
  const insSnap = normalizeRows((await insights.account({ time_granularity: "daily" })).data);

  // Agent produces the next plan.
  console.log("\n🤖 Planning next actions...");
  const actionPlan = await plan({ profile, state, existing });

  // Human-in-the-loop approval + execution (dry-run aware).
  const result = await execute(actionPlan, prior, state.refs);

  if (!result.approved) {
    console.log("\n⏹  Plan not approved — nothing executed. State unchanged.");
    return;
  }

  // Record the loop and persist.
  const record: LoopRecord = {
    loop: state.loops.length + 1,
    timestamp: new Date().toISOString(),
    plan: actionPlan,
    executed: result.executed,
    insightsSnapshot: insSnap,
  };
  state.refs = { ...state.refs, ...result.newRefs };
  state.loops.push(record);
  await saveState(PROJECT_ID, state);

  console.log("\n── Execution summary ──");
  for (const e of result.executed) console.log(`  ${e.ok ? "✅" : "❌"} ${e.action}${e.error ? ` — ${e.error}` : ""}`);
  console.log(`\n💾 Saved loop ${record.loop} to runs/${PROJECT_ID}.json`);
  console.log(config.liveMode ? "Live objects created." : "Dry-run: objects created PAUSED — review them, then set ADS_LIVE_MODE=true to go live.");
}

main().catch((e) => {
  console.error("\n❌ Loop failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
