// Verbatim mirror of the data contract from the backend analyzer:
//   /Users/agada/openai-ads/src/analyzer/types-v2.ts
// Keep in sync — analyzer output (or a future API) must satisfy these shapes.

export interface ProbeRecordV2 {
  id: string;
  prompt: string;
  status: "ok" | "failed";
  failed_reason?: string;

  // From cleaner
  chatgpt_response: string;
  citations: Array<{ url: string; title: string }>;
  response_length: number;
  has_search: boolean;
  ads: Array<{ advertiser: string; title: string; body: string }>;
  has_ads: boolean;
  advertiser_name: string | null;
  ad_copy: string | null;
  html_size_kb: number;

  // From classifier
  persona: string;
  primary_need: string;
  intent_score: number;
  known_competitors_in_prompt: string[];
  known_competitors_in_response: string[];
  contains_oms_language: boolean;
  oms_signals_found: string[];
  prompt_structure: string;
  contains_api: boolean;
  contains_compliance: boolean;
  contains_competitor: boolean;
  word_count: number;
}

export interface PatternSummary {
  generated_at: string;
  total_probes: number;
  total_success: number;
  total_failed: number;
  total_ads: number;
  ad_rate_pct: number;

  ad_density_by_persona: Array<{ persona: string; probes: number; ads: number; rate: number; competition: string }>;
  ad_density_by_need: Array<{ need: string; probes: number; ads: number; rate: number; competition: string }>;
  ad_density_by_structure: Array<{ structure: string; probes: number; ads: number; rate: number }>;

  competitor_frequency: Array<{ company: string; organic_mentions: number; paid_impressions: number; total_share: number }>;

  intent_by_persona: Array<{ persona: string; count: number; avg_intent: number; max_intent: number }>;
  intent_by_need: Array<{ need: string; count: number; avg_intent: number; max_intent: number }>;

  coverage_gaps: Array<{ capability: string; keywords: string[]; covered_by: string[]; gap_value: string }>;
  blue_ocean: Array<{ rank: number; persona: string; need: string; probes: number; avg_intent: number; ad_count: number }>;

  response_quality: Array<{ persona: string; avg_response_length: number; avg_citations: number; pct_has_search: number }>;
  prompt_structure_effectiveness: Array<{ structure: string; probes: number; avg_intent: number; avg_response_length: number }>;

  oms_language_penetration: { pct_with_oms_language: number; top_oms_signals: Array<{ signal: string; count: number }> };

  advertisers: Array<{ advertiser: string; hits: number; sample_prompts: string[]; sample_copy: string[] }>;
}

// Frontend convenience: a loaded industry = its aggregates + raw probes.
export interface IndustryData {
  patterns: PatternSummary;
  probes: ProbeRecordV2[];
}

export type AdCard = ProbeRecordV2["ads"][number];
