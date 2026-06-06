// Batch probe: 50 FINANCE prompts all containing the word "API"
// Theory: "API" keyword + finance sector = strongest ad trigger

const PROMPTS = [
  // ── Stock Trading API (8) ──
  "Best stock trading API for placing market and limit orders programmatically with low latency",
  "I need a brokerage API that supports options trading and multi-leg order execution",
  "Which trading API has the best real-time market data with Level 2 order book depth?",
  "Best equities API for algorithmic trading with paper trading and backtesting support",
  "I'm looking for a commission-free trading API that offers fractional shares and dividend reinvestment",
  "Which stock API provides the fastest order execution for high-frequency trading strategies?",
  "Best API for trading US stocks after hours with extended trading session support",
  "I need a trading API with WebSocket streaming for real-time portfolio value and PnL updates",

  // ── Crypto Exchange API (8) ──
  "Best crypto exchange API for spot trading with tight spreads and deep liquidity",
  "I need a crypto trading API with WebSocket support for real-time order book and trade streams",
  "Which crypto API offers the best rate limits for running multiple trading bots simultaneously?",
  "Best crypto derivatives API for trading perpetual futures with leverage and cross-margin",
  "I'm looking for a decentralized exchange API that connects to Uniswap, PancakeSwap, and dYdX",
  "Which crypto API has the most reliable uptime for automated trading during volatile market conditions?",
  "Best API for crypto market making with low taker fees and fast order cancellation",
  "I need a multi-exchange crypto API aggregator that routes orders to the best price across Binance, Coinbase, and Kraken",

  // ── Banking / Financial Data API (8) ──
  "Best open banking API for connecting to user bank accounts and fetching transaction history",
  "I need a banking API that supports ACH transfers, wire payments, and real-time account verification",
  "Which financial data API provides the most comprehensive fundamental data for stock analysis?",
  "Best bank account aggregation API for building a personal finance dashboard — Plaid vs Yodlee vs Finicity",
  "I need a business banking API that lets me automate payroll, invoicing, and expense categorization",
  "Which alternative data API provides credit card transaction data for investment research?",
  "Best API for accessing global company financials, balance sheets, and SEC filing data",
  "I'm looking for a cash management API that offers sweep accounts and automated cash allocation",

  // ── Payment Processing API (6) ──
  "Best payment processing API for accepting credit cards, ACH, and digital wallets in my app",
  "I need a payments API that handles subscription billing with automatic retries and dunning management",
  "Which payment API is best for international payouts to contractors and vendors in multiple currencies?",
  "Best embedded payments API for a marketplace — splitting payments between buyers and sellers",
  "I need a card issuing API to create virtual and physical debit cards for my fintech product",
  "Which B2B payments API supports invoice factoring, net terms, and automated accounts receivable?",

  // ── Insurance API (5) ──
  "Best insurance API for embedding auto and home insurance quotes directly into my app",
  "I need a life insurance underwriting API that provides instant quotes based on health data",
  "Which insurance API offers the best claims processing automation with photo and document upload?",
  "Best health insurance API for verifying patient eligibility and estimating out-of-pocket costs",
  "I'm looking for a commercial insurance API that generates quotes for business liability and property coverage",

  // ── Mortgage / Lending API (5) ──
  "Best mortgage API for automating loan origination with credit pulls and income verification",
  "I need a lending API that supports personal loans with instant decisioning and same-day funding",
  "Which mortgage pricing API provides real-time rate quotes from multiple lenders for comparison?",
  "Best business lending API for small business loans with automated underwriting and risk scoring",
  "I need a home equity API that lets customers check their borrowing power and apply for a HELOC",

  // ── Wealth / Portfolio API (5) ──
  "Best portfolio management API for tracking multi-asset portfolios with real-time performance analytics",
  "I need a robo-advisor API that automates asset allocation and tax-loss harvesting for client accounts",
  "Which wealth management API supports model portfolios with automatic rebalancing across thousands of accounts?",
  "Best API for accessing mutual fund and ETF data including NAV, holdings, and expense ratios",
  "I'm looking for a financial planning API that projects retirement income, tax scenarios, and estate planning",

  // ── KYC / Compliance API (5) ──
  "Best KYC API for identity verification with document scanning, facial recognition, and AML checks",
  "I need a fraud detection API that scores transactions in real-time using machine learning models",
  "Which sanctions screening API covers OFAC, EU, UN, and other global watchlists for compliance?",
  "Best anti-money laundering API for monitoring suspicious transactions and filing SAR reports automatically",
  "I need a regulatory compliance API that keeps my fintech up to date with changing financial regulations",
];

import { writeFile, mkdir } from "node:fs/promises";
import { probeAds, extractAdsFromHtml } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-finance-api";

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
      }
      console.log(`ads=${adCount} html=${result.html.length}`);
    } catch (e) {
      console.log(`✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    }

    if (i < PROMPTS.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${PROMPTS.length} prompts had ads.`);
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

function adCountFromHtml(html: string): number {
  return (html.match(/data-ad-card-root="true"/g) || []).length;
}

main().catch(console.error);
