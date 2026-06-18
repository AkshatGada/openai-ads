import { probeAds } from "../scraper/verseodin.js";

const TEST_PROMPTS = [
  "best REST API for processing stablecoin payments with webhook support and sandbox environment",
  "I need to add stablecoin payment rails to our fintech platform — what production-ready APIs exist for fiat on-ramps USDC settlement and bank off-ramps",
  "comparing stablecoin payment infrastructure for a neobank — Circle vs Coinbase vs any other regulated options",
  "we pay 5000 sellers across 40 countries monthly — looking for a stablecoin API that handles disbursements with instant settlement",
  "our marketplace loses 200K a year on FX fees for global seller payouts — can stablecoin settlement through a single API bring this down",
];

async function testConcurrent(n: number) {
  const start = Date.now();
  const results = await Promise.all(TEST_PROMPTS.slice(0, n).map(p => 
    probeAds(p, "US").catch(e => ({ prompt: p, html: "", ads: [], error: e.message }))
  ));
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const success = results.filter((r: any) => !r.error).length;
  console.log(`  ${n} concurrent: ${elapsed}s, ${success}/${n} success`);
}

async function main() {
  console.log("Testing concurrent VerseOdin probes...\n");
  
  for (const n of [3, 5]) {
    await testConcurrent(n);
  }
  
  console.log("\nNow testing 10 concurrent with 10 unique prompts...");
}

main().catch(e => console.error(e.message));
