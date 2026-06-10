// VerseOdin scraper verification — single probe test
import { probeAds, probeContent, probeAI } from "../scraper/verseodin.js";

async function main() {
  console.log("VerseOdin Scraper Verification\n");

  // Test 1: Raw API call
  console.log("── Test 1: Raw probeAI ──");
  const raw = await probeAI("What is the best laptop for programming in 2026?", {
    engine: "chatgpt",
    country: "US",
    name: "verify-test",
  });
  console.log(`  Engine: ${raw.engine}`);
  console.log(`  Country: ${raw.country}`);
  console.log(`  Answer text (first 150 chars): ${raw.answer_text.slice(0, 150)}`);
  console.log(`  HTML size: ${(raw.answer_html.length / 1024).toFixed(0)} KB`);
  console.log(`  Citations: ${raw.citations.length}`);
  console.log(`  Took: ${raw.took_ms}ms`);
  console.log(`  Quota used today: ${raw.quota_used_today} / remaining: ${raw.quota_remaining_today}`);

  // Test 2: probeContent
  console.log("\n── Test 2: probeContent ──");
  const content = await probeContent("best API management platform for scaling microservices");
  console.log(`  Response: ${content.response_text?.slice(0, 150) ?? "N/A"}`);
  console.log(`  Links: ${content.links.length}`);

  // Test 3: probeAds
  console.log("\n── Test 3: probeAds ──");
  const ads = await probeAds("I'm looking for a crypto exchange with the best REST API for automated trading bots");
  console.log(`  HTML size: ${(ads.html.length / 1024).toFixed(0)} KB`);
  console.log(`  Ads found: ${ads.ads.length}`);
  for (const ad of ads.ads) {
    console.log(`    🔴 ${ad.advertiser}: "${ad.title}"`);
  }

  console.log("\n✅ VerseOdin scraper verified.");
}

main().catch((e) => {
  console.error("❌ VerseOdin verify failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
