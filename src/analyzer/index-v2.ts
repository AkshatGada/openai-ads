#!/usr/bin/env node
// OMS Analysis Pipeline V2 — CLI
// Usage: pnpm analyze-oms

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { cleanProbes } from "./cleaner-v2.js";
import { classifyProbes } from "./classifier-v2.js";
import { computePatterns } from "./insights-v2.js";
import type { ProbeRecordV2, PatternSummary } from "./types-v2.js";

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function printReport(probes: ProbeRecordV2[], patterns: PatternSummary): void {
  const sep = "═".repeat(66);

  console.log(`\n${sep}`);
  console.log(`  OMS AD INTELLIGENCE — Loop 1`);
  console.log(`  ${patterns.total_probes} probes · ${patterns.advertisers.length} advertisers · ${patterns.ad_rate_pct}% ad rate`);
  console.log(`  ${patterns.total_success} ok · ${patterns.total_failed} failed validation`);
  console.log(`${sep}\n`);

  // ── Ad Density by Persona ──
  console.log("AD DENSITY BY PERSONA");
  if (patterns.ad_density_by_persona.length === 0) {
    console.log("  (no data)\n");
  } else {
    for (const a of patterns.ad_density_by_persona) {
      const bar = "█".repeat(Math.round(a.rate / 5)) + "░".repeat(20 - Math.round(a.rate / 5));
      console.log(`  ${pad(a.persona, 20)} ${bar}  ${a.rate.toFixed(1)}% (${a.ads}/${a.probes})  ${a.competition.toUpperCase()}`);
    }
    console.log("");
  }

  // ── Ad Density by Need ──
  console.log("AD DENSITY BY PRIMARY NEED");
  for (const a of patterns.ad_density_by_need) {
    console.log(`  ${pad(a.need, 20)} ${a.rate.toFixed(1)}% (${a.ads}/${a.probes})  ${a.competition.toUpperCase()}`);
  }
  console.log("");

  // ── Advertisers Found ──
  console.log("ADVERTISERS FOUND");
  if (patterns.advertisers.length === 0) {
    console.log("  No ads detected in any probe.\n");
  } else {
    for (const a of patterns.advertisers) {
      console.log(`  ${a.advertiser} (${a.hits} hits)`);
      for (const copy of a.sample_copy) console.log(`    └ "${copy}"`);
      for (const prompt of a.sample_prompts.slice(0, 2)) console.log(`    └ Prompt: "${prompt}..."`);
    }
    console.log("");
  }

  // ── Competitor Frequency ──
  console.log("ORGANIC COMPETITORS (ChatGPT's recommendations)");
  const organic = patterns.competitor_frequency.filter(c => c.organic_mentions > 0);
  if (organic.length === 0) {
    console.log("  No known competitors mentioned in responses.\n");
  } else {
    for (const c of organic.slice(0, 10)) {
      console.log(`  ${pad(c.company, 18)} ${c.organic_mentions} mentions (organic)${c.paid_impressions > 0 ? ` + ${c.paid_impressions} ads` : ""}`);
    }
    console.log("");
  }

  // ── Coverage Gaps ──
  console.log("OMS COVERAGE GAPS (what ChatGPT doesn't recommend that OMS does)");
  for (const g of patterns.coverage_gaps) {
    const badge = g.gap_value === "HIGH" ? "◉" : g.gap_value === "MEDIUM" ? "◐" : "○";
    console.log(`  ${badge} ${g.gap_value.padEnd(6)} ${g.capability}${g.covered_by.length > 0 ? ` — covered by: ${g.covered_by.join(", ")}` : ""}`);
  }
  console.log("");

  // ── Blue Ocean ──
  console.log("BLUE OCEAN (intent ≥ 7, zero ads)");
  if (patterns.blue_ocean.length === 0) {
    console.log("  No blue ocean candidates found.\n");
  } else {
    for (const b of patterns.blue_ocean) {
      console.log(`  ${b.rank}. ${pad(b.persona + " + " + b.need, 35)} ${b.probes} probes  avg intent ${b.avg_intent}`);
    }
    console.log("");
  }

  // ── Persona Performance ──
  console.log("PERSONA PERFORMANCE");
  for (const i of patterns.intent_by_persona) {
    const rq = patterns.response_quality.find(r => r.persona === i.persona);
    const ad = patterns.ad_density_by_persona.find(a => a.persona === i.persona);
    console.log(`  ${pad(i.persona, 20)} intent avg ${i.avg_intent.toFixed(1)} / max ${i.max_intent}  |  resp ${rq?.avg_response_length ?? "?"} chars  |  ads ${ad?.ads ?? 0}`);
  }
  console.log("");

  // ── Prompt Structure ──
  console.log("PROMPT STRUCTURE EFFECTIVENESS");
  for (const s of patterns.prompt_structure_effectiveness) {
    const ad = patterns.ad_density_by_structure.find(a => a.structure === s.structure);
    console.log(`  ${pad(s.structure, 18)} ${s.probes} prompts  avg intent ${s.avg_intent}  avg resp ${s.avg_response_length} chars  ads ${ad?.ads ?? 0}`);
  }
  console.log("");

  // ── OMS Language ──
  console.log(`OMS LANGUAGE: ${patterns.oms_language_penetration.pct_with_oms_language}% of prompts contain OMS API terminology`);
  if (patterns.oms_language_penetration.top_oms_signals.length > 0) {
    console.log("  Top signals: " + patterns.oms_language_penetration.top_oms_signals.map(s => `"${s.signal}" (${s.count})`).join(", "));
  }
  console.log("");

  console.log(`${sep}`);
  console.log(`  Generated: ${patterns.generated_at}`);
  console.log(`  Next: Review → adjust strategy → run Loop 2`);
  console.log(`${sep}\n`);
}

async function main(): Promise<void> {
  console.log("OMS Analysis Pipeline V2\n");

  // Layer 1: Clean
  console.log("[Layer 1] Cleaning HTMLs...");
  const probes = await cleanProbes();

  if (probes.length === 0) {
    console.log("No probes found in scraper-outputs-oms-loop1/. Run the batch first.");
    process.exit(1);
  }

  // Layer 1.5: Classify
  console.log("[Layer 1.5] Classifying...");
  classifyProbes(probes);

  // Save enriched probes
  const enrichedPath = "data/oms-probes-v2.json";
  writeFileSync(enrichedPath, JSON.stringify(probes, null, 2));
  console.log(`  ${probes.length} probes enriched → ${enrichedPath}`);

  // Layer 2: Patterns
  console.log("[Layer 2] Computing patterns...");
  const patterns = computePatterns(probes);

  // Save patterns
  if (!existsSync("data")) mkdirSync("data", { recursive: true });
  writeFileSync("data/oms-patterns-v2.json", JSON.stringify(patterns, null, 2));
  console.log(`  Patterns saved → data/oms-patterns-v2.json\n`);

  // Layer 3: Report
  printReport(probes, patterns);
}

main().catch((e) => {
  console.error("Analyzer error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
