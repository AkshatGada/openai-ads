import { config } from "../config.js";
import type { ListResponse } from "../types.js";

export class AdsApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "AdsApiError";
  }
}

interface RequestOpts {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  // Multipart form for file uploads.
  form?: FormData;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const url = new URL(config.ads.baseUrl + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.ads.apiKey}`,
    Accept: "application/json",
  };

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // fetch sets the multipart boundary header itself
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method: opts.method ?? "GET", headers, body });
  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new AdsApiError(res.status, json ?? text, `Ads API ${opts.method ?? "GET"} ${path} → ${res.status}`);
  }
  return json as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const adsClient = {
  get: <T>(path: string, query?: RequestOpts["query"]) => request<T>(path, { method: "GET", query }),
  // For endpoints needing repeated array params (`fields[]=a&fields[]=b`); pass a ready query string.
  getRaw: <T>(pathWithQuery: string) => request<T>(pathWithQuery, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", form }),
};

/** Build a query string using `key[]=` array syntax for array values (OpenAI Ads style). */
export function buildQuery(params: Record<string, string | number | string[] | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const item of v) sp.append(`${k}[]`, item);
    else sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Walk all pages of a cursor-paginated list endpoint. */
export async function listAll<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const out: T[] = [];
  let after: string | undefined;
  do {
    const page = await adsClient.get<ListResponse<T>>(path, { ...query, limit: 100, after });
    out.push(...page.data);
    after = page.has_more ? page.last_id ?? undefined : undefined;
  } while (after);
  return out;
}
