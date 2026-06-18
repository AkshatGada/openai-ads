// OMS Analysis Pipeline V2 — Layer 1: HTML Cleaner
// Extracts structured data from VerseOdin HTML probe files.
// Pure code, no LLM.

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProbeRecordV2 } from "./types-v2.js";
import { extractAdsFromHtml } from "../scraper/client.js";

const SRC_DIRS = ["scraper-outputs-oms-loop1", "scraper-outputs-oms-loop2"];
const OUT_FILE = "data/oms-probes-v2.json";

function sanitizePrompt(filename: string): string {
  return filename.replace(/^\d{3}_/, "").replace(/\.html$/, "").replace(/_+/g, " ").trim();
}

function extractResponse(html: string): string {
  const markers = ["ChatGPT said:", "ChatGPT said"];
  let start = -1;
  for (const m of markers) {
    const idx = html.indexOf(m);
    if (idx > 0) { start = idx + m.length; break; }
  }
  if (start < 0) return "";

  let text = html.slice(start);
  // Strip scripts and styles
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  // Preserve paragraph breaks
  text = text.replace(/<p[^>]*>/gi, "\n\n");
  text = text.replace(/<br[^>]*>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode entities
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x201[4c]/g, "-").replace(/&#x201[8c]/g, "'");
  // Collapse whitespace
  text = text.replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();
  return text.slice(0, 5000);
}

function extractCitations(html: string): Array<{ url: string; title: string }> {
  const citations: Array<{ url: string; title: string }> = [];
  const seen = new Set<string>();
  const re = /href="(https?:\/\/[^"\s]+)"[^>]*>([^<]{5,100})<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const url = match[1]!;
    if (!seen.has(url) && !url.includes("chatgpt.com") && !url.includes("openai.com")) {
      seen.add(url);
      citations.push({ url, title: match[2]!.trim() });
    }
  }
  return citations.slice(0, 20);
}

function validate(probe: Partial<ProbeRecordV2>): { status: "ok" | "failed"; reason?: string } {
  if (!probe.prompt || probe.prompt.length < 20) return { status: "failed", reason: "prompt too short" };
  if ((probe.response_length ?? 0) < 50) return { status: "failed", reason: "response too short" };
  if ((probe.html_size_kb ?? 0) < 100) return { status: "failed", reason: "HTML too small (likely error page)" };
  if (probe.chatgpt_response?.includes("Log in") && probe.chatgpt_response?.includes("Sign up")) {
    return { status: "failed", reason: "auth page returned" };
  }
  return { status: "ok" };
}

export async function cleanProbes(dirs = SRC_DIRS): Promise<ProbeRecordV2[]> {
  const records: ProbeRecordV2[] = [];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      continue;
    }

    const files = (await readdir(dir)).filter(f => f.endsWith(".html")).sort();
    const batch = dir.includes("loop2") ? "L2" : "L1";

    for (const file of files) {
      const seqMatch = file.match(/^(\d{3})_/);
      const id = (batch + "-" + (seqMatch ? seqMatch[1]! : file.slice(0, 3)));
      const prompt = sanitizePrompt(file);
      const htmlPath = join(dir, file);

    let html: string;
    try {
      html = await readFile(htmlPath, "utf8");
    } catch {
      records.push({
        id, prompt, status: "failed", failed_reason: "unreadable file",
        chatgpt_response: "", citations: [], response_length: 0, has_search: false,
        ads: [], has_ads: false, advertiser_name: null, ad_copy: null, html_size_kb: 0,
        persona: "unknown", primary_need: "unknown", intent_score: 0,
        known_competitors_in_prompt: [], known_competitors_in_response: [],
        contains_oms_language: false, oms_signals_found: [], prompt_structure: "unknown",
        contains_api: false, contains_compliance: false, contains_competitor: false, word_count: 0,
      });
      continue;
    }

    const chatgptResponse = extractResponse(html);
    const citations = extractCitations(html);
    const rawAds = extractAdsFromHtml(html);
    const ads = rawAds.map(a => ({ advertiser: a.advertiser ?? "Unknown", title: a.title, body: a.body }));

    const validation = validate({
      prompt,
      response_length: chatgptResponse.length,
      html_size_kb: html.length / 1024,
      chatgpt_response: chatgptResponse,
    });

    records.push({
      id,
      prompt,
      status: validation.status,
      failed_reason: validation.reason,
      chatgpt_response: chatgptResponse,
      citations,
      response_length: chatgptResponse.length,
      has_search: citations.length > 0,
      ads,
      has_ads: ads.length > 0,
      advertiser_name: ads[0]?.advertiser ?? null,
      ad_copy: ads[0]?.title ?? null,
      html_size_kb: html.length / 1024,
      persona: "unknown", primary_need: "unknown", intent_score: 0,
      known_competitors_in_prompt: [], known_competitors_in_response: [],
      contains_oms_language: false, oms_signals_found: [], prompt_structure: "unknown",
      contains_api: false, contains_compliance: false, contains_competitor: false, word_count: 0,
    });
  }

  // outer for (dir) closes here
  }

  // Sort by id
  records.sort((a, b) => a.id.localeCompare(b.id));

  // Save
  if (!existsSync("data")) await mkdir("data", { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(records, null, 2));

  const ok = records.filter(r => r.status === "ok").length;
  console.log(`  Cleaned ${records.length} probes (${ok} ok, ${records.length - ok} failed) → ${OUT_FILE}`);

  return records;
}
