import { motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import { humanize } from "../lib/format";
import { staggerParent, fadeUp, EASE_OUT } from "../motion/transitions";

export default function LandscapeView({ data }: { data: IndustryData }) {
  const freq = data.patterns.competitor_frequency;
  const blueOcean = data.patterns.blue_ocean;
  const densityByPersona = data.patterns.ad_density_by_persona;

  const paid = freq.filter((f) => f.paid_impressions > 0);
  const organic = freq.filter((f) => f.paid_impressions === 0 && f.organic_mentions > 0);
  const maxRate = Math.max(1, ...densityByPersona.map((d) => d.rate));

  return (
    <div className="flex flex-col gap-8">
      {/* ── Ad density by persona ── */}
      <motion.section
        variants={staggerParent(0.05)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        <p className="label text-text-faint">Ad density by persona</p>
        {densityByPersona.map((d) => (
          <motion.div
            key={d.persona}
            variants={fadeUp}
            className="flex items-center gap-4"
          >
            <span className="w-48 shrink-0 truncate font-sans text-sm text-text-muted">
              {humanize(d.persona)}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-border">
              <motion.div
                className={`absolute inset-y-0 left-0 origin-left ${d.ads > 0 ? "bg-accent" : "bg-text-faint"}`}
                style={{ width: `${(d.rate / maxRate) * 100}%` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
              />
            </div>
            <span className="tnum w-12 text-right font-mono text-xs text-text-muted">
              {d.rate.toFixed(0)}%
            </span>
            <span className="tnum w-16 text-right font-mono text-xs text-text-faint">
              {d.ads} ad{d.ads !== 1 ? "s" : ""}
            </span>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Competitive map ── */}
      <section className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5">
        <p className="label text-text-faint">Competitive map</p>

        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">Advertising</p>
            <div className="flex flex-wrap gap-2">
              {paid.length > 0 ? paid.map((f) => (
                <span key={f.company} className="rounded-sm border border-accent/40 bg-accent-soft px-2.5 py-1 font-sans text-xs text-accent">
                  {f.company} · {f.paid_impressions}
                </span>
              )) : <span className="font-mono text-xs text-text-faint">None</span>}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Recommended, not paying</p>
            <div className="flex flex-wrap gap-2">
              {organic.slice(0, 15).map((f) => (
                <span key={f.company} className="rounded-sm border border-border px-2.5 py-1 font-sans text-xs text-text-muted">
                  {f.company} · {f.organic_mentions}
                </span>
              ))}
              {organic.length > 15 && (
                <span className="rounded-sm px-2.5 py-1 font-mono text-xs text-text-faint">
                  +{organic.length - 15} more
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-faint">Neither</p>
            <p className="font-mono text-xs text-text-faint">The gap — your opportunity.</p>
          </div>
        </div>
      </section>

      {/* ── Blue ocean ── */}
      <section className="flex flex-col gap-3">
        <p className="label text-text-faint">Blue ocean — high intent, zero ads</p>
        <div className="flex flex-col gap-1">
          {blueOcean.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT, delay: i * 0.04 }}
              className="flex items-center gap-4 border-b border-border py-3"
            >
              <span className="tnum w-6 font-mono text-xs text-text-faint">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-sans text-sm text-text">
                  {humanize(b.persona)} · {humanize(b.need)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">
                  {b.probes} probes · intent {b.avg_intent.toFixed(1)} · {b.ad_count} ads
                </span>
              </div>
              <span className="rounded-sm border border-status-positive/40 bg-status-positive/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-status-positive">
                open
              </span>
            </motion.div>
          ))}
          {blueOcean.length === 0 && (
            <p className="py-6 font-mono text-xs text-text-faint">No gaps — every high-intent persona has ads.</p>
          )}
        </div>
      </section>
    </div>
  );
}
