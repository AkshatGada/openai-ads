import type { AnalysisReport, TopicSummary, AdvertiserSummary, TriggerPattern } from "./types.js";

function bar(density: number, width = 20): string {
  const filled = Math.round((density / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

export function printReport(report: AnalysisReport): void {
  const sep = "─".repeat(66);

  console.log(`\n${sep}`);
  console.log(`  OpenAI Ads Intelligence Analyzer`);
  console.log(`  ${report.total_probes} probes · ${report.total_advertisers} advertisers · ${report.total_ads} ad hits`);
  console.log(`${sep}\n`);

  // ── Topic Ad Density ──
  console.log("AD DENSITY BY TOPIC");
  if (report.topics.length === 0) {
    console.log("  (no topics classified)\n");
  } else {
    for (const t of report.topics) {
      const label = t.topic === "uncategorized" ? "uncategorized" : t.topic;
      const comp = t.competition === "none" ? "BLUE OCEAN" : t.competition.toUpperCase();
      console.log(`  ${pad(label, 14)} ${bar(t.density)}  ${String(t.density).padStart(4)}% (${t.ads}/${t.probes})  ${comp}`);
    }
    console.log("");
  }

  // ── Advertiser Coverage Map ──
  console.log("ADVERTISER COVERAGE MAP");
  if (report.advertisers.length === 0) {
    console.log("  No advertisers detected in any probe.\n");
  } else {
    for (const a of report.advertisers) {
      const barWidth = Math.min(a.hits * 4, 30);
      const hbar = "█".repeat(barWidth);
      const style = a.campaign_style === "multi_dynamic" ? " [dynamic ads]" : a.campaign_style === "single_broad" ? " [broad campaign]" : "";
      console.log(`  ${pad(a.advertiser, 17)} ${hbar}  ${a.hits} hit${a.hits > 1 ? "s" : " "}  topics: ${a.topics_seen.join(", ")}${style}`);
      if (a.copies_seen.length > 0) {
        for (const copy of a.copies_seen) console.log(`                       "${copy}"`);
      }
    }
    console.log("");
  }

  // ── Trigger Patterns ──
  console.log("TRIGGER PATTERNS");
  for (const p of report.trigger_patterns) {
    const badge = p.confidence === "high" ? "●" : p.confidence === "medium" ? "◐" : "○";
    console.log(`  ${badge} ${pad(p.confidence.toUpperCase(), 6)} ${p.description}`);
  }
  console.log("");

  // ── Blue Ocean Opportunities ──
  if (report.blue_ocean.length > 0) {
    console.log("TOP BLUE OCEAN OPPORTUNITIES");
    for (let i = 0; i < Math.min(report.blue_ocean.length, 10); i++) {
      console.log(`  ${i + 1}. ${report.blue_ocean[i]}`);
    }
    console.log("");
  }

  console.log(`Report generated: ${report.generated_at}`);
  console.log("");
}

export function buildReport(
  probesLength: number,
  totalAds: number,
  totalAdvertisers: number,
  topics: TopicSummary[],
  advertisers: AdvertiserSummary[],
  triggerPatterns: TriggerPattern[],
  blueOcean: string[],
): AnalysisReport {
  return {
    generated_at: new Date().toISOString(),
    total_probes: probesLength,
    total_ads: totalAds,
    total_advertisers: totalAdvertisers,
    overall_fill_rate: probesLength > 0 ? (totalAds / probesLength) * 100 : 0,
    topics,
    advertisers,
    trigger_patterns: triggerPatterns,
    blue_ocean: blueOcean,
  };
}
