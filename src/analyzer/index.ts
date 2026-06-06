#!/usr/bin/env node
// Ad Intelligence Analyzer CLI
// Usage: pnpm analyze [--ingest] [--report]

import { ingest } from "./ingest.js";
import { computeTopicSummaries, computeAdvertiserSummaries, computeTriggerPatterns, computeBlueOcean } from "./patterns.js";
import { buildReport, printReport } from "./report.js";

const args = process.argv.slice(2);
const doIngest = args.length === 0 || args.includes("--ingest");
const doReport = args.length === 0 || args.includes("--report");

async function main() {
  if (doIngest) {
    console.log("Ingesting probe data...");
    const probes = await ingest();
    console.log(`  ${probes.length} probes ingested → data/probes.json`);
  }

  if (doReport) {
    // Dynamic import to avoid top-level issues
    const { readFile } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");

    if (!existsSync("data/probes.json")) {
      console.log("No data/probes.json found. Run with --ingest first.");
      process.exit(1);
    }

    const probes = JSON.parse(await readFile("data/probes.json", "utf8")) as Array<import("./types.js").ProbeRecord>;

    const topics = computeTopicSummaries(probes);
    const advertisers = computeAdvertiserSummaries(probes);
    const triggerPatterns = computeTriggerPatterns(probes);
    const blueOcean = computeBlueOcean(topics);

    const totalAds = probes.filter((p) => p.has_ads).length;
    const uniqueAdvertisers = new Set<string>();
    for (const p of probes) {
      for (const ad of p.ads) uniqueAdvertisers.add(ad.advertiser);
    }

    const report = buildReport(
      probes.length,
      totalAds,
      uniqueAdvertisers.size,
      topics,
      advertisers,
      triggerPatterns,
      blueOcean,
    );

    printReport(report);
  }
}

main().catch((e) => {
  console.error("Analyzer error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
