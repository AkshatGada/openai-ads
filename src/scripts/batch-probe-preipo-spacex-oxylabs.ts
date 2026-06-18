// SpaceX Pre-IPO Loop — Oxylabs (50 prompts)
// Probing who advertises on ChatGPT for SpaceX/pre-IPO queries

const PROMPTS = [
  "How to get notified when SpaceX IPO is announced?",
  "What's the lock-up period like for SpaceX pre-IPO investors?",
  "How do I vet a secondary market platform before buying SpaceX shares?",
  "Can I buy SpaceX stock through my company's 401k?",
  "What kind of discount do you get buying SpaceX pre-IPO vs the expected IPO price?",
  "What happens to my SpaceX shares if the IPO gets delayed years?",
  "How do secondary market transactions work for a company like SpaceX?",
  "Are there any funds specifically focused on SpaceX?",
  "How to buy SpaceX stock from current or former employees?",
  "What are the tax implications of buying SpaceX pre-IPO shares?",
  "SpaceX pre IPO stock price today",
  "How volatile is the secondary market price for SpaceX shares?",
  "Is SpaceX doing another tender offer in 2026?",
  "What's the smallest amount of SpaceX stock I can buy?",
  "How to get accredited investor status fast so I can buy SpaceX",
  "Does SpaceX allow employees to sell vested shares to outside investors?",
  "Why hasn't SpaceX IPO'd yet?",
  "What multiple is SpaceX trading at on secondary markets?",
  "Is it better to invest in SpaceX now or wait for the IPO?",
  "How do secondary market platforms verify you actually own the SpaceX shares?",
  "What are the hidden risks of buying SpaceX stock before it goes public?",
  "Can I pool money with friends to meet the SpaceX minimum investment?",
  "SpaceX vs Blue Origin pre-IPO which is the better bet?",
  "What's stopping SpaceX from going public?",
  "How do I get allocation to SpaceX in a tender offer?",
  "Are there any debt instruments or notes that give exposure to SpaceX?",
  "How much has SpaceX valuation grown over the last few tender offers?",
  "What happens if SpaceX never IPOs and I bought shares on the secondary market?",
  "Can I buy SpaceX stock through a trust or LLC?",
  "How long does it take to complete a SpaceX secondary market transaction?",
  "What are the best questions to ask before buying SpaceX pre-IPO shares?",
  "Is the SpaceX secondary market price inflated right now?",
  "How to compare SpaceX pre-IPO investment to other private companies",
  "What percentage of SpaceX is still available for private investors?",
  "Can retail investors ever participate in SpaceX tender offers?",
  "How do I know if I'm getting a fair price for SpaceX shares on the secondary market?",
  "SpaceX IPO how much will shares cost at open?",
  "What's the holding period for SpaceX pre-IPO shares before I can sell?",
  "how risky is it to buy spacex stock on secondary like honestly",
  "Are there any publicly traded companies that own SpaceX shares?",
  "How to buy SpaceX stock step by step",
  "What's the process for transferring SpaceX shares after a secondary sale?",
  "Does SpaceX have right of first refusal on secondary share sales?",
  "SpaceX pre IPO investing for beginners",
  "What's the difference between common and preferred SpaceX shares on secondary?",
  "How do I research SpaceX financials before committing to a pre-IPO investment?",
  "Can SpaceX block me from buying their stock on the secondary market?",
  "What questions should I ask a broker about SpaceX pre-IPO shares?",
  "Is there a deadline to buy SpaceX before IPO or can I buy up to the day before?",
  "How do I compare SpaceX's pre-IPO valuation to its actual revenue?",
  "Where to find reliable SpaceX IPO rumors and news",
];

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { probeAds } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-preipo-spacex-oxylabs";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

const CONCURRENCY = 5;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const existingFiles = new Set(
    existsSync(OUT_DIR) ? await import("node:fs/promises").then(fs => fs.readdir(OUT_DIR)) : []
  );

  let adsFound = 0;
  let skipped = 0;
  const advertisers = new Set<string>();
  const total = PROMPTS.length;

  console.log(`Starting SpaceX Pre-IPO Oxylabs Loop — ${total} prompts, ${CONCURRENCY} concurrent\n`);

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = PROMPTS.slice(i, i + CONCURRENCY);
    const batchStart = Date.now();

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

    const results = await Promise.all(
      toRun.map(async ({ num, prompt, fname }) => {
        try {
          const result = await probeAds(prompt, "United States");
          const hasAd = result.ads.length > 0;
          await writeFile(`${OUT_DIR}/${fname}`, result.html);
          return { num, prompt, ads: result.ads, htmlSize: result.html.length, ok: true };
        } catch (e) {
          return { num, prompt, ads: [], htmlSize: 0, ok: false, err: e instanceof Error ? e.message : String(e) };
        }
      })
    );

    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(0);
    const success = results.filter(r => r.ok).length;
    const batchAds = results.filter(r => r.ok && r.ads.length > 0).length;
    const sizes = results.filter(r => r.ok).map(r => r.htmlSize);
    const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024).toFixed(0) : "0";
    const batchLabel = `[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}]`;
    console.log(`${batchLabel} ${elapsed}s | ${success}/${toRun.length} ok | ${batchAds} ads | avg ${avgSize}KB`);

    for (const r of results) {
      if (r.ok && r.ads.length > 0) {
        adsFound++;
        for (const ad of r.ads) {
          advertisers.add(ad.advertiser ?? "Unknown");
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
  console.log(`Unique advertisers: ${advertisers.size}`);
  if (advertisers.size > 0) console.log(`Advertisers: ${[...advertisers].join(", ")}`);
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

main().catch(console.error);
