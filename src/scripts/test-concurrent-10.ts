import { probeAds } from "../scraper/verseodin.js";

const PROMPTS = Array.from({length: 10}, (_, i) => 
  `stablecoin payment infrastructure API for fintech platform — need regulated fiat rails ${i}`
);

async function main() {
  console.log("Testing 10 concurrent VerseOdin probes...");
  const start = Date.now();
  const results = await Promise.all(PROMPTS.map(p => 
    probeAds(p, "US").catch(e => ({ prompt: p, html: "", ads: [], error: e.message }))
  ));
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const success = results.filter((r: any) => !r.error).length;
  const errors = results.filter((r: any) => r.error);
  console.log(`10 concurrent: ${elapsed}s, ${success}/10 success`);
  if (errors.length) console.log(`Errors: ${errors.map((e: any) => e.error).join(", ")}`);
}

main().catch(e => console.error(e.message));
