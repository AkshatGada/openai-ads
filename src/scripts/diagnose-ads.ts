// Diagnostic: save raw ChatGPT HTML for inspection
import { writeFile } from "node:fs/promises";
import { probeAds } from "../scraper/client.js";

async function main() {
  console.log("Sending ad probe for prompt: 'best AI tools for workflow automation'...");
  const { html } = await probeAds("best AI tools for workflow automation", "United States");

  const outPath = "chatgpt-raw.html";
  await writeFile(outPath, html);
  console.log(`Saved ${html.length} chars to ${outPath}`);
}

main().catch(console.error);
