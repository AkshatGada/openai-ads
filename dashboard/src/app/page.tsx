"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import IndustrySearch from "@/components/IndustrySearch";
import FloatingCreatives from "@/components/FloatingCreatives";
import WaitlistForm from "@/components/WaitlistForm";
import { suggestIndustries } from "@/lib/data";
import type { IndustryEntry } from "@/lib/data";
import type { IndustryData } from "@/lib/types";
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
            The first public database of ChatGPT ads.
          </motion.p>

          {/* Search */}
          <motion.div variants={fadeUp} className="w-full max-w-2xl">
            <IndustrySearch onSelect={handleSelect} />
          </motion.div>

          {/* Industry chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-sans text-xs text-text-faint">Explore:</span>
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

      {/* ── Data section ── */}
      <DataShowcase />

      {/* ── Waitlist ── */}
      <section aria-label="Waitlist" className="border-t border-border bg-surface/20">
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
    </motion.div>
  );
}

/* ── Data Showcase ── */
function DataShowcase() {
  const [oms, setOms] = useState<IndustryData | null>(null);
  const [realEstate, setRealEstate] = useState<IndustryData | null>(null);

  useEffect(() => {
    fetch("/api/industries/oms")
      .then((r) => r.json())
      .then(setOms)
      .catch(() => {});
    fetch("/api/industries/real-estate")
      .then((r) => r.json())
      .then(setRealEstate)
      .catch(() => {});
  }, []);

  const allProbes = [...(oms?.probes ?? []), ...(realEstate?.probes ?? [])];
  const totalProbes = allProbes.length;
  const totalAds = allProbes.reduce((s, p) => s + p.ads.length, 0);

  // Aggregate advertisers across all probes
  const advertiserMap = new Map<string, number>();
  for (const p of allProbes) {
    for (const ad of p.ads) {
      const name = ad.advertiser || "Unknown";
      advertiserMap.set(name, (advertiserMap.get(name) ?? 0) + 1);
    }
  }
  const topAdvertisers = [...advertiserMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxCount = topAdvertisers[0]?.[1] ?? 1;

  return (
    <>
      {/* ── Stats ── */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-0 divide-x divide-border md:grid-cols-4">
          <StatBox value={totalProbes.toLocaleString()} label="Prompts analyzed" />
          <StatBox value={totalAds.toLocaleString()} label="Ads detected" />
          <StatBox value={advertiserMap.size.toLocaleString()} label="Advertisers tracked" />
          <StatBox value="2" label="Industries covered" />
        </div>
      </section>

      {/* ── Leaderboard ── */}
      <section className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
        >
          <div className="mb-10">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
              Leaderboard
            </p>
            <h2 className="font-sans text-2xl font-semibold text-text md:text-3xl">
              Brands showing up most in AI ads
            </h2>
            <p className="mt-2 font-sans text-sm text-text-muted">
              The advertisers appearing most often across all tracked ChatGPT prompts.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {topAdvertisers.map(([name, count], i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, ease: EASE_OUT, delay: i * 0.04 }}
                className="flex items-center gap-5 border-b border-border px-6 py-4 last:border-b-0 transition-colors hover:bg-surface-2"
              >
                <span className="tnum w-7 text-right font-sans text-sm text-text-faint">
                  {i + 1}
                </span>
                <span className="w-36 shrink-0 truncate font-sans text-sm font-medium text-text">
                  {name}
                </span>
                <div className="relative h-8 flex-1">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-sm bg-accent-soft"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(count / maxCount) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.04 + 0.2 }}
                  />
                </div>
                <span className="tnum w-16 text-right font-sans text-sm text-text-muted">
                  {count} ad{count > 1 ? "s" : ""}
                </span>
              </motion.div>
            ))}

            {topAdvertisers.length === 0 && (
              <div className="px-6 py-12 text-center font-sans text-sm text-text-faint">
                Loading advertiser data…
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── What an ad looks like ── */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
          >
            <div className="mb-10 text-center">
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
                What an ad looks like
              </p>
              <h2 className="font-sans text-2xl font-semibold text-text md:text-3xl">
                How a sponsored ad shows up in ChatGPT
              </h2>
              <p className="mt-2 font-sans text-sm text-text-muted">
                A representative look at ChatGPT's native sponsored card format, using real brands from our data.
              </p>
            </div>

            <div className="mx-auto max-w-[560px] overflow-hidden rounded-2xl border border-border bg-[#1b1d24] shadow-2xl">
              {/* ChatGPT header bar */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <span className="font-sans text-[13px] font-medium text-white/80">ChatGPT</span>
                <span className="ml-auto font-sans text-[11px] text-white/30">5:24 PM</span>
              </div>

              {/* Prompt */}
              <div className="flex justify-end px-4 pt-4 pb-2">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5">
                  <p className="font-sans text-[13px] leading-relaxed text-text">
                    best crypto exchange with REST API for automated trading
                  </p>
                </div>
              </div>

              {/* AI response + ad */}
              <div className="px-4 pt-2 pb-4">
                <p className="mb-4 font-sans text-[13px] leading-relaxed text-white/70">
                  For automated trading bots, the exchanges with the most reliable REST APIs are Binance, Bybit, and Kraken —
                  all offering WebSocket support and low-latency endpoints.
                </p>

                {/* Ad card */}
                <div className="rounded-xl border border-white/[0.08] bg-[#252830] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-sans text-[13px] font-semibold text-white/90">Mastercard</span>
                    <span className="font-sans text-[10px] text-white/30">Sponsored</span>
                  </div>
                  <p className="mb-1 font-sans text-[14px] font-medium leading-snug text-white">
                    Payments Strategy
                  </p>
                  <p className="font-sans text-[12px] leading-relaxed text-white/50">
                    Payments strategy, economic, AI advisory.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="border-t border-white/[0.06] px-4 py-2.5">
                <p className="font-sans text-[11px] text-white/20">
                  Ads do not influence the answers you get from ChatGPT. Your chats stay private.
                </p>
              </div>

              {/* Input bar */}
              <div className="border-t border-white/[0.06] px-4 py-3">
                <div className="rounded-full border border-white/[0.08] bg-[#252830] px-4 py-2">
                  <span className="font-sans text-[13px] text-white/25">Ask anything</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Industry breakdown ── */}
      <IndustryBreakdown oms={oms} realEstate={realEstate} totalProbes={totalProbes} />

      {/* ── How it works ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="mb-12 text-center"
          >
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
              How it works
            </p>
            <h2 className="font-sans text-2xl font-semibold text-text md:text-3xl">
              Three signals that track your competitive edge
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="grid gap-6 md:grid-cols-3"
          >
            <article className="rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:bg-surface-2">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <path d="M21 21H3V3"/><path d="M7 14l4-4 4 4 4-6"/>
                </svg>
              </div>
              <h3 className="mb-2 font-sans text-[15px] font-semibold text-text">Ad-triggered prompts</h3>
              <p className="font-sans text-sm leading-relaxed text-text-muted">
                See exactly which prompts trigger ads in your industry. Track how ad density shifts
                across different query patterns and find the unclaimed prompts in your space.
              </p>
            </article>

            <article className="rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:bg-surface-2">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                </svg>
              </div>
              <h3 className="mb-2 font-sans text-[15px] font-semibold text-text">Advertiser intelligence</h3>
              <p className="font-sans text-sm leading-relaxed text-text-muted">
                Which brands run ads in your category. Creative variations, frequency, and new
                advertisers entering your space. Period-over-period change.
              </p>
            </article>

            <article className="rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:bg-surface-2">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <h3 className="mb-2 font-sans text-[15px] font-semibold text-text">Prompt-level targeting</h3>
              <p className="font-sans text-sm leading-relaxed text-text-muted">
                Every ad links to the prompt that surfaced it. Reverse-engineer competitor context
                hints and understand which user intents they target.
              </p>
            </article>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function IndustryBreakdown({
  oms,
  realEstate,
  totalProbes,
}: {
  oms: IndustryData | null;
  realEstate: IndustryData | null;
  totalProbes: number;
}) {
  const industries = [
    {
      name: "Stablecoin & Payments",
      slug: "oms",
      probes: oms?.probes?.length ?? 0,
      ads: oms?.probes?.reduce((s, p) => s + p.ads.length, 0) ?? 0,
      advertisers: oms?.patterns?.advertisers?.length ?? 0,
      tagline: "Crypto exchanges, payment APIs, fintech infrastructure",
    },
    {
      name: "Real Estate",
      slug: "real-estate",
      probes: realEstate?.probes?.length ?? 0,
      ads: realEstate?.probes?.reduce((s, p) => s + p.ads.length, 0) ?? 0,
      advertisers: realEstate?.patterns?.advertisers?.length ?? 0,
      tagline: "Property listings, mortgage providers, real estate SaaS",
    },
  ];

  const maxAds = Math.max(1, ...industries.map((i) => i.ads));

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
        >
          <div className="mb-10">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
              By industry
            </p>
            <h2 className="font-sans text-2xl font-semibold text-text md:text-3xl">
              Which industries run the most ads
            </h2>
            <p className="mt-2 font-sans text-sm text-text-muted">
              Industries we track, ranked by ad volume from {totalProbes.toLocaleString()} analyzed prompts.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {industries.map((ind, i) => (
              <motion.a
                key={ind.slug}
                href={`/${ind.slug}/advertisers`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: i * 0.08 }}
                className="group rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-border-strong hover:bg-surface-2"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-sans text-[15px] font-semibold text-text group-hover:text-accent transition-colors">
                    {ind.name}
                  </h3>
                  <span className="tnum font-sans text-[13px] text-text-faint">
                    {ind.ads} ads
                  </span>
                </div>

                <div className="mb-3 relative h-2 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-accent"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(ind.ads / maxAds) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.08 + 0.3 }}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <span className="tnum font-sans text-[28px] font-medium tracking-tight text-text">
                    {ind.probes}
                  </span>
                  <span className="font-sans text-[13px] text-text-muted leading-tight">
                    prompts<br />analyzed
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="tnum font-sans text-sm text-text-faint">
                      {ind.advertisers} advertisers
                    </span>
                  </div>
                </div>

                <p className="mt-3 font-sans text-xs text-text-faint">{ind.tagline}</p>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
      <span className="tnum font-sans text-[32px] font-medium tracking-tight text-text">{value}</span>
      <span className="font-sans text-[13px] text-text-faint">{label}</span>
    </div>
  );
}
