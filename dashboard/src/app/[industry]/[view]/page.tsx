"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import ViewNav, { type ViewId } from "@/components/ViewNav";
import AdsGalleryView from "@/views/AdsGalleryView";
import PromptsView from "@/views/PromptsView";
import AdvertisersView from "@/views/AdvertisersView";
import EmailGate from "@/components/EmailGate";
import type { IndustryData } from "@/lib/types";
import { getIndustryMeta } from "@/lib/data";
import { viewSwap, EASE_OUT, DUR } from "@/motion/transitions";

type State =
  | { status: "loading" }
  | { status: "ready"; data: IndustryData }
  | { status: "error"; message: string };

export default function IndustryViewPage() {
  const params = useParams<{ industry: string; view: string }>();
  const router = useRouter();
  const industryId = params?.industry ?? "";
  const currentView = (params?.view ?? "advertisers") as ViewId;

  const [state, setState] = useState<State>({ status: "loading" });

  const meta = getIndustryMeta(industryId);

  // Fetch industry data from API
  useEffect(() => {
    if (!industryId) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/industries/${encodeURIComponent(industryId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IndustryData) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Load failed" });
      });

    return () => { cancelled = true; };
  }, [industryId]);

  const handleViewChange = useCallback(
    (v: ViewId) => {
      router.push(`/${industryId}/${v}`);
    },
    [router, industryId],
  );

  if (!meta) {
    return (
      <main className="mx-auto flex max-w-[1320px] flex-col items-center px-6 py-24 md:px-10">
        <p className="font-mono text-sm text-text-faint">Industry not found: {industryId}</p>
      </main>
    );
  }

  return (
    <motion.div
      key={`industry-${industryId}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DUR.base, ease: EASE_OUT }}
    >
      {state.status === "loading" ? (
        <main className="mx-auto flex max-w-[1320px] flex-col items-center px-6 py-24 md:px-10">
          <div className="flex items-center gap-3 font-mono text-sm text-text-faint">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Loading…
          </div>
        </main>
      ) : state.status === "error" ? (
        <main className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
          <p className="font-mono text-sm text-status-negative">Load failed: {state.message}</p>
        </main>
      ) : (
        <>
          <EmailGate />

          <div className="mx-auto max-w-[1320px] scroll-mt-16 px-6 pt-10 md:px-10">
            <h1 className="text-display text-text">{meta.label}</h1>
            <div className="mt-6">
              <ViewNav active={currentView} onChange={handleViewChange} />
            </div>
          </div>

          <main className="mx-auto max-w-[1320px] px-6 py-6 md:px-10">
            <AnimatePresence mode="wait">
              <motion.div key={currentView} variants={viewSwap} initial="hidden" animate="show" exit="exit">
                {currentView === "advertisers" && <AdvertisersView data={state.data} />}
                {currentView === "ads" && <AdsGalleryView data={state.data} />}
                {currentView === "prompts" && <PromptsView data={state.data} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </motion.div>
  );
}
