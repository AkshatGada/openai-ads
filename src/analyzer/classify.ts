import type { PromptFeatures } from "./types.js";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  crypto: ["crypto", "bitcoin", "ethereum", "solana", "defi", "nft", "token", "exchange", "blockchain", "web3", "wallet", "liquidity pool", "amm", "staking", "yield", "on-chain", "dex", "cex", "binance", "coinbase", "kraken", "bybit", "okx", "kucoin", "gate.io", "mexc", "uniswap", "pancakeswap", "dydx", "rpc", "mining", "stablecoin", "usdc", "usdt", "dao"],
  finance: ["finance", "bank", "credit", "loan", "mortgage", "heloc", "insurance", "investing", "investment", "broker", "brokerage", "retirement", "ira", "401k", "savings", "checking", "cd ", "deposit", "tax", "dividend", "portfolio", "wealth", "fidelity", "schwab", "vanguard", "robinhood", "sofi", "chime", "paypal", "stripe", "plaid", "ach", "kyc", "aml", "compliance", "forex", "fx", "currency pair", "commodities", "futures", "trading", "equities", "stock", "options trading", "capital gains"],
  dev_tools: ["api", "sdk", "webhook", "endpoint", "rest", "graphql", "openapi", "swagger", "microservice", "gateway", "ci/cd", "testing", "monitoring", "observability", "logging", "deployment", "devops", "infrastructure", "database", "mongodb", "postgres", "mysql", "redis", "docker", "kubernetes", "serverless", "cloud", "coding", "ide", "code editor", "llm", "ai inference", "embeddings", "scraping", "proxy"],
  marketing: ["email", "sms", "crm", "seo", "analytics", "social media", "marketing", "automation", "campaign", "newsletter"],
  travel: ["flight", "hotel", "booking", "travel", "car rental", "weather", "maps", "geocoding", "logistics"],
  healthcare: ["health", "medical", "telemedicine", "patient", "pharmacy", "fitness", "hipaa", "diagnostic", "blood work", "prescription"],
};

const STOP_WORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "shall", "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they", "them", "this", "that", "these", "those", "in", "on", "at", "to", "for", "of", "with", "from", "by", "about", "as", "into", "through", "during", "before", "after", "over", "under", "and", "but", "or", "not", "no", "yes", "so", "if", "than", "then", "also", "just", "now", "very", "too", "more", "some", "any", "all", "both", "each", "every", "which", "what", "who", "how", "where", "why", "when", "up", "down", "out", "off", "here", "there", "need", "want", "get", "got", "use", "like", "good", "best", "looking", "im", "ive", "one", "via", "across", "per", "its"]);

export function classify(prompt: string): PromptFeatures {
  const lower = prompt.toLowerCase();

  // Tokenize and extract keywords
  const tokens = lower
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  const keywords = [...new Set(tokens)];

  // Detect topics
  const topics: string[] = [];
  for (const [topic, topicKwds] of Object.entries(TOPIC_KEYWORDS)) {
    let hits = 0;
    for (const kw of topicKwds) {
      if (lower.includes(kw)) hits++;
    }
    if (hits >= 2) topics.push(topic);
  }
  // Also check for n-gram matches
  for (const [topic, topicKwds] of Object.entries(TOPIC_KEYWORDS)) {
    if (topics.includes(topic)) continue;
    for (const kw of topicKwds) {
      if (kw.includes(" ") && lower.includes(kw)) {
        topics.push(topic);
        break;
      }
    }
  }

  // Detect intent type
  let intent_type: PromptFeatures["intent_type"] = "unknown";
  if (/vs\.?|compare|comparison|which (one )?is better|better than|best.*for|or\b.*\bwhich/i.test(prompt)) {
    intent_type = "comparison";
  } else if (/\bi need\b|\bi'm looking\b|\bhelp me find\b/i.test(prompt)) {
    intent_type = "need";
  } else if (/\brecommend\b|\bsuggest\b/i.test(prompt)) {
    intent_type = "recommendation";
  } else if (/\bhow (do|to|can|does|should|would)\b/i.test(prompt)) {
    intent_type = "how-to";
  }

  return {
    keywords,
    topics: topics.length > 0 ? topics : ["uncategorized"],
    intent_type,
    contains_api: /\bapi\b/i.test(prompt),
    contains_comparison: /vs\.? |compare|comparison|which (one )?is better|better than/i.test(prompt),
    contains_brand: /\bbinance\b|\bcoinbase\b|\bkraken\b|\brobinhood\b|\bfidelity\b|\bschwab\b|\bstripe\b|\bplaid\b|\bmongodb\b|\bopenai\b|\banthropic\b|\bgemini\b|\bshopify\b|\bamazon\b|\bgoogle\b/i.test(prompt),
    word_count: prompt.split(/\s+/).length,
  };
}
