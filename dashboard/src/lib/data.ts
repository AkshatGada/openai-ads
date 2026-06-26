import type { IndustryData, PatternSummary, ProbeRecordV2 } from "@/lib/types";

export type IndustryId = "oms" | "enterprise";

export interface IndustryEntry {
  id: IndustryId;
  label: string;
  tagline: string;
  aliases: string[];
}

const INDUSTRY_META: Record<IndustryId, Omit<IndustryEntry, "id">> = {
  oms: {
    label: "Stablecoin & Payments",
    tagline: "116 probes · 9 ads · 5 advertisers",
    aliases: ["oms", "stablecoin", "fintech", "payments", "money stack", "crypto", "open money stack"],
  },
  enterprise: {
    label: "Enterprise & Fintech",
    tagline: "321 probes · 64 advertisers · live data",
    aliases: ["enterprise", "fintech", "privacy", "security", "compliance", "saas", "b2b", "cybersecurity", "payments"],
  },
};

export function getIndustries(): IndustryEntry[] {
  return Object.entries(INDUSTRY_META).map(([id, meta]) => ({ id: id as IndustryId, ...meta }));
}

export function getIndustryMeta(id: string): IndustryEntry | null {
  const meta = INDUSTRY_META[id as IndustryId];
  if (!meta) return null;
  return { id: id as IndustryId, ...meta };
}

/** Load full industry data — probes + patterns. Swappable to DB fetch later. */
export async function getIndustryData(id: string): Promise<IndustryData | null> {
  switch (id) {
    case "oms": {
      const [patternsMod, probesMod] = await Promise.all([
        import("@/data/oms-patterns.json"),
        import("@/data/oms-probes.json"),
      ]);
      return {
        patterns: patternsMod.default as unknown as PatternSummary,
        probes: probesMod.default as unknown as ProbeRecordV2[],
      };
    }
    case "enterprise": {
      const [patternsMod, probesMod] = await Promise.all([
        import("@/data/enterprise-patterns.json"),
        import("@/data/enterprise-probes.json"),
      ]);
      return {
        patterns: patternsMod.default as unknown as PatternSummary,
        probes: probesMod.default as unknown as ProbeRecordV2[],
      };
    }
    default:
      return null;
  }
}

/** Resolve a free-text query to an industry entry via label/alias substring match. */
export function resolveIndustry(query: string): IndustryEntry | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const entry of getIndustries()) {
    if (entry.id === q || entry.label.toLowerCase() === q) return entry;
    if (entry.aliases.some((a) => a === q || q.includes(a) || a.includes(q))) return entry;
  }
  return null;
}

/** Suggestions for the typeahead, filtered by the current query. */
export function suggestIndustries(query: string): IndustryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return getIndustries();
  return getIndustries().filter(
    (e) => e.label.toLowerCase().includes(q) || e.aliases.some((a) => a.includes(q)),
  );
}
