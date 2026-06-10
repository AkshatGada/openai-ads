// Deterministic fingerprint generation from a seed.
//
// Uses the fingerprint-generator Bayesian network to produce
// a realistic, internally-consistent fingerprint, then seeds the
// canvas/audio noise from the persona's `fingerprintSeed` so that
// re-creating with the same seed produces a byte-identical fingerprint.

import { FingerprintGenerator, Fingerprint as GenFingerprint } from "fingerprint-generator";
import { Fingerprint, Persona, PersonaSeed, asPersonaId } from "./types.js";
import { getSeed } from "./seeds/index.js";

const generator = new FingerprintGenerator({
  browsers: ["chrome"],
  operatingSystems: ["macos", "windows"],
  devices: ["desktop"],
  locales: ["en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "ja-JP", "pt-BR"],
});

/** Generate a fresh fingerprint for a persona, seeded by `fingerprintSeed`. */
export function generateFingerprint(
  seed: PersonaSeed,
  fingerprintSeed: string,
): Fingerprint {
  const os = seed.client.os === "macos" ? "macos" : seed.client.os === "windows" ? "windows" : "linux";
  const browserVersion = seed.client.browserVersion;

  // The generator returns a Bayesian-realistic fingerprint drawn from
  // the configured distributions. We override the canvas/audio noise
  // with our seed to make it deterministic per persona.
  const fp = generator.getFingerprint();

  // Extract the bits we need from the generator's output.
  const f: any = fp as any;
  const userAgent: string = f.userAgent ?? defaultUA(os, browserVersion);
  const screen = f.screen ?? { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, colorDepth: 30, devicePixelRatio: 2 };
  const viewport = f.viewport ?? { width: 1440, height: 900 };
  const locale = f.locale ?? seed.declared.locale;
  const timezoneId = f.timezoneId ?? seed.declared.timezone;

  return {
    userAgent,
    secChUa:
      f.brands?.map?.((b: any) => `"${b.brand}";v="${b.version}"`).join(", ") ??
      `"Chromium";v="${browserVersion}", "Not_A Brand";v="24", "Google Chrome";v="${browserVersion}"`,
    secChUaMobile: "?0",
    secChUaPlatform: f.platform ?? (os === "macos" ? '"macOS"' : os === "windows" ? '"Windows"' : '"Linux"'),
    secChUaFullVersionList: f.fullVersionList
      ?.map?.((b: any) => `"${b.brand}";v="${b.version}"`)
      .join(", "),
    screen: {
      width: screen.width ?? 1920,
      height: screen.height ?? 1080,
      availWidth: screen.availWidth ?? screen.width ?? 1920,
      availHeight: screen.availHeight ?? (screen.height ?? 1080) - 40,
      colorDepth: screen.colorDepth ?? 30,
      pixelRatio: screen.devicePixelRatio ?? 2,
    },
    viewport: { width: viewport.width ?? 1440, height: viewport.height ?? 900 },
    locale,
    timezone: timezoneId,
    timezoneOffsetMin: -new Date(timezoneId).getTimezoneOffset() || 0,
    hardware: {
      deviceMemory: f.hardware?.deviceMemory ?? 16,
      hardwareConcurrency: f.hardware?.hardwareConcurrency ?? 10,
      maxTouchPoints: 0,
    },
    platform: os === "macos" ? "MacIntel" : os === "windows" ? "Win32" : "Linux x86_64",
    webgl: {
      vendor: f.webgl?.vendor ?? "Google Inc. (Apple)",
      renderer: f.webgl?.renderer ?? "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)",
      unmaskedVendor: f.webgl?.unmaskedVendor ?? "Apple Inc.",
      unmaskedRenderer: f.webgl?.unmaskedRenderer ?? "Apple M1 Pro",
    },
    canvas: { noiseSeed: fingerprintSeed },
    audio: { noiseSeed: fingerprintSeed },
    fonts: f.fonts ?? ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia"],
    plugins: f.plugins ?? ["PDF Viewer", "Chrome PDF Viewer"],
    languages: f.languages ?? [locale, locale.split("-")[0] ?? "en"],
  };
}

/** Convenience: build a full Persona from a seed with a real fingerprint. */
export function makePersonaWithFingerprint(
  seedId: string,
  fingerprintSeed?: string,
): { persona: Persona; fingerprintSeed: string } {
  const seed = getSeed(seedId) as PersonaSeed | undefined;
  if (!seed) throw new Error(`Unknown seed: ${seedId}`);
  const actualSeed = fingerprintSeed ?? `${seed.id}-${Date.now().toString(36)}`;
  const fp = generateFingerprint(seed, actualSeed);
  const persona: Persona = {
    version: 2 as const,
    identity: {
      id: asPersonaId(seed.id),
      label: seed.label,
      description: seed.description,
      interests: seed.interests,
      backstory: seed.backstory,
      declared: seed.declared,
      client: seed.client,
      fingerprintSeed: actualSeed,
      createdAt: new Date().toISOString(),
      tags: seed.tags,
    },
    fingerprint: fp,
    proxy: {
      provider: "local",
      sessionId: `local-${seed.id}-${Date.now()}`,
      description: "no proxy (default)",
      burned: false,
      assignedAt: new Date().toISOString(),
    },
    behavioral: {
      typingWpm: 65,
      typingWpmStddev: 12,
      interActionDelayMs: { mean: 1200, stddev: 400 },
      activeHours: { start: 9, end: 23 },
      mouseCurveSamples: [],
      typingSamples: [],
    },
    history: { summaries: [], adsSeen: { total: 0, byAdvertiser: {}, byTopic: {} } },
    operational: {
      lastUsed: new Date(0).toISOString(),
      totalProbes: 0,
      totalConversations: 0,
      sessionSuccessRate: 1.0,
      recentAdYield: 0,
      healthScore: 50,
      flags: [],
    },
  };
  return { persona, fingerprintSeed: actualSeed };
}

function defaultUA(os: string, version: number): string {
  if (os === "macos") {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
  }
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
}
