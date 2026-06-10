// VerseOdin AI Engine Scraper client
// Supports ChatGPT, Gemini, Claude — returns both text + full rendered HTML in a single call.
// Ad extraction reuses the same extractAdsFromHtml from the Oxylabs client.

import { config } from "../config.js";
import type { VerseOdinResponse, AdCard, ScraperResult } from "./types.js";
import { extractAdsFromHtml } from "./client.js";

export class VerseOdinError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "VerseOdinError";
  }
}

/** Send a single prompt to an AI engine via VerseOdin. Returns full response. */
export async function probeAI(
  prompt: string,
  opts: { engine?: string; country?: string; name?: string } = {},
): Promise<VerseOdinResponse> {
  const { engine = "chatgpt", country = "US", name = "probe" } = opts;

  const res = await fetch(config.verseodin.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.verseodin.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, engine, prompt, country }),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new VerseOdinError(res.status, `VerseOdin returned non-JSON (${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const err = json as { error?: string; retry_after_seconds?: number };
    throw new VerseOdinError(res.status, err.error ?? `VerseOdin error ${res.status}`);
  }

  return json as VerseOdinResponse;
}

/** Probe ChatGPT via VerseOdin — returns HTML with ads extracted. */
export async function probeAds(
  prompt: string,
  country = "US",
): Promise<{ prompt: string; html: string; ads: AdCard[] }> {
  const data = await probeAI(prompt, { engine: "chatgpt", country });
  const ads = extractAdsFromHtml(data.answer_html);
  return { prompt, html: data.answer_html, ads };
}

/** Probe ChatGPT via VerseOdin — returns text response and citations (no ad detection). */
export async function probeContent(
  prompt: string,
  country = "US",
): Promise<ScraperResult> {
  const data = await probeAI(prompt, { engine: "chatgpt", country });

  return {
    prompt: data.prompt,
    geo_location: data.country,
    timestamp: new Date().toISOString(),
    response_text: data.answer_text,
    links: data.citations.map((c) => c.url),
    citations: data.citations.map((c) => ({ url: c.url, text: c.title })),
    ads: [],
    raw_html: data.answer_html,
  };
}

/** Probe ChatGPT at scale: send N prompts sequentially. */
export async function probeBatch(
  prompts: string[],
  opts: { concurrency?: number; country?: string } = {},
): Promise<ScraperResult[]> {
  const { country = "US" } = opts;
  const results: ScraperResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]!;
    process.stdout.write(`  [${i + 1}/${prompts.length}] ${prompt.slice(0, 60)}... `);
    try {
      const result = await probeContent(prompt, country);
      console.log(`${result.response_text ? result.response_text.length + " chars" : "no text"}`);
      results.push(result);
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message.slice(0, 60) : e}`);
      results.push({
        prompt,
        geo_location: country,
        timestamp: new Date().toISOString(),
        links: [],
        citations: [],
        ads: [],
        response_text: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    if (i < prompts.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

/** Probe ChatGPT for ads at scale: send N prompts, extract ads from HTML. */
export async function probeAdsBatch(
  prompts: string[],
  opts: { concurrency?: number; country?: string } = {},
): Promise<Array<{ prompt: string; ads: AdCard[]; html: string }>> {
  const { country = "US" } = opts;
  const results: Array<{ prompt: string; ads: AdCard[]; html: string }> = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]!;
    try {
      const result = await probeAds(prompt, country);
      results.push(result);
    } catch (e) {
      results.push({ prompt, ads: [], html: `ERROR: ${e instanceof Error ? e.message : String(e)}` });
    }
    if (i < prompts.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

/** Quick check: does this HTML contain ad cards? */
export function hasAds(html: string): boolean {
  return html.includes('data-ad-card-root="true"') && html.includes("Sponsored");
}

/** Count ad cards in HTML. */
export function countAds(html: string): number {
  return (html.match(/data-ad-card-root="true"/g) || []).length;
}
