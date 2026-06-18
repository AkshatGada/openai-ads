// OMS Analysis Pipeline V2 — Layer 1.5: Classifier
// Labels probes with persona, need, intent_score, competitor mentions.
// Pure code, no LLM.

import type { ProbeRecordV2 } from "./types-v2.js";

const KNOWN_COMPETITORS = [
  "Circle", "Coinbase", "Fireblocks", "Paxos", "Stripe", "Cybrid", "Conduit",
  "BlindPay", "Ripple", "Stellar", "ZeroHash", "BitPay", "Wyre", "MoonPay",
  "Transak", "Ramp", "Chainalysis", "Elliptic", "CipherTrace", "Mastercard",
  "Robinhood", "BestMoney", "MongoDB", "Anakin", "Tinfoil",
];

const OMS_SIGNALS = [
  "fiatToCrypto", "cryptoToFiat", "virtual account", "deposit code",
  "idempotency key", "quote lock", "endorsement", "webhook event",
  "custodial wallet", "sub-2-second", "native USDC", "sandbox environment",
  "ACH auto-convert", "Polygon Chain", "stablecoin.*settlement",
];

const PERSONA_PATTERNS: Array<{ pattern: RegExp; persona: string }> = [
  { pattern: /remit|send.*money.*home|cross.border.*send|cash.*pickup.*recipient/i, persona: "remittance_founder" },
  { pattern: /marketplace|seller.*pay|pay.*seller|gig.*economy|creator.*platform/i, persona: "marketplace_cto" },
  { pattern: /neobank|fintech.*app|fintech.*platform|payment.*platform|banking.*app/i, persona: "fintech_pm" },
  { pattern: /bank.*settlement|enterprise.*payment|institution.*infra|corporate.*treasury/i, persona: "enterprise_buyer" },
];

const NEED_PATTERNS: Array<{ pattern: RegExp; need: string }> = [
  { pattern: /remit|send.*home|cross.border.*family|cross.border.*consumer|remittance.*corridor/i, need: "remittance" },
  { pattern: /pay.*seller|pay.*sellers|disburse|payout|pay.*contractor|pay.*creator|payroll/i, need: "disbursement" },
  { pattern: /virtual.*account|dollar.*account|named.*account|real.*USD.*account|dedicated.*account/i, need: "virtual_accounts" },
  { pattern: /onramp|off.ramp|cash.*in|cash.*out|fund.*wallet|cash.*deposit|cash.*pickup|ATM.*code/i, need: "onramp" },
  { pattern: /vs\b|compare|alternativ|Circle|Coinbase|Fireblocks|which.*(better|best|option)/i, need: "comparison" },
  { pattern: /API.*integrat|REST.*endpoint|webhook|sandbox|developer.*experience|SDK/i, need: "developer_eval" },
];

function classifyPersona(prompt: string): string {
  for (const { pattern, persona } of PERSONA_PATTERNS) {
    if (pattern.test(prompt)) return persona;
  }
  return "unknown";
}

function classifyNeed(prompt: string): string {
  for (const { pattern, need } of NEED_PATTERNS) {
    if (pattern.test(prompt)) return need;
  }
  return "unknown";
}

function scoreIntent(prompt: string): number {
  let score = 0;
  if (prompt.split(/\s+/).length > 80) score += 2;
  if (/ACH|SEPA|PIX|UPI|SPEI|Fedwire|RTP|wire|bank.*transfer/i.test(prompt)) score += 2;
  if (/KYC|AML|regulat|complian|audit.*trail/i.test(prompt)) score += 2;
  if (/\bAPI\b/i.test(prompt)) score += 2;
  if (/integrat|build|connect|endpoint|webhook|REST/i.test(prompt)) score += 1;
  if (/vs\b|compare|alternativ|which.*(better|best|option)/i.test(prompt)) score += 2;
  if (/\$\d|percent|fee|cost|margin/i.test(prompt)) score += 2;
  if (KNOWN_COMPETITORS.some(c => new RegExp(c, "i").test(prompt))) score += 2;
  if (/thousands|hundreds.*thousands|million|5000|10[0,]\d{3}/i.test(prompt)) score += 2;
  if (/Q3|Q4|this year|in 2026|soon|now|launch/i.test(prompt)) score += 1;
  if (prompt.trim().endsWith("?")) score += 1;

  // Boost for specificity: prompt mentions a specific industry or role
  if (/neobank|fintech|bank|marketplace|remittance|payroll|platform|startup/i.test(prompt)) score += 1;

  // Boost for technical depth: mentions specific rails, currencies, or protocols
  if (/USDC|USDT|stablecoin|fiat.*crypto|crypto.*fiat|on.*chain|blockchain|settlement/i.test(prompt)) score += 2;

  return Math.min(score, 10);
}

function findCompetitors(text: string): string[] {
  return KNOWN_COMPETITORS.filter(c => new RegExp(`\\b${c}\\b`, "i").test(text));
}

function findOMSSignals(text: string): string[] {
  return OMS_SIGNALS.filter(s => new RegExp(s, "i").test(text));
}

function classifyStructure(prompt: string): string {
  if (/^(i need|we need|looking for|i'm looking|im looking)/i.test(prompt.trim())) return "need_statement";
  if (/^(what|which|how|does anyone|is there|can anyone)/i.test(prompt.trim())) return "question";
  if (/vs\b|compare|alternativ|circle|coinbase|fireblocks/i.test(prompt)) return "comparison";
  return "mixed";
}

export function classifyProbes(probes: ProbeRecordV2[]): ProbeRecordV2[] {
  for (const p of probes) {
    if (p.status === "failed") continue;

    const prompt = p.prompt;
    const response = p.chatgpt_response;

    p.persona = classifyPersona(prompt);
    p.primary_need = classifyNeed(prompt);
    p.intent_score = scoreIntent(prompt);
    p.known_competitors_in_prompt = findCompetitors(prompt);
    p.known_competitors_in_response = findCompetitors(response);
    p.contains_oms_language = OMS_SIGNALS.some(s => new RegExp(s, "i").test(prompt));
    p.oms_signals_found = findOMSSignals(prompt);
    p.prompt_structure = classifyStructure(prompt);
    p.contains_api = /\bAPI\b/i.test(prompt);
    p.contains_compliance = /KYC|AML|regulat|complian/i.test(prompt);
    p.contains_competitor = KNOWN_COMPETITORS.some(c => new RegExp(c, "i").test(prompt));
    p.word_count = prompt.split(/\s+/).length;
  }

  return probes;
}
