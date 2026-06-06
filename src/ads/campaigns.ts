import { adsClient, listAll } from "./client.js";
import { usdToMicros, type Campaign, type ResourceStatus } from "../types.js";

export interface CreateCampaignInput {
  name: string;
  status: ResourceStatus;
  daily_budget_usd: number;
  bidding_type?: "clicks" | "impressions";
  description?: string;
  countries?: string[];
  start_time?: number;
  end_time?: number;
}

export const campaigns = {
  list: () => listAll<Campaign>("/campaigns"),

  get: (id: string) => adsClient.get<Campaign>(`/campaigns/${id}`),

  create: (input: CreateCampaignInput) => {
    const body: Record<string, unknown> = {
      name: input.name,
      status: input.status,
      bidding_type: input.bidding_type ?? "clicks",
      budget: { daily_spend_limit_micros: usdToMicros(input.daily_budget_usd) },
    };
    if (input.description) body.description = input.description;
    if (input.start_time) body.start_time = input.start_time;
    if (input.end_time) body.end_time = input.end_time;
    if (input.countries?.length) {
      body.targeting = { locations: { include: input.countries.map((c) => ({ type: "country", country_code: c })) } };
    }
    return adsClient.post<Campaign>("/campaigns", body);
  },

  setDailyBudgetUsd: (id: string, usd: number) =>
    adsClient.post<Campaign>(`/campaigns/${id}`, { budget: { daily_spend_limit_micros: usdToMicros(usd) } }),

  activate: (id: string) => adsClient.post<Campaign>(`/campaigns/${id}/activate`),
  pause: (id: string) => adsClient.post<Campaign>(`/campaigns/${id}/pause`),
  archive: (id: string) => adsClient.post<Campaign>(`/campaigns/${id}/archive`),
};
