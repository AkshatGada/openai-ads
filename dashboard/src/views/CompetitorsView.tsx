import { useState } from "react";
import { motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import SectionHeading from "../components/primitives/SectionHeading";
import Drawer from "../components/primitives/Drawer";
import { EASE_OUT } from "../motion/transitions";

export default function CompetitorsView({ data }: { data: IndustryData }) {
  const freq = data.patterns.competitor_frequency;
  const max = Math.max(1, ...freq.map((f) => f.total_share));
  const [selected, setSelected] = useState<string | null>(null);
  const detail = data.patterns.advertisers.find((a) => a.advertiser === selected);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        index="03"
        title="Competitor leaderboard"
        sub="organic mentions vs paid impressions"
        lead="Who shows up in this market — earned (mentioned organically in ChatGPT's answer) versus paid (running an actual ad). Click any competitor to see their sample creatives and triggering prompts."
      />

      <div className="flex flex-col">
        {freq.map((f, i) => (
          <button
            key={f.company}
            onClick={() => setSelected(f.company)}
            className="group flex items-center gap-4 border-t border-ink-100 py-3 text-left last:border-b hover:bg-ink-50"
          >
            <span className="tnum w-6 font-mono text-xs text-ink-300">{String(i + 1).padStart(2, "0")}</span>
            <span className="w-40 shrink-0 font-sans text-sm text-ink-950">{f.company}</span>
            <div className="relative flex-1">
              {/* organic = outlined, paid = solid */}
              <div className="flex h-4 items-center gap-px">
                <motion.div
                  className="h-full border border-ink-400"
                  style={{ width: `${(f.organic_mentions / max) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.02 }}
                />
                <motion.div
                  className="h-full bg-ink-950"
                  style={{ width: `${(f.paid_impressions / max) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.02 + 0.1 }}
                />
              </div>
            </div>
            <span className="tnum w-24 text-right font-mono text-xs text-ink-400">
              {f.organic_mentions}·{f.paid_impressions}
            </span>
            <span className="tnum w-10 text-right font-mono text-sm text-ink-950">{f.total_share}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 border border-ink-400" /> Organic</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 bg-ink-950" /> Paid</span>
        <span className="ml-auto">Click a row for sample creatives →</span>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ?? ""}>
        {detail ? (
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs text-ink-500">{detail.hits} paid impression(s) observed</p>
            <div>
              <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">Sample copy</p>
              <ul className="flex flex-col gap-2">
                {detail.sample_copy.map((c, i) => (
                  <li key={i} className="rounded-md border border-ink-200 px-3 py-2 font-sans text-sm text-ink-950">{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-mono text-eyebrow uppercase text-ink-400">Triggering prompts</p>
              <ul className="flex flex-col gap-2">
                {detail.sample_prompts.map((c, i) => (
                  <li key={i} className="font-mono text-xs leading-relaxed text-ink-600">▸ {c}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-ink-400">No paid creatives recorded — appears organically only.</p>
        )}
      </Drawer>
    </div>
  );
}
