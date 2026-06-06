// Read-only sanity check: confirms the Ads API key works and prints the account
// hierarchy. Run with: npm run verify
import { account, insights } from "../ads/insights.js";
import { campaigns } from "../ads/campaigns.js";
import { adGroups } from "../ads/adGroups.js";
import { ads } from "../ads/ads.js";
import { microsToUsd } from "../types.js";
import { config } from "../config.js";

async function main() {
  console.log(`Mode: ${config.liveMode ? "LIVE 🔴" : "DRY-RUN 🟢"}  | LLM key: ${config.llm.apiKey ? "set" : "MISSING"}\n`);

  const acct = await account.get();
  console.log(`Account: ${acct.name} (${acct.id}) — ${acct.currency_code}, ${acct.timezone}`);
  if (acct.review) console.log(`  Account review: ${acct.review.status}${acct.review.reason ? ` (${acct.review.reason})` : ""}`);

  const cmps = await campaigns.list();
  console.log(`\nCampaigns: ${cmps.length}`);
  for (const c of cmps) {
    const budget = c.budget.daily_spend_limit_micros
      ? `$${microsToUsd(c.budget.daily_spend_limit_micros)}/day`
      : c.budget.lifetime_spend_limit_micros
        ? `$${microsToUsd(c.budget.lifetime_spend_limit_micros)} lifetime`
        : "no budget";
    console.log(`  • ${c.name} [${c.status}] ${budget} bidding=${c.bidding_type ?? "?"} (${c.id})`);

    const groups = await adGroups.list(c.id);
    for (const g of groups) {
      console.log(`     ◦ ${g.name} [${g.status}] bid $${microsToUsd(g.bidding_config.max_bid_micros)}/${g.bidding_config.billing_event_type} hints=[${g.context_hints.join(", ")}] (${g.id})`);
      const adList = await ads.list(g.id);
      for (const ad of adList) {
        console.log(`        - ${ad.name} [${ad.status}/${ad.review_status ?? ad.review?.status ?? "?"}] "${ad.creative.title}" (${ad.id})`);
      }
    }
  }

  const ins = await insights.account();
  console.log(`\nAccount insights rows: ${ins.data.length} (count=${ins.count ?? "n/a"})`);
  console.log("\n✅ Ads API connectivity verified.");
}

main().catch((e) => {
  console.error("❌ Verify failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
