import type { AdCard } from "../scraper/types.js";

export interface PersonaCredentials {
  email: string;
  password: string;
  mailTmId: string;
  mailTmToken: string;
  createdAt: string;
}

export interface Persona {
  name: string;
  description: string;
  seedPrompts: string[];
  credentials?: PersonaCredentials;
}

export interface ProfileMeta {
  name: string;
  path: string;
  created: string;
  conversations: number;
  lastUsed: string;
  description: string;
  hasCredentials: boolean;
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
  loginIfNeeded?: boolean;
}
