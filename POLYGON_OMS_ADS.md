# Polygon Open Money Stack — Complete ChatGPT Ads Strategy

## Executive Summary

Polygon's Open Money Stack (OMS) is entering technical preview. The product is a vertically integrated stablecoin payments API — fiat ramps, wallets, compliance, settlement, all in one platform. The target customer is NOT a crypto-native developer. It's a non-crypto fintech PM, bank VP, or marketplace operator who just heard about stablecoin regulation and needs to figure out how to add stablecoin rails to their business.

This document is a complete ads playbook for running ChatGPT Ads to acquire early-access partners for OMS. It covers: market context, target personas, campaign architecture, 30+ context hints across 5 ad groups, ad creative strategy, landing page guidance, budget recommendations, measurement framework, and an optimization playbook.

---

## 1. Market Context — Why Now

Stablecoins have crossed from crypto-native infrastructure into mainstream finance in 2026. Five structural shifts make this the right moment:

| Shift | Signal | Source |
|---|---|---|
| **US regulation** | GENIUS Act passed. ProShares launched GENIUS Money Market ETF designed for stablecoin reserves. | Congress.gov, ProShares |
| **Bank approval** | Coinbase received conditional OCC approval for a national trust bank charter. | Coinbase, Apr 2026 |
| **Public market validation** | Circle (USDC) listed on NYSE (CRCL). Public company with quarterly reporting. | NYSE |
| **Enterprise adoption** | Checkout.com added USDC acceptance for 1,000+ merchants via Coinbase. Visa expanded stablecoin settlement. Stripe re-entered crypto payments. | Press releases, 2026 |
| **Infrastructure maturity** | Polygon processed $54B in stablecoin volume across 159M wallets with $0.002 avg tx cost. Revolut, Stripe, Flutterwave already settled on Polygon Chain. | Polygon docs |

**The consequence**: A non-crypto fintech PM is now getting asked by their CEO: "What's our stablecoin strategy?" They've never owned crypto. They don't know what a seed phrase is. They need an answer — and they'll search ChatGPT for one.

---

## 2. Who We're Targeting — Detailed ICPs

### ICP 1: The Fintech PM
| Attribute | Detail |
|---|---|
| **Title** | Product Manager, Head of Product, VP Product |
| **Company** | Series B-C fintech, neobank (50-200 employees), payment platform |
| **Revenue** | $5M-$50M ARR |
| **Situation** | CEO/board read about stablecoin regulation and mandated a "stablecoin strategy." PM has 4-8 weeks to evaluate options. |
| **Crypto literacy** | Zero to minimal. Reads about crypto in mainstream news but has never transacted. |
| **What they search on ChatGPT** | "how do I add stablecoin payments to my app", "regulated stablecoin API for fintech", "do my users need a crypto wallet to use USDC" |
| **Primary objection** | Compliance. "Our legal team will veto anything that sounds like crypto." |
| **Secondary objection** | User experience. "Our customers shouldn't need to understand blockchain." |
| **Winning message** | "Regulated. KYC built in. REST API. Your users see dollars, not tokens." |

### ICP 2: The Bank/Enterprise Payments Lead
| Attribute | Detail |
|---|---|
| **Title** | VP/Director of Payments, Head of Innovation, Treasury Director |
| **Company** | Regional bank ($1B-$50B AUM), Fortune 500 treasury, large fintech |
| **Revenue** | $500M-$5B revenue (for corporates) |
| **Situation** | Board-level mandate to "explore blockchain settlement." 12-18 month evaluation cycle. |
| **Crypto literacy** | Theoretical. Read the BIS papers. Understands the concepts but hasn't touched code. |
| **What they search on ChatGPT** | "enterprise blockchain settlement production ready", "institutional stablecoin infrastructure", "is on-chain settlement reliable at scale" |
| **Primary objection** | Production readiness. "Can this handle $500M monthly with SLAs?" |
| **Secondary objection** | Vendor risk. "Who do I call at 3am?" |
| **Winning message** | "$54B processed. 6 years in production. SOC 2, RBAC, SSO. We own the settlement layer." |

### ICP 3: The Marketplace/Gig Economy Operator
| Attribute | Detail |
|---|---|
| **Title** | CTO, Head of Payments, VP Operations |
| **Company** | Two-sided marketplace, creator economy platform, gig economy company. Contractor-heavy. |
| **Revenue** | $10M-$200M GMV |
| **Situation** | Payments is their #2 cost after payroll. Cross-border payouts to sellers/creators/contractors taking 2-5 days and costing 3-7%. |
| **Crypto literacy** | Zero. They don't care about the tech — they care about the P&L line item. |
| **What they search on ChatGPT** | "cheaper faster way to pay international contractors", "Wise vs stablecoin payout cost comparison", "instant global seller payouts API" |
| **Primary objection** | Recipient experience. "My sellers/contractors don't have crypto wallets and I'm not making them download anything." |
| **Secondary objection** | Regulatory. "Is paying contractors in crypto legal?" |
| **Winning message** | "They get dollars. To their bank account. Settlement happens in seconds on the backend at $0.002." |

### ICP 4: The Embedded Finance Builder
| Attribute | Detail |
|---|---|
| **Title** | CTO, Engineering Lead, Founder |
| **Company** | Vertical SaaS platform, B2B marketplace, industry-specific software (15-80 employees). Already does invoicing/billing/reconciliation for their industry. |
| **Revenue** | $2M-$20M ARR |
| **Situation** | Sees an opportunity to own the payment flow, not just the workflow. Payment margin could 3x their ARPU. |
| **Crypto literacy** | Technical but practical. Could learn blockchain if needed but would rather not. |
| **What they search on ChatGPT** | "easiest API to embed cross-border payments into SaaS", "payments API with sandbox and webhooks", "embed stablecoin payments without blockchain team" |
| **Primary objection** | Developer experience. "How many sprints to integrate? Does it have a sandbox? Rate limits? Documentation quality?" |
| **Secondary objection** | Maintenance. "If something breaks at 2am, is my team debugging or yours?" |
| **Winning message** | "REST API. Webhooks. Sandbox environment. Production docs. Integrate in days, not months." |

---

## 3. Campaign Architecture

### Budget Recommendation

| Plan | Daily Budget | Est. Clicks/Day | Rationale |
|---|---|---|---|
| **Phase 1 (Test)** | $50/day | 15-20 clicks | Validate ad copy + context hint combinations on 4-5 ad groups |
| **Phase 2 (Scale)** | $200/day | 60-80 clicks | Double down on top 2 performing ad groups. Pause underperformers. |
| **Phase 3 (Sustain)** | $100/day | 30-40 clicks | Maintain successful groups. Rotate creatives. A/B test landing pages. |

**CPC estimate**: $3-5 (OpenAI's recommended range for new advertisers). At 1-2% conversion rate to waitlist signup, cost per lead = $150-$500.

### Campaign Structure

```
Campaign: OMS Early Access
├── Ad Group 1: "Just Heard About Stablecoins" (Top-of-Funnel)
│   ├── 5 context hints
│   └── 2-3 ad variants (educational, regulation-focused)
│
├── Ad Group 2: "Tired of Slow & Expensive Payments" (Pain-driven)
│   ├── 5 context hints
│   └── 2-3 ad variants (cost/speed comparison, ROI-focused)
│
├── Ad Group 3: "Don't Want to Become a Crypto Company" (Compliance-first)
│   ├── 5 context hints
│   └── 2-3 ad variants (compliance, no-crypto-UX)
│
├── Ad Group 4: "One API Instead of Five Vendors" (Developer/Integration)
│   ├── 5 context hints
│   └── 2-3 ad variants (developer experience, single-API)
│
├── Ad Group 5: "Enterprise & Bank" (Institutional)
│   ├── 5 context hints
│   └── 2-3 ad variants (enterprise-grade, production stats)
│
└── Ad Group 6: "Competitive Comparison" (Mid-funnel)
    ├── 5 context hints
    └── 2-3 ad variants (Circle/Coinbase alternative, differentiation)
```

### Ad Group Descriptions

**Ad Group 1: "Just Heard About Stablecoins"**
- **Audience**: Top of funnel. People learning about stablecoin regulation for the first time. ICPs 1 and 4.
- **Intent level**: Low-mid. Educational.
- **Goal**: Awareness → visit landing page → understand OMS exists as an option.
- **Bid**: $2-3 CPC (lower intent, volume play).
- **Context hint theme**: Curiosity about regulation, "what does this mean for me," first steps.

**Ad Group 2: "Tired of Slow & Expensive Payments"**
- **Audience**: Operators feeling payment pain. ICP 3 primary, ICP 2 secondary.
- **Intent level**: High. They're actively searching for alternatives.
- **Goal**: Direct response — "here's what it costs vs what you pay now."
- **Bid**: $4-5 CPC (high intent, willing to convert).
- **Context hint theme**: SWIFT fees, delayed settlement, FX costs, contractor payouts.

**Ad Group 3: "Don't Want to Become a Crypto Company"**
- **Audience**: Compliance-conscious founders/PMs. ICP 1 primary.
- **Intent level**: Medium-high. They want to add stablecoins but fear crypto complexity.
- **Goal**: Reassurance — "regulated, compliant, users never see crypto."
- **Bid**: $3-4 CPC.
- **Context hint theme**: Compliance anxiety, KYC/AML, no seed phrases, user sees dollars.

**Ad Group 4: "One API Instead of Five Vendors"**
- **Audience**: Technical decision-makers evaluating integration effort. ICP 4 primary.
- **Intent level**: High. They're comparing build vs buy.
- **Goal**: Technical conviction — "single integration, REST API, webhooks, sandbox."
- **Bid**: $4-5 CPC.
- **Context hint theme**: Vendor stitching, API integration, build vs buy, Stripe-like experience.

**Ad Group 5: "Enterprise & Bank"**
- **Audience**: Institutional buyers. ICP 2 primary.
- **Intent level**: Medium. Long evaluation cycle. They're gathering options.
- **Goal**: Credibility — "$54B processed, 6 years in production, SOC 2, enterprise SLAs."
- **Bid**: $5-7 CPC (willing to pay more for enterprise leads).
- **Context hint theme**: Institutional grade, production scale, compliance certifications, audit requirements.

**Ad Group 6: "Competitive Comparison"**
- **Audience**: Already evaluating Circle, Coinbase, or Fireblocks. ICPs 1-4.
- **Intent level**: Highest. They're in active evaluation.
- **Goal**: Differentiation — "we own the infrastructure, they aggregate vendors."
- **Bid**: $5-8 CPC (highest intent, closest to decision).
- **Context hint theme**: "vs Circle", "vs Coinbase", comparison questions.

---

## 4. Complete Context Hints (Ready for Campaign Setup)

### Ad Group 1: "Just Heard About Stablecoins" — Educational, top-of-funnel

```
fintech product manager trying to understand what the GENIUS Act and US stablecoin regulation actually means for their business — they want to know if there's a compliant way to add stablecoin payments to their existing product
neobank founder who keeps hearing about stablecoins in the Wall Street Journal and wants to understand whether there's actually a production-ready payments API that handles the full money movement lifecycle with regulatory compliance built in
business leader researching whether stablecoin payment infrastructure is regulated safe and ready for enterprise adoption or if it's still experimental technology that will get their compliance team fired
VP of payments asking what changed with US stablecoin regulation in 2026 and whether now is the right time to add USDC or USDT acceptance to their platform without hiring a blockchain team
product leader exploring how other fintech companies are integrating stablecoin payments — specifically looking for examples of businesses that added USDC rails without becoming crypto companies
```

### Ad Group 2: "Tired of Slow & Expensive Payments" — Pain-driven, operational

```
payments operations manager calculating how much their company loses per year on SWIFT fees wire transfer costs and FX spread — searching for instant cross-border settlement alternatives that actually work at production scale
gig economy platform CTO trying to figure out how to pay five thousand contractors across forty countries in hours instead of the three to five days it currently takes — and without each contractor needing to create a crypto wallet or understand blockchain
marketplace founder researching whether there's a single API that can replace their patchwork of ACH transfers Wise PayPal and international wires for global seller payouts — wants to stop managing five different payment integrations
finance leader doing a cost comparison between traditional cross-border payment rails and stablecoin-based settlement for business payments — needs actual numbers on all-in cost per transaction including any on and off ramp fees
operations director whose team spends half their week tracking down delayed international contractor payments — wants to know if stablecoin settlement can actually eliminate the three day wait and the intermediary bank black hole
```

### Ad Group 3: "Don't Want to Become a Crypto Company" — Compliance-first

```
product leader researching how to add stablecoin payment rails that handle KYC identity verification and compliance automatically — their users should see dollars not tokens and their compliance team should see a full audit trail
CTO evaluating whether there's a payments API with built-in identity verification regulatory compliance and bank-grade security that completely abstracts all blockchain complexity from both their engineering team and their end users
fintech founder who wants to offer fast cheap global payments but their legal and compliance team has vetoed anything that exposes customers to token price volatility cryptocurrency wallets or seed phrases
business operator searching for stablecoin payment infrastructure where end users just see regular dollar deposits and withdrawals — no MetaMask downloads no gas fees no blockchain jargon and no risk of token price fluctuation
compliance officer trying to understand how KYC and AML work for stablecoin-based business payments — specifically whether there are regulated options with built-in identity checks that don't add friction to the payment flow for legitimate users
```

### Ad Group 4: "One API Instead of Five Vendors" — Developer/integration

```
CTO frustrated with having to stitch together wallet providers KYC identity verification vendors exchange liquidity sources and traditional banking partners just to move money — researching whether anyone offers a single vertically integrated payments API that handles the entire flow
developer who spent months integrating multiple payment infrastructure vendors and is now specifically looking for one API that handles fiat deposits stablecoin transfers and bank off-ramps with REST endpoints webhooks and a sandbox environment
technical founder trying to decide whether to continue maintaining their current patchwork of five different payment infrastructure vendors or switch to a unified stablecoin payments API — comparing integration effort and ongoing maintenance cost
engineering leader evaluating the build versus buy tradeoff for adding stablecoin payment rails to their product — wants something that works like Stripe in terms of developer experience but handles the full money movement lifecycle including wallets compliance and settlement
startup CTO asking if there's a payments API that abstracts away all the complexity of blockchain settlement so their team can integrate in days instead of months — needs clear documentation SDK support and predictable pricing
```

### Ad Group 5: "Enterprise & Bank" — Institutional

```
enterprise payments architect evaluating whether blockchain-based settlement infrastructure can reliably handle five hundred million dollars in monthly institutional payment volume — needs production SLAs uptime guarantees and SOC 2 compliance certification before their risk committee will approve
bank VP of innovation researching how to layer regulated stablecoin settlement onto their existing core banking infrastructure without rebuilding their entire technology stack or disrupting existing payment operations
corporate treasury director evaluating integration of USDC settlement for B2B cross-border treasury payments — specifically focused on the compliance framework audit trail requirements and whether the infrastructure has been tested at institutional scale
institutional payments leader comparing stablecoin infrastructure providers for enterprise deployment — requirements include custody-grade security architecture role-based access control SSO integration and full transaction audit trail capabilities
risk officer at a financial institution evaluating whether stablecoin payment infrastructure meets their regulatory and operational risk standards for production deployment — needs to understand settlement finality guarantees and custody segregation
```

### Ad Group 6: "Competitive Comparison" — Mid-funnel evaluation

```
developer comparing Circle's payment APIs and wallet infrastructure against Polygon's Open Money Stack for building a stablecoin settlement product — wants to understand whether a vertically integrated stack that owns the settlement layer is better than composing multiple vendor services
fintech CTO evaluating whether to use Coinbase Developer Platform for adding stablecoin rails to their product or build on Polygon Open Money Stack — comparing API simplicity integration effort settlement speed and whether the platform actually owns the underlying infrastructure
founder researching the tradeoffs between using USDC directly through Circle's APIs versus integrating with a unified stablecoin payments platform that handles wallets fiat ramps compliance and settlement in a single integration
payments leader comparing stablecoin infrastructure options for cross-border B2B payments — evaluating Circle Coinbase Fireblocks and Polygon side by side across compliance coverage settlement speed and total cost per transaction
CTO who started evaluating Circle for stablecoin payments but is concerned about having to stitch together Circle wallets with a separate KYC vendor and a separate off-ramp provider — now looking for a single-platform alternative
```

---

## 5. Ad Creative Strategy

### Creative Angles

Each ad should use one of these angles. Vary across ad groups and A/B test.

| Angle | Example headline | Best for |
|---|---|---|
| **Regulation-driven** | "Stablecoin regulation passed. Here's how to add it to your stack." | AG1 (top of funnel) |
| **Cost comparison** | "Paying $25 per wire? Settle for $0.002." | AG2 (pain-driven) |
| **Compliance-first** | "Regulated stablecoin rails. KYC/AML built in. No crypto UX." | AG3 (compliance) |
| **Developer velocity** | "One REST API. Fiat in, stablecoins, fiat out. Deploy in days." | AG4 (developer) |
| **Scale/credibility** | "$54B settled. 159M wallets. Enterprise-grade stablecoin infra." | AG5 (enterprise) |
| **Vertical integration** | "Why stitch 5 vendors when one API handles everything?" | AG4, AG6 |

### Ad Copy Bank (20 variants)

**For AG1 (Top of Funnel / Regulation):**
1. Title: "Stablecoin Regulation Is Here. Now What?" Body: "The GENIUS Act passed. Your competitors are moving. A single API for regulated stablecoin payments."
2. Title: "Adding Stablecoin Payments? Start Here." Body: "Fiat ramps, compliance, and settlement in one API. Built on infrastructure that's processed $54B."
3. Title: "Your Board Asked About Stablecoins." Body: "Here's how to answer: regulated rails, KYC built in, one REST API. No crypto team required."

**For AG2 (Pain / Cost-Speed):**
4. Title: "$25 Per Wire. $0.002 Per Stablecoin Transfer." Body: "Cross-border settlement in seconds, not days. One API. Full compliance."
5. Title: "Your Contractors Wait 5 Days to Get Paid." Body: "USTDC settlement takes seconds. They get dollars. You get an audit trail."
6. Title: "3% FX Spread vs $0.002 Settlement." Body: "Pay sellers and contractors globally. Stablecoin rails with built-in off-ramps."

**For AG3 (Compliance / No-Crypto-UX):**
7. Title: "They See Dollars. Not Tokens." Body: "KYC handled at onboarding. Compliance built in. Your users never touch crypto."
8. Title: "Your Compliance Team Will Approve This." Body: "Regulated stablecoin payments. Full KYC/AML. Bank-grade custody. One API."
9. Title: "No MetaMask. No Seed Phrases. No Gas Fees." Body: "Your users deposit dollars. Your app settles in USDC. Everyone wins."

**For AG4 (Developer / Integration):**
10. Title: "One API. Five Vendors Worth of Infrastructure." Body: "Wallets, ramps, compliance, and settlement. REST endpoints, webhooks, sandbox."
11. Title: "Add Stablecoin Payments. Deploy in Days, Not Months." Body: "A Stripe-like experience for the full money movement lifecycle. Docs at docs.polygon.technology."
12. Title: "Stop Patching Payment Vendors Together." Body: "One vertically integrated API. We own every layer — so when something breaks, we fix it."

**For AG5 (Enterprise / Bank):**
13. Title: "Enterprise Stablecoin Settlement. Production Ready." Body: "$54B processed. SOC 2. RBAC. SSO. Built for the volumes your risk committee demands."
14. Title: "Layer Stablecoins Onto Your Core. Don't Rebuild." Body: "Integrate USDC settlement without touching your existing banking infrastructure."
15. Title: "Your Auditors Will Want to See This." Body: "Full transaction audit trail. Custody-grade security. Six years in production."

**For AG6 (Competitive Comparison):**
16. Title: "Circle + KYC Vendor + Off-Ramp. Or Just One API." Body: "Vertically integrated stablecoin payments. We own the settlement layer."
17. Title: "Evaluating Circle, Coinbase, and Fireblocks?" Body: "Add Polygon OMS to your comparison. One API. Every layer. No middleware."
18. Title: "They Aggregate Vendors. We Own the Infrastructure." Body: "When settlement breaks, they call their vendor. We own ours. $54B settled."

### Creative Scoring Heuristic (for optimization)

Score each creative on 5 dimensions (1-10):
- **Clarity**: Does the headline instantly communicate what this is?
- **Specificity**: Are there concrete numbers/features, not buzzwords?
- **Audience relevance**: Does this speak to the target persona's actual problem?
- **CTA strength**: Is the next action clear?
- **Clickbait risk**: Is this overpromising? (lower is better)

Target creative score: 38+/50. Retire creatives scoring below 30.

---

## 6. Landing Page Guidance

### What the landing page must communicate (in the first 5 seconds)

1. **What this is**: "Enterprise-ready stablecoin payments infrastructure — one API"
2. **Who it's for**: "Fintechs, banks, enterprises, marketplaces"
3. **Why now**: "GENIUS Act passed. Regulated stablecoin rails are here."
4. **Social proof**: "$54B processed. Used by Revolut, Stripe, Flutterwave."
5. **CTA**: "Get early access" (email + company name, 2 fields)

### Message-to-Ad Alignment

| Ad group | Ad promise | Landing page must show |
|---|---|---|
| AG1 (Regulation) | "Understand the regulation" | Section: "What the GENIUS Act Means for Your Business" |
| AG2 (Cost/Speed) | "$0.002 vs $25 per wire" | Cost comparison table: SWIFT vs ACH vs USDC |
| AG3 (No-crypto-UX) | "Users see dollars" | Screenshot: user dashboard showing USD balances, not tokens |
| AG4 (One API) | "Integrate in days" | Code snippet block + "View Docs" link + sandbox CTA |
| AG5 (Enterprise) | "Institutional grade" | Uptime stats, SOC 2 badge, compliance certifications |
| AG6 (Comparison) | "We own the infrastructure" | Architecture diagram: OMS stack vs Circle/Coinbase dependency chain |

### URL and Tracking

Every ad target URL should carry UTMs:
```
utm_source=openai_ads
utm_medium=cpc
utm_campaign=oms_early_access
utm_content={ad_id}_{creative_angle}
utm_term={ad_group_intent}
```

Example: `https://polygon.technology/open-money-stack?utm_source=openai_ads&utm_medium=cpc&utm_campaign=oms_early_access&utm_content=ad_17_comparison&utm_term=enterprise_institutional`

---

## 7. Measurement Framework

### Primary KPIs

| KPI | Target | Why |
|---|---|---|
| **CTR** | 1.5-3% | Indicates ad relevance. Below 1% → rewrite context hints or creative. |
| **CPC** | $3-5 | OpenAI's recommended range. Monitor for bid inflation. |
| **Landing page visits** | Per ad group | Track which segments drive traffic. |
| **Waitlist signups** | ≥1 per 100 clicks | Conversion rate. Below 0.5% → landing page needs work. |
| **Cost per lead** | $150-500 | Depends on CPC and conversion rate. Calibrate over first 2 weeks. |
| **Qualified leads** | ≥25% of signups | Of waitlist signups, how many fit ICP. Post-signup qualification email. |

### Leading Indicators (first 48 hours)

| Metric | Good | Bad | Action if bad |
|---|---|---|---|
| Ad impressions | Steady growth | 0 impressions | Context hints too narrow; broaden or add more |
| CTR | >1.5% | <0.5% | Creative mismatch with context; A/B test new copy |
| Spend pacing | Consistent | Budget exhausted by 10am | Increase daily cap or lower bids |

### Ad Group Performance Dashboard

Track per ad group weekly:

| Ad Group | Impr. | Clicks | CTR | CPC | Conv. | CPL | Status |
|---|---|---|---|---|---|---|---|
| AG1: Regulation | | | | | | | |
| AG2: Cost/Speed | | | | | | | |
| AG3: No-Crypto | | | | | | | |
| AG4: One API | | | | | | | |
| AG5: Enterprise | | | | | | | |
| AG6: Comparison | | | | | | | |

---

## 8. Optimization Playbook

### Week 1-2: Launch and Learn

1. Launch all 6 ad groups at equal budget splits.
2. Wait for minimum 500 impressions per ad group before making decisions.
3. Identify top 2 performing groups by CTR and conversion rate.
4. Pause any ad group with 0 conversions after 1,000 impressions.

### Week 3-4: Double Down

1. Shift 60% budget to top 2 ad groups.
2. Generate 5 new ad variants for top performers using the winning angles.
3. A/B test: "Regulation-driven" vs "Cost comparison" headlines in AG1/AG2.
4. Begin A/B testing landing page variations:
   - Version A: "Get Early Access" (current)
   - Version B: "See the API Docs" (developer-focused)
   - Version C: "Compare Costs" (pain-focused)

### Week 5-8: Scale and Rotate

1. Introduce creative rotation: retire creatives below 1% CTR after 500 impressions.
2. Bi-weekly context hint refresh: add 3 new hints per active group, deactivate the worst performer.
3. If CPL is steady or declining, increase daily budget 20% per week until plateau.
4. Cross-reference: if AG3 (compliance) converts but AG2 (cost/speed) doesn't, the audience is compliance-driven, not cost-driven. Adjust all copy accordingly.

### Context Hint Optimization Rules

- **Hint too broad**: Clicks but low conversion → add specificity (audience, intent, product category)
- **Hint too narrow**: 0 impressions after 48 hours → broaden the context description
- **Hint overlap**: Two groups competing on the same terms → merge hints or differentiate by adding audience descriptors
- **Hint decay**: Was performing, now declining → rotate in fresh hints every 2-3 weeks

---

## 9. Competitive Landscape

Advertisers currently bidding on "stablecoin API" / "payments API" context hints (observed from our ChatGPT ad probes):

| Competitor | What they're bidding on | OMS differentiation |
|---|---|---|
| **Circle** | USDC, stablecoin payments, wallet infrastructure | Circle provides components; OMS is vertically integrated. Circle wallets + separate off-ramp + separate compliance = 3+ vendors. |
| **Coinbase** | Stablecoin rails, onramp, developer platform | Similar to Circle — component-based. Coinbase has custody but doesn't own the settlement chain. |
| **Fireblocks** | Institutional custody, MPC wallets | Fireblocks is custody/wallet only. No fiat ramps. No settlement layer. |
| **Stripe** | Payments API (not stablecoin-specific) | Stripe processes credit cards. OMS processes stablecoins at $0.002/tx with instant settlement. |

**OMS's unique positioning**: The only player that owns every layer — fiat ramps, wallets, compliance, settlement chain, cross-chain interop — in one API. When something breaks, there's one vendor to call, not five.

---

## 10. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| **OMS is in technical preview** — limited capacity | High | Ads position as "early access" not "GA." Manage expectations on landing page. |
| **ChatGPT Ad auction is sparse** (3% fill rate observed) | High | Broader context hints. Accept that not every impression will serve an ad. |
| **Competitors also discover ChatGPT Ads** | Medium | Move fast. First-mover advantage is real in a sparse auction. |
| **Regulatory changes shift messaging** | Low | Monitor GENIUS Act progress. Be ready to update context hints within 48 hours of regulatory news. |
| **Audience doesn't understand "stablecoin"** | Medium | A/B test "stablecoin payments" vs "digital dollar payments" vs "blockchain settlement" in ad copy. |

---

## 11. Timeline

| Phase | Duration | Activities |
|---|---|---|
| **Setup** | Day 1-3 | Create campaigns, ad groups, upload context hints and creatives |
| **Launch** | Day 4 | Activate all 6 ad groups at $50/day combined |
| **Learn** | Day 4-18 | Gather data. Minimum 500 impressions per group. First optimization pass. |
| **Optimize** | Day 18-32 | Double down on winners. Pause losers. A/B test creatives and landing pages. |
| **Scale** | Day 32-60 | Increase budget on proven groups. Rotate creatives. Bi-weekly refresh. |
| **Review** | Day 60 | Full performance review. Strategy update for next quarter. |

---

## 12. Appendix: Context Hint Quality Checklist

Before activating any context hint, verify:

1. **Names a specific audience** (fintech PM, bank VP, CTO, etc.)
2. **Describes user intent** (researching, comparing, evaluating, trying to understand)
3. **Mentions the problem** (slow settlement, high fees, compliance anxiety, integration pain)
4. **Is 10-30 words** (enough to be specific, not so long it's unwieldy)
5. **Contains 0 crypto-native jargon** (no DeFi, smart contract, EVM, AMM, yield, staking, governance)
6. **Uses business language** (API, integration, compliance, settlement, regulation, KYC/AML, audit trail)
7. **Doesn't duplicate** another hint in the same ad group
8. **Distinct from other ad groups** (no cross-group overlap)

### Bad Hint → Good Hint

| Bad (too vague / crypto-native) | Good (specific / business language) |
|---|---|
| "stablecoin API" | "fintech PM researching how to add regulated stablecoin payment rails to their existing banking app without their users seeing crypto" |
| "blockchain payments" | "CTO evaluating whether settlement on stablecoin rails is production-ready and whether they can integrate it without hiring a blockchain team" |
| "USDC integration" | "marketplace founder comparing the total cost and integration effort of stablecoin payouts vs Wise vs bank wire for paying 5000 international sellers" |
