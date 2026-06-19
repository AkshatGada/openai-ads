// Display helpers. Numbers are ledger-grade (tabular) by CSS; these just format.

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const num = (n: number) => n.toLocaleString("en-US");

/** Persona/need slugs → human labels: "real_estate_investor" → "Real Estate Investor". */
export const humanize = (slug: string) =>
  slug
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export type Competition = "none" | "low" | "medium" | "high";
export const asCompetition = (s: string): Competition =>
  s === "none" || s === "low" || s === "medium" || s === "high" ? s : "low";

export type GapValue = "LOW" | "MEDIUM" | "HIGH";
export const asGap = (s: string): GapValue =>
  s === "LOW" || s === "MEDIUM" || s === "HIGH" ? s : "LOW";

/** Decode HTML entities in scraped responses for plain-text rendering.
 *  Handles entities both with and without trailing semicolons (the scraper
 *  sometimes drops them), plus common named entities and stray artifacts. */
export function decodeEntities(s: string): string {
  return s
    // Numeric hex entities — with or without semicolon (e.g. &#x2192; or &#x2192)
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    // Numeric decimal entities — with or without semicolon
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    // Named entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Scraping artifacts: mangled em/en-dashes
    .replace(/-;/g, "—")
    // Collapse runs of 3+ spaces (formatting whitespace from scrape)
    .replace(/ {3,}/g, "  ");
}
