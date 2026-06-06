import { adsClient, listAll } from "./client.js";
import type { Ad, ResourceStatus } from "../types.js";

export interface CreateAdInput {
  ad_group_id: string;
  name: string;
  status: ResourceStatus;
  creative: {
    title: string;
    body: string;
    target_url: string;
    file_id?: string;
  };
}

export const ads = {
  list: (ad_group_id: string) => listAll<Ad>("/ads", { ad_group_id }),

  get: (id: string) => adsClient.get<Ad>(`/ads/${id}`),

  create: (input: CreateAdInput) =>
    adsClient.post<Ad>("/ads", {
      ad_group_id: input.ad_group_id,
      name: input.name,
      status: input.status,
      creative: { type: "chat_card", ...input.creative },
    }),

  activate: (id: string) => adsClient.post<Ad>(`/ads/${id}/activate`),
  pause: (id: string) => adsClient.post<Ad>(`/ads/${id}/pause`),
  archive: (id: string) => adsClient.post<Ad>(`/ads/${id}/archive`),
};
