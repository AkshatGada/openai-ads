import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import SectionHeading from "../components/primitives/SectionHeading";
import Drawer from "../components/primitives/Drawer";
import { adGallery } from "../lib/derive";
import { EASE_OUT, staggerParent, fadeUp } from "../motion/transitions";

export default function AdvertisersView({ data }: { data: IndustryData }) {
  const freq = data.patterns.competitor_frequency;
  const advertisers = data.patterns.advertisers;
  const max = Math.max(1, ...freq.map((f) => f.total_share));
  const [selected, setSelected] = useState<string | null>(null);

  // ads (with their triggering prompts) for the selected advertiser
  const gallery = useMemo(() => adGallery(data.probes), [data.probes]);
  const selectedAds = useMemo(
    () => gallery.filter((g) => g.ad.advertiser === selected),
    [gallery, selected],
  );
  const detail = advertisers.find((a) => a.advertiser === selected);

  // Split: who's actually paying (has ads) vs purely organic mentions.
  const paid = freq.filter((f) => f.paid_impressions > 0);
  const organic = freq.filter((f) => f.paid_impressions === 0);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        index="03"
        title="Advertisers"
        sub={`${freq.length} companies`}
        lead="Who shows up in this market. Paid means they are running an ad; organic means ChatGPT mentions them in its answer without an ad. Click a paid advertiser to see their creatives."
      />

      {/* Paid advertisers — the ones to study, as cards (bento-ish) */}
      {paid.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-eyebrow uppercase text-ink-400">Running ads</p>
          <motion.div
            variants={staggerParent(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {paid.map((f) => (
              <motion.button
                key={f.company}
                variants={fadeUp}
                onClick={() => setSelected(f.company)}
                className="group flex flex-col gap-3 rounded-xl border border-ink-200 bg-paper p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-[0_10px_30px_-12px_rgba(26,60,255,0.2)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-semibold text-ink-950">{f.company}</span>
                  <span className="rounded-full bg-signal/10 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-signal">
                    {f.paid_impressions} ad{f.paid_impressions > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="tnum font-dot text-4xl text-ink-950">{f.total_share}</span>
                  <span className="dot-label text-[0.625rem] text-ink-400">APPEARANCES</span>
                </div>
                <span className="font-mono text-[0.625rem] text-ink-400 group-hover:text-signal">View creatives →</span>
              </motion.button>
            ))}
          </motion.div>
        </section>
      )}

      {/* Organic mentions — leaderboard rows */}
      <section>
        <p className="mb-3 font-mono text-eyebrow uppercase text-ink-400">Mentioned organically (no ad)</p>
        <div className="flex flex-col">
          {organic.map((f, i) => (
            <div key={f.company} className="flex items-center gap-4 border-t border-ink-100 py-3 last:border-b">
              <span className="tnum w-6 font-mono text-xs text-ink-300">{String(i + 1).padStart(2, "0")}</span>
              <span className="w-40 shrink-0 font-sans text-sm text-ink-950">{f.company}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-ink-100">
                <motion.div
                  className="absolute inset-y-0 left-0 origin-left bg-ink-400"
                  style={{ width: `${(f.total_share / max) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.02 }}
                />
              </div>
              <span className="tnum w-10 text-right font-mono text-sm text-ink-700">{f.total_share}</span>
            </div>
          ))}
          {organic.length === 0 && (
            <p className="py-6 font-mono text-xs uppercase tracking-[0.12em] text-ink-400">None. Everyone here is paying.</p>
          )}
        </div>
      </section>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ?? ""}>
        <div className="flex flex-col gap-6">
          {detail && <p className="font-mono text-xs text-ink-500">{detail.hits} paid impression(s) observed</p>}
          {selectedAds.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="font-mono text-eyebrow uppercase text-ink-400">Creatives + triggering prompts</p>
              {selectedAds.map((g) => (
                <div key={g.key} className="rounded-lg border border-ink-200 p-4">
                  <p className="font-display text-base font-semibold text-ink-950">{g.ad.title}</p>
                  <p className="mt-0.5 font-sans text-sm text-ink-500">{g.ad.body}</p>
                  <div className="mt-3 border-t border-ink-100 pt-2">
                    <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">▸ Triggered by</p>
                    <p className="mt-0.5 font-mono text-xs leading-relaxed text-ink-700">{g.probe.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-ink-400">No creatives captured for this advertiser.</p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
