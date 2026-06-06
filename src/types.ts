import { z } from "zod";

// ──────────────────────────────────────────────────────────────────────────
// OpenAI Ads API resource shapes (modeled from live API responses, which are
// richer than the public docs — e.g. clicks bidding + daily budget exist).
// ──────────────────────────────────────────────────────────────────────────

export interface AdAccount {
  id: string;
  name: string;
  url: string;
  preview_url: string | null;
  timezone: string;
  currency_code: string;
  status?: string;
  review?: { status: string; reason?: string };
  account_integrity_review?: unknown;
}

export type ResourceStatus = "active" | "paused" | "archived";
export type ReviewStatus = "in_review" | "approved" | "rejected";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: ResourceStatus;
  bidding_type?: "clicks" | "impressions";
  budget: {
    daily_spend_limit_micros?: number;
    lifetime_spend_limit_micros?: number;
  };
  start_time: number | null;
  end_time: number | null;
  targeting: unknown;
  created_at: number;
  updated_at: number;
}

export interface AdGroup {
  id: string;
  name: string;
  description: string | null;
  status: ResourceStatus;
  context_hints: string[];
  bidding_config: {
    billing_event_type: "click" | "impression";
    max_bid_micros: number;
  };
  created_at: number;
  updated_at: number;
}

export interface Ad {
  id: string;
  name: string;
  status: ResourceStatus;
  creative: {
    type: "chat_card";
    title: string;
    body: string;
    target_url: string;
    file_id?: string;
    image_url?: string;
  };
  review_status?: ReviewStatus;
  review?: { status: ReviewStatus; reason?: string };
  created_at: number;
  updated_at: number;
}

export interface ListResponse<T> {
  object: "list";
  data: T[];
  first_id: string | null;
  last_id: string | null;
  has_more: boolean;
  count?: number;
}

export interface InsightsRow {
  id?: string;
  start_time?: number;
  end_time?: number;
  impressions?: number;
  clicks?: number;
  spend?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  campaign_name?: string;
  ad_group_name?: string;
  ad_name?: string;
  [k: string]: unknown;
}

// ──────────────────────────────────────────────────────────────────────────
// The agent's structured output: an ActionPlan the executor validates + runs.
// This is the safety-critical contract between the LLM and real money.
// ──────────────────────────────────────────────────────────────────────────

export const CreativeSchema = z.object({
  title: z.string().min(3).max(50),
  body: z.string().min(3).max(100),
  target_url: z.string().url(),
  // Optional reasoning the LLM attaches so humans understand the creative.
  rationale: z.string().optional(),
});

const MICRO = 1_000_000;

export const CreateCampaignAction = z.object({
  type: z.literal("create_campaign"),
  name: z.string().min(3).max(1000),
  description: z.string().optional(),
  daily_budget_usd: z.number().positive(),
  bidding_type: z.enum(["clicks", "impressions"]).default("clicks"),
  countries: z.array(z.string().length(2)).default(["US"]),
  rationale: z.string().optional(),
});

export const CreateAdGroupAction = z.object({
  type: z.literal("create_ad_group"),
  // References a campaign created earlier in the same plan, or an existing id.
  campaign_ref: z.string(),
  name: z.string().min(3).max(1000),
  description: z.string().optional(),
  context_hints: z.array(z.string()).min(1).max(20),
  max_bid_usd: z.number().positive(),
  rationale: z.string().optional(),
});

export const CreateAdAction = z.object({
  type: z.literal("create_ad"),
  ad_group_ref: z.string(),
  name: z.string().min(3).max(1000),
  creative: CreativeSchema,
  image_url: z.string().url().optional(),
  rationale: z.string().optional(),
});

export const SetBidAction = z.object({
  type: z.literal("set_bid"),
  ad_group_id: z.string(),
  max_bid_usd: z.number().positive(),
  rationale: z.string().optional(),
});

export const SetBudgetAction = z.object({
  type: z.literal("set_budget"),
  campaign_id: z.string(),
  daily_budget_usd: z.number().positive(),
  rationale: z.string().optional(),
});

export const PauseAction = z.object({
  type: z.literal("pause"),
  resource: z.enum(["campaign", "ad_group", "ad"]),
  id: z.string(),
  rationale: z.string().optional(),
});

export const ActivateAction = z.object({
  type: z.literal("activate"),
  resource: z.enum(["campaign", "ad_group", "ad"]),
  id: z.string(),
  rationale: z.string().optional(),
});

export const ActionSchema = z.discriminatedUnion("type", [
  CreateCampaignAction,
  CreateAdGroupAction,
  CreateAdAction,
  SetBidAction,
  SetBudgetAction,
  PauseAction,
  ActivateAction,
]);

export const ActionPlanSchema = z.object({
  summary: z.string(),
  // The agent's read of the situation this loop — shown to the human approver.
  reasoning: z.string(),
  actions: z.array(ActionSchema),
});

export type Action = z.infer<typeof ActionSchema>;
export type ActionPlan = z.infer<typeof ActionPlanSchema>;

// Business profile produced by the research stage.
export const BusinessProfileSchema = z.object({
  name: z.string(),
  url: z.string(),
  category: z.string(),
  location: z.string().optional(),
  value_props: z.array(z.string()),
  target_audience: z.array(z.string()),
  // The intent moments where this business is relevant — feeds context_hints.
  relevant_moments: z.array(z.string()),
  notes: z.string().optional(),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

export const usdToMicros = (usd: number): number => Math.round(usd * MICRO);
export const microsToUsd = (micros: number): number => micros / MICRO;
