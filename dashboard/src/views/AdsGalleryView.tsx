"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import { adGallery, galleryFilters } from "../lib/derive";
import AdCreativeCard from "../components/AdCreativeCard";
import { EASE_OUT, DUR } from "../motion/transitions";

export default function AdsGalleryView({ data }: { data: IndustryData }) {
  const items = useMemo(() => adGallery(data.probes), [data]);
  const filters = useMemo(() => galleryFilters(items), [items]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ industry: string }>();
  const industryId = params?.industry ?? "";

  const urlAdvertiser = searchParams?.get("advertiser") ?? "all";
  const [advertiser, setAdvertiser] = useState<string>(urlAdvertiser);
  const [selected, setSelected] = useState<(typeof items)[number] | null>(null);

  const shown = useMemo(
    () => (advertiser === "all" ? items : items.filter((i) => i.ad.advertiser === advertiser)),
    [items, advertiser],
  );

  const handleFilter = useCallback(
    (a: string) => {
      setAdvertiser(a);
      if (a === "all") {
        router.push(`/${industryId}/ads`, { scroll: false });
      } else {
        router.push(`/${industryId}/ads?advertiser=${encodeURIComponent(a)}`, { scroll: false });
      }
    },
    [router, industryId],
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
          <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
        </svg>
        <p className="font-sans text-sm text-text-muted">0 ads observed</p>
        <p className="font-sans text-xs text-text-faint">across {data.probes.length} probes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={advertiser === "all"} onClick={() => handleFilter("all")}>
          All ({items.length})
        </FilterChip>
        {filters.advertisers.map((a) => (
          <FilterChip key={a} active={advertiser === a} onClick={() => handleFilter(a)}>
            {a}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((item, i) => (
            <AdCreativeCard key={item.key} item={item} index={i} onClick={() => setSelected(item)} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Ad detail panel ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-bg/70"
              style={{ backdropFilter: "blur(8px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: DUR.base, ease: EASE_OUT }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            >
              <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4">
                <div>
                  <p className="font-sans text-[15px] font-semibold text-text">{selected.ad.advertiser}</p>
                  <p className="mt-0.5 font-sans text-xs text-text-faint">Ad creative details</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div>
                  <p className="mb-1 font-sans text-[11px] font-medium tracking-wide text-text-faint">Ad title</p>
                  <p className="font-sans text-[17px] font-semibold leading-snug text-text">{selected.ad.title}</p>
                </div>
                <div>
                  <p className="mb-1 font-sans text-[11px] font-medium tracking-wide text-text-faint">Ad body</p>
                  <p className="font-sans text-[15px] leading-relaxed text-text-muted">{selected.ad.body}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <p className="mb-2 font-sans text-[11px] font-medium tracking-wide text-text-faint">Triggering prompt</p>
                  <p className="font-sans text-[15px] leading-relaxed text-text">{selected.probe.prompt}</p>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 font-sans text-sm transition-all duration-200 ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-surface text-text-faint hover:border-border-strong hover:text-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
