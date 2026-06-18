// One-off mock generator for the real-estate showcase dataset.
// Produces real-estate-probes.json (bare array) + real-estate-patterns.json
// (bare object) with internally-consistent aggregates. Run: node scripts/gen-real-estate.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

// Advertisers plausibly surfaced by ChatGPT for real-estate intents.
const ADV = {
  zillow: "Zillow",
  redfin: "Redfin",
  realtor: "Realtor.com",
  opendoor: "Opendoor",
  rocket: "Rocket Mortgage",
  better: "Better.com",
  compass: "Compass",
  homelight: "HomeLight",
  sofi: "SoFi",
};

const COMPETITORS = Object.values(ADV);

// Ad creatives keyed by advertiser.
const CREATIVE = {
  [ADV.zillow]: { title: "Find Your Next Home", body: "Browse millions of listings with photos, prices, and Zestimate values." },
  [ADV.redfin]: { title: "Tour Homes On Your Schedule", body: "Lower fees, local agents, and same-day tours near you." },
  [ADV.realtor]: { title: "See Homes Before They Hit the Market", body: "Accurate, up-to-date listings sourced directly from the MLS." },
  [ADV.opendoor]: { title: "Sell Your Home Without the Hassle", body: "Get a competitive cash offer in minutes. Skip the showings." },
  [ADV.rocket]: { title: "Get Approved in Minutes", body: "See real mortgage rates and lock yours online with Rocket." },
  [ADV.better]: { title: "Mortgages With Zero Lender Fees", body: "Pre-approval in as little as 3 minutes. No commission, no surprises." },
  [ADV.compass]: { title: "Work With a Top Local Agent", body: "Compass agents close faster with data-driven pricing." },
  [ADV.homelight]: { title: "Match With the Right Agent", body: "We compare agents by real performance so you don't have to." },
  [ADV.sofi]: { title: "Mortgage Rates Built for You", body: "Member rates, fast pre-qualification, no hidden fees." },
};

// helper to build a probe
let n = 0;
function probe(p) {
  n++;
  const id = `RE-${String(n).padStart(3, "0")}`;
  const ads = (p.advertisers || []).map((a) => ({ advertiser: a, title: CREATIVE[a].title, body: CREATIVE[a].body }));
  const has_ads = ads.length > 0;
  return {
    id,
    prompt: p.prompt,
    status: "ok",
    chatgpt_response: p.response,
    citations: (p.citations || []).map((c) => ({ url: c[1], title: c[0] })),
    response_length: p.response.length,
    has_search: (p.citations || []).length > 0,
    ads,
    has_ads,
    advertiser_name: has_ads ? ads[0].advertiser : null,
    ad_copy: has_ads ? ads[0].title : null,
    html_size_kb: 1800 + Math.round(p.prompt.length * 3),
    persona: p.persona,
    primary_need: p.need,
    intent_score: p.intent,
    known_competitors_in_prompt: p.compPrompt || [],
    known_competitors_in_response: p.compResp || [],
    // OMS-specific fields are neutral for non-OMS industries.
    contains_oms_language: false,
    oms_signals_found: [],
    prompt_structure: p.structure,
    contains_api: false,
    contains_compliance: !!p.compliance,
    contains_competitor: (p.compResp || []).length > 0,
    word_count: p.prompt.split(/\s+/).length,
  };
}

const P = [
  // first_time_buyer
  probe({ prompt: "What's the first thing I should do as a first-time home buyer with about $80k saved?", response: "Start by getting pre-approved for a mortgage so you know your real budget. Lenders like Rocket Mortgage and Better.com offer fast online pre-approval. Then connect with a buyer's agent...", persona: "first_time_buyer", need: "buy_home", intent: 6, structure: "question", advertisers: [ADV.rocket], compResp: ["Rocket Mortgage", "Better.com"], citations: [["Consumer Financial Protection Bureau", "https://www.consumerfinance.gov"]] }),
  probe({ prompt: "How much house can I afford on a $130,000 salary in Austin?", response: "On a $130k salary, a common guideline is a home price around 3–4x income, so roughly $400k–$520k depending on debts and down payment. Use a pre-approval from a lender to get exact numbers...", persona: "first_time_buyer", need: "mortgage", intent: 7, structure: "question", advertisers: [ADV.rocket, ADV.sofi], compResp: ["Rocket Mortgage", "SoFi"] }),
  probe({ prompt: "Is it better to buy or rent right now if I plan to stay 3 years?", response: "With a 3-year horizon, renting is often safer because transaction costs (≈8–10% round trip) can outweigh appreciation. Run a rent-vs-buy calculator...", persona: "first_time_buyer", need: "buy_home", intent: 4, structure: "comparison" }),
  probe({ prompt: "What credit score do I need to get a good mortgage rate?", response: "Generally 740+ gets the best conventional rates; 620 is a common floor. FHA loans allow lower. Lenders such as Better.com show rate tiers by score...", persona: "first_time_buyer", need: "mortgage", intent: 6, structure: "question", advertisers: [ADV.better], compResp: ["Better.com"] }),
  probe({ prompt: "first time buyer programs california down payment assistance", response: "California offers CalHFA programs with down-payment and closing-cost assistance for first-time buyers, including the MyHome and Dream For All shared-appreciation programs...", persona: "first_time_buyer", need: "buy_home", intent: 5, structure: "need_statement", compliance: true, citations: [["CalHFA", "https://www.calhfa.ca.gov"]] }),

  // real_estate_investor (seed blue ocean: investment_analysis, high intent, NO ads)
  probe({ prompt: "How do I calculate cap rate and cash-on-cash return for a duplex I'm evaluating?", response: "Cap rate = net operating income / purchase price. Cash-on-cash = annual pre-tax cash flow / total cash invested. For a duplex, sum both units' rent, subtract vacancy, taxes, insurance, maintenance...", persona: "real_estate_investor", need: "investment_analysis", intent: 9, structure: "question" }),
  probe({ prompt: "I want to build a rental property analysis spreadsheet that models vacancy, capex reserves, and IRR over 10 years", response: "A solid model has tabs for assumptions, monthly cash flow, and a 10-year pro forma. Key drivers: rent growth, vacancy %, capex reserve per unit, exit cap rate for terminal value, then compute levered IRR...", persona: "real_estate_investor", need: "investment_analysis", intent: 10, structure: "need_statement" }),
  probe({ prompt: "best markets for buy-and-hold single family rentals with strong rent-to-price ratios in 2026", response: "Midwest and Southeast metros (e.g. Indianapolis, Memphis, Birmingham, Kansas City) tend to show higher rent-to-price (the '1% rule') than coastal markets. Look at job growth, population inflow, landlord-friendly laws...", persona: "real_estate_investor", need: "investment_analysis", intent: 8, structure: "need_statement" }),
  probe({ prompt: "how should I think about a 1031 exchange to defer capital gains on a rental sale?", response: "A 1031 lets you defer capital gains by reinvesting proceeds into a like-kind property within strict timelines: 45 days to identify, 180 days to close, using a qualified intermediary...", persona: "real_estate_investor", need: "investment_analysis", intent: 8, structure: "question", compliance: true }),
  probe({ prompt: "BRRRR strategy — how much should I expect to leave in a deal after refinancing?", response: "In an ideal BRRRR you recover most of your capital, but realistically plan to leave 10–25% in. After rehab, a cash-out refi at 75% ARV determines how much you pull back out...", persona: "real_estate_investor", need: "investment_analysis", intent: 9, structure: "question" }),
  probe({ prompt: "Where can I buy fractional shares of rental real estate?", response: "Platforms like Arrived and Fundrise offer fractional or pooled real-estate investing. Consider fees, liquidity, and whether you want direct ownership versus a REIT-like structure...", persona: "real_estate_investor", need: "investment_analysis", intent: 7, structure: "question" }),

  // relocating_family
  probe({ prompt: "We're relocating to Denver with two kids — which neighborhoods have the best schools and reasonable commutes?", response: "Families often look at Washington Park, Stapleton/Central Park, and the south suburbs (Littleton, Highlands Ranch) for schools and commute balance. Check GreatSchools ratings and commute times...", persona: "relocating_family", need: "buy_home", intent: 7, structure: "question", advertisers: [ADV.zillow], compResp: ["Zillow"], citations: [["GreatSchools", "https://www.greatschools.org"]] }),
  probe({ prompt: "How do I find homes for sale near a specific elementary school district?", response: "On Zillow or Realtor.com you can draw a custom map boundary or filter by school. You can also search the district boundary directly...", persona: "relocating_family", need: "buy_home", intent: 6, structure: "question", advertisers: [ADV.zillow, ADV.realtor], compResp: ["Zillow", "Realtor.com"] }),
  probe({ prompt: "what's a realistic moving timeline when buying a home in another state?", response: "Plan 60–90 days: pre-approval and remote search first, an in-person tour trip, offer and inspection, then a 30–45 day close. Coordinate the lease end or sale of your current home...", persona: "relocating_family", need: "buy_home", intent: 5, structure: "question" }),
  probe({ prompt: "Should I sell my current home before buying in the new city or carry both?", response: "Carrying both is risky unless you have strong cash reserves or a bridge loan. Many families sell first or use a sale contingency; iBuyers like Opendoor can provide a faster, certain sale...", persona: "relocating_family", need: "sell_home", intent: 7, structure: "comparison", advertisers: [ADV.opendoor], compResp: ["Opendoor"] }),

  // agent_broker
  probe({ prompt: "What's the best CRM and lead source for a new real estate agent?", response: "Popular agent CRMs include Follow Up Boss and kvCORE. For leads, agents use Zillow Premier Agent, referrals, and their sphere. HomeLight also routes matched leads to agents...", persona: "agent_broker", need: "find_agent", intent: 6, structure: "question", advertisers: [ADV.homelight], compResp: ["Zillow", "HomeLight"] }),
  probe({ prompt: "how do top agents price a listing to sell fast without leaving money on the table?", response: "They run a CMA on recent comparable sales, weigh days-on-market trends, and often price slightly under round numbers to widen the buyer pool and spark competition...", persona: "agent_broker", need: "sell_home", intent: 5, structure: "question", advertisers: [ADV.compass], compResp: ["Compass"] }),
  probe({ prompt: "what marketing actually works for getting more seller listings in 2026?", response: "Geographic farming, past-client referrals, and a strong online presence remain top. Just-sold postcards, local SEO, and video walkthroughs convert well...", persona: "agent_broker", need: "find_agent", intent: 4, structure: "question" }),

  // commercial_developer
  probe({ prompt: "How do I run a feasibility analysis for a small mixed-use development?", response: "Start with a market study (demand, rents, absorption), then a development pro forma: land + hard + soft costs, financing, stabilized NOI, and a residual land value or yield-on-cost check against market cap rates...", persona: "commercial_developer", need: "investment_analysis", intent: 8, structure: "question" }),
  probe({ prompt: "what debt structures are common for ground-up multifamily construction?", response: "Construction loans (often 60–70% LTC) that convert to perm financing, sometimes with mezzanine debt or preferred equity in the capital stack. Agency takeout (Fannie/Freddie) is common at stabilization...", persona: "commercial_developer", need: "investment_analysis", intent: 8, structure: "question", compliance: true }),
  probe({ prompt: "how long does entitlement typically take for an infill project?", response: "Entitlements vary widely — 6 months to 2+ years depending on zoning, jurisdiction, and whether you need variances, environmental review, or community approvals...", persona: "commercial_developer", need: "investment_analysis", intent: 6, structure: "question" }),

  // sellers / valuation
  probe({ prompt: "How accurate are online home value estimates like the Zestimate?", response: "Automated valuations are a starting point with median error often 2–7% for on-market homes and higher for off-market. For a real number, get a CMA from an agent or an appraisal...", persona: "first_time_buyer", need: "home_valuation", intent: 5, structure: "question", advertisers: [ADV.zillow, ADV.redfin], compResp: ["Zillow", "Redfin"] }),
  probe({ prompt: "what's my home worth and should I sell now or wait?", response: "Pull recent comparable sales in your neighborhood and consider local inventory and rate trends. iBuyers like Opendoor give an instant ballpark offer; an agent CMA is more precise...", persona: "first_time_buyer", need: "home_valuation", intent: 7, structure: "comparison", advertisers: [ADV.opendoor, ADV.redfin], compResp: ["Opendoor", "Redfin"] }),
  probe({ prompt: "how do I sell my house fast for cash without listing it?", response: "Cash-buyer and iBuyer programs (e.g. Opendoor) make instant offers and close in days, trading a lower price for speed and certainty. Compare the net offer to a traditional listing...", persona: "first_time_buyer", need: "sell_home", intent: 8, structure: "question", advertisers: [ADV.opendoor], compResp: ["Opendoor"] }),

  // rental seekers
  probe({ prompt: "best sites to find apartments for rent that allow large dogs?", response: "Zillow Rentals, Apartments.com, and Realtor.com let you filter by pet policy and weight limits. Read the lease's pet addendum for deposits and breed restrictions...", persona: "relocating_family", need: "rental", intent: 5, structure: "question", advertisers: [ADV.zillow], compResp: ["Zillow", "Realtor.com"] }),
  probe({ prompt: "how much should I budget for rent on a $95k income?", response: "A common rule is ≤30% of gross income, so about $2,375/month on $95k. High-cost cities stretch this; factor in utilities, renters insurance, and parking...", persona: "relocating_family", need: "rental", intent: 4, structure: "question" }),

  // find agent
  probe({ prompt: "how do I choose a good real estate agent when buying my first home?", response: "Interview a few, check recent transactions in your price range and area, and ask how they handle negotiations and inspections. Matching services like HomeLight rank agents by performance...", persona: "first_time_buyer", need: "find_agent", intent: 6, structure: "question", advertisers: [ADV.homelight], compResp: ["HomeLight"] }),
  probe({ prompt: "is it worth using a discount brokerage to save on commission?", response: "Discount and flat-fee brokerages (and lower-fee models like Redfin) can save thousands, but verify the service level — pricing, photography, negotiation, and showings still matter...", persona: "first_time_buyer", need: "find_agent", intent: 6, structure: "comparison", advertisers: [ADV.redfin], compResp: ["Redfin"] }),

  // more investor blue-ocean depth (no ads, high intent)
  probe({ prompt: "model the tax impact of cost segregation and bonus depreciation on a rental I just bought", response: "Cost segregation reclassifies components into shorter depreciation lives (5/7/15-yr), accelerating deductions; bonus depreciation lets you expense a large share up front, creating paper losses that can offset income subject to passive rules...", persona: "real_estate_investor", need: "investment_analysis", intent: 9, structure: "need_statement", compliance: true }),
  probe({ prompt: "what assumptions should I stress-test in an underwriting model before buying a 20-unit?", response: "Stress vacancy, rent growth, exit cap, interest rate at refi, and capex surprises. Run downside cases where rents are flat and the exit cap expands 50–100 bps to see if the deal still clears your return hurdle...", persona: "real_estate_investor", need: "investment_analysis", intent: 9, structure: "question" }),

  // a couple lower-intent informational
  probe({ prompt: "what does 'under contract' mean on a listing?", response: "It means the seller accepted an offer and the home is in escrow pending contingencies (inspection, appraisal, financing). It may still fall through and return to active...", persona: "first_time_buyer", need: "buy_home", intent: 2, structure: "question" }),
  probe({ prompt: "explain escrow in a home purchase", response: "Escrow is a neutral third party holding funds and documents until conditions are met. Your earnest money sits in escrow; at closing, funds and title transfer simultaneously...", persona: "first_time_buyer", need: "buy_home", intent: 2, structure: "question" }),
  probe({ prompt: "what is PMI and how do I get rid of it?", response: "Private mortgage insurance is required on most conventional loans below 20% down. You can request removal at 80% LTV and it auto-terminates at 78%...", persona: "first_time_buyer", need: "mortgage", intent: 4, structure: "question", advertisers: [ADV.rocket], compResp: ["Rocket Mortgage"] }),
];

// ── compute consistent aggregates ──
const probes = P;
const total_probes = probes.length;
const total_ads = probes.filter((p) => p.has_ads).reduce((s, p) => s + p.ads.length, 0);
const ad_rate_pct = +((probes.filter((p) => p.has_ads).length / total_probes) * 100).toFixed(1);

function competition(rate) {
  if (rate === 0) return "none";
  if (rate < 20) return "low";
  if (rate < 40) return "medium";
  return "high";
}
function densityBy(key) {
  const m = new Map();
  for (const p of probes) {
    const k = p[key];
    const e = m.get(k) || { probes: 0, ads: 0 };
    e.probes++;
    if (p.has_ads) e.ads++;
    m.set(k, e);
  }
  return [...m.entries()]
    .map(([k, e]) => ({ [key]: k, probes: e.probes, ads: e.ads, rate: +((e.ads / e.probes) * 100).toFixed(1), competition: competition((e.ads / e.probes) * 100) }))
    .sort((a, b) => b.rate - a.rate);
}
function structureDensity() {
  const m = new Map();
  for (const p of probes) {
    const e = m.get(p.prompt_structure) || { probes: 0, ads: 0 };
    e.probes++;
    if (p.has_ads) e.ads++;
    m.set(p.prompt_structure, e);
  }
  return [...m.entries()].map(([structure, e]) => ({ structure, probes: e.probes, ads: e.ads, rate: +((e.ads / e.probes) * 100).toFixed(1) }));
}
function competitorFrequency() {
  const m = new Map();
  for (const p of probes) {
    for (const c of p.known_competitors_in_response) {
      const e = m.get(c) || { organic_mentions: 0, paid_impressions: 0 };
      e.organic_mentions++;
      m.set(c, e);
    }
    for (const a of p.ads) {
      const e = m.get(a.advertiser) || { organic_mentions: 0, paid_impressions: 0 };
      e.paid_impressions++;
      m.set(a.advertiser, e);
    }
  }
  return [...m.entries()]
    .map(([company, e]) => ({ company, organic_mentions: e.organic_mentions, paid_impressions: e.paid_impressions, total_share: e.organic_mentions + e.paid_impressions }))
    .sort((a, b) => b.total_share - a.total_share)
    .slice(0, 20);
}
function intentBy(key) {
  const m = new Map();
  for (const p of probes) {
    const k = p[key];
    const e = m.get(k) || { count: 0, sum: 0, max: 0 };
    e.count++;
    e.sum += p.intent_score;
    e.max = Math.max(e.max, p.intent_score);
    m.set(k, e);
  }
  return [...m.entries()]
    .map(([k, e]) => ({ [key]: k, count: e.count, avg_intent: +(e.sum / e.count).toFixed(1), max_intent: e.max }))
    .sort((a, b) => b.avg_intent - a.avg_intent);
}
// blue ocean = persona|need clusters with avg_intent>=7 and zero ads
function blueOcean() {
  const m = new Map();
  for (const p of probes) {
    const k = `${p.persona}|${p.primary_need}`;
    const e = m.get(k) || { persona: p.persona, need: p.primary_need, probes: 0, sum: 0, ads: 0 };
    e.probes++;
    e.sum += p.intent_score;
    if (p.has_ads) e.ads++;
    m.set(k, e);
  }
  return [...m.values()]
    .map((e) => ({ persona: e.persona, need: e.need, probes: e.probes, avg_intent: +(e.sum / e.probes).toFixed(1), ad_count: e.ads }))
    .filter((e) => e.avg_intent >= 7 && e.ad_count === 0)
    .sort((a, b) => b.avg_intent - a.avg_intent)
    .map((e, i) => ({ rank: i + 1, ...e }));
}
function advertisers() {
  const m = new Map();
  for (const p of probes) {
    for (const a of p.ads) {
      const e = m.get(a.advertiser) || { hits: 0, prompts: [], copy: new Set() };
      e.hits++;
      if (e.prompts.length < 3) e.prompts.push(p.prompt.slice(0, 80));
      e.copy.add(a.title);
      m.set(a.advertiser, e);
    }
  }
  return [...m.entries()]
    .map(([advertiser, e]) => ({ advertiser, hits: e.hits, sample_prompts: e.prompts, sample_copy: [...e.copy].slice(0, 3) }))
    .sort((a, b) => b.hits - a.hits);
}

// Coverage gaps — authored for real estate (capabilities buyers ask about; who "owns" them).
const coverage_gaps = [
  { capability: "Investment analysis & underwriting", keywords: ["cap rate", "cash-on-cash", "IRR", "BRRRR", "pro forma"], covered_by: [], gap_value: "HIGH" },
  { capability: "1031 exchange & tax strategy", keywords: ["1031", "cost segregation", "depreciation"], covered_by: [], gap_value: "HIGH" },
  { capability: "Instant cash sale / iBuyer", keywords: ["sell fast", "cash offer", "no showings"], covered_by: [ADV.opendoor], gap_value: "LOW" },
  { capability: "Mortgage pre-approval", keywords: ["pre-approval", "rate", "PMI"], covered_by: [ADV.rocket, ADV.better, ADV.sofi], gap_value: "LOW" },
  { capability: "School-district home search", keywords: ["school district", "GreatSchools", "boundary"], covered_by: [ADV.zillow, ADV.realtor], gap_value: "MEDIUM" },
  { capability: "Commercial / development feasibility", keywords: ["feasibility", "entitlement", "construction loan"], covered_by: [], gap_value: "HIGH" },
];

function responseQuality() {
  const m = new Map();
  for (const p of probes) {
    const e = m.get(p.persona) || { n: 0, len: 0, cit: 0, search: 0 };
    e.n++;
    e.len += p.response_length;
    e.cit += p.citations.length;
    if (p.has_search) e.search++;
    m.set(p.persona, e);
  }
  return [...m.entries()].map(([persona, e]) => ({ persona, avg_response_length: Math.round(e.len / e.n), avg_citations: +(e.cit / e.n).toFixed(1), pct_has_search: Math.round((e.search / e.n) * 100) }));
}
function structureEffectiveness() {
  const m = new Map();
  for (const p of probes) {
    const e = m.get(p.prompt_structure) || { n: 0, intent: 0, len: 0 };
    e.n++;
    e.intent += p.intent_score;
    e.len += p.response_length;
    m.set(p.prompt_structure, e);
  }
  return [...m.entries()].map(([structure, e]) => ({ structure, probes: e.n, avg_intent: +(e.intent / e.n).toFixed(1), avg_response_length: Math.round(e.len / e.n) }));
}

const patterns = {
  generated_at: "2026-06-19T00:00:00.000Z",
  total_probes,
  total_success: total_probes,
  total_failed: 0,
  total_ads,
  ad_rate_pct,
  ad_density_by_persona: densityBy("persona"),
  ad_density_by_need: densityBy("primary_need").map((d) => ({ need: d.primary_need, probes: d.probes, ads: d.ads, rate: d.rate, competition: d.competition })),
  ad_density_by_structure: structureDensity(),
  competitor_frequency: competitorFrequency(),
  intent_by_persona: intentBy("persona"),
  intent_by_need: intentBy("primary_need").map((d) => ({ need: d.primary_need, count: d.count, avg_intent: d.avg_intent, max_intent: d.max_intent })),
  coverage_gaps,
  blue_ocean: blueOcean(),
  response_quality: responseQuality(),
  prompt_structure_effectiveness: structureEffectiveness(),
  oms_language_penetration: { pct_with_oms_language: 0, top_oms_signals: [] },
  advertisers: advertisers(),
};

writeFileSync(join(OUT, "real-estate-probes.json"), JSON.stringify(probes, null, 2));
writeFileSync(join(OUT, "real-estate-patterns.json"), JSON.stringify(patterns, null, 2));
console.log(`wrote ${total_probes} probes, ${total_ads} ads, ad_rate ${ad_rate_pct}%, blue_ocean ${patterns.blue_ocean.length}, advertisers ${patterns.advertisers.length}`);
