import { config } from "../config.js";
import type { ScraperRequest, OxylabsResponse, ScraperResult, AdCard } from "./types.js";

export class ScraperError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ScraperError";
  }
}

function authHeader(): string {
  if (!config.oxylabs.username || !config.oxylabs.password) {
    throw new Error("Oxylabs credentials not set. Add OXYLABS_USERNAME and OXYLABS_PASSWORD to .env");
  }
  return "Basic " + Buffer.from(`${config.oxylabs.username}:${config.oxylabs.password}`).toString("base64");
}

/** Send a single prompt to ChatGPT via Oxylabs and return parsed content or raw HTML. */
export async function probeChatGPT(
  prompt: string,
  opts: { search?: boolean; geo_location?: string; parse?: boolean; session_id?: string } = {},
): Promise<{ content: unknown; rawHtml: string }> {
  const { search = true, geo_location, parse = true, session_id } = opts;

  const body: Record<string, unknown> = {
    source: "chatgpt",
    prompt,
    parse,
    search,
    ...(geo_location ? { geo_location } : {}),
    ...(session_id ? { session_id } : {}),
  };

  const res = await fetch(config.oxylabs.baseUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ScraperError(res.status, `Oxylabs returned non-JSON: ${text.slice(0, 500)}`);
  }

  if (!res.ok) {
    throw new ScraperError(res.status, `Oxylabs error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = json as OxylabsResponse;
  const result = data.results?.[0];
  if (!result) throw new ScraperError(res.status, "Oxylabs returned no results");

  // When parse=false, the content IS the raw HTML
  const rawHtml = typeof result.content === "string" ? result.content : "";

  return { content: result.content, rawHtml };
}

/** Probe ChatGPT with parse=true: returns the conversational response. */
export async function probeContent(
  prompt: string,
  geo_location?: string,
): Promise<ScraperResult> {
  const { content } = await probeChatGPT(prompt, { search: true, geo_location, parse: true });
  const c = content as OxylabsResponse["results"][0]["content"];

  return {
    prompt: c.prompt ?? prompt,
    geo_location,
    timestamp: new Date().toISOString(),
    llm_model: c.llm_model,
    response_text: c.response_text,
    links: c.links ?? [],
    citations: c.citations ?? [],
    ads: [],
  };
}

/** Probe ChatGPT with parse=false: returns raw HTML for ad extraction. */
export async function probeAds(
  prompt: string,
  geo_location?: string,
  session_id?: string,
): Promise<{ prompt: string; html: string; ads: AdCard[] }> {
  const { rawHtml } = await probeChatGPT(prompt, { search: true, geo_location, parse: false, session_id });
  const ads = extractAdsFromHtml(rawHtml);
  return { prompt, html: rawHtml, ads };
}

/** Parse ad card elements from raw ChatGPT page HTML. */
export function extractAdsFromHtml(html: string): AdCard[] {
  const ads: AdCard[] = [];

  // Find all ad card markers
  const marker = 'data-ad-card-root="true"';
  let searchFrom = 0;

  while (true) {
    const adIdx = html.indexOf(marker, searchFrom);
    if (adIdx < 0) break;
    searchFrom = adIdx + marker.length;

    // Get 1000 chars after marker for title/body extraction
    const after = html.slice(adIdx, adIdx + 1000);

    // Extract title: <p> with font-medium in class
    const titleMatch = after.match(/<p[^>]*class="[^"]*font-medium[^"]*"[^>]*>([^<]+)<\/p>/);
    const title = titleMatch?.[1]?.trim() ?? "";

    // Extract body: <p> with line-clamp-2 in class
    const bodyMatch = after.match(/<p[^>]*line-clamp-2[^>]*>([^<]+)<\/p>/);
    const body = bodyMatch?.[1]?.trim() ?? "";

    // Look backwards to find the nearest "Sponsored" label and advertiser name
    const before = html.slice(Math.max(0, adIdx - 10000), adIdx);
    // The Sponsored label is <p class="...">Sponsored</p>
    const sponsoredMatch = before.match(/<p[^>]*>Sponsored<\/p>\s*$/s);
    if (!sponsoredMatch) {
      // Try broader: find the last occurrence of "Sponsored" in a <p> tag
      const spMatchGlobal = [...before.matchAll(/<p[^>]*>Sponsored<\/p>/gs)];
      if (spMatchGlobal.length === 0) {
        ads.push({ title, body, target_url: "", advertiser: "" });
        continue;
      }
      const lastSponsored = spMatchGlobal[spMatchGlobal.length - 1]!;
      const sponsoredIdx = lastSponsored.index!;
      const beforeSponsored = before.slice(0, sponsoredIdx);
      const nameMatches = [...beforeSponsored.matchAll(/<p[^>]*>([^<]+)<\/p>/g)];
      const advertiserName = nameMatches.length > 0 ? nameMatches[nameMatches.length - 1]![1]?.trim() ?? "" : "";
      ads.push({ title, body, target_url: "", advertiser: advertiserName });
    } else {
      const sponsoredIdx = sponsoredMatch.index!;
      const beforeSponsored = before.slice(0, sponsoredIdx);
      const nameMatches = [...beforeSponsored.matchAll(/<p[^>]*>([^<]+)<\/p>/g)];
      const advertiserName = nameMatches.length > 0 ? nameMatches[nameMatches.length - 1]![1]?.trim() ?? "" : "";
      ads.push({ title, body, target_url: "", advertiser: advertiserName });
    }
  }

  return ads;
}

/** Quick check: does this HTML contain ad cards? */
export function hasAds(html: string): boolean {
  return html.includes('data-ad-card-root="true"') && html.includes("Sponsored");
}

/** Count ad cards in HTML. */
export function countAds(html: string): number {
  return (html.match(/data-ad-card-root="true"/g) || []).length;
}

/** Probe ChatGPT at scale: send N prompts, return content responses in parallel batches. */
export async function probeBatch(
  prompts: string[],
  opts: { concurrency?: number; geo_location?: string } = {},
): Promise<ScraperResult[]> {
  const { concurrency = 5, geo_location } = opts;
  const results: ScraperResult[] = [];

  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = prompts.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((p) => probeContent(p, geo_location).catch((e) => ({
        prompt: p,
        geo_location,
        timestamp: new Date().toISOString(),
        links: [],
        citations: [],
        ads: [],
        response_text: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
      } satisfies ScraperResult))),
    );
    results.push(...batchResults);
    // Small delay between batches to avoid rate limiting
    if (i + concurrency < prompts.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}

/** Probe ChatGPT for ads at scale: send N prompts, extract ads from raw HTML. */
export async function probeAdsBatch(
  prompts: string[],
  opts: { concurrency?: number; geo_location?: string } = {},
): Promise<Array<{ prompt: string; ads: AdCard[]; html: string }>> {
  const { concurrency = 3, geo_location } = opts;
  const results: Array<{ prompt: string; ads: AdCard[]; html: string }> = [];

  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = prompts.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((p) => probeAds(p, geo_location).catch((e) => ({
        prompt: p,
        ads: [] as AdCard[],
        html: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
      }))),
    );
    results.push(...batchResults);
    if (i + concurrency < prompts.length) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return results;
}
