"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import IndustrySearch from "@/components/IndustrySearch";
import FloatingCreatives from "@/components/FloatingCreatives";
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
          style={{
            background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
            opacity: 0.6,
          }}
        />

        <motion.div
          variants={staggerParent(0.12)}
          initial="hidden"
          animate="show"
          className="relative z-10 -mt-12 flex w-full max-w-3xl flex-col items-center gap-7"
        >
          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-center text-hero font-bold tracking-tighter2 text-text md:font-extrabold"
          >
            Who&apos;s advertising
            <br />
            on <span className="text-accent">ChatGPT?</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="max-w-lg text-center font-sans text-base text-text-muted md:text-lg"
          >
            The first public database of{" "}
            <strong className="text-text">ChatGPT ads</strong>. See which
            companies are running{" "}
            <strong className="text-text">OpenAI advertising</strong>{" "}
            campaigns, what creatives they use, and which prompts trigger their ads.
          </motion.p>

          {/* Search */}
          <motion.div variants={fadeUp} className="w-full max-w-2xl">
            <IndustrySearch onSelect={handleSelect} />
          </motion.div>

          {/* Industry chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2.5">
            {industries.map((e) => (
              <button
                key={e.id}
                onClick={() => handleSelect(e)}
                className="rounded-full border border-border bg-surface/80 px-4 py-2 font-sans text-sm text-text-muted backdrop-blur-md transition-all duration-200 hover:border-accent/60 hover:bg-accent-soft hover:text-text"
              >
                {e.label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section
        aria-label="How it works"
        className="mx-auto w-full max-w-[1320px] px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="grid gap-8 md:grid-cols-3"
        >
          <article className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur-sm">
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-accent">Discover</div>
            <h3 className="mb-2 font-display text-lg font-semibold text-text">See who advertises on ChatGPT</h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              Browse advertisers across any industry — fintech, real estate, SaaS, ecommerce, and more.
              See every ChatGPT ad creative and the exact prompt that triggers it. The only public{" "}
              <strong>ChatGPT ad intelligence</strong> database.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur-sm">
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-accent">Analyze</div>
            <h3 className="mb-2 font-display text-lg font-semibold text-text">Understand competitor strategy</h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              Track which advertisers appear most often, what{" "}
              <strong>ChatGPT context hints</strong> they target, and which landing pages they send traffic to.
              Spot gaps and opportunities before your competitors do.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur-sm">
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-accent">Monitor</div>
            <h3 className="mb-2 font-display text-lg font-semibold text-text">Stay ahead of the market</h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              New <strong>OpenAI advertisers</strong> appear every week. ChatGPT Ads Library updates regularly
              so you can see who just entered your space — and what they&apos;re testing.
            </p>
          </article>
        </motion.div>
      </section>

      {/* ── FAQ / SEO ── */}
      <section
        aria-label="Frequently asked questions about ChatGPT ads"
        className="mx-auto w-full max-w-[1320px] px-6 pb-32 md:px-10"
      >
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="mb-10 text-center font-display text-2xl font-semibold text-text md:text-3xl"
        >
          What are <span className="text-accent">ChatGPT Ads</span>?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="mx-auto max-w-3xl space-y-6 font-sans text-sm leading-relaxed text-text-muted md:text-base"
        >
          <p>
            <strong className="text-text">ChatGPT Ads</strong> (also called{" "}
            <strong className="text-text">OpenAI Ads</strong>) are sponsored messages that appear
            inside ChatGPT conversations. When a user asks ChatGPT a question related to a product,
            service, or topic, an advertiser&apos;s message may appear alongside the AI&apos;s response.
          </p>
          <p>
            These ads are triggered by{" "}
            <strong className="text-text">context hints</strong> — semantic descriptions of the
            situations where an ad may be useful. Unlike traditional search ads that match on keywords,
            ChatGPT ads match on the meaning and intent behind a conversation.
          </p>
          <p>
            This makes <strong className="text-text">ChatGPT advertising competitive intelligence</strong>{" "}
            critical for marketers. Understanding which context hints your competitors target, what
            ad copy they use, and where they send traffic gives you an edge in the fastest-growing
            ad platform since Google and Meta.
          </p>
          <p>
            ChatGPT Ads Library is the first public tool to catalog and display every ad running inside
            ChatGPT, organized by industry. Search for your vertical above to see which companies are
            already advertising — and what they&apos;re saying.
          </p>
        </motion.div>
      </section>
    </motion.div>
  );
}
