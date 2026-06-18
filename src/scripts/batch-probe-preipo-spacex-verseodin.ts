// SpaceX Pre-IPO Loop — VerseOdin (50 prompts)
// Probing who advertises on ChatGPT for SpaceX/pre-IPO queries

const PROMPTS = [
  "How can I buy SpaceX stock before it goes public?",
  "When is SpaceX going to IPO?",
  "Is there any way for regular people to invest in SpaceX right now?",
  "What's the latest rumor on SpaceX IPO date?",
  "How much is SpaceX worth right now per share?",
  "Can retail investors buy SpaceX shares before IPO?",
  "What's the minimum to invest in SpaceX pre IPO?",
  "Where can I buy SpaceX stock on the secondary market?",
  "Am I too late to invest in SpaceX pre-IPO?",
  "Do I need to be an accredited investor to buy SpaceX shares?",
  "How does pre IPO investing actually work?",
  "SpaceX valuation 2026 what is it",
  "What funds hold SpaceX shares I can invest in?",
  "How do SpaceX tender offers work?",
  "Can non US citizens buy SpaceX pre-IPO shares?",
  "Is there a way to buy SpaceX stock without being rich?",
  "What platforms let you buy private company shares?",
  "Risk of buying SpaceX on secondary market vs waiting for IPO",
  "Can I buy fractional shares of SpaceX?",
  "How do I become an accredited investor to get into SpaceX?",
  "Anyone know if SpaceX employees can sell their shares to outsiders?",
  "What price are SpaceX shares trading at on secondary markets?",
  "SpaceX pre IPO minimum investment amount?",
  "Is buying SpaceX pre-IPO worth the risk?",
  "How to invest in SpaceX with only 5k",
  "What are the best ways to get exposure to SpaceX before it goes public?",
  "SpaceX IPO timeline 2026 or 2027?",
  "Can I buy SpaceX stock indirectly through a fund?",
  "How do accredited investor requirements work for SpaceX investing?",
  "What is the secondary market for private shares and how does it work?",
  "is spacex publicly traded yet",
  "Comparing SpaceX pre-IPO to other companies like Stripe or Databricks",
  "How much could SpaceX shares be worth after IPO?",
  "Ways to invest in SpaceX before it IPOs for non-accredited investors",
  "What's the lockup period on SpaceX shares bought secondarily?",
  "Can I use my IRA to buy SpaceX pre-IPO shares?",
  "SpaceX share price estimate before IPO",
  "What's the process for buying SpaceX equity from an employee?",
  "How often does SpaceX do tender offers?",
  "Is SpaceX planning to IPO soon or are they just doing more tender offers?",
  "I want to buy SpaceX stock but I'm not an accredited investor any loopholes?",
  "What are the fees like for buying SpaceX on secondary markets?",
  "How liquid are SpaceX shares on the secondary market?",
  "SpaceX pre-IPO vs waiting to buy at IPO which is better?",
  "What's the difference between buying SpaceX in a tender offer vs on secondary market?",
  "How do I find out about upcoming SpaceX tender offers?",
  "Can I buy SpaceX stock if I'm not a US citizen?",
  "What documents do I need to buy SpaceX pre-IPO shares?",
  "Is there any ETF or mutual fund with SpaceX exposure?",
  "SpaceX revenue and valuation before IPO what do the numbers look like",
];

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { probeAds, countAds } from "../scraper/verseodin.js";

const CONCURRENCY = 8;
const OUT_DIR = "scraper-outputs-preipo-spacex-verseodin";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const existingFiles = new Set(
    existsSync(OUT_DIR) ? await import("node:fs/promises").then(fs => fs.readdir(OUT_DIR)) : []
  );

  let adsFound = 0;
  let skipped = 0;
  const advertisersSet = new Set<string>();
  const total = PROMPTS.length;

  console.log(`Starting SpaceX Pre-IPO VerseOdin Loop — ${total} prompts, 8 concurrent\n`);

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = PROMPTS.slice(i, i + CONCURRENCY);
    
    const pending = batch.map((prompt, j) => {
      const num = String(i + j + 1).padStart(3, "0");
      const fname = `${num}_${sanitize(prompt.slice(0, 70))}.html`;
      return { num, prompt, fname, alreadyDone: existingFiles.has(fname) };
    });

    const alreadyDone = pending.filter(p => p.alreadyDone).length;
    skipped += alreadyDone;
    if (alreadyDone > 0) {
      console.log(`[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}] ${alreadyDone} skipped`);
    }

    const toRun = pending.filter(p => !p.alreadyDone);
    if (toRun.length === 0) continue;

    const batchStart = Date.now();

    const results = await Promise.all(
      toRun.map(async ({ num, prompt, fname }) => {
        try {
          const result = await probeAds(prompt, "US");
          const adCount = countAds(result.html);
          await writeFile(`${OUT_DIR}/${fname}`, result.html);
          return { num, prompt, adCount, htmlSize: result.html.length, ads: result.ads, ok: true };
        } catch (e) {
          return { num, prompt, adCount: 0, htmlSize: 0, ads: [], ok: false, err: e instanceof Error ? e.message : String(e) };
        }
      })
    );

    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(0);
    for (const r of results) {
      if (r.ok && r.adCount > 0) {
        adsFound++;
        for (const ad of r.ads) {
          advertisersSet.add(ad.advertiser ?? "Unknown");
        }
      }
    }

    const success = results.filter(r => r.ok).length;
    const batchAds = results.filter(r => r.adCount > 0).length;
    const sizes = results.filter(r => r.ok).map(r => r.htmlSize);
    const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024).toFixed(0) : "0";
    const batchLabel = `[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}]`;
    console.log(`${batchLabel} ${elapsed}s | ${success}/${toRun.length} ok | ${batchAds} ads | avg ${avgSize}KB`);
    
    for (const r of results) {
      if (r.ok && r.adCount > 0) {
        for (const ad of r.ads) {
          console.log(`  🔴 [${r.num}] ${ad.advertiser}: "${ad.title}" — "${r.prompt.slice(0, 60)}..."`);
        }
      }
    }

    if (i + CONCURRENCY < total) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${total} prompts had ads.`);
  if (skipped > 0) console.log(`${skipped} prompts already existed and were skipped.`);
  console.log(`Unique advertisers: ${advertisersSet.size}`);
  if (advertisersSet.size > 0) console.log(`Advertisers: ${[...advertisersSet].join(", ")}`);
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

main().catch(console.error);
