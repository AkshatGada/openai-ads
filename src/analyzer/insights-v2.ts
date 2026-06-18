// OMS Analysis Pipeline V2 — Layer 2: Insights / Pattern Detection
// Aggregates classified probe data into actionable patterns.
// Pure code, no LLM.

import type { ProbeRecordV2, PatternSummary } from "./types-v2.js";

const COMPETITION = (rate: number): string =>
  rate === 0 ? "none" : rate < 3 ? "low" : rate < 8 ? "medium" : "high";

const OMS_CAPABILITIES = [
  { capability: "Virtual bank accounts per customer", keywords: ["virtual account", "named account", "dollar account", "USD account"] },
  { capability: "ACH auto-converts to USDC", keywords: ["ACH.*USDC", "auto.convert", "ACH.*deposit.*stablecoin"] },
  { capability: "Full fiat-crypto in one API", keywords: ["single.*API.*fiat", "fiatToCrypto", "cryptoToFiat", "one.*API.*stablecoin"] },
  { capability: "Disbursement to 40+ countries", keywords: ["40.*countr", "global.*disburse", "pay.*global", "pay.*seller.*countr"] },
  { capability: "Cash-in at retail locations", keywords: ["cash.*deposit.*retail", "cash.*in.*store", "retail.*location", "deposit.*code"] },
  { capability: "Sub-2-second finality", keywords: ["sub.2.second", "second.*finality", "instant.*settle", "settle.*second"] },
  { capability: "KYC endorsements", keywords: ["endorsement", "KYC.*gate", "KYC.*approv"] },
  { capability: "Webhooks + idempotency keys", keywords: ["webhook", "idempotency", "signing.*secret"] },
];

export function computePatterns(probes: ProbeRecordV2[]): PatternSummary {
  const ok = probes.filter(p => p.status === "ok");
  const withAds = ok.filter(p => p.has_ads);

  // 1. Ad density by persona
  const adByPersona = groupBy(ok, "persona", (group) => ({
    persona: group[0]!.persona,
    probes: group.length,
    ads: group.filter(p => p.has_ads).length,
    rate: pct(group.filter(p => p.has_ads).length, group.length),
    competition: COMPETITION(pct(group.filter(p => p.has_ads).length, group.length)),
  })).sort((a, b) => b.ads - a.ads);

  // 2. Ad density by need
  const adByNeed = groupBy(ok, "primary_need", (group) => ({
    need: group[0]!.primary_need,
    probes: group.length,
    ads: group.filter(p => p.has_ads).length,
    rate: pct(group.filter(p => p.has_ads).length, group.length),
    competition: COMPETITION(pct(group.filter(p => p.has_ads).length, group.length)),
  })).sort((a, b) => b.ads - a.ads);

  // 3. Ad density by structure
  const adByStructure = groupBy(ok, "prompt_structure", (group) => ({
    structure: group[0]!.prompt_structure,
    probes: group.length,
    ads: group.filter(p => p.has_ads).length,
    rate: pct(group.filter(p => p.has_ads).length, group.length),
  })).sort((a, b) => b.ads - a.ads);

  // 4. Competitor frequency
  const compMap = new Map<string, { organic: number; paid: number }>();
  for (const p of ok) {
    for (const c of p.known_competitors_in_response) {
      const entry = compMap.get(c) ?? { organic: 0, paid: 0 };
      entry.organic++;
      compMap.set(c, entry);
    }
  }
  for (const p of withAds) {
    for (const ad of p.ads) {
      const key = ad.advertiser;
      const entry = compMap.get(key) ?? { organic: 0, paid: 0 };
      entry.paid++;
      compMap.set(key, entry);
    }
  }
  const competitorFreq = [...compMap.entries()]
    .map(([company, { organic, paid }]) => ({
      company, organic_mentions: organic, paid_impressions: paid, total_share: organic + paid,
    }))
    .sort((a, b) => b.total_share - a.total_share)
    .slice(0, 20);

  // 5. Intent by persona
  const intentByPersona = groupBy(ok, "persona", (group) => ({
    persona: group[0]!.persona,
    count: group.length,
    avg_intent: avg(group.map(p => p.intent_score)),
    max_intent: Math.max(...group.map(p => p.intent_score)),
  })).sort((a, b) => b.avg_intent - a.avg_intent);

  const intentByNeed = groupBy(ok, "primary_need", (group) => ({
    need: group[0]!.primary_need,
    count: group.length,
    avg_intent: avg(group.map(p => p.intent_score)),
    max_intent: Math.max(...group.map(p => p.intent_score)),
  })).sort((a, b) => b.avg_intent - a.avg_intent);

  // 6. Coverage gaps
  const coverageGaps = OMS_CAPABILITIES.map(cap => {
    const mentions = ok.filter(p => cap.keywords.some(kw => new RegExp(kw, "i").test(p.prompt)));
    const coveredBy: string[] = [];
    for (const p of mentions) {
      for (const comp of p.known_competitors_in_response) {
        if (!coveredBy.includes(comp)) coveredBy.push(comp);
      }
    }
    const gapValue = mentions.length === 0 ? "HIGH" : coveredBy.length === 0 ? "HIGH" : coveredBy.length <= 2 ? "MEDIUM" : "LOW";
    return { capability: cap.capability, keywords: cap.keywords, covered_by: coveredBy, gap_value: gapValue };
  });

  // 7. Blue ocean (intent >= 7, no ads)
  const blueCandidates = ok
    .filter(p => p.intent_score >= 7 && !p.has_ads)
    .reduce((acc, p) => {
      const key = `${p.persona}|${p.primary_need}`;
      if (!acc[key]) acc[key] = { persona: p.persona, need: p.primary_need, probes: 0, totalIntent: 0, ads: 0 };
      acc[key]!.probes++;
      acc[key]!.totalIntent += p.intent_score;
      return acc;
    }, {} as Record<string, { persona: string; need: string; probes: number; totalIntent: number; ads: number }>);

  const blueOcean = Object.values(blueCandidates)
    .map((b, i) => ({
      rank: i + 1, persona: b.persona, need: b.need,
      probes: b.probes, avg_intent: Math.round((b.totalIntent / b.probes) * 10) / 10, ad_count: b.ads,
    }))
    .sort((a, b) => b.probes - a.probes || b.avg_intent - a.avg_intent)
    .slice(0, 10);

  // 8. Response quality
  const respQuality = groupBy(ok, "persona", (group) => ({
    persona: group[0]!.persona,
    avg_response_length: Math.round(avg(group.map(p => p.response_length))),
    avg_citations: Math.round(avg(group.map(p => p.citations.length)) * 10) / 10,
    pct_has_search: Math.round(pct(group.filter(p => p.has_search).length, group.length)),
  })).sort((a, b) => b.avg_response_length - a.avg_response_length);

  // 9. Prompt structure effectiveness
  const structureEff = groupBy(ok, "prompt_structure", (group) => ({
    structure: group[0]!.prompt_structure,
    probes: group.length,
    avg_intent: Math.round(avg(group.map(p => p.intent_score)) * 10) / 10,
    avg_response_length: Math.round(avg(group.map(p => p.response_length))),
  })).sort((a, b) => b.avg_intent - a.avg_intent);

  // 10. OMS language penetration
  const omsProbes = ok.filter(p => p.contains_oms_language);
  const omsSignalCounts = new Map<string, number>();
  for (const p of ok) {
    for (const s of p.oms_signals_found) {
      omsSignalCounts.set(s, (omsSignalCounts.get(s) ?? 0) + 1);
    }
  }
  const omsLangPen = {
    pct_with_oms_language: Math.round(pct(omsProbes.length, ok.length)),
    top_oms_signals: [...omsSignalCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([signal, count]) => ({ signal, count })),
  };

  // Advertiser details
  const adMap = new Map<string, { prompts: string[]; copy: string[] }>();
  for (const p of withAds) {
    for (const ad of p.ads) {
      const entry = adMap.get(ad.advertiser) ?? { prompts: [], copy: [] };
      if (!entry.prompts.includes(p.prompt.slice(0, 80))) entry.prompts.push(p.prompt.slice(0, 80));
      if (!entry.copy.includes(ad.title)) entry.copy.push(ad.title);
      adMap.set(ad.advertiser, entry);
    }
  }
  const advertisers = [...adMap.entries()].map(([advertiser, data]) => ({
    advertiser, hits: data.prompts.length + data.copy.length,
    sample_prompts: data.prompts.slice(0, 3),
    sample_copy: data.copy.slice(0, 3),
  })).sort((a, b) => b.hits - a.hits);

  return {
    generated_at: new Date().toISOString(),
    total_probes: probes.length,
    total_success: ok.length,
    total_failed: probes.length - ok.length,
    total_ads: withAds.length,
    ad_rate_pct: Math.round(pct(withAds.length, ok.length) * 10) / 10,
    ad_density_by_persona: adByPersona,
    ad_density_by_need: adByNeed,
    ad_density_by_structure: adByStructure,
    competitor_frequency: competitorFreq,
    intent_by_persona: intentByPersona,
    intent_by_need: intentByNeed,
    coverage_gaps: coverageGaps,
    blue_ocean: blueOcean,
    response_quality: respQuality,
    prompt_structure_effectiveness: structureEff,
    oms_language_penetration: omsLangPen,
    advertisers,
  };
}

// ── helpers ──
function pct(part: number, total: number): number {
  return total === 0 ? 0 : (part / total) * 100;
}
function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}
function groupBy<T>(items: T[], key: keyof T, fn: (group: T[]) => any): any[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = String(item[key] ?? "unknown");
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return [...map.values()].map(fn);
}
