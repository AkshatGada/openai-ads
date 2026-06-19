import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { IndustryData, ProbeRecordV2 } from "../lib/types";
import IntentMeter from "../components/primitives/IntentMeter";
import Drawer from "../components/primitives/Drawer";
import { decodeEntities, humanize } from "../lib/format";
import { EASE_OUT, DUR } from "../motion/transitions";

type SortKey = "rank" | "intent";

function rankScore(p: ProbeRecordV2): number {
  return p.intent_score + (p.has_ads ? 5 : 0) + p.ads.length;
}

export default function PromptsView({ data }: { data: IndustryData }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");
  const [adsOnly, setAdsOnly] = useState(false);
  const [selected, setSelected] = useState<ProbeRecordV2 | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.probes
      .filter((p) => (adsOnly ? p.has_ads : true))
      .filter((p) => (q ? p.prompt.toLowerCase().includes(q) : true))
      .map((p) => ({ p, score: rankScore(p) }))
      .sort((a, b) => (sort === "rank" ? b.score - a.score : b.p.intent_score - a.p.intent_score));
  }, [data.probes, query, sort, adsOnly]);

  const maxScore = Math.max(1, ...rows.map((r) => r.score));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts…"
          aria-label="Search prompts"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 font-sans text-sm text-text caret-accent outline-none placeholder:text-text-faint focus:border-accent"
        />
        <Toggle active={adsOnly} onClick={() => setAdsOnly((v) => !v)}>Ads only</Toggle>
        <Toggle active={sort === "rank"} onClick={() => setSort("rank")}>By value</Toggle>
        <Toggle active={sort === "intent"} onClick={() => setSort("intent")}>By intent</Toggle>
      </div>

      <motion.div
        key={`${query}|${sort}|${adsOnly}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.fast, ease: EASE_OUT }}
        className="flex flex-col gap-1"
      >
        {rows.map(({ p, score }, i) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-md border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <span
              className="absolute inset-y-0 left-0 bg-accent/[0.06]"
              style={{ width: `${(score / maxScore) * 100}%` }}
            />
            <span className="tnum relative z-10 w-7 shrink-0 font-mono text-xs text-text-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block truncate font-sans text-sm text-text">{p.prompt}</span>
              <span className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-faint">
                {humanize(p.persona)} · {humanize(p.primary_need)}
              </span>
            </span>
            <span className="relative z-10 shrink-0">
              <IntentMeter value={p.intent_score} animate={false} />
            </span>
            <span className="relative z-10 w-14 shrink-0 text-right">
              {p.has_ads ? (
                <span className="font-mono text-xs text-accent">{p.ads.length} ad{p.ads.length > 1 ? "s" : ""}</span>
              ) : (
                <span className="font-mono text-xs text-text-faint">—</span>
              )}
            </span>
          </button>
        ))}
        {rows.length === 0 && (
          <p className="py-12 text-center font-mono text-xs text-text-faint">No matching prompts.</p>
        )}
      </motion.div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? humanize(selected.primary_need) : ""}>
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">{humanize(selected.persona)}</span>
              <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">{selected.prompt_structure}</span>
              {selected.has_ads && <span className="rounded-sm border border-accent/40 bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">ad surfaced</span>}
            </div>
            <div>
              <p className="label mb-1 text-text-faint">Prompt</p>
              <p className="font-mono text-sm leading-relaxed text-text">{selected.prompt}</p>
            </div>
            <div>
              <p className="label mb-2 text-text-faint">ChatGPT response</p>
              <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-text-muted">
                {decodeEntities(selected.chatgpt_response).slice(0, 1500)}…
              </p>
            </div>
            {selected.ads.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="label mb-2 text-text-faint">Ads surfaced ({selected.ads.length})</p>
                <div className="flex flex-col gap-2">
                  {selected.ads.map((a, i) => (
                    <div key={i} className="rounded-md border border-border p-3">
                      <p className="font-sans text-sm font-semibold text-text">{a.advertiser}</p>
                      <p className="font-sans text-sm text-text">{a.title}</p>
                      <p className="font-sans text-xs text-text-muted">{a.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.known_competitors_in_response.length > 0 && (
              <div>
                <p className="label mb-2 text-text-faint">Mentioned in response</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.known_competitors_in_response.map((c) => (
                    <span key={c} className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-text-muted">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
        active ? "border-accent bg-accent-soft text-accent" : "border-border text-text-faint hover:border-border-strong hover:text-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
