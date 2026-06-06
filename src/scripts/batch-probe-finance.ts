// Batch probe: 50 financial services prompts → scrape ChatGPT via Oxylabs
// Run alongside batch-probe-crypto.ts — uses same API, separate output dir

const PROMPTS = [
  // ── Investment & Trading Apps (12) ──
  "I'm looking for the best stock trading app for beginners with low fees and fractional shares",
  "Robinhood vs Fidelity vs Charles Schwab — which investing platform is best for long-term portfolios?",
  "What's the best robo-advisor for automated investing in 2025 — Betterment vs Wealthfront vs Vanguard?",
  "I want to start investing in ETFs with a mobile app — which platform has the lowest expense ratios?",
  "Best investment app for dollar cost averaging into index funds with no commission fees",
  "Looking for a brokerage account that offers both stocks and bonds with good research tools",
  "Which trading platform has the best mobile app for active traders who want real-time data and low fees?",
  "I need an investing platform with tax-loss harvesting and automated portfolio rebalancing",
  "Best platform for buying fractional shares of expensive stocks like Amazon and Google",
  "What's the best brokerage for someone who wants to invest in mutual funds and ETFs with no minimum balance?",
  "I'm comparing E*TRADE vs TD Ameritrade vs Webull — which has the best user experience for casual investors?",
  "Best individual retirement account platform — which provider offers the best IRA options and lowest fees?",

  // ── Banking & Savings (10) ──
  "I'm looking for the best high-yield savings account with no fees and a good mobile app",
  "Which online bank has the highest APY for savings accounts right now — comparing Ally vs Marcus vs Discover",
  "Best checking account with no monthly fees and good overdraft protection",
  "I need a business bank account for my LLC — which bank offers the best small business checking?",
  "What's the best cash management account that combines checking and savings with competitive interest rates?",
  "Looking for a bank with excellent international wire transfer services and low forex fees",
  "Which neobank is best — Chime vs SoFi vs Varo for everyday banking with early direct deposit?",
  "Best bank for joint accounts — I need something with good budgeting tools and shared access",
  "I want to open a CD or certificate of deposit — which bank currently offers the best rates?",
  "Which bank offers the best signup bonus for opening a new checking account with direct deposit?",

  // ── Credit Cards (10) ──
  "I'm looking for the best cash back credit card with no annual fee and good rewards on groceries and gas",
  "Best travel rewards credit card for someone who flies a few times a year — Chase vs Amex vs Capital One?",
  "Which credit card offers the best balance transfer with 0% APR and no transfer fees?",
  "I need a business credit card for my startup — which one has the best rewards for advertising and software spend?",
  "Best student credit card with no credit history required and cash back on everyday purchases",
  "Looking for a credit card with the best purchase protection and extended warranty benefits",
  "Which premium travel card is worth the annual fee — Amex Platinum vs Chase Sapphire Reserve vs Capital One Venture X?",
  "Best secured credit card for building credit from scratch with low deposit requirements",
  "I want a credit card that offers the best rewards for dining out and food delivery services",
  "Which credit card has the best 0% intro APR for new purchases and balance transfers combined?",

  // ── Personal Finance & Budgeting (8) ──
  "I'm looking for the best budgeting app that automatically categorizes my spending and syncs with my bank",
  "Mint is shutting down — what's the best alternative budgeting app for tracking expenses and net worth?",
  "Best expense tracking app for freelancers who need to separate business and personal spending",
  "I need a personal finance app that helps me save for multiple goals and tracks my progress visually",
  "Which app is best for tracking subscriptions and recurring payments to find unused services?",
  "Looking for the best app to manage my debt payoff plan — which one helps with snowball and avalanche methods?",
  "Best family budgeting app that lets multiple people track shared expenses and household budgets",
  "I want an AI-powered finance assistant that gives me spending insights and savings recommendations",

  // ── Insurance (5) ──
  "I'm looking for the best car insurance with affordable rates for safe drivers and good claims service",
  "Which life insurance company is best — term life vs whole life, and which provider has the easiest online application?",
  "Best renters insurance for apartment dwellers that covers electronics and has a low deductible",
  "I need home insurance for a new house — which provider bundles auto and home for the best discount?",
  "Looking for the best pet insurance that covers preventive care and has no breed restrictions",

  // ── Mortgage & Loans (5) ──
  "I'm looking for the best mortgage lender for first-time homebuyers with low down payment options",
  "Which mortgage provider offers the best refinance rates for a 30-year fixed loan right now?",
  "Best personal loan for debt consolidation with low interest rates and no origination fees",
  "I need a home equity line of credit — which bank offers the best HELOC rates and flexible terms?",
  "Looking for the best student loan refinancing company — which one offers the lowest rates for graduates?",
];

import { writeFile, mkdir } from "node:fs/promises";
import { probeAds, extractAdsFromHtml } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-finance";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let adsFound = 0;

  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i]!;
    const num = String(i + 1).padStart(2, "0");
    process.stdout.write(`[${num}/50] `);

    try {
      const result = await probeAds(prompt, "United States");
      const adCount = adCountFromHtml(result.html);
      await writeFile(`${OUT_DIR}/${num}_${sanitize(prompt)}.html`, result.html);

      if (adCount > 0) {
        adsFound++;
        const parsed = extractAdsFromHtml(result.html);
        for (const ad of parsed) {
          console.log(`\n    🔴 AD: ${ad.advertiser} — "${ad.title}"`);
        }
        console.log(`  ads=${adCount} html=${result.html.length}`);
      } else {
        console.log(`· html=${result.html.length}`);
      }
    } catch (e) {
      console.log(`✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    }

    if (i < PROMPTS.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${PROMPTS.length} prompts had ads.`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nHTML files saved to ${OUT_DIR}/`);
}

function adCountFromHtml(html: string): number {
  return (html.match(/data-ad-card-root="true"/g) || []).length;
}

main().catch(console.error);
