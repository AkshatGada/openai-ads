"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import IndustrySearch from "@/components/IndustrySearch";
import FloatingCreatives from "@/components/FloatingCreatives";
import WaitlistForm from "@/components/WaitlistForm";
import { suggestIndustries } from "@/lib/data";
import type { IndustryEntry } from "@/lib/data";
import { fadeUp, staggerParent, EASE_OUT, DUR } from "@/motion/transitions";

export default function HomePage() {
  const router = useRouter();
  const industries = suggestIndustries("");

  function handleSelect(entry: IndustryEntry) {
    router.push(`/${entry.id}/advertisers`);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE_OUT } }}
    >
      {/* ── Hero ── */}
      <section
        aria-label="Hero"
        className="relative flex min-h-[calc(100vh-57px)] flex-col items-center justify-center overflow-hidden px-6"
      >
        <FloatingCreatives />

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)", opacity: 0.6 }}
        />

        <motion.div
          variants={staggerParent(0.12)}
          initial="hidden"
          animate="show"
          className="relative z-10 -mt-12 flex w-full max-w-3xl flex-col items-center gap-6"
        >
          {/* Eyebrow badge */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-sans text-[11px] font-medium tracking-wide text-accent">
              ChatGPT ads are live — browse real probe data
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-center text-hero font-bold tracking-tighter2 text-text md:font-extrabold"
          >
            See every ad
            <br />
            on <span className="text-accent">ChatGPT</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="max-w-xl text-center font-sans text-base text-text-muted md:text-lg"
          >
            Track every advertiser, creative, and trigger prompt across any industry.
            The first public database of{" "}
            <strong className="text-text">ChatGPT ads</strong> — updated with real
            probe data, not estimates.
          </motion.p>

          {/* Search */}
          <motion.div variants={fadeUp} className="w-full max-w-2xl">
            <IndustrySearch onSelect={handleSelect} />
          </motion.div>

          {/* Industry chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-sans text-xs text-text-faint">Popular:</span>
            {industries.map((e) => (
              <button
                key={e.id}
                onClick={() => handleSelect(e)}
                className="rounded-full border border-border bg-surface/80 px-4 py-1.5 font-sans text-sm text-text-muted backdrop-blur-md transition-all duration-200 hover:border-accent/50 hover:bg-accent-soft hover:text-text"
              >
                {e.label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section
        aria-label="Platform stats"
        className="border-y border-border bg-surface/30"
      >
        <div className="mx-auto max-w-[1320px] px-6 py-10 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="grid grid-cols-2 gap-6 md:grid-cols-5"
          >
            <StatItem value="116" label="Probes collected" />
            <StatItem value="9" label="Ads detected" />
            <StatItem value="5" label="Advertisers tracked" />
            <StatItem value="2" label="Industries" />
            <StatItem value="Real" label="Probe data" />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        aria-label="How it works"
        className="mx-auto w-full max-w-[1320px] px-6 pb-20 pt-20 md:px-10 md:pb-28 md:pt-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="mb-12 text-center"
        >
          <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
            How it works
          </p>
          <h2 className="font-sans text-2xl font-semibold text-text md:text-3xl">
            Three signals that define your competitive edge
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="grid gap-6 md:grid-cols-3"
        >
          {/* Signal 1 */}
          <article className="group rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-border-strong hover:shadow-lg">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <path d="M21 21H3V3"/><path d="M7 14l4-4 4 4 4-6"/>
              </svg>
            </div>
            <h3 className="mb-2 font-sans text-[15px] font-semibold text-text">
              Ad-triggered prompts
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              See exactly which prompts trigger ads in your industry. Filter by ads-served vs.
              organic-only. Track how ad density shifts week to week.
            </p>
          </article>

          {/* Signal 2 */}
          <article className="group rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-border-strong hover:shadow-lg">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
              </svg>
            </div>
            <h3 className="mb-2 font-sans text-[15px] font-semibold text-text">
              Advertiser intelligence
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              Which brands are running ads in your category. Their creatives, frequency, and
              messaging. Spot new entrants before they scale.
            </p>
          </article>

          {/* Signal 3 */}
          <article className="group rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-border-strong hover:shadow-lg">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3 className="mb-2 font-sans text-[15px] font-semibold text-text">
              Prompt-level targeting
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              Every ad links to the prompt that surfaced it. Reverse-engineer competitor context
              hints and find the unclaimed prompts in your space.
            </p>
          </article>
        </motion.div>
      </section>

      {/* ── Waitlist CTA ── */}
      <section
        aria-label="Waitlist"
        className="border-t border-border bg-surface/20"
      >
        <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <h2 className="font-sans text-xl font-semibold text-text md:text-2xl">
              New industries drop every week
            </h2>
            <p className="max-w-md font-sans text-sm text-text-muted">
              AI advertising is scaling fast. Be the first to know when your vertical goes live.
            </p>
            <WaitlistForm />
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        aria-label="Frequently asked questions"
        className="mx-auto w-full max-w-[1320px] px-6 pb-32 md:px-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
        >
          <p className="mb-3 text-center font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
            FAQ
          </p>
          <h2 className="mb-10 text-center font-sans text-2xl font-semibold text-text md:text-3xl">
            What are <span className="text-accent">ChatGPT Ads</span>?
          </h2>

          <div className="mx-auto max-w-3xl space-y-5 font-sans text-sm leading-relaxed text-text-muted md:text-[15px]">
            <p>
              <strong className="text-text">ChatGPT Ads</strong> (also called OpenAI Ads)
              are sponsored messages inside ChatGPT conversations. When a user asks about a
              product or topic, an advertiser&apos;s card appears alongside the AI response.
              Unlike search ads that match keywords, ChatGPT ads match on semantic{" "}
              <strong className="text-text">context hints</strong> — the meaning and intent
              behind a conversation.
            </p>
            <p>
              The ad surface scaled dramatically in May 2026. What started as a beta has become
              the fastest-growing ad platform since Google and Meta. Understanding who runs ads,
              what they say, and which prompts trigger them is now a competitive necessity.
            </p>
            <p>
              ChatGPT Ads Library catalogs every ad we detect inside ChatGPT, organized by
              industry. Search your vertical to see which companies are advertising — and what
              they&apos;re testing.
            </p>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="tnum font-sans text-[28px] font-medium tracking-tight text-text">{value}</span>
      <span className="font-sans text-xs text-text-faint">{label}</span>
    </div>
  );
}
