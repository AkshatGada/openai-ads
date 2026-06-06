import { chatJson } from "./llm.js";
import { PLANNER_SYSTEM } from "./prompts.js";
import { ActionPlanSchema, type ActionPlan, type BusinessProfile } from "../types.js";
import type { ProjectState } from "../store/history.js";
import { summarizeHistory } from "../store/history.js";

export interface PlannerContext {
  profile: BusinessProfile;
  state: ProjectState | null;
  // Live snapshot of existing objects so the agent can reference real ids.
  existing: {
    campaigns: Array<{ id: string; name: string; status: string }>;
    adGroups: Array<{ id: string; name: string; status: string; max_bid_micros: number }>;
    ads: Array<{ id: string; name: string; status: string; review?: string }>;
  };
}

export async function plan(ctx: PlannerContext): Promise<ActionPlan> {
  const history = ctx.state ? summarizeHistory(ctx.state) : "No prior loops.";

  const userContent = [
    `BUSINESS PROFILE:\n${JSON.stringify(ctx.profile, null, 2)}`,
    `\nEXISTING OBJECTS ON THE ACCOUNT (use these real ids for set_bid/pause/activate):\n${JSON.stringify(ctx.existing, null, 2)}`,
    `\nKNOWN REFS → IDS FROM PRIOR LOOPS:\n${JSON.stringify(ctx.state?.refs ?? {}, null, 2)}`,
    `\nPERFORMANCE HISTORY:\n${history}`,
    `\nProduce the next ActionPlan as JSON. Be decisive but stay within sane budgets/bids.`,
  ].join("\n");

  const raw = await chatJson<unknown>([
    { role: "system", content: PLANNER_SYSTEM },
    { role: "user", content: userContent },
  ]);

  const parsed = ActionPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Planner output failed validation: ${parsed.error.message}\n\nRaw:\n${JSON.stringify(raw, null, 2)}`);
  }
  return parsed.data;
}
