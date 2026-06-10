#!/usr/bin/env node
// Multi-persona batch: each line of input is "persona_id|prompt".
// Probes all personas in parallel (one per persona; concurrent within
// a single persona is serialized by the per-persona lock).
//
// Usage: pnpm personas --multi-batch <file>
//        echo "crypto-trader|What exchange has the best API?" | pnpm personas --multi-batch -

import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { stdin } from "node:process";
import { PersonaManager } from "./manager.js";
import { ChatGPTClient } from "./chatgpt/client.js";
import { asPersonaId, ProbeResult } from "./types.js";
import { getLogger } from "./observability/log.js";

async function readLines(path: string): Promise<string[]> {
  if (path === "-") {
    return new Promise<string[]>((resolve, reject) => {
      const lines: string[] = [];
      const rl = createInterface({ input: stdin, crlfDelay: Infinity });
      rl.on("line", (l) => lines.push(l));
      rl.on("close", () => resolve(lines));
      rl.on("error", reject);
    });
  }
  return new Promise<string[]>((resolve, reject) => {
    const lines: string[] = [];
    const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
    rl.on("line", (l) => lines.push(l));
    rl.on("close", () => resolve(lines));
    rl.on("error", reject);
  });
}

export async function runMultiBatch(
  pm: PersonaManager,
  filePath: string,
  opts: { concurrency?: number } = {},
): Promise<void> {
  const log = getLogger().child({ op: "multi-batch" });
  const concurrency = opts.concurrency ?? 5;
  const lines = (await readLines(filePath)).filter((l) => l.trim().length > 0);
  const jobs = lines
    .map((line) => {
      const [id, ...rest] = line.split("|");
      if (!id || rest.length === 0) return null;
      return { id: asPersonaId(id.trim()), prompt: rest.join("|").trim() };
    })
    .filter((x): x is { id: import("./types.js").PersonaId; prompt: string } => x !== null);

  log.info({ total: jobs.length, concurrency }, "starting multi-persona batch");
  let done = 0;
  let totalAds = 0;
  let failed = 0;

  // Process with a simple worker pool. Each worker pulls from the queue.
  let nextIdx = 0;
  async function worker(workerId: number): Promise<void> {
    while (true) {
      const i = nextIdx++;
      if (i >= jobs.length) return;
      const job = jobs[i]!;
      try {
        const result = await runOne(pm, job.id, job.prompt);
        totalAds += result.ads.length;
        if (result.ads.length > 0) {
          for (const ad of result.ads) {
            process.stdout.write(`\n  🔴 ${ad.advertiser}: "${ad.title}"`);
          }
        }
      } catch (e) {
        failed++;
        process.stdout.write(`\n  ✗ ${job.id}: ${e instanceof Error ? e.message.slice(0, 60) : e}`);
      } finally {
        done++;
        process.stdout.write(`\r  ${done}/${jobs.length} `);
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, (_, i) => worker(i)),
  );

  process.stdout.write("\n");
  log.info({ done, failed, totalAds }, "multi-batch complete");
  console.log(`\nDONE. ${done} jobs, ${failed} failed, ${totalAds} ads surfaced.`);
}

async function runOne(
  pm: PersonaManager,
  id: import("./types.js").PersonaId,
  prompt: string,
): Promise<ProbeResult> {
  const client = (await pm.getClient(id)) as ChatGPTClient;
  return client.probe(prompt);
}

// CLI entry point (used when called directly as `tsx src/personas/multi-batch.ts`)
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2] ?? "-";
  const masterKey = process.env.PERSONA_MASTER_KEY;
  if (!masterKey || !/^[0-9a-fA-F]{64}$/.test(masterKey)) {
    console.error("PERSONA_MASTER_KEY missing or invalid");
    process.exit(1);
  }
  const pm = new PersonaManager({ masterKeyHex: masterKey });
  await pm.init();
  await runMultiBatch(pm, filePath);
}
