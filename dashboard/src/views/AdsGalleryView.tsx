"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { IndustryData } from "../lib/types";
import { adGallery, galleryFilters } from "../lib/derive";
import AdCreativeCard from "../components/AdCreativeCard";
import { humanize } from "../lib/format";
import Drawer from "../components/primitives/Drawer";
import { decodeEntities } from "../lib/format";

export default function AdsGalleryView({ data }: { data: IndustryData }) {
  const items = useMemo(() => adGallery(data.probes), [data]);
  const filters = useMemo(() => galleryFilters(items), [items]);
  const [advertiser, setAdvertiser] = useState<string>("all");
  const [selected, setSelected] = useState<typeof items[number] | null>(null);

  const shown = useMemo(
    () => (advertiser === "all" ? items : items.filter((i) => i.ad.advertiser === advertiser)),
    [items, advertiser],
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-20 text-center">
        <p className="font-mono text-sm text-text-muted">0 ads observed</p>
        <p className="font-mono text-xs text-text-faint">across {data.probes.length} probes — blue ocean</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={advertiser === "all"} onClick={() => setAdvertiser("all")}>All ({items.length})</FilterChip>
        {filters.advertisers.map((a) => (
          <FilterChip key={a} active={advertiser === a} onClick={() => setAdvertiser(a)}>{a}</FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((item, i) => (
            <AdCreativeCard key={item.key} item={item} index={i} onClick={() => setSelected(item)} />
          ))}
        </AnimatePresence>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.ad.advertiser ?? ""}>
        {selected && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="label mb-1 text-text-faint">Ad title</p>
              <p className="font-sans text-base font-medium text-text">{selected.ad.title}</p>
            </div>
            <div>
              <p className="label mb-1 text-text-faint">Ad body</p>
              <p className="font-sans text-sm leading-relaxed text-text-muted">{selected.ad.body}</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="label mb-1 text-text-faint">Triggered by prompt</p>
              <p className="font-mono text-xs leading-relaxed text-text">{selected.probe.prompt}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {humanize(selected.probe.persona)}
              </span>
              <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {humanize(selected.probe.primary_need)}
              </span>
            </div>
            <div className="border-t border-border pt-4">
              <p className="label mb-2 text-text-faint">ChatGPT response</p>
              <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-text-muted">
                {decodeEntities(selected.probe.chatgpt_response).slice(0, 1200)}…
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
        active ? "border-accent bg-accent-soft text-accent" : "border-border text-text-faint hover:border-border-strong hover:text-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
