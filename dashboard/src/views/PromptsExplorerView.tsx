import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { IndustryData, ProbeRecordV2 } from "../lib/types";
import SectionHeading from "../components/primitives/SectionHeading";
import IntentMeter from "../components/primitives/IntentMeter";
import Tag from "../components/primitives/Tag";
import Drawer from "../components/primitives/Drawer";
import { decodeEntities, humanize } from "../lib/format";

export default function PromptsExplorerView({ data }: { data: IndustryData }) {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [adsOnly, setAdsOnly] = useState(false);
  const [selected, setSelected] = useState<ProbeRecordV2 | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.probes
      .filter((p) => (adsOnly ? p.has_ads : true))
      .filter((p) => (q ? p.prompt.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => (sortDesc ? b.intent_score - a.intent_score : a.intent_score - b.intent_score));
  }, [data.probes, query, sortDesc, adsOnly]);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        index="05"
        title="Prompts explorer"
        sub={`${data.probes.length} probes`}
        lead="Every prompt we tested, scored by buying intent, with whether it surfaced an ad. Search and sort to find the exact questions worth advertising against. Click a row for the full response."
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts…"
          aria-label="Search prompts"
          className="flex-1 rounded-md border border-ink-200 bg-paper px-3 py-2 font-mono text-sm text-ink-950 caret-signal outline-none placeholder:text-ink-400 focus:border-signal"
        />
        <button
          onClick={() => setAdsOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${adsOnly ? "border-ink-950 bg-ink-950 text-paper" : "border-ink-300 text-ink-600 hover:border-ink-600"}`}
        >
          Ads only
        </button>
        <button
          onClick={() => setSortDesc((v) => !v)}
          className="rounded-full border border-ink-300 px-3 py-1.5 font-mono text-xs text-ink-600 transition-colors hover:border-ink-600"
        >
          Intent {sortDesc ? "↓" : "↑"}
        </button>
      </div>

      <motion.div
        key={`${query}|${sortDesc}|${adsOnly}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden rounded-md border border-ink-200"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">
              <th className="px-4 py-3 font-medium">Prompt</th>
              <th className="px-3 py-3 font-medium">Persona</th>
              <th className="px-3 py-3 font-medium">Need</th>
              <th className="px-3 py-3 font-medium">Intent</th>
              <th className="px-3 py-3 text-center font-medium">Ad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelected(p)}
                className="cursor-pointer border-b border-ink-100 last:border-0 transition-colors hover:bg-ink-50"
              >
                <td className="max-w-md px-4 py-3 font-sans text-sm text-ink-950">
                  <span className="line-clamp-1">{p.prompt}</span>
                </td>
                <td className="px-3 py-3 font-mono text-xs text-ink-500">{humanize(p.persona)}</td>
                <td className="px-3 py-3 font-mono text-xs text-ink-500">{humanize(p.primary_need)}</td>
                <td className="px-3 py-3"><IntentMeter value={p.intent_score} animate={false} /></td>
                <td className="px-3 py-3 text-center font-mono text-sm">
                  {p.has_ads ? <span className="text-signal">●</span> : <span className="text-ink-300">○</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center font-mono text-xs uppercase tracking-[0.12em] text-ink-400">No matching prompts.</p>
        )}
      </motion.div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? humanize(selected.primary_need) : ""}>
        {selected && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <Tag>{humanize(selected.persona)}</Tag>
              <Tag>{selected.prompt_structure}</Tag>
              {selected.contains_compliance && <Tag>compliance</Tag>}
              {selected.has_ads && <Tag variant="signal">ad surfaced</Tag>}
            </div>
            <div>
              <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">Prompt</p>
              <p className="font-mono text-sm leading-relaxed text-ink-950">{selected.prompt}</p>
            </div>
            <div>
              <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">ChatGPT response</p>
              <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-700">
                {decodeEntities(selected.chatgpt_response)}
              </p>
            </div>
            {selected.ads.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">Ads surfaced</p>
                {selected.ads.map((a, i) => (
                  <div key={i} className="rounded-md border border-ink-200 p-3">
                    <p className="font-sans text-sm font-semibold text-ink-950">{a.advertiser}</p>
                    <p className="font-display text-base text-ink-950">{a.title}</p>
                    <p className="font-sans text-sm text-ink-600">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
            {selected.citations.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">Citations</p>
                <ul className="flex flex-col gap-1">
                  {selected.citations.map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-signal hover:underline">
                        {c.title || c.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
