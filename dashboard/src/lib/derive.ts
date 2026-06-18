import type { AdCard, ProbeRecordV2 } from "./types";

export interface GalleryItem {
  ad: AdCard;
  probe: ProbeRecordV2;
  key: string;
}

/** Flatten probes that surfaced ads into per-ad cards, each carrying its triggering probe. */
export function adGallery(probes: ProbeRecordV2[]): GalleryItem[] {
  return probes
    .filter((p) => p.has_ads)
    .flatMap((p, pi) =>
      p.ads.map((ad, ai) => ({ ad, probe: p, key: `${p.id}-${pi}-${ai}` })),
    );
}

/** Distinct values for filter chips. */
export function distinct<T extends string>(items: T[]): T[] {
  return [...new Set(items)];
}

export function galleryFilters(items: GalleryItem[]) {
  return {
    advertisers: distinct(items.map((i) => i.ad.advertiser)).sort(),
    personas: distinct(items.map((i) => i.probe.persona)).sort(),
    needs: distinct(items.map((i) => i.probe.primary_need)).sort(),
  };
}
