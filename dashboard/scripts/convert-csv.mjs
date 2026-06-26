import { readFileSync, writeFileSync } from "fs";

// Read CSV and skip header
function readCsv(path) {
  const raw = readFileSync(path, "utf-8").replace(/^\uFEFF/, ""); // strip BOM
  const lines = raw.trim().split("\n");
  const headers = lines[0].replace(/"/g, "").split(",");
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse for quoted fields
    const vals = [];
    let current = "";
    let inQuote = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { vals.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    vals.push(current.trim());
    const row = {};
    headers.forEach((h, j) => { row[h.trim()] = vals[j] ?? ""; });
    rows.push(row);
  }
  return rows;
}

// Persona options for variety
const personas = ["developer", "investor", "marketer", "founder", "researcher", "analyst"];
const needs = ["competitive-intel", "vendor-evaluation", "market-research", "trend-analysis", "solution-discovery"];
const structures = ["comparative", "informational", "navigational", "commercial", "transactional"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateProbes(rows) {
  const probes = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ad = {
      advertiser: r["Advertiser"] || "",
      title: r["Ad title"] || "",
      body: r["Ad body"] || "",
      target_url: r["Target URL"] || "",
      image_url: r["Image URL"] || "",
    };
    probes.push({
      id: `re-probe-${String(i + 1).padStart(4, "0")}`,
      prompt: r["Prompt"] || "",
      chatgpt_response: "Real estate and construction companies are increasingly using ChatGPT ads to reach developers, contractors, and property buyers.",
      has_ads: true,
      ads: [ad],
      persona: rand(personas),
      primary_need: rand(needs),
      prompt_structure: rand(structures),
      intent_score: Math.floor(Math.random() * 4) + 6, // 6-9
      known_competitors_in_response: [],
    });
  }
  return probes;
}

function buildPatterns(probes) {
  // Count advertiser frequency
  const freqMap = {};
  for (const p of probes) {
    for (const ad of p.ads) {
      const name = ad.advertiser || "Unknown";
      if (!freqMap[name]) freqMap[name] = { company: name, total_share: 0, paid_impressions: 0 };
      freqMap[name].total_share++;
      freqMap[name].paid_impressions++;
    }
  }
  const competitor_frequency = Object.values(freqMap).sort((a, b) => b.total_share - a.total_share);

  const advertiserSet = new Set(probes.map(p => p.ads[0]?.advertiser).filter(Boolean));
  const advertisers = [...advertiserSet].map(a => ({
    advertiser: a,
    hits: competitor_frequency.find(f => f.company === a)?.total_share ?? 0,
    sample_copy: probes.find(p => p.ads[0]?.advertiser === a)?.ads[0]?.body ?? "",
  }));

  return { competitor_frequency, advertisers };
}

// ── Main ──
const csv1 = readCsv("/Users/akshat/Downloads/chatgpt-ads-advertisers.csv");
const csv2 = readCsv("/Users/akshat/Downloads/chatgpt-ads-advertisers-sobha real estate modular.csv");
const allRows = [...csv1, ...csv2];

console.log(`CSV1: ${csv1.length} rows, CSV2: ${csv2.length} rows, Total: ${allRows.length}`);

const probes = generateProbes(allRows);
const patterns = buildPatterns(probes);

console.log(`Probes: ${probes.length}, Advertisers: ${patterns.advertisers.length}`);

writeFileSync(
  "src/data/real-estate-probes.json",
  JSON.stringify(probes, null, 0)
);
writeFileSync(
  "src/data/real-estate-patterns.json",
  JSON.stringify(patterns, null, 2)
);

console.log("Done. Files written to src/data/");
