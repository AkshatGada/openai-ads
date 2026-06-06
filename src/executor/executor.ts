import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "../config.js";
import type { Action, ActionPlan, ResourceStatus } from "../types.js";
import { campaigns } from "../ads/campaigns.js";
import { adGroups } from "../ads/adGroups.js";
import { ads } from "../ads/ads.js";
import { upload } from "../ads/upload.js";
import { checkPlan, type PriorValues, type Violation } from "./guardrails.js";

export interface ExecutedAction {
  action: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface ExecuteResult {
  executed: ExecutedAction[];
  // Newly created refs → real ids (merged into project state by the caller).
  newRefs: Record<string, string>;
  approved: boolean;
  violations: Violation[];
}

// In dry-run we never create live/active objects.
function statusFor(): ResourceStatus {
  return config.liveMode ? "active" : "paused";
}

async function confirm(plan: ActionPlan, violations: Violation[]): Promise<boolean> {
  console.log("\n" + "═".repeat(70));
  console.log(`PROPOSED ACTION PLAN  (mode: ${config.liveMode ? "LIVE 🔴" : "DRY-RUN 🟢 — objects created paused"})`);
  console.log("═".repeat(70));
  console.log(`Summary:  ${plan.summary}`);
  console.log(`Reasoning: ${plan.reasoning}\n`);
  plan.actions.forEach((a, i) => {
    console.log(`  ${i + 1}. ${describe(a)}`);
    if ("rationale" in a && a.rationale) console.log(`      ↳ ${a.rationale}`);
  });

  if (violations.length) {
    console.log("\n⛔ GUARDRAIL VIOLATIONS — this plan cannot run as-is:");
    for (const x of violations) console.log(`   - [${x.action}] ${x.message}`);
    console.log("Re-plan with values inside the limits.");
    return false;
  }

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question("\nApprove and execute this plan? (yes/no) ")).trim().toLowerCase();
  rl.close();
  return answer === "yes" || answer === "y";
}

function describe(a: Action): string {
  switch (a.type) {
    case "create_campaign":
      return `create_campaign "${a.name}" — $${a.daily_budget_usd}/day, ${a.bidding_type}, ${a.countries.join(",")}`;
    case "create_ad_group":
      return `create_ad_group "${a.name}" in <${a.campaign_ref}> — bid $${a.max_bid_usd}, hints: ${a.context_hints.join(" | ")}`;
    case "create_ad":
      return `create_ad "${a.name}" in <${a.ad_group_ref}> — "${a.creative.title}" / "${a.creative.body}" → ${a.creative.target_url}`;
    case "set_bid":
      return `set_bid ${a.ad_group_id} → $${a.max_bid_usd}`;
    case "set_budget":
      return `set_budget ${a.campaign_id} → $${a.daily_budget_usd}/day`;
    case "pause":
      return `pause ${a.resource} ${a.id}`;
    case "activate":
      return `activate ${a.resource} ${a.id}`;
  }
}

export async function execute(
  plan: ActionPlan,
  prior: PriorValues,
  existingRefs: Record<string, string>,
): Promise<ExecuteResult> {
  const violations = checkPlan(plan, prior);
  const approved = await confirm(plan, violations);
  if (!approved) return { executed: [], newRefs: {}, approved: false, violations };

  const refs: Record<string, string> = { ...existingRefs };
  const executed: ExecutedAction[] = [];

  // resolve a ref-or-id to a concrete id (campaign/ad group created earlier in this plan)
  const resolve = (refOrId: string) => refs[refOrId] ?? refOrId;

  for (const a of plan.actions) {
    try {
      const result = await runAction(a, refs, resolve);
      executed.push({ action: describe(a), ok: true, result });
    } catch (err) {
      executed.push({ action: describe(a), ok: false, error: err instanceof Error ? err.message : String(err) });
      // Continue with remaining actions; the loop record captures failures.
    }
  }

  return { executed, newRefs: refs, approved: true, violations: [] };
}

async function runAction(
  a: Action,
  refs: Record<string, string>,
  resolve: (s: string) => string,
): Promise<unknown> {
  switch (a.type) {
    case "create_campaign": {
      const c = await campaigns.create({
        name: a.name,
        status: statusFor(),
        daily_budget_usd: a.daily_budget_usd,
        bidding_type: a.bidding_type,
        description: a.description,
        countries: a.countries,
      });
      refs[a.name] = c.id; // allow referencing by name as a fallback
      return c;
    }
    case "create_ad_group": {
      const g = await adGroups.create({
        campaign_id: resolve(a.campaign_ref),
        name: a.name,
        status: statusFor(),
        context_hints: a.context_hints,
        max_bid_usd: a.max_bid_usd,
        description: a.description,
      });
      refs[a.name] = g.id;
      return g;
    }
    case "create_ad": {
      let file_id: string | undefined;
      if (a.image_url) {
        const uploaded = await upload.fromUrl(a.image_url);
        file_id = uploaded.file_id;
      }
      const ad = await ads.create({
        ad_group_id: resolve(a.ad_group_ref),
        name: a.name,
        status: statusFor(),
        creative: { title: a.creative.title, body: a.creative.body, target_url: a.creative.target_url, file_id },
      });
      refs[a.name] = ad.id;
      return ad;
    }
    case "set_bid":
      return adGroups.setMaxBidUsd(resolve(a.ad_group_id), a.max_bid_usd);
    case "set_budget":
      return campaigns.setDailyBudgetUsd(resolve(a.campaign_id), a.daily_budget_usd);
    case "pause": {
      const id = resolve(a.id);
      return a.resource === "campaign" ? campaigns.pause(id) : a.resource === "ad_group" ? adGroups.pause(id) : ads.pause(id);
    }
    case "activate": {
      // In dry-run we refuse to activate anything (it would start spending).
      if (!config.liveMode) throw new Error("activate skipped: dry-run mode (set ADS_LIVE_MODE=true to allow)");
      const id = resolve(a.id);
      return a.resource === "campaign" ? campaigns.activate(id) : a.resource === "ad_group" ? adGroups.activate(id) : ads.activate(id);
    }
  }
}
