import type { Action, ActionPlan } from "../types.js";

// Conservative sandbox limits (chosen for dry-run; tighten/loosen before going live).
export const GUARDRAILS = {
  maxDailyBudgetUsd: 5,
  maxBidUsd: 1.0,
  maxBudgetIncreasePct: 0.25, // a single set_budget may raise budget at most 25%
  maxBidIncreasePct: 0.25,
  maxActionsPerPlan: 20,
} as const;

export interface Violation {
  action: string;
  message: string;
}

export interface PriorValues {
  // Existing daily budgets / bids keyed by id, for % -change checks (USD).
  campaignDailyBudgetUsd: Record<string, number>;
  adGroupMaxBidUsd: Record<string, number>;
}

/** Pure validation: returns the list of guardrail violations (empty = OK). */
export function checkPlan(plan: ActionPlan, prior: PriorValues): Violation[] {
  const v: Violation[] = [];

  if (plan.actions.length > GUARDRAILS.maxActionsPerPlan) {
    v.push({ action: "plan", message: `Too many actions (${plan.actions.length} > ${GUARDRAILS.maxActionsPerPlan}).` });
  }

  for (const a of plan.actions) {
    checkAction(a, prior, v);
  }
  return v;
}

function checkAction(a: Action, prior: PriorValues, v: Violation[]): void {
  switch (a.type) {
    case "create_campaign":
      if (a.daily_budget_usd > GUARDRAILS.maxDailyBudgetUsd) {
        v.push({ action: a.type, message: `daily_budget_usd $${a.daily_budget_usd} > cap $${GUARDRAILS.maxDailyBudgetUsd}` });
      }
      break;
    case "create_ad_group":
      if (a.max_bid_usd > GUARDRAILS.maxBidUsd) {
        v.push({ action: a.type, message: `max_bid_usd $${a.max_bid_usd} > cap $${GUARDRAILS.maxBidUsd}` });
      }
      break;
    case "set_budget": {
      if (a.daily_budget_usd > GUARDRAILS.maxDailyBudgetUsd) {
        v.push({ action: a.type, message: `daily_budget_usd $${a.daily_budget_usd} > cap $${GUARDRAILS.maxDailyBudgetUsd}` });
      }
      const cur = prior.campaignDailyBudgetUsd[a.campaign_id];
      if (cur !== undefined && a.daily_budget_usd > cur * (1 + GUARDRAILS.maxBudgetIncreasePct)) {
        v.push({ action: a.type, message: `budget jump $${cur}→$${a.daily_budget_usd} exceeds ${GUARDRAILS.maxBudgetIncreasePct * 100}% per loop` });
      }
      break;
    }
    case "set_bid": {
      if (a.max_bid_usd > GUARDRAILS.maxBidUsd) {
        v.push({ action: a.type, message: `max_bid_usd $${a.max_bid_usd} > cap $${GUARDRAILS.maxBidUsd}` });
      }
      const cur = prior.adGroupMaxBidUsd[a.ad_group_id];
      if (cur !== undefined && a.max_bid_usd > cur * (1 + GUARDRAILS.maxBidIncreasePct)) {
        v.push({ action: a.type, message: `bid jump $${cur}→$${a.max_bid_usd} exceeds ${GUARDRAILS.maxBidIncreasePct * 100}% per loop` });
      }
      break;
    }
    // create_ad / pause / activate carry no spend risk on their own.
    default:
      break;
  }
}
