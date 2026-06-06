import type { ProbeRecord, TopicSummary, AdvertiserSummary, TriggerPattern } from "./types.js";

const DEV_ADVERTISERS = new Set(["Anakin Technologies Inc", "MongoDB", "Tinfoil"]);
const FINANCE_ADVERTISERS = new Set(["BestMoney", "Robinhood"]);

const COMMERCIAL_INTENT: Record<string, "high" | "medium" | "low"> = {
  finance: "high",
  crypto: "high",
  dev_tools: "high",
  insurance: "high",
  healthcare: "medium",
  marketing: "medium",
  travel: "medium",
};

export function computeTopicSummaries(probes: ProbeRecord[]): TopicSummary[] {
  const map = new Map<string, { probes: number; ads: number }>();

  for (const p of probes) {
    for (const topic of p.features.topics) {
      const entry = map.get(topic) ?? { probes: 0, ads: 0 };
      entry.probes++;
      if (p.has_ads) entry.ads++;
      map.set(topic, entry);
    }
  }

  const summaries: TopicSummary[] = [];
  for (const [topic, data] of map) {
    const density = data.probes > 0 ? (data.ads / data.probes) * 100 : 0;
    let competition: TopicSummary["competition"] = "none";
    if (density === 0) competition = "none";
    else if (density < 5) competition = "low";
    else if (density < 15) competition = "medium";
    else competition = "high";

    summaries.push({
      topic,
      probes: data.probes,
      ads: data.ads,
      density: Math.round(density * 10) / 10,
      competition,
      commercial_intent: COMMERCIAL_INTENT[topic] ?? "low",
    });
  }

  summaries.sort((a, b) => b.ads - a.ads || b.probes - a.probes);
  return summaries;
}

export function computeAdvertiserSummaries(probes: ProbeRecord[]): AdvertiserSummary[] {
  const map = new Map<string, { hits: number; copies: Set<string>; topics: Set<string> }>();

  for (const p of probes) {
    for (const ad of p.ads) {
      const entry = map.get(ad.advertiser) ?? { hits: 0, copies: new Set(), topics: new Set() };
      entry.hits++;
      entry.copies.add(ad.title);
      for (const t of p.features.topics) entry.topics.add(t);
      map.set(ad.advertiser, entry);
    }
  }

  const summaries: AdvertiserSummary[] = [];
  for (const [advertiser, data] of map) {
    const copies = [...data.copies];
    let campaignStyle: AdvertiserSummary["campaign_style"] = "unknown";
    if (data.hits >= 2 && copies.length === 1) {
      campaignStyle = "single_broad";
    } else if (data.hits >= 2 && copies.length >= 2) {
      campaignStyle = "multi_dynamic";
    }

    summaries.push({
      advertiser,
      hits: data.hits,
      copies_seen: copies,
      topics_seen: [...data.topics],
      campaign_style: campaignStyle,
    });
  }

  summaries.sort((a, b) => b.hits - a.hits);
  return summaries;
}

export function computeTriggerPatterns(probes: ProbeRecord[]): TriggerPattern[] {
  const patterns: TriggerPattern[] = [];

  // Pattern 1: API keyword → dev tool ad
  let apiPrompts = 0;
  let apiDevAds = 0;
  for (const p of probes) {
    if (!p.features.contains_api) continue;
    apiPrompts++;
    if (p.ads.some((a) => DEV_ADVERTISERS.has(a.advertiser))) apiDevAds++;
  }
  patterns.push({
    rule: "API keyword triggers dev-tool advertiser ads",
    confidence: apiPrompts > 0 && apiDevAds / apiPrompts > 0.03 ? "high" : apiPrompts > 0 ? "medium" : "low",
    matches: apiDevAds,
    description: `${apiDevAds}/${apiPrompts} API-containing prompts triggered dev-tool ads (${apiDevAds > 0 ? ((apiDevAds / apiPrompts) * 100).toFixed(1) : "0"}%)`,
  });

  // Pattern 2: Financial intent → lead-gen ad
  let finIntent = 0;
  let finIntentAds = 0;
  for (const p of probes) {
    if (p.features.topics.includes("finance") && (p.features.intent_type === "comparison" || p.features.intent_type === "need")) {
      finIntent++;
      if (p.ads.some((a) => FINANCE_ADVERTISERS.has(a.advertiser))) finIntentAds++;
    }
  }
  patterns.push({
    rule: "Financial intent prompts trigger lead-gen/comparison ads",
    confidence: finIntentAds > 0 ? "medium" : "low",
    matches: finIntentAds,
    description: `${finIntentAds}/${finIntent} financial intent (comparison/need) prompts triggered finance ads`,
  });

  // Pattern 3: Ad fill rate
  const totalAds = probes.filter((p) => p.has_ads).length;
  patterns.push({
    rule: "Overall ad auction fill rate",
    confidence: "high",
    matches: totalAds,
    description: `${totalAds}/${probes.length} prompts had ads (${((totalAds / probes.length) * 100).toFixed(1)}% fill rate — auction is ${totalAds / probes.length < 0.05 ? "very thin" : totalAds / probes.length < 0.15 ? "thin" : "moderate"})`,
  });

  // Pattern 4: Advertiser campaign style
  const adSummaries = computeAdvertiserSummaries(probes);
  const multiCampaigns = adSummaries.filter((a) => a.campaign_style === "multi_dynamic");
  const singleCampaigns = adSummaries.filter((a) => a.campaign_style === "single_broad");
  patterns.push({
    rule: "Multi-dynamic advertisers serve different ads per context",
    confidence: multiCampaigns.length > 0 ? "medium" : "low",
    matches: multiCampaigns.length,
    description: `${multiCampaigns.length} advertisers use dynamic ad copy (matching prompt category). ${singleCampaigns.length} use a single broad campaign.`,
  });

  // Pattern 5: Blue ocean — high intent, zero ads
  const topicSummaries = computeTopicSummaries(probes);
  const blueOcean = topicSummaries
    .filter((t) => t.ads === 0 && t.commercial_intent !== "low")
    .sort((a, b) => {
      const intentOrder = { high: 3, medium: 2, low: 1 };
      return (intentOrder[b.commercial_intent] ?? 0) - (intentOrder[a.commercial_intent] ?? 0) || b.probes - a.probes;
    });
  patterns.push({
    rule: "Blue ocean topics: high commercial intent with zero advertisers",
    confidence: blueOcean.length > 0 ? "medium" : "low",
    matches: blueOcean.length,
    description: `${blueOcean.length} topics have commercial intent but zero ads — first-mover opportunity.`,
  });

  return patterns;
}

export function computeBlueOcean(topics: TopicSummary[]): string[] {
  return topics
    .filter((t) => t.ads === 0 && t.commercial_intent !== "low")
    .sort((a, b) => {
      const intentOrder = { high: 3, medium: 2, low: 1 };
      return (intentOrder[b.commercial_intent] ?? 0) - (intentOrder[a.commercial_intent] ?? 0) || b.probes - a.probes;
    })
    .map((t) => {
      const label = t.topic === "uncategorized" ? t.topic : `"${t.topic}"`;
      return `${t.probes} probes, 0 ads, ${t.commercial_intent.toUpperCase()} intent → ${label} prompts`;
    });
}
