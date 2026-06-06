import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ActionPlan, BusinessProfile, InsightsRow } from "../types.js";

const RUNS_DIR = join(process.cwd(), "runs");

export interface LoopRecord {
  loop: number;
  timestamp: string;
  // What the agent decided and why.
  plan: ActionPlan;
  // Which actions were actually executed (after approval), with resulting ids.
  executed: Array<{ action: string; ok: boolean; result?: unknown; error?: string }>;
  // Performance snapshot taken at the START of this loop (what the agent reasoned over).
  insightsSnapshot: InsightsRow[];
}

export interface ProjectState {
  profile: BusinessProfile;
  // Stable refs the agent assigned ("main_campaign") → real Ads API ids.
  refs: Record<string, string>;
  loops: LoopRecord[];
}

function fileFor(projectId: string): string {
  return join(RUNS_DIR, `${projectId}.json`);
}

export async function loadState(projectId: string): Promise<ProjectState | null> {
  const f = fileFor(projectId);
  if (!existsSync(f)) return null;
  return JSON.parse(await readFile(f, "utf8")) as ProjectState;
}

export async function saveState(projectId: string, state: ProjectState): Promise<void> {
  if (!existsSync(RUNS_DIR)) await mkdir(RUNS_DIR, { recursive: true });
  await writeFile(fileFor(projectId), JSON.stringify(state, null, 2), "utf8");
}

/** Compact, token-friendly history the planner reads each loop. */
export function summarizeHistory(state: ProjectState): string {
  if (state.loops.length === 0) return "No prior loops. This is the first planning cycle.";
  return state.loops
    .map((l) => {
      const totals = l.insightsSnapshot.reduce(
        (a: { impressions: number; clicks: number; spend: number }, r) => ({
          impressions: a.impressions + (r.impressions ?? 0),
          clicks: a.clicks + (r.clicks ?? 0),
          spend: a.spend + (r.spend ?? 0),
        }),
        { impressions: 0, clicks: 0, spend: 0 },
      );
      const ctr = totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";
      const cpc = totals.clicks ? (totals.spend / totals.clicks).toFixed(2) : "—";
      const acted = l.executed.map((e) => `${e.action}${e.ok ? "" : " (FAILED)"}`).join("; ");
      return `Loop ${l.loop} (${l.timestamp}): impressions=${totals.impressions}, clicks=${totals.clicks}, spend=$${totals.spend.toFixed(2)}, CTR=${ctr}%, CPC=$${cpc}. Actions: ${acted || "none"}. Rationale: ${l.plan.reasoning}`;
    })
    .join("\n");
}
