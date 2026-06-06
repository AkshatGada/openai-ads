import { config } from "../config.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Minimal OpenAI-compatible chat client for Minimax (Global endpoint).
 * Requests JSON output and returns the parsed object.
 */
export async function chatJson<T>(messages: ChatMessage[]): Promise<T> {
  if (!config.llm.apiKey) {
    throw new Error(
      "MINIMAX_API_KEY is not set. Add it to .env to use the agent (research/planning). " +
        "The Ads API client and executor work without it.",
    );
  }

  const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Minimax LLM error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Minimax returned no content");

  return extractJson<T>(content);
}

/** LLMs sometimes wrap JSON in prose or fences — pull out the JSON object. */
function extractJson<T>(content: string): T {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error(`Could not parse JSON from LLM response:\n${content}`);
  }
}
