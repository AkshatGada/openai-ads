import { motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import SectionHeading from "../components/primitives/SectionHeading";
import Tag from "../components/primitives/Tag";
import { asGap, humanize } from "../lib/format";
import { fadeUp, staggerParent } from "../motion/transitions";

export default function BlueOceanView({ data }: { data: IndustryData }) {
  const { blue_ocean, coverage_gaps } = data.patterns;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
        <SectionHeading
          index="04"
          title="Blue ocean"
          sub="high intent · zero ads"
          lead="High-intent prompt clusters where buyers are clearly deliberating but no one is advertising yet — the open lanes to claim before competitors arrive."
        />
        {blue_ocean.length === 0 ? (
          <p className="py-12 text-center font-mono text-sm uppercase tracking-[0.12em] text-ink-400">
            No zero-ad high-intent clusters detected.
          </p>
        ) : (
          <motion.div
            variants={staggerParent(0.08)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {blue_ocean.map((b) => (
              <motion.div
                key={b.rank}
                variants={fadeUp}
                className="flex flex-col gap-3 rounded-md border border-signal/40 bg-signal/[0.04] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-eyebrow uppercase text-signal">Rank {b.rank}</span>
                  <span className="tnum font-mono text-sm text-signal">intent {b.avg_intent}</span>
                </div>
                <h3 className="font-display text-xl tracking-tightish text-ink-950">{humanize(b.need)}</h3>
                <p className="font-sans text-sm text-ink-600">
                  {humanize(b.persona)} · {b.probes} prompt{b.probes === 1 ? "" : "s"} · {b.ad_count} ads
                </p>
                <p className="font-mono text-xs text-ink-400">Open lane — no competitor is bidding here.</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading index="04" title="Coverage gaps" sub="capabilities & who owns them" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coverage_gaps.map((g) => {
            const gap = asGap(g.gap_value);
            const unowned = g.covered_by.length === 0;
            return (
              <div
                key={g.capability}
                className={`flex flex-col gap-3 rounded-md border p-4 ${
                  gap === "HIGH" ? "border-signal/50 bg-signal/[0.04]" : "border-ink-200 bg-paper"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-sans text-sm font-semibold text-ink-950">{g.capability}</h4>
                  <Tag variant={gap}>{gap}</Tag>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.keywords.slice(0, 5).map((k) => (
                    <span key={k} className="rounded-sm bg-ink-100 px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-500">{k}</span>
                  ))}
                </div>
                <p className="mt-auto font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">
                  {unowned ? "Owned by — nobody" : `Owned by ${g.covered_by.join(", ")}`}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
