// OMS Loop 1 — 100 prompts across 3 personas rooted in Polygon OMS API docs
// Run with VerseOdin: pnpm tsx src/scripts/batch-probe-oms-loop1.ts

const PROMPTS = [
  // ═══════════════════════════════════════════════════════════════
  // Persona 1: Fintech PM (33 prompts)
  // Researching regulated stablecoin rails for neobank/payment platform.
  // Language: onboarding, compliance, virtual accounts, API primitives.
  // ═══════════════════════════════════════════════════════════════

  "I'm evaluating stablecoin payment APIs that let us provision custodial wallets per customer with KYC endorsements built in — looking for customer creation, wallet provisioning, quotes with rate locks, and fiatToCrypto transactions in one integration",
  "our neobank needs an API that auto-converts incoming ACH deposits to USDC through virtual bank accounts assigned per customer — does any production infrastructure handle virtual accounts with compliance built in",
  "comparing stablecoin payment infrastructure that supports ACH, SEPA, and wire rails through a single API — need customer onboarding with KYC, custodial wallets, and webhook events for transaction status changes",
  "we want to give users real USD account numbers that hold a stablecoin balance — looking for an API where every customer gets a virtual US bank account and ACH deposits auto-convert to USDC without manual steps",
  "evaluating whether to build stablecoin rails in-house or use an API — need something with bearer token auth, idempotency keys, sandbox with auto-approved KYC, and endpoints for customers wallets quotes and transactions",
  "looking for a stablecoin payments API that handles the full stack — identity verification at onboarding, custodial wallets on Polygon, and fiat off-ramps to external bank accounts via cryptoToFiat transactions",
  "we need a payment API with a quote system that locks rates and shows fee breakdowns before every transaction — fiatToCrypto and cryptoToFiat with validity windows so we know the exact cost before executing",
  "researching APIs where we can create customers with KYC endorsements that gate access to financial operations — wallets provisions per customer, transactions tracked via webhooks, native USDC with no wrapping or bridging",
  "our platform needs to let users fund wallets via cash-in and hold USDC balances — looking for an API with endpoints for customers wallets cash-ins and transactions plus a sandbox for testing without live KYC delays",
  "evaluating Circle alternatives for stablecoin payments — need something that doesn't require stitching together Circle wallets plus a separate KYC vendor plus a separate off-ramp provider",
  "is there a stablecoin API where developers create customers with structured residential addresses and government IDs for KYC, provision wallets by asset and chain, and execute transactions with idempotency keys",
  "our fintech needs to add stablecoin rails — but our compliance team requires KYC KYB and AML screening built into the payment flow not bolted on after the fact",
  "comparing Coinbase Developer Platform vs alternatives for stablecoin settlement — need an API that actually owns the settlement layer and doesn't just aggregate other vendors underneath",
  "we want to launch a stablecoin-based savings product — looking for custodial wallet infrastructure with passkey auth embedded wallets and the ability to hold USDC and USDT on Polygon chain for users",
  "the OMS docs mention sub-2-second finality and native USDC with no wrapping — is there infrastructure where ACH wires and card rails all flow through one API with webhook events for every transaction state change",
  "our users need to deposit cash and receive stablecoins — looking for cash-in endpoints that generate deposit codes valid for one hour and auto-create fiatToCrypto transactions when the code is presented at retail",
  "we're building a neobank and evaluating stablecoin payment infrastructure — need regulated fiat ramps covering 38 US states with built-in identity verification and transaction monitoring",
  "the docs describe virtual accounts as dedicated US bank account numbers assigned per customer — is there a production API where incoming ACH deposits auto-convert to USDC and trigger webhook events on completion",
  "need a payments API where every transaction has a quote with rate lock and fee breakdown — the quote expires if not executed within the validity window and we get a webhook when the transaction completes",
  "evaluating stablecoin APIs by developer experience — bearer token auth, idempotency keys on all requests, webhook subscriptions with signing secrets, and sandbox environments that auto-approve KYC for testing",
  "our neobank needs to support consumer on-ramp and off-ramp — fund wallet via cash-in, hold USDC balance, withdraw to external bank account via cryptoToFiat — all through one API with KYC at onboarding",
  "looking for a payment API where customer creation provisions KYC endorsements that gate access to fiat operations — wallets are auto-created with onchain Polygon addresses and the API manages the keys",
  "we need to pay contractors from a single treasury wallet in local currency — looking for an API that handles the full disbursement flow from USDC balance to external bank accounts via ACH with webhook confirmation",
  "comparing stablecoin infrastructure for a fintech — need fiat rails supporting ACH wire SWIFT and card all in one integration with compliance handling KYC KYB and AML screening across 38 states",
  "evaluating whether to use Circle or find a vertically integrated alternative — the docs suggest Polygons OMS owns the settlement layer and every integration layer unlike competitors who aggregate third-party vendors",
  "need a stablecoin API with a sandbox that lets us test the full flow — create customers with fake SSNs, provision wallets, generate quotes, execute fiatToCrypto and cryptoToFiat transactions, all auto-approved",
  "our platform needs dollar accounts — give each user a real USD account number that receives ACH transfers and holds a stablecoin balance behind the scenes — looking for virtual account infrastructure with compliance built in",
  "looking for production-grade stablecoin payment infrastructure — $54B processed 159M wallets sub-2-second finality $0.002 average transaction cost — need an API with those numbers not a pilot project",
  "we need a payments API where transactions have clear statuses and sub-statuses — fiatToCrypto moves from created to processing to completed and we get webhooks at every state change — what regulated options exist",
  "evaluating whether to build a stablecoin wallet and compliance layer from scratch or integrate an API that provisions custodial wallets auto-creates onchain addresses and manages keys without any user-facing crypto",
  "need to offer users the ability to hold USDC and withdraw to their bank account — looking for a single API with customer onboarding wallet provisioning quote creation and cryptoToFiat transactions to saved external accounts",
  "our neobank wants to plug into stablecoin rails without hiring a blockchain team — need REST endpoints for customers wallets quotes transactions and webhooks with clean documentation and a sandbox environment",
  "comparing stablecoin payment APIs by their quote system — rate locks with full fee breakdowns no surprise deductions at settlement validity windows so we know the exact cost before executing any money movement",

  // ═══════════════════════════════════════════════════════════════
  // Persona 2: Marketplace CTO (33 prompts)  
  // Paying sellers globally, replacing slow/expensive payouts.
  // Language: disbursements, treasury wallet, settlement speed, FX cost.
  // ═══════════════════════════════════════════════════════════════

  "we pay 5000 sellers across 40 countries monthly — looking for a stablecoin API that handles fiat deposits to a treasury wallet USDC conversion and off-ramps to sellers local bank accounts with instant settlement",
  "our marketplace loses 200K a year on FX fees and wire costs for global seller payouts — can stablecoin settlement through a single API actually bring this down to fractions of a cent with sub-2-second finality",
  "evaluating disbursement APIs where we fund a treasury wallet and pay contractors in local currency — need ACH SEPA and international rail support with webhook events confirming when money lands in the recipients account",
  "we need a payments API that handles the full seller payout flow — buyer pays in USD converts to USDC settles instantly and off-ramps to the sellers local bank account via their saved external account ID",
  "our sellers across Latin America and Africa wait 3 to 5 days for wire transfers — looking for cross-border stablecoin settlement where fiat enters in one country and gets delivered locally in the recipient's currency within seconds",
  "comparing global payout infrastructure — Wise PayPal and bank wires are eating our margins with 3 percent FX spread — is there a stablecoin API with quote locks and fee breakdowns that actually shows us the all-in cost per payout",
  "we need to automate payouts to thousands of sellers every month — looking for a payment API with idempotency keys webhook subscriptions and transaction status tracking so we never double-pay or lose a payment in transit",
  "evaluating whether to move our marketplace payouts to stablecoin rails — need an API where we fund a single wallet and trigger batch cryptoToFiat transactions to external bank accounts with each payment tracked via webhooks",
  "our platform processes about 10 million a month in seller payouts — looking for an API that handles the full money movement lifecycle from fiat in to USDC settlement to fiat out with compliance and KYC built in",
  "need to pay sellers in local currency from a USDC balance — evaluating APIs that create quotes with rate locks before each payout and execute cryptoToFiat transactions with webhook confirmation when fiat lands in the bank account",
  "our marketplace sellers don't have crypto wallets and shouldn't need them — looking for stablecoin infrastructure where sellers just provide their bank account as an external account ID and receive dollars automatically",
  "we're losing sellers because payouts take 5 days — need instant stablecoin settlement where money converts to USDC moves on Polygon chain and off-ramps to any bank account via ACH or wire in under two seconds",
  "evaluating payment infrastructure for a two-sided marketplace — need fiatToCrypto for buyer deposits and cryptoToFiat for seller payouts all through one API with role-based access control and webhook events",
  "our disbursement costs are our second largest expense after payroll — if stablecoin settlement at fractions of a cent actually works we could reduce payout costs by 90 percent — what production APIs handle this at scale",
  "need a treasury wallet that holds USDC and disburses to seller bank accounts across 40 countries — evaluating Circle Coinbase and alternatives that own the settlement layer and offer sub-2-second finality",
  "our sellers in emerging markets receive local currency through correspondent banking chains that take days — looking for stablecoin rails with direct fiat off-ramps to local banks without intermediary bank hops and hidden deductions",
  "comparing payout APIs by their webhook and reconciliation capabilities — need transaction events for every status change from created to processing to completed so our ops team can reconcile in real time",
  "we need to batch pay thousands of sellers monthly — evaluating stablecoin APIs that support idempotency keys so we can safely retry failed payouts and transaction status polling until webhook delivery is confirmed",
  "our marketplace currently uses a patchwork of PayPal Wise and ACH for seller payouts — looking for a single API that replaces all three with stablecoin settlement at lower cost and faster delivery",
  "when we pay a seller in Brazil we lose 2 percent on FX spread before the money even moves — looking for stablecoin rails that support local currency off-ramps via PIX and offer quote locks with transparent fee breakdowns",
  "need a disbursement API where we create quotes for every payout — the quote locks the rate and shows the exact fee breakdown so we know what the seller receives before we execute the transaction",
  "our sellers need to receive payment the same day they ship — current rails take 3 to 5 business days — evaluating stablecoin APIs that settle in seconds and off-ramp to the sellers local bank account with webhook confirmation",
  "looking for global payout infrastructure that doesn't require per-country bank relationships — need a single API that handles ACH SEPA PIX UPI and SPEI rails with stablecoin settlement as the backbone",
  "we're building a marketplace and evaluating whether to integrate stablecoin rails now or wait — the GENIUS Act passed and regulation is here so we want to move before our competitors do — what production APIs exist today",
  "our treasury team wants to hold USDC and disburse to seller bank accounts on demand — looking for custodial wallet infrastructure with role-based access control SSO and webhook events for every disbursement transaction",
  "comparing marketplace payout solutions — some promise instant settlement but actually route through multiple vendors adding margin at each layer — is there a vertically integrated API that owns the entire settlement stack",
  "need a payment API with a sandbox where we can test the full seller payout flow — create a customer provision a wallet fund it via cash-in generate a cryptoToFiat quote and execute the transaction all auto-approved",
  "our sellers in 40 countries need to receive local currency not USDC — looking for an off-ramp API with coverage across multiple corridors where the seller just provides their bank account and receives local fiat automatically",
  "evaluating stablecoin settlement APIs by their rail coverage — need ACH for US sellers SEPA for European sellers PIX for Brazil and local rails for LatAm Africa and Asia — all through one integration",
  "our marketplace payment costs are 3 percent of GMV — if we can bring that to near zero with stablecoin settlement we add 2 million to our bottom line annually — what production APIs handle stablecoin payouts at 50 million plus annual volume",
  "we need to reconcile thousands of seller payouts daily — looking for a stablecoin API with webhook events for every transaction state and idempotency keys so our finance team can match every payout to every order",
  "our sellers in Nigeria Kenya and Ghana receive payments through dollar-denominated correspondent accounts that take days — need stablecoin rails with direct local currency off-ramps in African markets with predictable settlement",
  "evaluating whether to integrate stablecoin payouts now or wait until the product is more mature — our competitors are already advertising on ChatGPT for payment infrastructure keywords so we need to move",

  // ═══════════════════════════════════════════════════════════════
  // Persona 3: Remittance Founder (34 prompts)
  // Consumer cross-border transfers. Sending US-LatAm, US-Africa, US-Asia.
  // Language: corridors, FX, consumer UX, cash pickup, local currency.
  // ═══════════════════════════════════════════════════════════════

  "I run a remittance app for consumer cross-border transfers — right now every transfer costs us 2 to 3 percent in FX spread before we make margin — is there a stablecoin API that handles fiat in USDC settlement and local currency off ramp through a single integration",
  "our remittance app sends money from the US to Latin America and Africa — current rails take 3 days through correspondent banking — looking for stablecoin infrastructure where the money settles in seconds and off-ramps to local bank accounts via PIX SPEI and mobile money",
  "need a remittance API that converts sender USD to USDC settles on Polygon chain and delivers the recipient local currency through ACH SEPA PIX UPI and cash pickup at retail locations — all with built-in KYC at onboarding",
  "evaluating stablecoin infrastructure for cross-border consumer payments — need coverage across US-LatAm US-Africa and US-Asia corridors with predictable settlement times and no hidden correspondent banking fees",
  "our customers send money home to family — they don't care about blockchain they care about speed and cost — looking for a payment API where the sender pays in dollars the recipient gets local currency and the backend handles everything in between",
  "comparing remittance APIs that use stablecoins for settlement — need cash-in endpoints where senders deposit at retail and recipients pick up cash via ATM codes plus bank off-ramps for digital delivery",
  "we're losing margin on every cross-border transfer because correspondent banks take a cut at every hop — looking for stablecoin rails that eliminate intermediary banks entirely with direct fiat to stablecoin conversion and local off ramps",
  "our remittance volume has grown to about 2 million a month across US Mexico and US Nigeria corridors — evaluating whether stablecoin settlement can handle this volume with sub 2 second finality and predictable per transaction costs",
  "need KYC built into the remittance flow — evaluating APIs where customer creation includes identity verification endorsements that gate access to fiat operations and every transaction is tracked with full compliance audit trail",
  "our customers need same day delivery — current rails can't promise that because correspondent banking chains are unpredictable — looking for stablecoin infrastructure with 24 7 settlement that doesn't pause on weekends or holidays",
  "evaluating whether to build our own stablecoin rails or integrate an API — need customer creation wallet provisioning quote generation with rate locks and fiatToCrypto plus cryptoToFiat transactions all through one endpoint",
  "our remittance recipients in Guatemala Honduras and El Salvador receive cash at retail locations — looking for an API with cash disbursement endpoints that generate ATM or retail pickup codes from a USDC wallet balance",
  "comparing Western Union and MoneyGram alternatives using stablecoin rails — need an API that handles the full flow from sender cash deposit to USDC settlement to local currency pickup without the 7 percent all-in cost of traditional remittance",
  "we need to offer both digital and cash delivery for remittances — evaluating APIs with cash-in endpoints for sender deposits and cash-out endpoints for recipient pickup plus bank off ramps for recipients who want digital delivery",
  "our remittance app needs virtual accounts for senders — they fund via ACH deposit which auto converts to USDC and then we settle to the recipient in local currency all tracked via webhooks with idempotency keys",
  "looking for a remittance API with a quote system — need rate locks with transparent fee breakdowns before every transfer so our customers know exactly how much the recipient will receive in local currency",
  "our senders are mostly unbanked — they deposit cash at retail locations — looking for stablecoin rails with cash-in infrastructure that generates deposit codes and auto-creates fiatToCrypto transactions on confirmation",
  "evaluating stablecoin remittance APIs by their local currency coverage — need off ramps in Mexican pesos Brazilian real Nigerian naira Kenyan shillings Indian rupees and Philippine pesos all through one integration",
  "the GENIUS Act is regulating stablecoins — we want to be compliant from day one — looking for remittance infrastructure with built-in KYC KYB and AML screening plus transaction monitoring across all corridors",
  "our customers in the Philippines receive remittances via mobile wallets and cash pickup — need stablecoin rails that off ramp to local mobile money providers and generate cash pickup codes from a USDC treasury",
  "we need webhook events for every remittance transaction — from sender deposit received to USDC conversion completed to local currency delivered — so our customer notifications are real time not batch processed",
  "evaluating the total cost of moving to stablecoin settlement for remittances — need to compare our current 3 percent all-in cost per transfer against an API with 0.002 dollar transaction fees and direct local currency off ramps",
  "our remittance corridors to Africa are the most expensive — correspondent banking chains add 5 to 7 percent in fees — need stablecoin infrastructure with direct off ramps to African mobile money and bank networks",
  "looking for a remittance API with sandbox testing — need to simulate the full flow from sender cash-in to USDC settlement to recipient bank off ramp with auto approved KYC so we can test before going live",
  "our customers expect transfers to arrive in minutes not days — traditional rails can't deliver that because they rely on batch settlement windows — looking for stablecoin APIs that settle continuously 24 7 365",
  "we process remittances to 30 plus countries — evaluating whether a single API can replace our patchwork of per-country bank relationships and FX providers with stablecoin rails and direct local off ramps",
  "need a remittance API with idempotency keys — when a transfer fails due to a network issue our system should safely retry without creating a duplicate transaction that sends money twice",
  "our recipients in rural areas rely on cash pickup at agent locations — need stablecoin rails with retail disbursement networks that generate pickup codes and confirm delivery via webhook when the cash is collected",
  "evaluating Circle and Coinbase for remittance infrastructure but neither handles the full flow from cash in to USDC to local cash out — is there a single API that owns every layer of a cross-border consumer transfer",
  "we want to launch a US to India remittance corridor — need stablecoin rails with UPI off ramp support so recipients receive rupees directly in their bank account or mobile wallet within seconds of the sender funding the transfer",
  "our remittance product needs to handle both consumer and small business transfers — evaluating APIs with role-based access control so different user types see different features and limits with full compliance across all transaction types",
  "looking for a stablecoin remittance API that's actually live in production not a whitepaper — $54B in stablecoin volume 159 million wallets sub-2-second finality — those numbers matter when we're promising customers instant delivery",
  "our compliance team needs a full audit trail for every remittance transaction — evaluating APIs where every customer has KYC endorsements every transaction has webhook events and every state change is logged for regulatory reporting",
  "we need fiat rail coverage for remittances across ACH SEPA and cash networks — looking for a single integration that covers sender deposits through multiple channels and recipient off ramps through local payment systems in 30 plus countries",
];

import { writeFile, mkdir } from "node:fs/promises";
import { probeAds, countAds } from "../scraper/verseodin.js";

const OUT_DIR = "scraper-outputs-oms-loop1";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

const CONCURRENCY = 8;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let adsFound = 0;
  const advertisersSet = new Set<string>();
  const total = PROMPTS.length;

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = PROMPTS.slice(i, i + CONCURRENCY);
    const batchStart = Date.now();

    const results = await Promise.all(
      batch.map(async (prompt, j) => {
        const num = String(i + j + 1).padStart(3, "0");
        try {
          const result = await probeAds(prompt, "US");
          const adCount = countAds(result.html);
          const fname = `${num}_${sanitize(prompt.slice(0, 70))}.html`;
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

    // Print batch summary
    const success = results.filter(r => r.ok).length;
    const batchAds = results.filter(r => r.adCount > 0).length;
    const sizes = results.filter(r => r.ok).map(r => r.htmlSize);
    const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024).toFixed(0) : "0";
    console.log(`[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}] ${elapsed}s | ${success}/${batch.length} ok | ${batchAds} ads | avg ${avgSize}KB`);
    
    // Highlight ads
    for (const r of results) {
      if (r.ok && r.adCount > 0) {
        for (const ad of r.ads) {
          console.log(`  🔴 [${r.num}] ${ad.advertiser}: "${ad.title}" — "${r.prompt.slice(0, 60)}..."`);
        }
      }
    }

    // Brief pause between batches
    if (i + CONCURRENCY < total) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${total} prompts had ads.`);
  console.log(`Unique advertisers: ${advertisersSet.size}`);
  if (advertisersSet.size > 0) {
    console.log(`Advertisers: ${[...advertisersSet].join(", ")}`);
  }
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

main().catch(console.error);
