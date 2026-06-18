import { useRef } from "react";
import { motion } from "motion/react";
import SearchBar from "./SearchBar";
import { INDUSTRY_LIST, type IndustryEntry } from "../lib/registry";
import { staggerParent, fadeUp } from "../motion/transitions";
import { WhyNowSection, HowItWorksSection, WhyMeasureSection, StepsSection, CtaSection } from "./landing/sections";
import FloatingAds from "./landing/FloatingAds";

// Full-fledged scrollable landing page (dark). Hero with the search up top, then
// educational sections about ChatGPT ads, then a CTA back to the search.
export default function Hero({ onSelect }: { onSelect: (e: IndustryEntry) => void }) {
  const topRef = useRef<HTMLDivElement>(null);
  const scrollToSearch = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <motion.div exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      {/* ── Top nav ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-paper/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4 md:px-12">
          <span className="font-display text-base font-semibold tracking-tight text-paper">
            GPT Ads Library
          </span>
          <nav className="hidden gap-8 font-sans text-sm text-paper/50 md:flex">
            <a href="#why-now" className="transition-colors hover:text-paper">Why now</a>
            <a href="#how" className="transition-colors hover:text-paper">How it works</a>
            <a href="#steps" className="transition-colors hover:text-paper">Using it</a>
          </nav>
          <button
            onClick={scrollToSearch}
            className="rounded-md border border-paper/20 px-4 py-1.5 font-sans text-sm text-paper/80 transition-colors hover:border-signal hover:text-paper"
          >
            Search a market
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section ref={topRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* live ad-card showcase drifting behind the headline */}
        <FloatingAds />

        <motion.div
          variants={staggerParent(0.09)}
          initial="hidden"
          animate="show"
          className="relative z-10 flex w-full flex-col items-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-7 flex items-center gap-2 rounded-full border border-paper/15 bg-paper/[0.03] px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-paper/60">
              Ad intelligence for ChatGPT
            </span>
          </motion.div>

          <h1 className="mb-7 max-w-4xl text-center font-display text-hero font-semibold leading-[1.0] text-paper">
            <motion.span variants={fadeUp} className="block">
              The ad library
            </motion.span>
            <motion.span variants={fadeUp} className="block">
              for <span className="text-signal">ChatGPT</span>.
            </motion.span>
          </h1>

          <motion.p variants={fadeUp} className="mb-9 max-w-lg text-center font-sans text-lg leading-relaxed text-paper/55">
            Type your market. See every ad running inside ChatGPT, who is behind it, and the exact prompt that
            brought it up.
          </motion.p>

          <motion.div variants={fadeUp} className="flex w-full justify-center">
            <SearchBar onSelect={onSelect} />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-eyebrow uppercase text-paper/30">Try</span>
            {INDUSTRY_LIST.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="rounded-full border border-paper/15 bg-paper/[0.02] px-4 py-1.5 font-sans text-sm text-paper/70 backdrop-blur-sm transition-colors hover:border-signal hover:text-paper"
              >
                {e.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <motion.button
          onClick={() => document.getElementById("why-now")?.scrollIntoView({ behavior: "smooth" })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 z-10 font-mono text-eyebrow uppercase text-paper/40 transition-colors hover:text-paper"
        >
          ↓ What are ChatGPT ads
        </motion.button>
      </section>

      {/* ── Scrollable educational sections ── */}
      <WhyNowSection />
      <HowItWorksSection />
      <WhyMeasureSection />
      <StepsSection />
      <CtaSection onCta={scrollToSearch} />
    </motion.div>
  );
}
