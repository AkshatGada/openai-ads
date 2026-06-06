import { readdir, readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProbeRecord, AdRecord } from "./types.js";
import { classify } from "./classify.js";
import { extractAdsFromHtml } from "../scraper/client.js";

const OUTPUT_DIRS = [
  "scraper-outputs-crypto",
  "scraper-outputs-finance",
  "scraper-outputs-crypto-api",
  "scraper-outputs-finance-api",
];

const LOG_FILES: Record<string, string> = {
  crypto: "batch-probe-crypto.log",
  finance: "batch-probe-finance.log",
  "crypto-api": "batch-probe-crypto-api.log",
  "finance-api": "batch-probe-finance-api.log",
};

interface LogEntry {
  seq: number;
  timestamp: string;
  ads: number;
  error?: string;
}

/** Parse a batch log file to extract timestamps per probe sequence number. */
function parseLog(logPath: string): Map<number, LogEntry> {
  const map = new Map<number, LogEntry>();
  if (!existsSync(logPath)) return map;

  const text = readFileSync(logPath, "utf8");
  let lastTs: string | null = null;

  // Each entry looks like:
  // [01/50] · html=480453
  // [34/50]   ads=1 html=522240
  // We need timestamps — not present in current logs. Use file mtime as fallback.

  for (const line of text.split("\n")) {
    const match = line.match(/\[(\d+)\/50\]\s*(.*)/);
    if (!match) continue;

    const seq = parseInt(match[1]!, 10);
    const rest = match[2]!;
    const adsMatch = rest.match(/ads=(\d+)/);
    const ads = adsMatch ? parseInt(adsMatch[1]!, 10) : 0;
    const error = rest.includes("✗") ? rest.replace(/✗\s*/, "").trim() : undefined;

    map.set(seq, {
      seq,
      timestamp: lastTs ?? "",
      ads,
      error,
    });
  }

  return map;
}

function batchNameFromDir(dir: string): string {
  if (dir.includes("crypto-api")) return "crypto-api";
  if (dir.includes("finance-api")) return "finance-api";
  if (dir.includes("crypto")) return "crypto";
  if (dir.includes("finance")) return "finance";
  return dir;
}

/** Extract ChatGPT's conversational response from HTML. */
function extractResponse(html: string): string {
  // Find the ChatGPT answer — starts after "ChatGPT said" or similar marker
  const markers = ["ChatGPT said:", "ChatGPT said"];
  let start = -1;
  for (const m of markers) {
    const idx = html.indexOf(m);
    if (idx > 0) { start = idx + m.length; break; }
  }
  if (start < 0) return "";

  let text = html.slice(start);
  // Strip tags
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#x27;/g, "'");
  text = text.replace(/\s+/g, " ").trim();
  return text.slice(0, 2000); // cap at 2K chars
}

export async function ingest(): Promise<ProbeRecord[]> {
  const records: ProbeRecord[] = [];
  const existingIds = new Set<string>();

  for (const dir of OUTPUT_DIRS) {
    if (!existsSync(dir)) continue;

    const batch = batchNameFromDir(dir);
    const logPath = LOG_FILES[batch] ?? null;
    const logEntries = logPath ? parseLog(logPath) : new Map();

    // Get mtime of the directory as fallback timestamp
    let fallbackTs: string | null = null;
    try {
      const s = await stat(dir);
      fallbackTs = s.mtime.toISOString();
    } catch { /* ignore */ }

    const files = (await readdir(dir)).filter((f) => f.endsWith(".html"));

    for (const file of files) {
      const seqMatch = file.match(/^(\d+)_/);
      if (!seqMatch) continue;
      const seq = parseInt(seqMatch[1]!, 10);

      // Build unique ID
      const id = `${batch}-${String(seq).padStart(2, "0")}`;
      if (existingIds.has(id)) continue;
      existingIds.add(id);

      const htmlPath = join(dir, file);
      let html: string;
      try {
        html = await readFile(htmlPath, "utf8");
      } catch {
        // Corrupt or unreadable — skip
        continue;
      }

      const htmlSize = html.length;
      const rawAds = extractAdsFromHtml(html);
      const ads: AdRecord[] = rawAds.map((a) => ({
        advertiser: a.advertiser ?? "Unknown",
        title: a.title,
        body: a.body,
      }));
      const chatgptResponse = extractResponse(html);

      // Parse prompt from filename: remove prefix number + underscores → spaces
      const promptRaw = file.replace(/^\d+_/, "").replace(/\.html$/, "");
      const prompt = promptRaw.replace(/_+/g, " ").trim();

      // Timestamp: log entry > file mtime > dir mtime
      let timestamp: string | null = null;
      try {
        const s = await stat(htmlPath);
        timestamp = s.mtime.toISOString();
      } catch { /* ignore */ }
      if (fallbackTs && !timestamp) timestamp = fallbackTs;

      records.push({
        id,
        batch,
        seq,
        prompt,
        timestamp,
        html_path: htmlPath,
        html_size: htmlSize,
        has_ads: ads.length > 0,
        ads,
        chatgpt_response: chatgptResponse,
        features: classify(prompt),
      });
    }
  }

  // Sort by batch then seq
  records.sort((a, b) => a.batch.localeCompare(b.batch) || a.seq - b.seq);

  // Write to disk
  if (!existsSync("data")) await mkdir("data", { recursive: true });
  await writeFile("data/probes.json", JSON.stringify(records, null, 2));

  return records;
}
