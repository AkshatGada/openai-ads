// Health check loop logic. Pure (testable); the CLI entry point is in `./cli.ts`.

import { getLogger } from "../observability/log.js";
import { updateIndex } from "../storage.js";
import { readEnrichedIndex } from "../registry.js";
import { ChatGPTClient } from "../chatgpt/client.js";
import { PersonaManager } from "../manager.js";
import { SessionHealth } from "../types.js";
import { buildReport } from "./score.js";

export interface DaemonOptions {
  pm: PersonaManager;
  intervalMs?: number;
  /** Restrict to a specific set of persona ids. */
  onlyIds?: string[];
  /** Log handler. Default: getLogger(). */
  log?: ReturnType<typeof getLogger>;
}

export class HealthDaemon {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(public readonly opts: DaemonOptions) {}

  start(): void {
    const interval = this.opts.intervalMs ?? 5 * 60_000; // 5 min default
    const log = this.opts.log ?? getLogger();
    log.info({ intervalMs: interval }, "health daemon starting");
    this.tick().catch((e) => log.error({ err: e }, "tick failed"));
    this.timer = setInterval(() => {
      this.tick().catch((e) => log.error({ err: e }, "tick failed"));
    }, interval);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Run a single probe pass over all known personas. */
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const log = this.opts.log ?? getLogger();
    try {
      const idx = await readEnrichedIndex();
      const ids = this.opts.onlyIds ?? Object.keys(idx.personas);
      for (const id of ids) {
        try {
          await this.probeOne(id);
        } catch (e) {
          log.warn({ persona: id, err: e }, "probe failed");
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async probeOne(id: string): Promise<void> {
    const log = (this.opts.log ?? getLogger()).child({ persona: id });
    const persona = await this.opts.pm.load(id as any);
    const auth = await this.opts.pm.loadAuth(id as any);
    const client = new ChatGPTClient(persona, auth);
    let valid = false;
    let health: SessionHealth = auth.health;
    let accountState = auth.accountState;
    let plan = auth.plan;
    try {
      const v = await client.validateSession();
      valid = v.valid;
      health = valid ? "healthy" : "session_expired";
      try {
        const me = await client.getMe();
        plan = me.plan;
        auth.plan = plan;
        await this.opts.pm.persistAuth(id as any, auth);
      } catch {
        /* /me may fail; keep the old plan */
      }
      try {
        accountState = await client.getAccountState();
        auth.accountState = accountState;
        await this.opts.pm.persistAuth(id as any, auth);
      } catch {
        /* /accounts/check may fail; keep the old state */
      }
      auth.health = health;
      auth.lastValidatedAt = new Date().toISOString();
      await this.opts.pm.persistAuth(id as any, auth);
    } catch (e: any) {
      const code = e?.code ?? "unknown";
      if (code === "cf_blocked") health = "cf_blocked";
      else if (code === "session_expired") health = "session_expired";
      else if (code === "banned") health = "banned";
      else if (code === "rate_limited") health = "rate_limited";
      else health = "unknown";
      auth.health = health;
      auth.lastValidatedAt = new Date().toISOString();
      await this.opts.pm.persistAuth(id as any, auth);
    }

    const report = buildReport({
      persona,
      auth,
      lastSessionValid: valid,
      lastCfBlocked: health === "cf_blocked",
      sessionSuccessWindow: valid ? 1 : 0,
      recentAdYield: persona.operational.recentAdYield,
    });

    persona.operational.healthScore = report.healthScore;
    persona.operational.lastUsed = new Date().toISOString();
    await this.opts.pm.persistPersona(persona);

    await updateIndex((idx) => ({
      ...idx,
      personas: {
        ...idx.personas,
        [id]: {
          ...idx.personas[id]!,
          health,
          healthScore: report.healthScore,
          lastUsed: persona.operational.lastUsed,
          plan,
        },
      },
    }));

    log.info(
      { valid, health, accountState, plan, score: report.healthScore, issues: report.issues },
      "probe complete",
    );
  }
}
