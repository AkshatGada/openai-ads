// ── Oxylabs ChatGPT Scraper types ──

export interface ScraperRequest {
  prompt: string;
  search?: boolean;
  geo_location?: string;
  parse?: boolean;
}

export interface AdCard {
  title: string;
  body: string;
  target_url: string;
  advertiser?: string;
  image_url?: string;
}

export interface ScraperResult {
  prompt: string;
  geo_location?: string;
  timestamp: string;
  llm_model?: string;
  response_text?: string;
  links: string[];
  citations: Array<{ url: string; text?: string }>;
  ads: AdCard[];
  raw_html?: string;
}

export interface OxylabsResponse {
  results: Array<{
    content: {
      prompt: string;
      llm_model?: string;
      response_text?: string;
      markdown_text?: string;
      links?: string[];
      citations?: Array<{ url: string; text?: string }>;
      parse_status_code: number;
    };
    created_at: string;
    updated_at: string;
    url: string;
    job_id: string;
    status_code: number;
  }>;
}

// ── VerseOdin AI Engine Scraper types ──

export interface VerseOdinResponse {
  name: string;
  engine: string;
  prompt: string;
  country: string;
  answer_text: string;
  answer_html: string;
  citations: Array<{ url: string; title: string }>;
  scrape_url: string;
  took_ms: number;
  quota_used_today: number;
  quota_remaining_today: number;
  quota_resets_at: string;
}
