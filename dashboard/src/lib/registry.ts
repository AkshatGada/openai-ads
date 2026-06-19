import type { IndustryData, PatternSummary, ProbeRecordV2 } from "./types";

export type IndustryId = "real-estate" | "oms";

export interface IndustryEntry {
  id: IndustryId;
  label: string;
  tagline: string;
  aliases: string[]; // typeahead matching
  load: () => Promise<IndustryData>;
}

// This indirection is the future-API seam: swap dynamic import() → fetch() later.
// OMS is listed first: it's backed by REAL collected probe data (116 probes).
// Real Estate is a showcase sample until its scrape lands.
export const INDUSTRIES: Record<IndustryId, IndustryEntry> = {
  oms: {
    id: "oms",
    label: "Stablecoin & Payments",
    tagline: "116 probes · 9 ads · 5 advertisers",
    aliases: ["oms", "stablecoin", "fintech", "payments", "money stack", "crypto", "open money stack"],
    load: async () => {
      const [patterns, probes] = await Promise.all([
        import("../data/oms-patterns.json"),
        import("../data/oms-probes.json"),
      ]);
      return {
        patterns: patterns.default as unknown as PatternSummary,
        probes: probes.default as unknown as ProbeRecordV2[],
      };
    },
  },
  "real-estate": {
    id: "real-estate",
    label: "Real Estate",
    tagline: "Sample data · scrape pending",
    aliases: ["real estate", "realty", "property", "homes", "housing", "mortgage", "realtor"],
    load: async () => {
      const [patterns, probes] = await Promise.all([
        import("../data/real-estate-patterns.json"),
        import("../data/real-estate-probes.json"),
      ]);
      return {
        patterns: patterns.default as unknown as PatternSummary,
        probes: probes.default as unknown as ProbeRecordV2[],
      };
    },
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRIES);

/** Resolve a free-text query to a registry entry via label/alias substring match. */
export function resolveIndustry(query: string): IndustryEntry | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const entry of INDUSTRY_LIST) {
    if (entry.id === q || entry.label.toLowerCase() === q) return entry;
    if (entry.aliases.some((a) => a === q || q.includes(a) || a.includes(q))) return entry;
  }
  return null;
}

/** Suggestions for the typeahead, filtered by the current query. */
export function suggestIndustries(query: string): IndustryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDUSTRY_LIST;
  return INDUSTRY_LIST.filter(
    (e) => e.label.toLowerCase().includes(q) || e.aliases.some((a) => a.includes(q)),
  );
}
