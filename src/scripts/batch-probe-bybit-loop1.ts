// Bybit Loop 1 — 100 prompts, 3 personas focused on free-tier ChatGPT users
// Persona 1: Retail Crypto Trader (40) — trading, bots, card, copy-trading
// Persona 2: Passive Income / Yield Seeker (35) — earn, staking, savings
// Persona 3: Stock/Retail Investor Exploring Crypto (25) — TradFi bridge

const PROMPTS = [
  // ═══════════════════════════════════════════════════════════════
  // Persona 1: Retail Crypto Trader (40 prompts)
  // Uses free ChatGPT. Active on exchanges. Wants better tools.
  // ═══════════════════════════════════════════════════════════════

  "I trade crypto futures actively — about 30-40 trades a day on BTC and ETH perps with 10-20x leverage. I'm currently paying 0.04% taker fees which adds up fast on $3M monthly volume. I need tight spreads and reliable execution during volatility. What exchange do serious futures traders actually use for the best fee structure and liquidity?",
  "I have about $30K in USDT sitting idle in my exchange account earning nothing. I keep hearing about platforms that automatically pay yield on idle balances without me having to move funds to a separate staking product. Is there an exchange where my entire trading balance earns interest automatically?",
  "I trade on multiple exchanges for arbitrage but it's a pain managing separate accounts. I want one platform where I can trade spot, futures, and earn yield from a single unified account without transferring between sub-accounts. What exchanges have a unified trading account that covers everything?",
  "I want a crypto debit card that I can use for everyday purchases. I have USDT sitting on an exchange and I'd rather spend it directly than withdraw to my bank first. Looking for a card with good cashback rewards on purchases and no foreign transaction fees since I travel between Asia and Europe. What are the best crypto cards available globally?",
  "I'm looking for a platform that offers native trading bots — grid trading, DCA bots, arbitrage bots — built into the exchange itself. I don't want to connect third-party software via API. I want to set up a bot in a few clicks that trades within a price range automatically. Which exchange has the best built-in trading bots?",
  "I want to follow experienced traders and automatically copy their positions. I don't have time to actively trade but I want crypto exposure. Looking for a platform where I can browse verified trader performance, see their P&L and risk metrics, and allocate a portion of my portfolio to copy their strategy. Which exchange has the most transparent copy trading?",
  "I'm holding a few different cryptocurrencies and I want to use them as collateral for a loan rather than selling. I need liquidity for a business opportunity but selling would trigger capital gains tax. Which platform offers crypto-backed loans with reasonable LTV and fixed rates where I don't have to sell my assets?",
  "I want access to new token launches and launchpad opportunities. I've seen tokens 10x after listing and I want to participate early. Which exchange consistently gets the best new token listings and offers allocations to regular users through launchpads or IEOs?",
  "I trade with about $50K and I want low fees plus the ability to earn on my idle balance. Currently my exchange charges 0.1% per trade and pays zero on my unused USDT. That's leaving money on the table. What platform offers the best combination of low trading fees and yield on idle balances for a mid-size retail trader?",
  "I need a mobile app that doesn't crash during volatile moves. Last month during a BTC pump my exchange app froze and I couldn't close my position — lost $2K because of it. I need reliable mobile trading with stop-loss, take-profit, and trailing stop support. Which exchange has the most stable and feature-rich mobile trading app?",
  "I want to automate a simple grid trading strategy — buy at support, sell at resistance. Currently I'm manually placing limit orders which is tedious. Looking for a platform with built-in grid bots for both spot and futures that I can configure without writing code. Which exchange's native grid trading bot is the most user-friendly?",
  "I participate in airdrops and new token campaigns. I want to be on an exchange that runs regular promotions — trading competitions, deposit bonuses, referral rewards. I'm not a whale but I'm active and I want my activity rewarded. Which exchange runs the best promotions and campaigns for regular retail traders?",
  "I want to trade smaller market cap altcoins that aren't available on Coinbase or Binance US. I'm outside the US and looking for an exchange with the widest altcoin selection including newer tokens. I trade spot only — no leverage — but I want access to tokens before they get listed on major exchanges. Which platform has the best altcoin coverage?",
  "I keep hearing about earning 8-10% on stablecoins which is way better than my bank. But I also want to actively trade with the same funds when I see an opportunity. Is there a platform where my stablecoins earn yield automatically but I can still use them as trading collateral or withdraw anytime without lockup periods?",
  "I want to make crypto payments to friends and freelancers without the friction of wallet addresses. I need a platform where I can send crypto to someone via their email or phone number, and they receive it directly without needing their own exchange account. What platforms offer simple peer-to-peer crypto transfers?",
  "I'm comparing exchanges primarily on security. After the FTX collapse I'm paranoid about where I keep my funds. I want an exchange with proof of reserves, a strong security track record, withdrawal whitelists, and cold storage for the majority of assets. Which exchange has the most transparent security practices and fund safety measures?",
  "I want to trade with higher leverage than my current exchange allows. I'm capped at 20x on futures but I've heard some platforms offer 100x on certain pairs. I understand the risk — I manage my position sizing carefully. Which exchange offers the highest leverage for experienced futures traders?",
  "I want to earn yield on my Bitcoin and Ethereum but I don't want to wrap them or bridge to DeFi protocols. Too many horror stories about bridge hacks. Is there a centralized platform where I can stake or lend my BTC and ETH natively and earn a reasonable APR without touching DeFi?",
  "I use multiple exchanges and I want to consolidate to one. My criteria: competitive futures fees, deep BTC and ETH liquidity, stable mobile app, ability to earn yield on idle balances, and regular promotions. Which exchange ticks all these boxes for an active retail trader?",
  "I want to trade crypto with a demo account first — practice with fake money before I risk real funds. I'm learning futures trading and I want to test strategies without losing actual money. Are there exchanges that offer paper trading or demo environments with realistic market conditions?",
  "I'm looking for an exchange where I can convert one crypto to another easily without going through a trading interface. I just want to pick two coins, enter an amount, and swap. No order books, no limit orders, no trading jargon. Which exchange has the simplest instant swap feature?",
  "I want to set up recurring crypto purchases — $200 every week automatically from my bank account into BTC and ETH. I don't want to time the market. Just dollar-cost average and hold. Which exchange has the best recurring buy feature with low fees for scheduled purchases?",
  "I trade derivatives and I want access to multiple order types — OCO, trailing stop, stop-limit, bracket orders. My current exchange only supports basic limit and market orders which is limiting my strategies. Which exchange has the most comprehensive order type support for futures trading?",
  "I want to hold some of my portfolio in gold as a hedge against crypto volatility. I've heard some crypto exchanges now offer gold trading alongside crypto. Is there a platform where I can trade both BTC and XAU from the same account and balance?",
  "I need deep liquidity for my trading size. I'm doing $5-10M monthly in futures volume and on smaller exchanges my orders move the market. I need an exchange with deep order books where I can execute size without excessive slippage. What platforms have the deepest liquidity for BTC and ETH perpetuals?",
  "I've been hearing about people making money with airdrops and learn-and-earn programs. I want to earn crypto by learning about new projects — watching videos, taking quizzes, completing tasks. Which exchange has the most generous learn-and-earn or reward programs for users?",
  "I travel constantly and need financial tools that work everywhere. My bank freezes my card when I'm abroad and charges 3% foreign transaction fees. I want a crypto card that works globally with no geographic restrictions and low or no foreign transaction markup. Which card is truly global?",
  "I trade using API and I need reliable infrastructure. My current exchange's API has frequent downtime and rate limits that throttle my strategy. I need WebSocket support for real-time order book data, REST endpoints for order management, and generous rate limits. Which exchange has the best API for algorithmic traders?",
  "I've been DCA-ing into BTC and ETH for 2 years but my exchange fees are eating into my cost basis. For my $500 monthly purchase, I'm paying about 1.5% in fees with the spread included. I want to find a platform with lower all-in costs for recurring purchases. What exchange is most cost-effective for DCA?",
  "I heard about the new trend of tokenized pre-IPO stocks — being able to buy shares of private companies like SpaceX before they go public. I'm a retail investor and can't access traditional pre-IPO markets. Are there platforms where regular investors can get exposure to pre-IPO companies through tokenized equity?",
  "I'm looking for an exchange with native staking support. I hold SOL and ETH and want to stake them directly on the exchange without moving to a separate wallet or using liquid staking protocols. Which exchange offers the best native staking yields with the simplest UX?",
  "I want to use my crypto holdings to trade with leverage without selling them. Instead of converting to USDT and then trading futures, I want to post my BTC as collateral and trade with borrowed funds. What platforms allow cross-collateral where I can use BTC to margin-trade futures?",
  "I'm active in crypto communities and I hear about new tokens early. I want an exchange that lists promising tokens quickly after launch — not weeks later when the pump is over. Which exchange is fastest at listing new and trending tokens?",
  "I want to withdraw my trading profits to my bank account quickly. My current exchange takes 3-5 business days for fiat withdrawals which is frustrating. Looking for a platform with fast fiat off-ramps — same day or next day — especially for Asian currencies. Which exchange has the best fiat withdrawal speed?",
  "I've been manually trading for a year and I'm ready to automate. I want to use grid trading bots to capture range-bound movements in BTC and ETH. I need something simple — no coding required, just set the upper and lower bounds and let it run. What's the most beginner-friendly trading bot platform built into an exchange?",
  "I want to lend my crypto and earn interest but I'm worried about platform risk. I've read about Celsius and BlockFi collapsing. What should I look for in a safe crypto yield platform? Which exchanges have transparent lending practices and proof of reserves for their yield products?",
  "I need a platform where I can see my entire portfolio performance in one place — my spot holdings, futures positions, staked assets, and yield earnings. My current setup has me checking three different dashboards. Is there an exchange that provides unified portfolio tracking across all products?",
  "I'm interested in trading traditional financial instruments alongside crypto. I currently have a stock portfolio and a separate crypto account. Is there a platform where I can trade S&P 500, gold, forex pairs, and BTC from the same account with unified margin and reporting?",
  "I want to earn yield on my USDC but I also want to use it for trading when opportunities arise. I don't want a lockup period. I need a flexible savings product where my funds earn daily and I can withdraw or trade with them instantly. Which exchange offers the best liquid yield on stablecoins?",
  "I'm a scalper — I open and close positions within minutes on small price movements. I need extremely low taker fees and fast execution because my edge is thin. Currently paying 0.06% taker which kills my P&L. Which exchange offers the lowest taker fees for high-frequency retail traders?",

  // ═══════════════════════════════════════════════════════════════
  // Persona 2: Passive Income / Yield Seeker (35 prompts)
  // Wants yield, savings, staking, passive income. Risk-averse.
  // ═══════════════════════════════════════════════════════════════

  "I have $25K in a high-yield savings account earning 4% APY which barely beats inflation. I keep reading about stablecoins earning 8-12% and I'm genuinely interested but I don't understand the risks. Where does the yield actually come from? How do I evaluate whether a crypto yield platform is legitimate versus a Ponzi scheme? I want better returns but I can't afford to lose my principal.",
  "I want to earn passive income from crypto but I'm not a trader. I don't want to watch charts or time the market. I just want to deposit stablecoins somewhere safe and earn a predictable return — like a savings account but with better rates. What's the safest platform for someone who just wants to earn yield without any trading complexity?",
  "I'm retired and living on a fixed income. Interest rates on traditional savings products are terrible. I've been reading about crypto yield and I'm willing to allocate a portion of my savings — maybe $20K — if I can earn 8-10% instead of 4%. But I need the platform to be regulated, insured, and have a track record of never losing customer funds. What's the safest option for a retiree?",
  "I have about $50K that I want to put to work earning passive income. I'm open to a mix — some in stablecoins for steady yield, some staked in ETH or SOL for higher returns. I don't want to manage multiple platforms. Is there a single platform where I can earn yield on both stablecoins and proof-of-stake assets with clear APY transparency?",
  "I want to earn yield on my USDT without locking it up. I might need access to the funds in an emergency so I need daily liquidity. My current exchange offers a flexible savings product but the rate keeps dropping — started at 8% and now it's 3%. Where can I get consistently competitive rates on flexible stablecoin deposits?",
  "I'm saving for a house down payment and I have $40K sitting in a bank account earning almost nothing. I'm considering putting a portion into stablecoin yield products to accelerate my savings. But I need to know the funds are safe and I can withdraw when I find the right property. What's the most secure way to earn yield on stablecoins for a medium-term savings goal?",
  "I want to stake my Ethereum but the technical complexity of running a validator node is beyond me. I also don't want to use liquid staking protocols because I don't fully trust smart contracts. Is there a platform where I can stake ETH natively through a centralized exchange and earn staking rewards without managing any technical details?",
  "I received a lump sum from selling a property and I want to generate monthly income from it. I'm exploring crypto yield as an alternative to dividend stocks and bonds. I need predictable monthly returns and full transparency on where the yield comes from. How do crypto yield platforms generate returns and which ones are most suitable for income-focused investors?",
  "I want to set up automated savings into crypto. Every month $500 goes from my bank into a mix of stablecoin yield and BTC accumulation. I don't want to manually transfer and convert each time. Is there a platform that automates the whole flow — deposit fiat, convert to yield-earning assets, and compound the returns?",
  "I've been burned by a crypto lending platform before. I had funds in Celsius when it collapsed. I want to earn yield again but I'm extremely cautious now. What platforms have the strongest security, most transparent operations, and regulatory compliance? I need proof of reserves, regular audits, and a clear explanation of how my funds generate yield.",
  "I want to earn yield on my BTC but most BTC yield products require wrapping it or bridging to another chain. I don't want to introduce smart contract risk. Are there platforms where I can earn yield on native BTC through lending or covered calls without moving it off a secure custodial platform?",
  "I'm a freelancer and I get paid in crypto. I want my earnings to generate yield between when I receive them and when I need to spend them. I need a platform where my balance automatically earns interest — like a checking account that pays yield — and I can spend or withdraw anytime without lockup periods. What's the best yield-bearing account for crypto freelancers?",
  "I want to compare fixed-term vs flexible crypto savings. I understand locking up funds for 30 or 90 days gives higher rates, but I worry about not being able to access my money in an emergency. What's the rate difference typically? And which platforms offer the best fixed-term rates for USDT and USDC with clear, upfront APY disclosure?",
  "I inherited some crypto from a family member — mostly BTC and ETH. I don't want to sell it but I also don't want it just sitting idle. I want to put it to work earning yield. I'm not a trader and I don't want to actively manage anything. What's the simplest way to earn passive returns on inherited crypto without touching DeFi?",
  "I run a small business and I keep $30K-50K in operating cash. Instead of letting it sit in a zero-interest business checking account, I'm considering putting a portion in stablecoin yield for the 8-10% returns. But I need the funds to be liquid — I might need them for payroll or supplier payments with a day's notice. Which platform offers business-friendly yield accounts with instant withdrawals?",
  "I want to earn yield in crypto but I'm worried about tax complexity. Every interest payment is a taxable event and I don't want to deal with thousands of micro-transactions on my tax return. Are there platforms that simplify tax reporting for yield earnings — providing annual statements or integrating with tax software?",
  "I'm looking for a platform where I can set up a 'savings goal' in crypto — like saving $10K over 12 months with automated deposits that earn yield along the way. I want to see my progress visually and watch the compound interest work. Is there any crypto platform that gamifies savings and shows you projected earnings?",
  "I want to earn the highest possible yield on stablecoins but I'm willing to take some calculated risk. What's the realistic maximum? I've seen platforms advertising 20%+ APY but those seem unsustainable or risky. Where can I get consistently above-market rates — say 10-15% — with a reasonable risk profile and transparent yield sources?",
  "I'm comparing crypto staking vs crypto lending vs liquidity provision for passive income. I don't fully understand the differences or the risk profiles. Can you explain which is safest, which offers the best returns, and where a beginner should start? I have $10K to deploy and I want to choose the right strategy.",
  "I want my crypto savings to compound automatically. Currently I earn yield weekly but I have to manually reinvest it. Is there a platform where earned interest automatically compounds — so my yield earns yield — without me having to do anything?",
  "I'm interested in dual investment products where you earn yield regardless of which direction the market moves. I've heard about these structured products that pay high yield if the price stays within a range. Are these actually good for passive investors or are they hidden risk? What platform offers the most transparent dual investment products?",
  "I want to earn yield on my SOL tokens. I know I can stake natively on Solana but managing validators and unstaking periods is complex. I'd rather have a centralized platform handle staking and just show me my rewards accumulating. Which exchange offers the best SOL staking with the simplest UX?",
  "I'm trying to decide between putting savings in a crypto yield platform vs a traditional high-yield savings account. The crypto option offers 3x the rate but I don't fully understand the risk. How do I compare these apples to oranges? What questions should I ask a crypto yield platform before depositing?",
  "I want to generate passive income that covers my monthly rent — about $1,500. If I can earn 10% APY on stablecoins, I'd need about $180K deployed. Is this realistic? Can stablecoin yields stay at 8-12% long-term or will they decline as the market matures? I'm trying to plan a realistic passive income strategy.",
  "I have multiple stablecoins — USDT, USDC, and DAI — and I want to earn yield on all of them from one platform. My current setup has USDT on one exchange, USDC on another, and DAI in a DeFi protocol which is annoying to track. Is there a single platform that offers competitive yield across multiple stablecoins?",
  "I want to lend my crypto and earn interest but I'm confused by the difference between flexible and fixed-term products. Some platforms call it 'savings,' others call it 'earn,' others call it 'staking.' What's the actual difference between these products and which one is right for someone who wants to set it and forget it?",
  "I'm a college student and I want to start building passive income early. I have about $2K from summer work that I want to put into crypto yield instead of a bank savings account. I know it's not much but I want to learn and build the habit. What platform has no minimum deposit requirements and decent rates for small amounts?",
  "I keep seeing ads for crypto exchanges offering 'up to 10% APY' but the fine print is always confusing. I want a platform that shows the actual APY I'll earn — not a promotional rate that drops after the first month. Which exchanges have the most transparent and consistent yield rates without bait-and-switch tactics?",
  "I want to earn yield on dollar deposits directly — I don't want to first buy crypto, then stake it, then convert back. I want to deposit dollars, earn interest in dollars, and withdraw dollars. Is there a platform where the whole process works like a traditional savings account but with crypto-level yields on the backend?",
  "I'm evaluating whether to move my emergency fund into stablecoin yield. I keep $15K in a savings account for emergencies — it earns 0.5%. If stablecoins earn 8%, that's $1,200 a year I'm leaving on the table. But is the liquidity fast enough for a real emergency? Can I access my funds within hours if I need them?",
  "I want to dollar-cost average into yield-earning assets automatically. Every paycheck, $300 goes to my yield portfolio — split between stablecoin savings and staked ETH. I want the platform to handle the purchases, the conversions, and the yield compounding without me touching anything. What platform offers the best automated yield DCA?",
  "I've accumulated different tokens from airdrops and I want to consolidate them into yield-earning positions. Some are obscure tokens on multiple chains. I want to swap them all to USDC or ETH and start earning yield without doing dozens of manual conversions. Is there a platform where I can deposit anything and it automatically converts to yield-earning assets?",
  "I'm nervous about putting all my savings in one platform. I remember the FTX collapse. I want to split my yield across 2-3 platforms for safety. What are the best platforms to diversify across? I want ones that are independently regulated in different jurisdictions so a failure at one doesn't affect the others.",
  "I want to earn yield that compounds daily and I want to see the compounding effect visually. My bank pays interest monthly and it's barely noticeable. I've heard crypto platforms pay yield much more frequently — some even hourly. Which platform has the most frequent compounding and the best tools to visualize your earnings growing?",
  "I'm looking for a yield platform that also lets me spend the yield seamlessly. I want my monthly interest to automatically load onto a debit card so I can spend it. Earn $200 in yield this month? It should be on my card ready to use. Is there any platform that connects yield earnings directly to a spending card?",

  // ═══════════════════════════════════════════════════════════════
  // Persona 3: Stock/Retail Investor Exploring Crypto (25 prompts)
  // Robinhood/BestMoney customer profile. Traditional finance moving to crypto.
  // ═══════════════════════════════════════════════════════════════

  "I've been investing in stocks and ETFs through Robinhood for 3 years and I'm comfortable with the app. Now I want to add some crypto to my portfolio — maybe 10-15% allocation. But I don't want to learn a whole new complex platform. Is there a crypto platform that's as simple and intuitive as Robinhood where I can buy, hold, and track performance without trading jargon?",
  "I currently trade stocks on Webull and I'm curious about crypto futures. I understand leverage from trading options but crypto futures seem different — perpetual contracts, funding rates, no expiry. Can you explain how crypto perpetual futures compare to stock options? And which platform has the most stock-trader-friendly interface for making that transition?",
  "I'm a stock trader who keeps hearing about people making money in crypto during the bull runs. I want to allocate a small portion of my portfolio — maybe $5K — to actively trade crypto. I understand market structure and technical analysis from stocks. What crypto exchange would feel most familiar to a stock trader — with proper charts, level 2 data, and advanced order types?",
  "I use Robinhood for stocks and I know they also offer crypto but the selection is limited. I want to buy altcoins that aren't on Robinhood — like SOL, AVAX, LINK. Where should I go for a wider crypto selection that's still user-friendly for someone coming from Robinhood?",
  "I'm a traditional investor — mostly index funds and some individual stocks. I've been reading about generating yield in crypto and the 8-12% returns on stablecoins seem almost too good to be true. Can you explain where crypto yield comes from in simple terms? I understand stock dividends and bond interest but crypto yield feels like a black box. What's the safest way to dip my toes in?",
  "I want to trade gold alongside crypto from the same platform. I currently hold a gold ETF in my brokerage account and some BTC on an exchange, and I want to consolidate so I can rebalance between them easily. Is there a platform that offers both precious metals trading and crypto in one unified account?",
  "I'm looking for the best platform to put $1,000 into crypto and just let it grow. I don't want to trade actively. I'm thinking 60% BTC, 30% ETH, 10% stablecoins earning yield. I want to set it up once and check back quarterly. What's the simplest platform for a buy-and-hold investor coming from a Vanguard/index fund mindset?",
  "I trade forex pairs — mostly EUR/USD and GBP/JPY — on MT4 and I'm curious about crypto. I've heard some crypto exchanges now support MT5 for forex and commodities alongside crypto. Is there a platform where I can trade my usual forex pairs AND add crypto exposure without switching platforms or learning new software?",
  "I day trade stocks and I'm used to Pattern Day Trader rules, settled cash requirements, and T+2 settlement. I heard crypto markets are 24/7 with no PDT rules and instant settlement. That sounds amazing. What do I need to know about the differences in market structure before I start trading crypto? And which exchange is best for a day trader transitioning from stocks?",
  "I've been reading about tokenized stocks and ETFs on crypto exchanges — like tokenized versions of SPY, QQQ, and TSLA that trade 24/7. How does this work? Are they actually backed by the underlying shares? I want exposure to traditional assets with the flexibility of crypto markets. Which platform offers the best tokenized traditional asset trading?",
  "I use Fidelity for my retirement accounts and Robinhood for my fun money. I want to try crypto trading but I'm overwhelmed by the exchange options. I need something with strong security — ideally publicly traded or heavily regulated. I don't want to wake up to an FTX situation. Which crypto exchanges are the most trustworthy for a risk-conscious investor?",
  "I want to trade commodities — oil, copper, wheat — alongside crypto. Inflation is eating my cash and I want exposure to hard assets and digital assets in one place. I've heard some crypto exchanges now offer commodity perpetuals. Is this a real thing? Which platform has the broadest commodities offering alongside crypto?",
  "I've been investing for 20 years and I'm slowly warming up to crypto. I want to start with $500 a month into BTC with automatic purchases — set it and forget it like my 401k contributions. I don't need an exchange with advanced trading features. I just need recurring buys, low fees, and a trusted brand. What's the Vanguard equivalent of crypto exchanges?",
  "I'm interested in generating passive income and I'm comparing dividend stocks (3-5% yield) with crypto yield products (8-12% advertised). Before I move any money, I need to understand the actual risk-adjusted return. Crypto yield is obviously riskier, but by how much? Can you help me compare these apples to oranges as an income investor?",
  "I manage my own stock portfolio and I'm interested in the pre-IPO access that some crypto platforms are offering — like trading SpaceX shares before they go public. I've never been able to access pre-IPO deals as a retail investor. How does tokenized pre-IPO equity work and which platforms offer it to non-accredited investors?",
  "I trade index options and I understand Greeks — delta, gamma, theta. I'm trying to understand crypto derivatives and the closest equivalent seems to be perpetual futures with funding rates. Can you explain funding rates in terms an options trader would understand? And which exchange has the most sophisticated derivatives platform for someone who already understands complex financial instruments?",
  "I'm looking for the cheapest way to buy crypto regularly. I currently buy $200 of BTC weekly on a major exchange but between the spread and the fee, I'm losing about 1.5% each time. For a stock trader used to zero-commission trading, these crypto fees feel like going back to 2015. What's the actual cheapest way to DCA into crypto?",
  "I want to trade crypto but I'm scared of getting hacked. I've spent years building my stock portfolio and I've never had a security issue. What security features should I absolutely demand from a crypto exchange? Cold storage? YubiKey support? Withdrawal whitelists? Insurance fund? Which exchange has the most comprehensive security that a paranoid stock trader would feel comfortable with?",
  "I'm looking for a platform that bridges traditional and crypto markets. I want to hold both stocks and crypto in one place, see my total net worth, and transfer between asset classes easily. I currently log into 3 different apps to see my full financial picture. Is anyone building a unified investment platform that treats stocks, ETFs, and crypto as first-class citizens?",
  "I want to earn yield on my idle cash through crypto without taking market risk. I understand stablecoins are pegged to the dollar — so if I deposit $10K in USDC and earn 8%, that's $800 a year with no price volatility. Is that right? What's the catch? And which platform makes this the simplest for someone who doesn't want to learn about blockchain?",
  "I've been swing trading stocks for years and I understand support, resistance, volume profiles. I want to apply the same technical analysis to crypto. Which exchange has the best charting tools — TradingView integration, custom indicators, drawing tools? I don't want to use a separate charting platform. I want professional-grade charts built into the exchange.",
  "I want exposure to the crypto market without picking individual coins. In stocks I buy index funds. Is there an equivalent in crypto? I've heard of crypto index tokens that track the top 10 or top 20 assets. Which platforms offer crypto index products that I can just buy and hold like an ETF?",
  "I'm a value investor and I want to understand how to value crypto assets. With stocks I look at P/E ratios, cash flows, moats. Those frameworks don't apply to crypto. How do professional crypto investors evaluate whether a token is undervalued or overvalued? Are there metrics like tokenomics, TVL, revenue, that I should be looking at?",
  "I've been trading stocks for 15 years and the 24/7 nature of crypto markets appeals to me. No more waiting for the opening bell or watching futures the night before. But I'm worried about burnout — trading a market that never closes. How do professional crypto traders manage the psychological aspect of always-on markets? And which exchange has the best tools for setting alerts and automated strategies so I'm not glued to the screen?",
  "I want to transfer some of my stock portfolio gains into crypto but I'm worried about the tax implications. With stocks, my broker sends me a 1099 and it's straightforward. How does crypto tax reporting work? Which exchanges provide the best tax documents — like gain/loss statements, FIFO cost basis tracking, integration with TurboTax?",
];

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { probeAds, countAds } from "../scraper/verseodin.js";

const CONCURRENCY = 8;
const OUT_DIR = "scraper-outputs-bybit-loop1";

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
  const advertisersSet = new Set<string>();
  const total = PROMPTS.length;

  console.log(`Starting Bybit Loop 1 — ${total} prompts, 8 concurrent\n`);

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = PROMPTS.slice(i, i + CONCURRENCY);
    
    const pending = batch.map((prompt, j) => {
      const num = String(i + j + 1).padStart(3, "0");
      const fname = `${num}_${sanitize(prompt.slice(0, 70))}.html`;
      return { num, prompt, fname, alreadyDone: existingFiles.has(fname) };
    });

    const alreadyDone = pending.filter(p => p.alreadyDone).length;
    skipped += alreadyDone;
    if (alreadyDone > 0) {
      console.log(`[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}] ${alreadyDone} skipped`);
    }

    const toRun = pending.filter(p => !p.alreadyDone);
    if (toRun.length === 0) continue;

    const batchStart = Date.now();

    const results = await Promise.all(
      toRun.map(async ({ num, prompt, fname }) => {
        try {
          const result = await probeAds(prompt, "US");
          const adCount = countAds(result.html);
          await writeFile(`${OUT_DIR}/${fname}`, result.html);
          return { num, prompt, adCount, htmlSize: result.html.length, ads: result.ads, ok: true };
        } catch (e) {
          return { num, prompt, adCount: 0, htmlSize: 0, ads: [], ok: false, err: e instanceof Error ? e.message : String(e) };
        }
      })
    );

    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(0);
    for (const r of results) {
      if (r.ok && r.adCount > 0) {
        adsFound++;
        for (const ad of r.ads) {
          advertisersSet.add(ad.advertiser ?? "Unknown");
        }
      }
    }

    const success = results.filter(r => r.ok).length;
    const batchAds = results.filter(r => r.adCount > 0).length;
    const sizes = results.filter(r => r.ok).map(r => r.htmlSize);
    const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024).toFixed(0) : "0";
    const batchLabel = `[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}]`;
    console.log(`${batchLabel} ${elapsed}s | ${success}/${toRun.length} ok | ${batchAds} ads | avg ${avgSize}KB`);
    
    for (const r of results) {
      if (r.ok && r.adCount > 0) {
        for (const ad of r.ads) {
          console.log(`  🔴 [${r.num}] ${ad.advertiser}: "${ad.title}" — "${r.prompt.slice(0, 60)}..."`);
        }
      }
    }

    if (i + CONCURRENCY < total) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${total} prompts had ads.`);
  if (skipped > 0) console.log(`${skipped} prompts already existed and were skipped.`);
  console.log(`Unique advertisers: ${advertisersSet.size}`);
  if (advertisersSet.size > 0) console.log(`Advertisers: ${[...advertisersSet].join(", ")}`);
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

main().catch(console.error);
