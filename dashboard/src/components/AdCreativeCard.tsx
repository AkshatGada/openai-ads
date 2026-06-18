import { motion } from "motion/react";
import type { GalleryItem } from "../lib/derive";
import Tag from "./primitives/Tag";
import IntentMeter from "./primitives/IntentMeter";
import { humanize } from "../lib/format";
import { EASE_OUT } from "../motion/transitions";

// The showpiece. Ad creative + the prompt that triggered it.
export default function AdCreativeCard({ item, index }: { item: GalleryItem; index: number }) {
  const { ad, probe } = item;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      className="group flex flex-col rounded-md border border-ink-200 bg-paper transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.08)]"
    >
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
        <span className="font-sans text-sm font-semibold text-ink-950">{ad.advertiser}</span>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">Sponsored</span>
      </div>

      <div className="flex flex-col gap-2 px-5 py-4">
        <h3 className="font-display text-lg tracking-tightish text-ink-950">{ad.title}</h3>
        <p className="font-sans text-sm leading-relaxed text-ink-600">{ad.body}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 px-5 pb-4">
        <Tag>{humanize(probe.persona)}</Tag>
        <Tag>{humanize(probe.primary_need)}</Tag>
        <span className="ml-auto">
          <IntentMeter value={probe.intent_score} animate={false} />
        </span>
      </div>

      <div className="border-t border-ink-100 bg-ink-50 px-5 py-3">
        <p className="mb-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">▸ Triggered by</p>
        <p className="font-mono text-xs leading-relaxed text-ink-700">{probe.prompt}</p>
        {probe.known_competitors_in_response.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {probe.known_competitors_in_response.slice(0, 6).map((c) => (
              <span key={c} className="rounded-sm bg-ink-200/60 px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-500">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <span className="h-0.5 w-0 bg-signal transition-all duration-300 group-hover:w-full" />
    </motion.article>
  );
}
