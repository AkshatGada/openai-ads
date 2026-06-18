import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { IndustryData } from "../lib/types";
import { adGallery, galleryFilters } from "../lib/derive";
import AdCreativeCard from "../components/AdCreativeCard";
import SectionHeading from "../components/primitives/SectionHeading";
import { humanize } from "../lib/format";

type FilterKey = "all" | string;

export default function AdsGalleryView({ data }: { data: IndustryData }) {
  const items = useMemo(() => adGallery(data.probes), [data]);
  const filters = useMemo(() => galleryFilters(items), [items]);
  const [advertiser, setAdvertiser] = useState<FilterKey>("all");

  const shown = useMemo(
    () => (advertiser === "all" ? items : items.filter((i) => i.ad.advertiser === advertiser)),
    [items, advertiser],
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <SectionHeading index="02" title="Ads running" />
        <p className="py-16 text-center font-mono text-sm uppercase tracking-[0.12em] text-ink-400">
          No ads observed in this dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        index="02"
        title="Ads running"
        sub={`${items.length} creatives observed`}
        lead="Every ad we observed running in ChatGPT for this market — the advertiser, the creative, and the exact prompt that triggered it. Filter by advertiser to study a competitor's messaging."
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip active={advertiser === "all"} onClick={() => setAdvertiser("all")}>
          All
        </FilterChip>
        {filters.advertisers.map((a) => (
          <FilterChip key={a} active={advertiser === a} onClick={() => setAdvertiser(a)}>
            {a}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((item, i) => (
            <AdCreativeCard key={item.key} item={item} index={i} />
          ))}
        </AnimatePresence>
      </div>
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">
        Filtered by advertiser · personas: {filters.personas.map(humanize).join(", ")}
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
        active ? "border-ink-950 bg-ink-950 text-paper" : "border-ink-300 text-ink-600 hover:border-ink-600"
      }`}
    >
      {children}
    </button>
  );
}
