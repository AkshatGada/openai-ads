import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import type { IndustryEntry } from "../lib/registry";
import SearchBar from "./SearchBar";
import ViewNav, { type ViewId } from "./ViewNav";
import { viewSwap } from "../motion/transitions";
import AdsGalleryView from "../views/AdsGalleryView";
import PromptsView from "../views/PromptsView";
import AdvertisersView from "../views/AdvertisersView";

export default function Dashboard({
  entry,
  data,
  onSelect,
}: {
  entry: IndustryEntry;
  data: IndustryData;
  onSelect: (e: IndustryEntry) => void;
}) {
  const [view, setView] = useState<ViewId>("ads");

  return (
    <motion.div
      className="relative min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.15 } }}
    >
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-6 py-4 md:px-12">
          <div className="flex items-center gap-3">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-signal font-dot text-[0.8rem] font-bold text-black">L</span>
            <span className="dot-label text-sm text-ink-950">GPT ADS LIBRARY</span>
            <span className="text-ink-300">/</span>
            <span className="font-sans text-sm text-ink-700">{entry.label}</span>
          </div>
          <span className="hidden font-mono text-xs text-ink-400 lg:block">{entry.tagline}</span>
          <div className="ml-auto">
            <SearchBar compact onSelect={onSelect} />
          </div>
        </div>
        <div className="mx-auto max-w-[1320px] px-6 md:px-12">
          <ViewNav active={view} onChange={setView} />
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 py-10 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div key={view} variants={viewSwap} initial="hidden" animate="show" exit="exit">
            {view === "ads" && <AdsGalleryView data={data} />}
            {view === "prompts" && <PromptsView data={data} />}
            {view === "advertisers" && <AdvertisersView data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mx-auto max-w-[1320px] border-t border-ink-200 px-6 py-8 md:px-12">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">
          ChatGPT Ads Library · {data.patterns.total_probes} probes · generated{" "}
          {new Date(data.patterns.generated_at).toISOString().slice(0, 10)}
        </p>
      </footer>
    </motion.div>
  );
}
