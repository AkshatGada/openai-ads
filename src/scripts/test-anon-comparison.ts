// Test: compare ad rates between VerseOdin and Oxylabs on the same prompts
import { probeAds as voProbeAds } from "../scraper/verseodin.js";
import { probeAds as oxProbeAds } from "../scraper/client.js";

const PROMPTS = [
  "we pay 5000 sellers across 40 countries monthly — looking for a stablecoin API that handles disbursements with instant settlement",
  "evaluating whether to use Circle or find a vertically integrated alternative for stablecoin payment infrastructure",
  "our marketplace payment costs are 3 percent of GMV — looking for instant stablecoin settlement at lower cost",
  "need a stablecoin API with a sandbox environment and webhook support for processing cross-border payments",
  "comparing payment APIs that handle fiat deposits USDC conversion and bank off-ramps — need KYC built in",
];

async function main() {
  console.log("Side-by-side test: VerseOdin vs Oxylabs\n");
  console.log("Both use anonymous sessions. If ad rates differ significantly, session/IP matters.");
  console.log("If rates are similar, the limitation is platform maturity + category niche.\n");

  let voAds = 0;
  let oxAds = 0;

  for (let i = 0; i < PROMPTS.length; i++) {
    const p = PROMPTS[i]!;
    console.log(`\nPrompt ${i + 1}: ${p.slice(0, 70)}...`);

    // VerseOdin (anonymous, fresh session, VerseOdin's IPs)
    try {
      const vo = await voProbeAds(p, "US");
      console.log(`  VerseOdin: ${vo.ads.length} ads ${vo.ads.length > 0 ? vo.ads.map(a => a.advertiser + ': ' + a.title).join(', ') : ''}`);
      voAds += vo.ads.length;
    } catch (e: any) {
      console.log(`  VerseOdin: ERROR ${e.message?.slice(0, 50)}`);
    }

    // Oxylabs (anonymous, fresh session, Oxylabs proxy IPs)
    try {
      const ox = await oxProbeAds(p, "United States");
      console.log(`  Oxylabs:   ${ox.ads.length} ads ${ox.ads.length > 0 ? ox.ads.map(a => a.advertiser + ': ' + a.title).join(', ') : ''}`);
      oxAds += ox.ads.length;
    } catch (e: any) {
      console.log(`  Oxylabs:   ERROR ${e.message?.slice(0, 50)}`);
    }

    // Small pause
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n═════════════════════════════════`);
  console.log(`VerseOdin total: ${voAds}/${PROMPTS.length} had ads`);
  console.log(`Oxylabs total:   ${oxAds}/${PROMPTS.length} had ads`);
  console.log(`\nConclusion: ${voAds === oxAds ? 'Rates match — session type unlikely to be the differentiator' : 'Rates differ — session/IP might be a factor'}`);
}

main().catch(e => console.error(e.message));
