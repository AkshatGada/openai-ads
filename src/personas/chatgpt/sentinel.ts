// Sentinel proof-of-work computation. Ported from PawanOsman/ChatGPT
// (src/app.ts → GenerateProofToken). SHA3-512, ~1M iterations on a
// modern CPU per token. Difficulty is a hex string; the proof is
// valid when sha3(seed + base64(json(config))).hex() starts with a
// substring <= difficulty.

import { createHash } from "node:crypto";

export interface ProofOfWorkInput {
  seed: string;
  /** Hex string, e.g. "00000" means the hash must start with 5 zero hex chars. */
  difficulty: string;
  userAgent: string;
  /** navigator.hardwareConcurrency. */
  cores: number;
  /** "1920x1080" — screen dimensions. */
  screen: string;
}

export interface ProofOfWorkOutput {
  /** The proof token. Sent as `openai-sentinel-proof-token`. */
  proofToken: string;
  iterations: number;
  elapsedMs: number;
}

export async function computeProofOfWork(
  input: ProofOfWorkInput,
): Promise<ProofOfWorkOutput> {
  const { seed, difficulty, userAgent, cores, screen } = input;
  const parseTime = Math.floor(Date.now() / 1000);
  const diffLen = difficulty.length;

  // config: [coreScreenString, parseTime, ??, nonce, userAgent]
  // The 3rd element is fixed (looks like a constant in the JS reference impls).
  const FIXED = 4294705152;
  const start = Date.now();

  for (let i = 0; i < 1_000_000; i++) {
    const config: [string, number, number, number, string] = [
      `${cores}|${screen}`,
      parseTime,
      FIXED,
      i,
      userAgent,
    ];
    const base = Buffer.from(JSON.stringify(config)).toString("base64");
    const hash = createHash("sha3-512").update(seed + base).digest();
    if (hash.toString("hex").substring(0, diffLen) <= difficulty) {
      return {
        proofToken: "gAAAAAB" + base,
        iterations: i + 1,
        elapsedMs: Date.now() - start,
      };
    }
  }
  throw new Error(
    `proof-of-work: exceeded iteration budget (difficulty=${difficulty})`,
  );
}
