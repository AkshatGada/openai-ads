// ── Ad Intelligence Analyzer types ──

export interface AdRecord {
  advertiser: string;
  title: string;
  body: string;
}

export interface PromptFeatures {
  keywords: string[];
  topics: string[];
  intent_type: "comparison" | "need" | "recommendation" | "how-to" | "unknown";
  contains_api: boolean;
  contains_comparison: boolean;
  contains_brand: boolean;
  word_count: number;
}

export interface ProbeRecord {
  id: string;
  batch: string;
  seq: number;
  prompt: string;
  timestamp: string | null;
  html_path: string;
  html_size: number;
  has_ads: boolean;
  ads: AdRecord[];
  chatgpt_response: string;
  features: PromptFeatures;
}

export interface TopicSummary {
  topic: string;
  probes: number;
  ads: number;
  density: number;        // 0-100
  competition: "none" | "low" | "medium" | "high";
  commercial_intent: "high" | "medium" | "low";
}

export interface AdvertiserSummary {
  advertiser: string;
  hits: number;
  copies_seen: string[];   // unique ad titles
  topics_seen: string[];   // which topics they appeared on
  campaign_style: "single_broad" | "multi_dynamic" | "unknown";
}

export interface AnalysisReport {
  generated_at: string;
  total_probes: number;
  total_ads: number;
  total_advertisers: number;
  overall_fill_rate: number;
  topics: TopicSummary[];
  advertisers: AdvertiserSummary[];
  trigger_patterns: TriggerPattern[];
  blue_ocean: string[];     // ranked list of topics: description
}

export interface TriggerPattern {
  rule: string;
  confidence: "high" | "medium" | "low";
  matches: number;
  description: string;
}
