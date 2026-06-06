// Batch probe: 50 crypto/trading platform prompts → scrape ChatGPT via Oxylabs
// Run with: pnpm tsx src/scripts/batch-probe-crypto.ts

const PROMPTS = [
  // ── Crypto Exchange APIs (15) ──
  "I'm looking for a crypto exchange with good API documentation and support for limit orders, stop losses, and OCO orders",
  "Which crypto trading platform has the fastest REST API for placing orders programmatically?",
  "I need a crypto exchange API that supports WebSocket streaming for real-time order book updates — which one is best?",
  "Binance vs Coinbase Advanced vs Kraken API — which exchange has the best API for algorithmic trading in 2025?",
  "I'm building a trading bot in Python and need an exchange with good rate limits and sandbox/testnet support",
  "Looking for a crypto exchange API that lets me place market orders, trailing stops, and bracket orders programmatically",
  "Which crypto platforms have the most reliable APIs for high-frequency trading with low latency?",
  "I need to connect my trading strategy to Bybit or OKX — which has better API support for futures and perpetuals?",
  "Best crypto exchange for API-based automated DCA and grid trading bots",
  "What's the most developer-friendly crypto exchange API with good Python and Node.js SDKs?",
  "I want to auto-trade crypto across multiple exchanges — which platforms have the best API for portfolio rebalancing?",
  "Looking for an exchange with an API that supports conditional orders like take-profit and stop-loss for spot trading",
  "Which crypto exchanges offer paper trading APIs and test environments for developing automated strategies?",
  "Best crypto platform for running a market-making bot via API — which has lowest fees and best order book depth?",
  "I'm comparing KuCoin, Gate.io, and MEXC API limits — which exchange has the most generous rate limits for trading bots?",

  // ── Algo Trading Platforms (10) ──
  "I'm looking for a platform to automate my crypto trading strategy — something like 3Commas or Cryptohopper but with better API control",
  "Best algorithmic trading platform with API access for running Python-based trading strategies",
  "I need a crypto trading automation tool that lets me connect to multiple exchanges and execute orders via a unified API",
  "Which crypto trading bot platform offers the best API for defining custom entry and exit logic?",
  "Looking for an automated trading platform that supports both spot and futures with API-driven order management",
  "Best platform for backtesting crypto trading strategies with historical market data and then deploying via API",
  "I want to automate my trading with a platform that has a visual strategy builder AND an API for custom logic",
  "What's the best algo trading platform for running multiple crypto trading bots simultaneously with API control?",
  "Looking for a cloud-based crypto trading automation service that lets me deploy Python strategies and manage orders via API",
  "Which trading automation platform has the best API for running mean reversion and momentum strategies across crypto markets?",

  // ── Stock/Equity Trading APIs (8) ──
  "I'm looking for a stock trading API that supports automated order placement for US equities — Alpaca vs Interactive Brokers vs TD Ameritrade",
  "Best API for algorithmic stock trading with good documentation and sandbox environments for testing",
  "I need a brokerage API that lets me place market, limit, and bracket orders for stocks programmatically",
  "Which stock trading platform has the most reliable API for running automated day trading strategies?",
  "Looking for an equities trading API with WebSocket support for real-time market data and order execution",
  "Best platform for programmatic options trading — which API supports multi-leg options orders?",
  "I want to build a stock trading bot — which brokerage API has the best Python integration and order type support?",
  "Interactive Brokers vs TradeStation vs Alpaca API — which is best for automated equity trading in 2025?",

  // ── Forex/Commodities APIs (5) ──
  "I'm looking for a forex broker with a good REST API for placing automated trades on currency pairs",
  "Best forex trading API for algorithmic strategies — OANDA vs FXCM vs IG Markets compared",
  "Which forex platform has the most comprehensive API for running automated scalping and hedging strategies?",
  "I need a commodities trading API that supports futures contracts and automated order management",
  "Looking for a multi-asset trading API that handles forex, indices, and commodities for a diversified algo strategy",

  // ── Specific Technical Needs (7) ──
  "Best multi-exchange crypto trading API aggregator — I want to place orders across Binance, Coinbase, and Kraken from one interface",
  "I need a trading API with extremely low latency for arbitrage between crypto exchanges — which platform delivers?",
  "Looking for a comprehensive trading API that provides full order book depth, tick-level data, and historical market data",
  "Which crypto exchange API gives me the best access to on-chain data and DeFi protocol integration for automated trading?",
  "I'm building a signals-based trading system — best platform that can receive external trading signals and execute orders via API?",
  "Best crypto staking and yield farming platform with an API for automated yield optimization strategies",
  "Which exchange has the cleanest WebSocket API for streaming real-time trades and order book updates for crypto pairs?",

  // ── Adjacent High-Intent (5) ──
  "I'm looking for a trading platform that supports copy trading via API — I want to programmatically follow top traders",
  "Best portfolio management platform with trading API access for automated rebalancing across stocks and crypto",
  "I need a white-label trading platform with a robust API for building a custom trading interface for my users",
  "Looking for a crypto exchange with API support for OTC trading and large block order execution",
  "Which trading platform has the best mobile API and SDK for building a trading app that places orders programmatically?",
];

import { writeFile, mkdir, rm } from "node:fs/promises";
import { probeAds, extractAdsFromHtml } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-crypto";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

async function main() {
  // Clean previous run
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  let adsFound = 0;
  const results: Array<{ num: number; prompt: string; ads: number }> = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i]!;
    const num = String(i + 1).padStart(2, "0");
    process.stdout.write(`[${num}/50] `);

    try {
      const result = await probeAds(prompt, "United States");
      const adCount = countAds(result.html);
      await writeFile(`${OUT_DIR}/${num}_${sanitize(prompt)}.html`, result.html);

      if (adCount > 0) {
        adsFound++;
        // Print ad details inline
        const parsed = extractAdsFromHtml(result.html);
        for (const ad of parsed) {
          console.log(`\n    🔴 AD: ${ad.advertiser} — "${ad.title}" → ${ad.target_url || "(JS-navigated)"}`);
        }
        console.log(`  ads=${adCount} html=${result.html.length}`);
      } else {
        console.log(`· html=${result.html.length}`);
      }
    } catch (e) {
      results.push({ num: i + 1, prompt, ads: -1 });
      console.log(`✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    }

    if (i < PROMPTS.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${PROMPTS.length} prompts had ads.`);
  console.log(`${"=".repeat(60)}`);
  for (const r of results) {
    if (r.ads > 0) console.log(`  [${String(r.num).padStart(2)}] ads=${r.ads} — ${r.prompt.slice(0, 80)}`);
  }
  if (adsFound === 0) console.log("  No ads found in any prompt.");
  console.log(`\nHTML files saved to ${OUT_DIR}/`);
}

function countAds(html: string): number {
  return (html.match(/data-ad-card-root="true"/g) || []).length;
}

main().catch(console.error);
