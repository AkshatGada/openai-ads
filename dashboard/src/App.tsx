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
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <Header
        theme={theme}
        onToggleTheme={toggle}
        onHome={handleBack}
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

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border bg-surface/30">
        <div className="mx-auto max-w-[1320px] px-6 py-10 md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-accent-fg">
                  G
                </span>
                <span className="font-display text-sm font-semibold tracking-tight text-text">
                  ChatGPT Ads Library
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-faint">
                The first public database of ChatGPT ads. Browse advertisers,
                creatives, and context hints by industry. Free competitive
                intelligence for OpenAI advertising.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Industries
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="?industry=real-estate"
                      className="font-sans text-xs text-text-faint transition-colors hover:text-text"
                    >
                      Real Estate Ads
                    </a>
                  </li>
                  <li>
                    <a
                      href="?industry=oms"
                      className="font-sans text-xs text-text-faint transition-colors hover:text-text"
                    >
                      Fintech &amp; Payments
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Resources
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://github.com/AkshatGada/openai-ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-xs text-text-faint transition-colors hover:text-text"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <span className="font-sans text-xs text-text-faint">
                      API (coming soon)
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  About
                </h4>
                <ul className="space-y-2">
                  <li>
                    <span className="font-sans text-xs text-text-faint">
                      Privacy
                    </span>
                  </li>
                  <li>
                    <span className="font-sans text-xs text-text-faint">
                      Terms
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-text-faint">
              &copy; {new Date().getFullYear()} ChatGPT Ads Library
            </p>
          </div>
        </div>
      </footer>
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
          Loading&hellip;
        </div>
      </main>
    );
  }

  if (dataState.status === "error") {
    return (
      <main className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
        <p className="font-mono text-sm text-status-negative">
          Load failed: {dataState.message}
        </p>
      </main>
    );
  }

  if (dataState.status !== "ready") return null;

  const { data } = dataState;

  return (
    <>
      <div className="mx-auto max-w-[1320px] scroll-mt-16 px-6 pt-10 md:px-10">
        <h1 className="text-display text-text">{entry.label}</h1>
        <div className="mt-6">
          <ViewNav active={view} onChange={onViewChange} />
        </div>
      </div>

      <main className="mx-auto max-w-[1320px] px-6 py-6 md:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            variants={viewSwap}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {view === "advertisers" && <AdvertisersView data={data} />}
            {view === "ads" && <AdsGalleryView data={data} />}
            {view === "prompts" && <PromptsView data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
