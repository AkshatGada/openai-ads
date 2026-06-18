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

/** Decode common HTML entities in scraped responses for plain-text rendering. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
