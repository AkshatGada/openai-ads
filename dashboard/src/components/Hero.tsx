import { motion } from "motion/react";
import SearchBar from "./SearchBar";
import { INDUSTRY_LIST, type IndustryEntry } from "../lib/registry";
import { staggerParent, fadeUp } from "../motion/transitions";
import FloatingAds from "./landing/FloatingAds";

// ONE attractive page: hero + the search. No marketing sections. Entering an
// industry transitions into the dashboard. The floating real-ad cluster is the
// centerpiece; the page is single-purpose and confident.
export default function Hero({ onSelect }: { onSelect: (e: IndustryEntry) => void }) {
  return (
    <motion.div exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      {/* ── Minimal top bar ── */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-signal font-dot text-[0.8rem] font-bold text-black">L</span>
            <span className="dot-label text-[0.95rem] text-paper">GPT ADS LIBRARY</span>
          </div>
          <span className="hidden items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/40 md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" /> Live ad intelligence
          </span>
        </div>
      </header>

      {/* ── Hero (full viewport) ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        <FloatingAds />

        <motion.div
          variants={staggerParent(0.08)}
          initial="hidden"
          animate="show"
          className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-paper/12 bg-paper/[0.03] px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="dot-label text-[0.6875rem] text-paper/60">EVERY AD INSIDE CHATGPT</span>
          </motion.div>

          <h1 className="mb-6 font-display text-hero leading-[1.08] text-paper">
            <motion.span variants={fadeUp} className="block">THE AD LIBRARY</motion.span>
            <motion.span variants={fadeUp} className="block">
              FOR <span className="text-signal">CHATGPT</span>
            </motion.span>
          </h1>

          <motion.p variants={fadeUp} className="mb-10 max-w-md font-sans text-lg leading-relaxed text-paper/55">
            Type your market. See the ads, the advertisers behind them, and the prompts they show up on.
          </motion.p>

          <motion.div variants={fadeUp} className="w-full">
            <SearchBar onSelect={onSelect} />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <span className="dot-label text-eyebrow text-paper/30">TRY</span>
            {INDUSTRY_LIST.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="rounded-full border border-paper/12 bg-paper/[0.02] px-4 py-1.5 font-sans text-sm text-paper/70 backdrop-blur-sm transition-all duration-200 hover:border-signal/60 hover:bg-paper/[0.05] hover:text-paper"
              >
                {e.label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </motion.div>
  );
}
