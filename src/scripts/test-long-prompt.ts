import { probeAds } from "../scraper/client.js";
import { writeFileSync } from "node:fs";

const LONG_PROMPT = `I've been trading forex manually on MT4 for about 3 years now, mostly EUR/USD and GBP/JPY pairs with a trend-following strategy. I'm getting tired of staring at charts all day and want to automate my trades.

I've already written a Python backtester and my strategy shows good results over historical data. Now I need to connect to a broker's REST API to place live orders — market orders, limit orders, and stop losses. Latency matters because I'm looking at 1-minute and 5-minute timeframes.

Which forex broker has the best REST API for automated trading? I need good documentation, Python SDK support, and reliable execution. I've heard good things about OANDA and Interactive Brokers but want to know if there are better options for active automated traders.`;

async function main() {
  console.log("Probing with long multi-line prompt...");
  const r = await probeAds(LONG_PROMPT, "United States");
  console.log(`Ads: ${r.ads.length}, HTML: ${r.html.length}`);
  for (const ad of r.ads) console.log(`  ${ad.advertiser}: "${ad.title}"`);
  
  // Also test: same short prompt that triggered ads before
  console.log("\nProbing with short prompt (known ad trigger from batch #34)...");
  const SHORT = "I'm looking for a forex broker with a good REST API for placing automated trades on currency pairs";
  const r2 = await probeAds(SHORT, "United States");
  console.log(`Ads: ${r2.ads.length}, HTML: ${r2.html.length}`);
  for (const ad of r2.ads) console.log(`  ${ad.advertiser}: "${ad.title}"`);
  
  console.log("\nDone. Long prompt gave", r.ads.length, "ads, short gave", r2.ads.length);
}

main().catch(console.error);
