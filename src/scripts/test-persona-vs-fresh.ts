import { probeAds as voProbeAds } from "../scraper/verseodin.js";
import { probeWithProfile } from "../playwright-scraper/client.js";

const PROMPTS = [
  "we pay 5000 sellers across 40 countries monthly and need instant stablecoin settlement — what production APIs handle this",
  "best REST API for processing cross-border stablecoin payments with KYC built in and webhook support",
  "our marketplace loses 200K a year on FX fees for global seller payouts — can stablecoin settlement reduce this",
  "comparing Circle vs alternatives for stablecoin payment infrastructure — need something vertically integrated that owns the settlement layer",
  "evaluating stablecoin disbursement APIs for paying contractors globally from a single treasury wallet",
];

async function main() {
  console.log("Testing: Persona (persistent cookies + 6-chat history) vs Fresh (VerseOdin)\n");

  let personaAds = 0;
  let freshAds = 0;

  for (let i = 0; i < PROMPTS.length; i++) {
    const p = PROMPTS[i]!;
    console.log(`[${i + 1}/5] ${p.slice(0, 60)}...`);

    // Persona: persistent cookies, 6-chat history, anonymous, local IP
    try {
      const pr = await probeWithProfile(p, { persona: "crypto-trader", headless: true, loginIfNeeded: false });
      const prAds = pr.ads.length;
      personaAds += prAds;
      console.log(`  Persona (persistent): ${prAds} ads`);
    } catch (e: any) {
      console.log(`  Persona: ERROR ${e.message?.slice(0, 50)}`);
    }

    // VerseOdin: fresh session each time, anonymous, VerseOdin's IP
    try {
      const vo = await voProbeAds(p, "US");
      const voAds = vo.ads.length;
      freshAds += voAds;
      console.log(`  VerseOdin (fresh):    ${voAds} ads`);
    } catch (e: any) {
      console.log(`  VerseOdin: ERROR ${e.message?.slice(0, 50)}`);
    }

    // Pause between pairs
    if (i < PROMPTS.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n═════════════════════════════════`);
  console.log(`Persona total: ${personaAds}/${PROMPTS.length}`);
  console.log(`VerseOdin:      ${freshAds}/${PROMPTS.length}`);
  console.log(`\nInsight: ${personaAds > freshAds ? 'Persistent history got MORE ads — depth matters' : personaAds === freshAds ? 'No difference — session depth does NOT affect ad rate' : 'Fresh got more ads — unexpected'}`);
  console.log(`Note: Both are anonymous. The difference is conversation history.`);
}

main().catch(e => console.error(e.message));
