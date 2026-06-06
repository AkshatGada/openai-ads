import type { AdCard } from "../scraper/types.js";

export interface Persona {
  name: string;
  description: string;
  seedPrompts: string[];
}

export interface ProfileMeta {
  name: string;
  path: string;
  created: string;
  conversations: number;
  lastUsed: string;
  description: string;
}

export interface PlaywrightProbeResult {
  prompt: string;
  html: string;
  ads: AdCard[];
  persona: string;
  timestamp: string;
}

export interface PlaywrightProbeOptions {
  persona?: string;
  headless?: boolean;
  waitForAds?: boolean;
  adTimeoutMs?: number;
  newChat?: boolean;
}
