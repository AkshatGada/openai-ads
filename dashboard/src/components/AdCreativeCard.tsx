"use client";
import { motion } from "motion/react";
import type { GalleryItem } from "../lib/derive";
import { EASE_OUT } from "../motion/transitions";

export default function AdCreativeCard({ item, index, onClick }: { item: GalleryItem; index: number; onClick?: () => void }) {
  const { ad, probe } = item;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group flex cursor-pointer flex-col rounded-md border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-sans text-sm font-semibold text-text">{ad.advertiser}</span>
        <span className="font-sans text-[11px] font-medium tracking-wide text-text-faint">Sponsored</span>
      </div>

      <div className="flex flex-col gap-1.5 px-4 py-3">
        <h3 className="font-sans text-sm font-medium leading-snug text-text">{ad.title}</h3>
        <p className="font-sans text-xs leading-relaxed text-text-muted">{ad.body}</p>
      </div>

      <div className="border-t border-border bg-surface-2 px-4 py-2.5">
        <p className="mb-1.5 font-sans text-[11px] font-medium tracking-wide text-text-faint">Triggered by</p>
        <p className="font-sans text-xs leading-relaxed text-text-muted line-clamp-2">{probe.prompt}</p>
      </div>
    </motion.article>
  );
}
