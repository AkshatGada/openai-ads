import { adsClient, listAll } from "./client.js";
import { usdToMicros, type AdGroup, type ResourceStatus } from "../types.js";

export interface CreateAdGroupInput {
  campaign_id: string;
  name: string;
  status: ResourceStatus;
  context_hints: string[];
  max_bid_usd: number;
  description?: string;
  billing_event_type?: "click" | "impression";
}

export const adGroups = {
  list: (campaign_id: string) => listAll<AdGroup>("/ad_groups", { campaign_id }),

  get: (id: string) => adsClient.get<AdGroup>(`/ad_groups/${id}`),

  create: (input: CreateAdGroupInput) =>
    adsClient.post<AdGroup>("/ad_groups", {
      campaign_id: input.campaign_id,
      name: input.name,
      status: input.status,
      description: input.description,
      context_hints: input.context_hints,
      bidding_config: {
        billing_event_type: input.billing_event_type ?? "click",
        max_bid_micros: usdToMicros(input.max_bid_usd),
      },
    }),

  setMaxBidUsd: (id: string, usd: number, billing_event_type: "click" | "impression" = "click") =>
    adsClient.post<AdGroup>(`/ad_groups/${id}`, {
      bidding_config: { billing_event_type, max_bid_micros: usdToMicros(usd) },
    }),

  activate: (id: string) => adsClient.post<AdGroup>(`/ad_groups/${id}/activate`),
  pause: (id: string) => adsClient.post<AdGroup>(`/ad_groups/${id}/pause`),
  archive: (id: string) => adsClient.post<AdGroup>(`/ad_groups/${id}/archive`),
};
