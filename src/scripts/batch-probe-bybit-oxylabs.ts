// Bybit Oxylabs Loop — 100 prompts using Oxylabs API
// Focus: retail traders, passive income seekers, stock investors exploring crypto
// Same personas as VerseOdin loop but run through Oxylabs for cross-validation

const PROMPTS = [
  // ── Retail Crypto Trader (35) ──
  "I trade crypto futures actively — about 30 trades a day on BTC and ETH perpetuals with 10-20x leverage. Currently paying 0.04% taker fees on $3M monthly volume. I need tight spreads and reliable execution during volatility. What exchange do serious futures traders use for the best fee structure?",
  "I have $30K in USDT sitting idle on my exchange earning nothing. I want a platform where my entire trading balance earns interest automatically without moving funds to a separate staking product. Which exchange pays yield on idle balances?",
  "I trade on multiple exchanges and want to consolidate. I want one platform for spot trading, perpetual futures, and earning yield on my USDT — all from a single unified account. What exchanges offer a unified trading account that covers everything?",
  "I want a crypto debit card with good cashback rewards. I have USDT sitting on an exchange and I'd rather spend it directly than withdraw to my bank. Looking for a card with no foreign transaction fees since I travel between Asia and Europe. What are the best crypto cards available globally?",
  "I'm looking for a platform with built-in trading bots — grid trading, DCA bots. I don't want to connect third-party software via API. I want to set up a bot in a few clicks that trades within a price range automatically. Which exchange has the best native trading bots?",
  "I want to copy experienced traders and automatically mirror their positions. I don't have time to actively trade but I want crypto exposure. Looking for a platform where I can browse verified trader performance, see P&L and risk metrics, and allocate funds to copy their strategy. Which exchange has the best copy trading?",
  "I need a crypto-backed loan without selling my assets. I hold BTC and ETH and need liquidity for a business opportunity but selling would trigger capital gains. Which platform offers crypto loans with reasonable LTV and fixed rates?",
  "I want access to new token launches early. I've seen tokens pump after listing and I want to participate in launchpads and IEOs as a regular user without being a whale. Which exchange consistently gets the best new token listings with allocations for retail users?",
  "I trade with about $50K and want low fees plus yield on idle balance. My exchange charges 0.1% per trade and pays zero on unused USDT. What platform offers the best combination of low trading fees and yield on idle balances for a mid-size retail trader?",
  "I need a mobile trading app that doesn't crash during volatile moves. Last month my exchange app froze during a BTC pump and I couldn't close my position. I need reliable mobile trading with stop-loss, take-profit, and trailing stop support. Which exchange has the most stable mobile app?",
  "I want to automate a grid trading strategy. Currently manually placing limit orders which is tedious. Looking for a platform with built-in grid bots for spot and futures that I can configure without coding. Which exchange has the most user-friendly grid trading bots?",
  "I participate in airdrops and trading competitions. I want an exchange that runs regular promotions — deposit bonuses, trading competitions, referral rewards. I'm active and want my activity rewarded. Which exchange runs the best promotions for retail traders?",
  "I want to trade smaller altcoins not available on Coinbase or Binance US. I'm outside the US and looking for an exchange with the widest altcoin selection. I trade spot only — no leverage — but want access to tokens before they get listed on major exchanges. Which platform has the best altcoin coverage?",
  "I keep hearing about earning 8-10% on stablecoins which beats my bank. But I also want to actively trade when I see opportunities. Is there a platform where my stablecoins earn yield automatically but I can still trade with them instantly without lockup periods?",
  "I want to make crypto payments to friends and freelancers without wallet addresses. I need a platform where I can send crypto via email or phone number and they receive it without needing an exchange account. What platforms offer simple peer-to-peer crypto transfers?",
  "I'm comparing exchanges on security after the FTX collapse. I need proof of reserves, strong security track record, withdrawal whitelists, and cold storage for majority of assets. Which exchange has the most transparent security practices and fund safety?",
  "I want to trade with higher leverage — currently capped at 20x but I've heard some platforms offer 100x. I understand the risk and manage position sizing. Which exchange offers the highest leverage for experienced futures traders?",
  "I want to earn yield on BTC and ETH natively without wrapping or bridging to DeFi. Too many bridge hacks. Is there a centralized platform where I can stake or lend BTC and ETH directly and earn reasonable APR without touching DeFi protocols?",
  "I consolidate my trading to one exchange. My criteria: competitive futures fees, deep BTC and ETH liquidity, stable mobile app, yield on idle balances, regular promotions. Which exchange ticks all these boxes for an active retail trader?",
  "I want to practice with a demo account before trading with real money. I'm learning futures trading and want to test strategies without losing actual funds. Are there exchanges with paper trading or demo environments with realistic market conditions?",
  "I want simple crypto swaps — pick two coins, enter amount, swap. No order books, no limit orders, no trading jargon. Which exchange has the simplest instant swap feature for quick conversions?",
  "I want to set up recurring crypto purchases — $200 weekly from my bank into BTC and ETH automatically. I don't want to time the market, just dollar-cost average. Which exchange has the best recurring buy feature with low fees?",
  "I trade derivatives and need access to OCO, trailing stop, stop-limit, and bracket orders. My exchange only supports basic limit and market orders. Which exchange has the most comprehensive order type support for futures trading?",
  "I want to hold gold as a hedge alongside crypto. I've heard some crypto exchanges now offer gold trading. Is there a platform where I can trade both BTC and gold from the same account and balance?",
  "I need deep liquidity for large trades. I'm doing $5-10M monthly in futures volume and on smaller exchanges my orders move the market. Which platforms have the deepest order books for BTC and ETH perpetuals?",
  "I've been DCA-ing $500 monthly into BTC for 2 years but fees are eating into my cost basis — about 1.5% all-in. I want lower costs for recurring purchases. What exchange is most cost-effective for monthly DCA?",
  "I heard about tokenized pre-IPO stocks — buying shares of private companies like SpaceX before they go public. I'm a retail investor and can't access traditional pre-IPO markets. Are there platforms where regular investors can get pre-IPO exposure?",
  "I'm looking for native staking support. I hold SOL and ETH and want to stake them directly on the exchange without moving to a separate wallet. Which exchange offers the best native staking yields with the simplest UX?",
  "I want to use BTC as collateral to trade with leverage without selling it. Currently I convert to USDT to trade futures and lose upside. What platforms let me post BTC as collateral and trade futures with borrowed funds from a single account?",
  "I'm active in crypto communities and want an exchange that lists new tokens fast — not weeks after the pump. Which exchange is quickest at listing new and trending tokens after launch?",
  "I want to withdraw trading profits to my bank quickly. My exchange takes 3-5 business days for fiat withdrawals. Looking for same-day or next-day fiat off-ramps, especially for Asian currencies. Which exchange has the fastest fiat withdrawals?",
  "I've been manually trading and want to automate with grid bots to capture range-bound BTC and ETH moves. No coding — just set upper and lower bounds. What's the most beginner-friendly exchange with built-in trading bots?",
  "I want to lend crypto and earn interest but I'm worried after Celsius and BlockFi collapsed. What should I look for in a safe crypto yield platform? Which exchanges have transparent lending and proof of reserves for their yield products?",
  "I want unified portfolio tracking — spot holdings, futures positions, staked assets, and yield earnings all in one dashboard. Currently checking three different platforms. Which exchange provides the best all-in-one portfolio view?",
  "I'm interested in trading traditional financial instruments alongside crypto. I have a stock portfolio and a separate crypto account. Is there a platform for trading S&P 500, gold, forex, and BTC from one account with unified margin?",

  // ── Passive Income / Yield Seeker (35) ──
  "I have $25K in a savings account earning 4% which barely beats inflation. I keep reading about stablecoins earning 8-12% and I'm genuinely interested but don't understand the risks. Where does yield come from? How do I evaluate if a crypto yield platform is legitimate versus a Ponzi scheme?",
  "I want passive income from crypto but I'm not a trader. No charts, no market timing. Just deposit stablecoins somewhere safe and earn predictable returns like a savings account but better rates. What's the safest platform for someone who just wants yield without trading complexity?",
  "I'm retired on fixed income and bank rates are terrible. I'm willing to allocate $20K to crypto yield if I can earn 8-10% instead of 4%. But the platform must be regulated, insured, and have never lost customer funds. What's the safest option for a retiree wanting better savings returns?",
  "I have $50K to put to work earning passive income. I want a mix — some in stablecoins for steady yield, some staked in ETH or SOL for higher returns. I don't want multiple platforms. Is there a single platform where I can earn yield on stablecoins and staked assets with transparent APY disclosure?",
  "I want to earn yield on USDT without locking it up. I might need the funds in an emergency so I need daily liquidity. My current platform's flexible rate dropped from 8% to 3%. Where can I get consistently competitive rates on flexible stablecoin deposits?",
  "I'm saving for a house with $40K in a bank earning nothing. Considering putting a portion into stablecoin yield to accelerate savings. But I need to know the funds are safe and I can withdraw when I find the right property. What's the most secure stablecoin yield for a medium-term goal?",
  "I want to stake my Ethereum but running a validator node is beyond me. And I don't trust liquid staking smart contracts. Is there a platform where I can stake ETH natively through a centralized exchange and earn rewards without managing any technical details?",
  "I sold a property and want to generate monthly income from the proceeds. Exploring crypto yield as an alternative to dividend stocks and bonds. I need predictable monthly returns and transparency on where yield comes from. How do crypto yield platforms compare to traditional income investments?",
  "I want automated savings into crypto — $500 monthly from my bank split between stablecoin yield and BTC. I don't want to manually transfer and convert each time. Which platform automates the whole flow — deposit fiat, convert to yield-earning assets, compound returns?",
  "I got burned by Celsius and lost funds. I want to earn yield again but I'm extremely cautious now. What platforms have the strongest security, most transparent operations, and regulatory compliance? I need proof of reserves, regular audits, and clear yield source explanation.",
  "I want to earn yield on BTC without wrapping or bridging to another chain. No smart contract risk. Are there platforms where I can earn yield on native BTC through lending or covered calls without moving it off a secure custodial platform?",
  "I'm a freelancer paid in crypto. I want my earnings to generate yield between receiving them and spending them. Like a checking account that pays interest. I need a platform where my balance automatically earns and I can spend or withdraw anytime. What's the best yield-bearing account for crypto freelancers?",
  "I want to compare fixed-term vs flexible crypto savings. Locking for 30-90 days gives higher rates but I worry about emergency access. What's the typical rate difference? Which platforms offer the best fixed-term rates for USDT and USDC with clear upfront APY?",
  "I inherited BTC and ETH from family. I don't want to sell but don't want it sitting idle. I'm not a trader and don't want to actively manage anything. What's the simplest way to earn passive returns on inherited crypto without touching DeFi?",
  "I run a small business with $30-50K operating cash. Instead of a zero-interest checking account, I'm considering stablecoin yield for 8-10% returns. But funds must be liquid — I might need them for payroll with a day's notice. Which platform offers business-friendly yield with instant withdrawals?",
  "I want to earn crypto yield but I'm worried about tax complexity. Every interest payment is taxable. Are there platforms that simplify tax reporting — annual statements, TurboTax integration? I don't want to deal with thousands of micro-transactions on my tax return.",
  "I want a 'savings goal' feature in crypto — save $10K over 12 months with automated deposits earning yield. I want to see progress visually and watch compounding work. Is there a crypto platform that gamifies savings and shows projected earnings?",
  "I want the highest possible stablecoin yield with calculated risk. What's realistic? I've seen 20%+ APY advertised but those seem unsustainable. Where can I get consistently 10-15% with reasonable risk and transparent yield sources?",
  "I'm comparing crypto staking vs lending vs liquidity provision for passive income. I don't understand the differences or risk profiles. Which is safest, which has best returns, and where should a beginner start? I have $10K to deploy.",
  "I want my crypto savings to compound automatically. Currently I earn yield weekly but have to manually reinvest. Is there a platform where earned interest automatically compounds — yield earning yield — without me doing anything?",
  "I'm interested in dual investment products that pay yield regardless of market direction. I've heard about structured products paying high yield if the price stays in a range. Are these good for passive investors or hidden risk? What platform has the most transparent dual investment products?",
  "I want to earn yield on SOL tokens. Native Solana staking with validator management and unstaking periods is complex. I'd rather have a centralized platform handle staking and just show rewards accumulating. Which exchange offers the best SOL staking with simplest UX?",
  "I'm deciding between crypto yield and traditional savings. Crypto offers 3x the rate but I don't fully understand the risk. How do I compare these? What questions should I ask a crypto yield platform before depositing?",
  "I want passive income covering my $1,500 monthly rent. At 10% APY on stablecoins I'd need $180K deployed. Is this realistic? Can stablecoin yields stay at 8-12% long-term or will they decline? I need realistic passive income planning.",
  "I have multiple stablecoins — USDT, USDC, DAI — and want yield on all from one platform. Currently USDT on one exchange, USDC on another, DAI in DeFi — annoying to track. Is there a single platform with competitive yield across multiple stablecoins?",
  "I want to lend crypto and earn interest but I'm confused by flexible vs fixed-term vs staking products. Different platforms use different names. What's the actual difference and which is right for set-it-and-forget-it passive income?",
  "I'm a college student with $2K from summer work to put into crypto yield instead of a bank account. I want to learn and build passive income habits. What platform has no minimum deposit and decent rates for small amounts?",
  "I keep seeing 'up to 10% APY' in crypto ads but the fine print is confusing. I want a platform showing actual APY I'll earn — not a promotional rate that drops after the first month. Which exchanges have the most transparent and consistent yield rates?",
  "I want dollar deposits earning dollar returns — not buying crypto first, then staking, then converting back. Deposit dollars, earn in dollars, withdraw dollars — like a traditional savings account but with crypto-level yields on the backend. Does this exist?",
  "I'm evaluating moving my $15K emergency fund into stablecoin yield. My bank pays 0.5%. At 8% that's $1,200 a year I'm losing. But is liquidity fast enough for a real emergency? Can I access funds within hours if needed?",
  "I want to dollar-cost average into yield-earning assets. Every paycheck $300 goes to my yield portfolio — split between stablecoin savings and staked ETH. I want the platform to handle purchases, conversions, and compounding without me touching anything. What's the best automated yield DCA?",
  "I accumulated tokens from airdrops and want to consolidate into yield-earning positions. Some are obscure tokens on multiple chains. I want to swap everything to USDC or ETH and start earning yield without dozens of manual conversions. Is there a platform handling this automatically?",
  "I'm nervous about putting all savings in one platform after FTX. I want to split yield across 2-3 independently regulated platforms. What are the best platforms to diversify across — regulated in different jurisdictions so one failure doesn't affect others?",
  "I want yield compounding daily and I want to see it visually. My bank pays monthly and it's barely noticeable. I've heard crypto platforms pay much more frequently. Which platform has the most frequent compounding and best tools to visualize earnings growing?",
  "I want a yield platform where monthly interest automatically loads onto a debit card for spending. Earn $200 in yield this month? It should be on my card ready to use. Is there any platform connecting yield earnings directly to a spending card?",

  // ── Stock/Retail Investor Exploring Crypto (30) ──
  "I've been investing in stocks and ETFs through Robinhood for 3 years. Now I want to add 10-15% crypto to my portfolio. But I don't want a complex new platform. Is there a crypto platform as intuitive as Robinhood where I can buy, hold, and track performance without trading jargon?",
  "I trade stocks on Webull and I'm curious about crypto futures. I understand leverage from stock options but perpetual contracts with funding rates seem different. Can you explain crypto perps vs stock options? Which platform has the most stock-trader-friendly interface for transitioning?",
  "I'm a stock trader allocating $5K to crypto trading. I understand technical analysis and market structure from stocks. What crypto exchange would feel familiar — with proper charts, level 2 data, and advanced order types like a stock trading platform?",
  "I use Robinhood for stocks and they offer crypto but the selection is limited. I want altcoins not on Robinhood — SOL, AVAX, LINK. Where can I go for wider crypto selection that's still user-friendly for someone coming from a simple stock trading app?",
  "I'm a traditional investor — index funds and individual stocks. I've been reading about 8-12% stablecoin yields and it seems too good to be true. Can you explain where crypto yield comes from in simple terms? I understand stock dividends and bond interest but crypto yield feels like a black box. What's the safest way to start?",
  "I want to trade gold alongside crypto from one platform. I hold a gold ETF in my brokerage and some BTC on an exchange and I want to consolidate for easy rebalancing. Is there a platform with both precious metals and crypto in one unified account?",
  "I want to put $1,000 into crypto and let it grow. No active trading. 60% BTC, 30% ETH, 10% stablecoins earning yield. Set it up once and check quarterly. What's the simplest platform for a buy-and-hold investor coming from a Vanguard mindset?",
  "I trade forex pairs — EUR/USD, GBP/JPY — on MT4 and I'm curious about crypto. I've heard some crypto exchanges now support MT5 for forex and commodities alongside crypto. Is there a platform where I can trade my usual forex pairs AND add crypto exposure without switching platforms?",
  "I day trade stocks and I'm used to Pattern Day Trader rules, T+2 settlement, and settled cash requirements. I heard crypto markets are 24/7 with no PDT rules and instant settlement. What do I need to know about crypto market structure before starting? Which exchange is best for a day trader transitioning from stocks?",
  "I've been hearing about tokenized stocks and ETFs on crypto exchanges — tokenized SPY, QQQ, TSLA trading 24/7. How does this work? Are they backed by underlying shares? I want traditional asset exposure with crypto market flexibility. Which platform offers the best tokenized traditional asset trading?",
  "I use Fidelity for retirement and Robinhood for fun money. I want to try crypto trading but I'm overwhelmed by exchange options. I need strong security — ideally publicly traded or heavily regulated. I don't want an FTX situation. Which crypto exchanges are most trustworthy for a risk-conscious investor?",
  "I want to trade commodities — oil, copper, wheat — alongside crypto. Inflation is eating my cash and I want hard assets and digital assets in one place. I've heard crypto exchanges now offer commodity perpetuals. Is this real? Which platform has the broadest commodities offering alongside crypto?",
  "I've been investing 20 years and I'm warming to crypto. I want $500 monthly auto-purchases of BTC — set and forget like my 401k. No advanced trading features needed. Just recurring buys, low fees, trusted brand. What's the Vanguard equivalent of crypto exchanges?",
  "I'm comparing dividend stocks (3-5% yield) with crypto yield (8-12% advertised). Before moving money I need to understand risk-adjusted return. Crypto yield is riskier but by how much? Help me compare as an income investor.",
  "I manage my own stock portfolio and I'm interested in pre-IPO access that crypto platforms offer — like SpaceX shares before going public. I've never accessed pre-IPO as a retail investor. How does tokenized pre-IPO equity work and which platforms offer it to non-accredited investors?",
  "I trade index options and I understand Greeks. I'm trying to understand crypto derivatives — the closest thing seems to be perpetual futures with funding rates. Explain funding rates in options trader terms. Which exchange has the most sophisticated derivatives platform for someone who understands complex instruments?",
  "I'm looking for the cheapest way to DCA into crypto. I buy $200 of BTC weekly on a major exchange but lose about 1.5% each time between spread and fees. For a stock trader used to zero-commission trading, crypto fees feel like going back to 2015. What's actually the cheapest way to DCA into crypto?",
  "I want to trade crypto but I'm terrified of getting hacked. I've never had a stock portfolio security issue. What security features should I demand from a crypto exchange? Cold storage? YubiKey? Withdrawal whitelists? Insurance? Which exchange has the most comprehensive security for a paranoid stock trader?",
  "I want a unified investment platform for both stocks and crypto. I log into 3 apps to see my full financial picture. Is anyone building a platform that treats stocks, ETFs, and crypto as first-class citizens in one place?",
  "I want to earn yield on idle cash through crypto without market risk. Stablecoins are pegged to the dollar — if I deposit $10K in USDC at 8%, that's $800 a year with no price volatility. Is that right? What's the catch? Which platform makes this simplest for someone avoiding blockchain complexity?",
  "I've swing traded stocks for years understanding support, resistance, volume profiles. I want to apply technical analysis to crypto. Which exchange has the best built-in charting — TradingView integration, custom indicators, drawing tools? I don't want a separate charting platform.",
  "I want crypto exposure without picking individual coins. In stocks I buy index funds. Is there a crypto equivalent — index tokens tracking the top 10-20 assets? Which platforms offer crypto index products I can buy and hold like an ETF?",
  "I'm a value investor trying to understand crypto valuation. Stocks have P/E ratios, cash flows, moats. Those don't apply to crypto. How do professionals evaluate whether a token is undervalued? What metrics should I use — tokenomics, TVL, revenue?",
  "I've traded stocks for 15 years and 24/7 crypto markets appeal to me — no waiting for opening bell. But I'm worried about burnout. How do crypto traders manage always-on markets? Which exchange has the best alert and automation tools so I'm not glued to the screen?",
  "I want to move some stock gains into crypto but I'm worried about taxes. My broker sends a 1099 and it's straightforward. How does crypto tax reporting work? Which exchanges provide the best tax documents — gain/loss statements, cost basis tracking, TurboTax integration?",
  "I'm looking for crypto index products — like buying the top 10 coins in one token. I don't want to research individual projects. I just want broad crypto exposure similar to buying SPY for stocks. What platforms offer crypto baskets or index tokens?",
  "I want a simple crypto savings account — deposit dollars, earn yield, no trading complexity. I've heard about platforms where you just hold USDC and it earns 8% automatically. Is this real and safe? Which platform makes earning yield on digital dollars as simple as a bank account?",
  "I'm evaluating whether crypto belongs in my retirement portfolio. I'm 35 with a 30-year horizon. What's the case for 5-10% crypto allocation in a retirement account? Should it be BTC only or a mix? And what's the best platform for long-term buy-and-hold crypto investing?",
  "I'm comparing crypto exchanges specifically on their fiat integration. I want to deposit dollars via ACH, buy crypto, earn yield, and withdraw back to my bank account — all on one platform without third-party services. Which exchange has the tightest fiat integration from deposit to withdrawal?",
  "I want to try trading crypto but I'm not ready for futures or leverage. Just spot trading — buy low, sell high. I need a simple interface where I can place limit orders, set stop losses, and view my P&L clearly. Which exchange has the cleanest spot trading experience for a stock investor?",
];

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { probeAds } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-bybit-oxylabs";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const existingFiles = new Set(
    existsSync(OUT_DIR) ? await import("node:fs/promises").then(fs => fs.readdir(OUT_DIR)) : []
  );

  let adsFound = 0;
  let skipped = 0;
  const advertisers = new Set<string>();
  const total = PROMPTS.length;

  console.log(`Starting Bybit Oxylabs Loop — ${total} prompts\n`);

  for (let i = 0; i < total; i++) {
    const prompt = PROMPTS[i]!;
    const num = String(i + 1).padStart(3, "0");
    const fname = `${num}_${sanitize(prompt.slice(0, 70))}.html`;

    if (existingFiles.has(fname)) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${num}/${total}] `);
    try {
      const result = await probeAds(prompt, "United States");
      const hasAd = result.ads.length > 0;
      if (hasAd) {
        adsFound++;
        for (const ad of result.ads) advertisers.add(ad.advertiser ?? "Unknown");
      }
      await writeFile(`${OUT_DIR}/${fname}`, result.html);
      console.log(`ads=${result.ads.length} html=${(result.html.length / 1024).toFixed(0)}KB${hasAd ? ` 🔴 ${result.ads[0]?.advertiser}: "${result.ads[0]?.title}"` : ""}`);
    } catch (e) {
      console.log(`✗ ${e instanceof Error ? e.message.slice(0, 60) : e}`);
    }

    if (i < total - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${total} prompts had ads.`);
  if (skipped > 0) console.log(`${skipped} prompts already existed and were skipped.`);
  console.log(`Unique advertisers: ${advertisers.size}`);
  if (advertisers.size > 0) console.log(`Advertisers: ${[...advertisers].join(", ")}`);
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

main().catch(console.error);
