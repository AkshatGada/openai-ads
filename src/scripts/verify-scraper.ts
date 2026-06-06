// Read-only connectivity check for the ChatGPT scraper via Oxylabs.
// Run with: npx tsx src/scripts/verify-scraper.ts
import { probeContent, probeAds } from "../scraper/client.js";
import { config } from "../config.js";

async function main() {
  if (!config.oxylabs.username) {
    console.log("❌ Oxylabs credentials not set. Add OXYLABS_USERNAME and OXYLABS_PASSWORD to .env");
    process.exit(1);
  }

  console.log(`Scraper credentials: ${config.oxylabs.username ? "set" : "MISSING"}\n`);

  const testPrompts = [
    "best AI tools for automating workflows",
    "how to compare different AI APIs for my startup",
  ];

  // Test 1: Content probe
  console.log("── Content probe (parse=true) ──");
  const contentResult = await probeContent(testPrompts[0]!, "United States");
  console.log(`Model: ${contentResult.llm_model ?? "unknown"}`);
  console.log(`Response (first 200 chars): ${contentResult.response_text?.slice(0, 200) ?? "N/A"}`);
  console.log(`Links: ${contentResult.links.length}, Citations: ${contentResult.citations.length}`);

  // Test 2: Ad probe
  console.log("\n── Ad probe (parse=false) ──");
  const adResult = await probeAds(testPrompts[1]!, "United States");
  console.log(`HTML length: ${adResult.html.length} chars`);
  console.log(`Ads found: ${adResult.ads.length}`);
  if (adResult.ads.length > 0) {
    for (const ad of adResult.ads) {
      console.log(`  - "${ad.title}" → ${ad.target_url}`);
    }
  } else {
    console.log("  (No ads detected in HTML — may need to refine parser patterns)");
    console.log(`  HTML preview (first 500 chars): ${adResult.html.slice(0, 500)}`);
  }

  console.log("\n✅ Scraper connectivity verified.");
}

main().catch((e) => {
  console.error("❌ Scraper verify failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
