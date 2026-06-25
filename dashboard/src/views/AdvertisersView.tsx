"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import { adGallery } from "../lib/derive";
import Drawer from "../components/primitives/Drawer";
import { staggerParent, fadeUp } from "../motion/transitions";

export default function AdvertisersView({ data }: { data: IndustryData }) {
  const freq = data.patterns.competitor_frequency;
  const [selected, setSelected] = useState<string | null>(null);

  const gallery = useMemo(() => adGallery(data.probes), [data.probes]);
  const selectedAds = useMemo(
    () => gallery.filter((g) => g.ad.advertiser === selected),
    [gallery, selected],
  );
  const detail = data.patterns.advertisers.find((a) => a.advertiser === selected);

  const paid = freq.filter((f) => f.paid_impressions > 0);

  return (
    <div className="flex flex-col gap-8">
      {paid.length > 0 && (
        <section>
          <p className="label mb-3 text-text-faint">Running ads ({paid.length})</p>
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
                className="group flex flex-col gap-3 rounded-md border border-border bg-surface p-4 text-left transition-all duration-200 hover:border-border-strong hover:bg-surface-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm font-semibold text-text">{f.company}</span>
                  <span className="rounded-sm bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                    {f.paid_impressions} ad{f.paid_impressions > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="tnum font-sans text-2xl font-light text-text">{f.total_share}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">appearances</span>
                </div>
                <span className="font-mono text-[10px] text-text-faint group-hover:text-accent">View creatives →</span>
              </motion.button>
            ))}
          </motion.div>
        </section>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ?? ""}>
        <div className="flex flex-col gap-5">
          {detail && <p className="font-mono text-xs text-text-muted">{detail.hits} paid impression(s)</p>}
          {selectedAds.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="label text-text-faint">Creatives + triggering prompts</p>
              {selectedAds.map((g) => (
                <div key={g.key} className="rounded-md border border-border p-3">
                  <p className="font-sans text-sm font-semibold text-text">{g.ad.title}</p>
                  <p className="mt-0.5 font-sans text-xs text-text-muted">{g.ad.body}</p>
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="flex items-center gap-1.5 font-sans text-[11px] font-medium tracking-wide text-text-faint">
                      <span className="inline-block h-1 w-1 rounded-full bg-accent" />
                      Triggered by
                    </p>
                    <p className="mt-0.5 font-mono text-xs leading-relaxed text-text-muted">{g.probe.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-text-faint">No creatives captured.</p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
