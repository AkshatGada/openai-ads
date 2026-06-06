import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`);
  }
  return v.trim();
}

function optional(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : fallback;
}

export const config = {
  ads: {
    apiKey: required("OPENAI_ADS_API_KEY"),
    baseUrl: optional("OPENAI_ADS_BASE_URL", "https://api.ads.openai.com/v1"),
  },
  llm: {
    // Empty key is allowed at load time; the planner will error clearly if used without a key.
    apiKey: process.env.MINIMAX_API_KEY?.trim() ?? "",
    baseUrl: optional("MINIMAX_BASE_URL", "https://api.minimax.io/v1"),
    model: optional("MINIMAX_MODEL", "MiniMax-Text-01"),
  },
  oxylabs: {
    username: optional("OXYLABS_USERNAME", ""),
    password: optional("OXYLABS_PASSWORD", ""),
    baseUrl: optional("OXYLABS_BASE_URL", "https://realtime.oxylabs.io/v1/queries"),
    proxy: {
      username: optional("OXYLABS_PROXY_USERNAME", optional("OXYLABS_USERNAME", "")),
      password: optional("OXYLABS_PROXY_PASSWORD", optional("OXYLABS_PASSWORD", "")),
      server: optional("OXYLABS_PROXY_SERVER", "http://pr.oxylabs.io:7777"),
    },
  },
  // When false, the executor creates objects as `paused` and never spends. Flip with ADS_LIVE_MODE=true.
  liveMode: optional("ADS_LIVE_MODE", "false").toLowerCase() === "true",
} as const;

export type Config = typeof config;
