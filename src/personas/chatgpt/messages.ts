// Server-Sent Events parser. Ported from waylaidwanderer/node-chatgpt-api
// and the canonical acheong08/ChatGPT V1 client.
//
// Each event is `data: {json}\n\n` or `data: [DONE]\n\n`.
// Mid-stream errors arrive as `data: {"error": ...}`.
// Yields typed SseEvent objects.

import { SseEvent } from "./types.js";

/**
 * Parse a byte stream of SSE data into typed events.
 * Yields one event per `data: ` line. Caller is responsible for any
 * cumulative-vs-delta text handling.
 */
export async function* parseSSE(
  body: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
): AsyncGenerator<SseEvent, void, void> {
  const decoder = new TextDecoder("utf-8");
  const reader =
    "getReader" in body
      ? (body as ReadableStream<Uint8Array>).getReader()
      : null;

  if (reader) {
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = drainBuffer(buffer);
      buffer = events.rest;
      for (const e of events.events) yield e;
    }
    if (buffer.length > 0) {
      for (const e of drainBuffer(buffer + "\n\n").events) yield e;
    }
    return;
  }

  // Node ReadableStream fallback
  const node = body as NodeJS.ReadableStream;
  for await (const chunk of node) {
    const text = typeof chunk === "string" ? chunk : decoder.decode(chunk as Uint8Array);
    const events = drainBuffer(text);
    for (const e of events.events) yield e;
  }
}

function drainBuffer(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  // SSE events are separated by \n\n. A single chunk may carry many.
  let start = 0;
  for (;;) {
    const sep = buffer.indexOf("\n\n", start);
    if (sep < 0) return { events, rest: buffer.slice(start) };
    const block = buffer.slice(start, sep);
    start = sep + 2;
    const evt = parseBlock(block);
    if (evt) events.push(evt);
  }
}

function parseBlock(block: string): SseEvent | null {
  // SSE block can have `event:`, `id:`, `retry:`, `data:` lines.
  // We only care about `data:`.
  const lines = block.split("\n");
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  const data = dataLines.join("\n");
  if (data === "[DONE]") return { done: true };
  try {
    return JSON.parse(data) as SseEvent;
  } catch {
    return null;
  }
}
