#!/usr/bin/env node
// `pnpm personas:health` — runs the health daemon in the foreground.
// Stops cleanly on SIGINT / SIGTERM.

import "dotenv/config";
import { PersonaManager } from "../manager.js";
import { ChatGPTClient } from "../chatgpt/client.js";
import { BrowserPersonaRunner } from "../browser/runner.js";
import { HealthDaemon } from "./loop.js";
import { getLogger } from "../observability/log.js";

async function main(): Promise<void> {
  const log = getLogger().child({ svc: "personas-health" });
  const k = process.env.PERSONA_MASTER_KEY;
  if (!k || !/^[0-9a-fA-F]{64}$/.test(k)) {
    log.error("PERSONA_MASTER_KEY missing or invalid; cannot start daemon");
    process.exit(1);
  }
  const pm = new PersonaManager({
    masterKeyHex: k,
    clientFactory: (persona, auth) => new ChatGPTClient(persona, auth),
    browserFactory: () => new BrowserPersonaRunner({ headless: true }),
  });
  await pm.init();

  const interval = parseInt(process.env.PERSONAS_HEALTH_INTERVAL_MS ?? "300000", 10);
  const daemon = new HealthDaemon({ pm, intervalMs: interval, log });
  daemon.start();

  const stop = () => {
    log.info("stopping");
    daemon.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  log.info({ intervalMs: interval }, "daemon running; Ctrl-C to stop");
}

main().catch((e) => {
  console.error("health daemon error:", e);
  process.exit(1);
});
