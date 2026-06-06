import { adsClient, buildQuery } from "./client.js";
import type { AdAccount, InsightsRow, ListResponse } from "../types.js";

// Field names are NAMESPACED and level-specific (discovered from the live API).
// Core delivery metrics per level, plus optional country/device breakdowns.
const FIELDS = {
  account: ["ad_account.impressions", "ad_account.clicks", "ad_account.spend", "ad_account.ctr", "ad_account.cpc", "ad_account.cpm"],
  campaign: ["campaign.id", "campaign.name", "campaign.impressions", "campaign.clicks", "campaign.spend", "campaign.ctr", "campaign.cpc", "campaign.cpm"],
  adGroup: ["ad_group.id", "ad_group.name", "ad_group.impressions", "ad_group.clicks", "ad_group.spend", "ad_group.ctr", "ad_group.cpc", "ad_group.cpm"],
  ad: ["ad.id", "ad.name", "ad.impressions", "ad.clicks", "ad.spend", "ad.ctr", "ad.cpc", "ad.cpm", "ad.review_status"],
} as const;

interface InsightsParams {
  time_granularity?: "daily" | "none";
  fields?: string[];
  limit?: number;
}

function qs(defaultFields: readonly string[], params: InsightsParams): string {
  return buildQuery({
    time_granularity: params.time_granularity ?? "none",
    limit: params.limit ?? 1000,
    fields: params.fields ?? [...defaultFields],
  });
}

export const insights = {
  account: (params: InsightsParams = {}) =>
    adsClient.getRaw<ListResponse<InsightsRow>>(`/ad_account/insights${qs(FIELDS.account, params)}`),
  campaign: (id: string, params: InsightsParams = {}) =>
    adsClient.getRaw<ListResponse<InsightsRow>>(`/campaigns/${id}/insights${qs(FIELDS.campaign, params)}`),
  adGroup: (id: string, params: InsightsParams = {}) =>
    adsClient.getRaw<ListResponse<InsightsRow>>(`/ad_groups/${id}/insights${qs(FIELDS.adGroup, params)}`),
  ad: (id: string, params: InsightsParams = {}) =>
    adsClient.getRaw<ListResponse<InsightsRow>>(`/ads/${id}/insights${qs(FIELDS.ad, params)}`),
};

export const INSIGHTS_FIELDS = FIELDS;

/** Flatten dotted, namespaced keys (e.g. "campaign.clicks") to bare metric keys. */
export function normalizeRows(rows: InsightsRow[]): InsightsRow[] {
  const metric = (k: string) => k.split(".").pop() ?? k;
  return rows.map((row) => {
    const out: InsightsRow = {};
    for (const [k, v] of Object.entries(row)) out[metric(k)] = v;
    return out;
  });
}

export const account = {
  get: () => adsClient.get<AdAccount>("/ad_account"),
};
