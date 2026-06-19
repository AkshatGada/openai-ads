import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import Header from "./components/Header";
import Landing from "./components/Landing";
import ViewNav, { type ViewId } from "./components/ViewNav";
import AdsGalleryView from "./views/AdsGalleryView";
import PromptsView from "./views/PromptsView";
import AdvertisersView from "./views/AdvertisersView";
import { useTheme } from "./lib/theme";
import { useIndustryData } from "./hooks/useIndustryData";
import type { IndustryEntry, IndustryId } from "./lib/registry";
import { INDUSTRIES } from "./lib/registry";
import { viewSwap, EASE_OUT, DUR } from "./motion/transitions";

export default function App() {
  const { theme, toggle } = useTheme();
  const [selected, setSelected] = useState<IndustryId | null>(null);
  const [view, setView] = useState<ViewId>("advertisers");
  const dataState = useIndustryData(selected);

  const handleSelect = useCallback((entry: IndustryEntry) => {
    setSelected(entry.id);
    setView("advertisers");
  }, []);

  const handleBack = useCallback(() => setSelected(null), []);

  const entry = selected ? INDUSTRIES[selected] : null;

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header
        theme={theme}
        onToggleTheme={toggle}
        breadcrumb={
          entry && (
            <button
              onClick={handleBack}
              className="font-sans text-sm text-text-muted transition-colors hover:text-text"
            >
              {entry.label}
            </button>
          )
        }
      />

      <AnimatePresence mode="wait">
        {selected && entry ? (
          <motion.div
            key={`industry-${selected}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
          >
            <IndustryView
              entry={entry}
              dataState={dataState}
              view={view}
              onViewChange={setView}
            />
          </motion.div>
        ) : (
          <Landing key="landing" onSelect={handleSelect} />
        )}
      </AnimatePresence>
    </div>
  );
}

function IndustryView({
  entry,
  dataState,
  view,
  onViewChange,
}: {
  entry: IndustryEntry;
  dataState: ReturnType<typeof useIndustryData>;
  view: ViewId;
  onViewChange: (v: ViewId) => void;
}) {
  if (dataState.status === "loading") {
    return (
      <main className="mx-auto flex max-w-[1320px] flex-col items-center px-6 py-24 md:px-10">
        <div className="flex items-center gap-3 font-mono text-sm text-text-faint">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Loading…
        </div>
      </main>
    );
  }

  if (dataState.status === "error") {
    return (
      <main className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
        <p className="font-mono text-sm text-status-negative">Load failed: {dataState.message}</p>
      </main>
    );
  }

  if (dataState.status !== "ready") return null;

  const { data } = dataState;

  return (
    <>
      <div className="mx-auto max-w-[1320px] px-6 pt-10 md:px-10">
        <h1 className="text-display text-text">{entry.label}</h1>
        <div className="mt-6">
          <ViewNav active={view} onChange={onViewChange} />
        </div>
      </div>

      <main className="mx-auto max-w-[1320px] px-6 py-6 md:px-10">
        <AnimatePresence mode="wait">
          <motion.div key={view} variants={viewSwap} initial="hidden" animate="show" exit="exit">
            {view === "advertisers" && <AdvertisersView data={data} />}
            {view === "ads" && <AdsGalleryView data={data} />}
            {view === "prompts" && <PromptsView data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
