import { chatJson } from "./llm.js";
import { RESEARCH_SYSTEM } from "./prompts.js";
import { BusinessProfileSchema, type BusinessProfile } from "../types.js";

export interface BusinessInput {
  url: string;
  details: string;
}

/** Optionally fetch the business homepage so the LLM has real content to work from. */
async function fetchSiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return "";
    const html = await res.text();
    // Crude text extraction — strip tags, collapse whitespace, cap length.
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return "";
  }
}

export async function research(input: BusinessInput): Promise<BusinessProfile> {
  const siteText = await fetchSiteText(input.url);
  const userContent = [
    `Business website: ${input.url}`,
    `Owner-provided details:\n${input.details}`,
    siteText ? `\nWebsite content (extracted):\n${siteText}` : "\n(Website content could not be fetched.)",
  ].join("\n");

  const raw = await chatJson<unknown>([
    { role: "system", content: RESEARCH_SYSTEM },
    { role: "user", content: userContent },
  ]);

  const parsed = BusinessProfileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Research output failed validation: ${parsed.error.message}`);
  }
  // Ensure the URL is the canonical one we were given.
  return { ...parsed.data, url: input.url };
}
