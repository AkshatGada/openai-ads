// Batch probe: 50 CRYPTO prompts all containing the word "API"
// Theory: crypto + API combination triggers ads from both dev tools and finance advertisers

const PROMPTS = [
  // ── CEX / Exchange APIs (10) ──
  "Best crypto exchange API for building a trading bot with real-time order book access",
  "I need a centralized exchange API with WebSocket support for live price feeds across spot and futures markets",
  "Which crypto exchange API has the highest rate limits for placing thousands of orders per minute?",
  "Best CEX API for market making with low latency order placement and cancellation",
  "I'm looking for a crypto trading API that supports OCO, trailing stop, and bracket orders for all pairs",
  "Which exchange API provides the most comprehensive historical trade data for backtesting strategies?",
  "Best crypto API for automated portfolio rebalancing across spot, margin, and earn products",
  "I need an exchange API with a sandbox environment and paper trading for testing automated strategies safely",
  "Which crypto platform has the best API documentation and developer SDKs for Python and Node.js integration?",
  "Best crypto exchange API for programmatically managing sub-accounts and API key permissions",

  // ── DEX / DeFi APIs (8) ──
  "Best DEX API for swapping tokens across Uniswap, SushiSwap, and PancakeSwap from a single interface",
  "I need a DeFi yield aggregator API that automatically moves funds to the highest APY pools across chains",
  "Which decentralized exchange API offers the best slippage protection and MEV-resistant order routing?",
  "Best DeFi protocol API for lending and borrowing with real-time health factor monitoring for collateral",
  "I'm looking for a liquidity pool API that lets me programmatically add and remove liquidity across AMMs",
  "Which DeFi API provides the best on-chain arbitrage opportunities across multiple DEXs in real-time?",
  "Best staking API for earning yield on ETH, SOL, and stablecoins with auto-compounding rewards",
  "I need a DeFi composability API that lets me chain multiple protocol interactions into a single transaction",

  // ── Blockchain Node / RPC APIs (7) ──
  "Best blockchain node API for Ethereum with archive node access, trace support, and high reliability",
  "I need a multi-chain RPC API that supports Ethereum, Solana, Polygon, and Arbitrum from one endpoint",
  "Which blockchain API provider has the lowest latency for reading token balances and transaction receipts?",
  "Best Web3 API for querying smart contract events and logs across multiple blockchains with filtering",
  "I'm looking for a blockchain indexing API that provides enriched transaction data with decoded calldata",
  "Which RPC API offers the best free tier for developers building dApps with moderate traffic?",
  "Best blockchain subscription API with Webhook support for monitoring wallet activity and contract events",

  // ── On-Chain Data / Analytics APIs (6) ──
  "Best on-chain data API for tracking whale wallet movements, exchange inflows, and smart money activity",
  "I need a blockchain analytics API that provides token holder distribution, concentration metrics, and vesting schedules",
  "Which crypto analytics API offers the best NFT collection data with floor prices, volume, and rarity rankings?",
  "Best DeFi analytics API for tracking TVL, protocol revenue, and token emissions across chains",
  "I'm looking for a blockchain forensics API that traces fund flows and detects suspicious wallet activity",
  "Which crypto market data API provides the most accurate circulating supply and fully diluted valuation metrics?",

  // ── Wallet / Custody APIs (5) ──
  "Best crypto wallet API for generating self-custody wallets with mnemonic generation and secure key storage",
  "I need a multi-signature wallet API for managing treasury operations with approval workflows and spending limits",
  "Which wallet API supports the most blockchains for adding token balances and transaction history to my app?",
  "Best MPC wallet API for institutional custody with key sharding and transaction policy enforcement",
  "I'm looking for a wallet connect API that integrates with WalletConnect v2 for dApp browser interactions",

  // ── Crypto Payment / On-Ramp APIs (5) ──
  "Best crypto payment gateway API for accepting Bitcoin, Ethereum, and stablecoin payments in my store",
  "I need a fiat-to-crypto on-ramp API that supports credit card and bank transfer purchases in 100+ countries",
  "Which crypto payout API is best for sending mass payments to contractors and users in USDC across chains?",
  "Best crypto invoicing API that generates payment links with automatic conversion from crypto to fiat",
  "I'm looking for a stablecoin API that mints, burns, and transfers USDC and USDT across Ethereum, Solana, and Polygon",

  // ── NFT / Token APIs (5) ──
  "Best NFT minting API for creating and deploying ERC-721 and ERC-1155 collections with metadata hosting",
  "I need a token API for creating ERC-20 tokens with custom supply, tax mechanics, and liquidity pool creation",
  "Which NFT marketplace API lets me fetch listings, place bids, and execute sales across OpenSea and Blur?",
  "Best token gating API for checking wallet holdings and granting access to exclusive content and communities",
  "I'm looking for a metadata and asset API that resolves ENS names, token logos, and NFT images reliably",

  // ── Crypto Tax / Compliance APIs (4) ──
  "Best crypto tax API for calculating capital gains and generating tax reports across hundreds of exchanges and wallets",
  "I need a crypto compliance API that screens wallet addresses against OFAC sanctions and known illicit actors",
  "Which crypto transaction monitoring API automatically flags suspicious patterns for AML and KYC reporting?",
  "Best API for generating crypto tax forms including 8949, Schedule D, and FBAR for US-based traders",
];

import { writeFile, mkdir } from "node:fs/promises";
import { probeAds, extractAdsFromHtml } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-crypto-api";

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
