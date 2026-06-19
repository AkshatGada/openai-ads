import { motion } from "motion/react";
import IndustrySearch from "./IndustrySearch";
import FloatingCreatives from "./FloatingCreatives";
import { INDUSTRY_LIST, type IndustryEntry } from "../lib/registry";
import { fadeUp, staggerParent, EASE_OUT, DUR } from "../motion/transitions";

export default function Landing({
  onSelect,
}: {
  onSelect: (entry: IndustryEntry) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE_OUT } }}
      className="relative flex min-h-[calc(100vh-57px)] flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* ── Floating ad creatives in background ── */}
      <FloatingCreatives />

      {/* ── Subtle radial glow behind hero ── */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
          opacity: 0.6,
        }}
      />

      {/* ── Hero ── */}
      <motion.div
        variants={staggerParent(0.12)}
        initial="hidden"
        animate="show"
        className="relative z-10 -mt-12 flex w-full max-w-3xl flex-col items-center gap-7"
      >
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-center font-display text-5xl font-bold leading-[1.05] tracking-tighter2 text-text md:text-7xl"
        >
          Who's advertising
          <br />
          on <span className="text-accent">ChatGPT?</span>
        </motion.h1>

        {/* Search bar */}
        <motion.div variants={fadeUp} className="w-full max-w-2xl">
          <IndustrySearch onSelect={onSelect} />
        </motion.div>

        {/* Industry chips */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2.5">
          {INDUSTRY_LIST.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className="rounded-full border border-border bg-surface/80 px-4 py-2 font-sans text-sm text-text-muted backdrop-blur-md transition-all duration-200 hover:border-accent/60 hover:bg-accent-soft hover:text-text"
            >
              {e.label}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
