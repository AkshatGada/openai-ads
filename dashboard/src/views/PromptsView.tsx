import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { IndustryData, ProbeRecordV2 } from "../lib/types";
import SectionHeading from "../components/primitives/SectionHeading";
import IntentMeter from "../components/primitives/IntentMeter";
import Tag from "../components/primitives/Tag";
import Drawer from "../components/primitives/Drawer";
import { decodeEntities, humanize } from "../lib/format";

type SortKey = "rank" | "intent";

// Rank score = buying intent + a bonus when the prompt actually surfaced an ad.
// "Highest-value prompts ads show up on."
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
    <div className="flex flex-col gap-5">
      <SectionHeading
        index="02"
        title="Prompts ads rank on"
        sub={`${data.probes.length} probed`}
        lead="The questions buyers ask ChatGPT, ranked by value: buying intent plus whether an ad actually surfaced. The top of this list is where advertising pays off. Click any row for the full answer."
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts…"
          aria-label="Search prompts"
          className="flex-1 rounded-lg border border-ink-200 bg-paper px-4 py-2.5 font-mono text-sm text-ink-950 caret-signal outline-none transition-colors placeholder:text-ink-400 focus:border-signal focus:ring-2 focus:ring-signal/20"
        />
        <Toggle active={adsOnly} onClick={() => setAdsOnly((v) => !v)}>Surfaced an ad</Toggle>
        <Toggle active={sort === "rank"} onClick={() => setSort("rank")}>By value</Toggle>
        <Toggle active={sort === "intent"} onClick={() => setSort("intent")}>By intent</Toggle>
      </div>

      <motion.div
        key={`${query}|${sort}|${adsOnly}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-1.5"
      >
        {rows.map(({ p, score }, i) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-ink-200 bg-paper px-4 py-3.5 text-left transition-all duration-200 hover:border-ink-300 hover:shadow-[0_6px_20px_-8px_rgba(26,60,255,0.15)]"
          >
            {/* value bar background */}
            <span
              className="absolute inset-y-0 left-0 bg-signal/[0.04]"
              style={{ width: `${(score / maxScore) * 100}%` }}
            />
            <span className="tnum relative z-10 w-7 shrink-0 font-mono text-sm text-ink-300">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block truncate font-sans text-sm text-ink-950">{p.prompt}</span>
              <span className="mt-1 flex items-center gap-2">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">
                  {humanize(p.persona)} · {humanize(p.primary_need)}
                </span>
              </span>
            </span>
            <span className="relative z-10 shrink-0">
              <IntentMeter value={p.intent_score} animate={false} />
            </span>
            <span className="relative z-10 w-16 shrink-0 text-right">
              {p.has_ads ? (
                <span className="font-mono text-xs text-signal">{p.ads.length} ad{p.ads.length > 1 ? "s" : ""}</span>
              ) : (
                <span className="font-mono text-xs text-ink-300">—</span>
              )}
            </span>
          </button>
        ))}
        {rows.length === 0 && (
          <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.12em] text-ink-400">No matching prompts.</p>
        )}
      </motion.div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? humanize(selected.primary_need) : ""}>
        {selected && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <Tag>{humanize(selected.persona)}</Tag>
              <Tag>{selected.prompt_structure}</Tag>
              {selected.has_ads && <Tag variant="signal">ad surfaced</Tag>}
            </div>
            <Field label="Prompt">
              <p className="font-mono text-sm leading-relaxed text-ink-950">{selected.prompt}</p>
            </Field>
            <Field label="ChatGPT response">
              <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-700">
                {decodeEntities(selected.chatgpt_response)}
              </p>
            </Field>
            {selected.ads.length > 0 && (
              <Field label="Ads surfaced">
                <div className="flex flex-col gap-2">
                  {selected.ads.map((a, i) => (
                    <div key={i} className="rounded-lg border border-ink-200 p-3">
                      <p className="font-sans text-sm font-semibold text-ink-950">{a.advertiser}</p>
                      <p className="font-sans text-sm text-ink-950">{a.title}</p>
                      <p className="font-sans text-sm text-ink-500">{a.body}</p>
                    </div>
                  ))}
                </div>
              </Field>
            )}
            {selected.citations.length > 0 && (
              <Field label="Citations">
                <ul className="flex flex-col gap-1">
                  {selected.citations.map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-signal hover:underline">
                        {c.title || c.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </Field>
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
      className={`rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
        active ? "border-ink-950 bg-ink-950 text-paper" : "border-ink-300 text-ink-600 hover:border-ink-600"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">{label}</p>
      {children}
    </div>
  );
}
