"use client";

import { useEffect, useState, useMemo } from "react";
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
      <section className="relative flex min-h-[calc(100vh-57px)] flex-col items-center justify-center overflow-hidden px-6">
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
          <motion.h1
            variants={fadeUp}
            className="text-center text-hero font-bold tracking-tighter2 text-text md:font-extrabold"
          >
            See every ad
            <br />
            on <span className="text-accent">ChatGPT</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-center font-sans text-base text-text-muted md:text-lg"
          >
            Track every advertiser, creative, and trigger prompt across any industry.
            The first public database of ChatGPT ads.
          </motion.p>

          <motion.div variants={fadeUp} className="w-full max-w-2xl">
            <IndustrySearch onSelect={handleSelect} />
          </motion.div>

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

      {/* ── Data sections ── */}
      <DataSections />

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

/* ── Data Sections ── */
function DataSections() {
  const [oms, setOms] = useState<IndustryData | null>(null);
  const [enterprise, setEnterprise] = useState<IndustryData | null>(null);
  const [realEstate, setRealEstate] = useState<IndustryData | null>(null);

  useEffect(() => {
    fetch("/api/industries/oms").then((r) => r.json()).then(setOms).catch(() => {});
    fetch("/api/industries/enterprise").then((r) => r.json()).then(setEnterprise).catch(() => {});
    fetch("/api/industries/real-estate").then((r) => r.json()).then(setRealEstate).catch(() => {});
  }, []);

  const totalAdvertisers = useMemo(() => {
    const set = new Set<string>();
    for (const data of [oms, enterprise, realEstate]) {
      for (const p of data?.probes ?? []) {
        for (const a of p.ads) {
          if (a.advertiser) set.add(a.advertiser);
        }
      }
    }
    return set.size;
  }, [oms, enterprise, realEstate]);

  const totalAdPlacements = useMemo(() => {
    let count = 0;
    for (const data of [oms, enterprise, realEstate]) {
      for (const p of data?.probes ?? []) {
        count += p.ads.length;
      }
    }
    return count;
  }, [oms, enterprise, realEstate]);

  // Build leaderboard across all industries
  const leaderboard = useMemo(() => {
    const map = new Map<string, number>();
    for (const data of [oms, enterprise, realEstate]) {
      for (const p of data?.probes ?? []) {
        for (const a of p.ads) {
          const name = a.advertiser || "Unknown";
          map.set(name, (map.get(name) ?? 0) + 1);
        }
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [oms, enterprise, realEstate]);

  const maxCount = leaderboard[0]?.[1] ?? 1;

  return (
    <>
      {/* ── Stats bar ── */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-0 divide-x divide-border md:grid-cols-4">
          <StatCard value={3} label="Industries covered" />
          <StatCard value={totalAdvertisers} label="Advertisers tracked" />
          <StatCard value={totalAdPlacements} label="Ad placements detected" />
          <StatCard value={3} label="Data categories" />
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
              The advertisers appearing most often across all tracked categories, ranked by ad placements.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="hidden md:grid md:grid-cols-12 gap-4 border-b border-border bg-surface-2 px-6 py-3">
              <span className="col-span-1 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">#</span>
              <span className="col-span-5 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">Brand</span>
              <span className="col-span-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">Share of voice</span>
              <span className="col-span-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint text-right">Placements</span>
            </div>

            {leaderboard.map(([name, count], i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, ease: EASE_OUT, delay: i * 0.04 }}
                className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center border-b border-border px-6 py-4 last:border-b-0 transition-colors hover:bg-surface-2"
              >
                <span className="md:col-span-1 tnum font-sans text-sm text-text-faint">{i + 1}</span>
                <span className="md:col-span-5 font-sans text-sm font-medium text-text truncate">{name}</span>
                <div className="md:col-span-3 flex items-center gap-3">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-accent"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(count / maxCount) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.04 + 0.2 }}
                    />
                  </div>
                  <span className="tnum font-sans text-xs text-text-faint w-10 text-right">
                    {((count / totalAdPlacements) * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="md:col-span-3 tnum font-sans text-sm text-text-muted text-right">
                  {count} placements
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Industry breakdown ── */}
      <IndustryCards oms={oms} enterprise={enterprise} realEstate={realEstate} />

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
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <span className="font-sans text-[13px] font-medium text-white/80">ChatGPT</span>
                <span className="ml-auto font-sans text-[11px] text-white/30">5:24 PM</span>
              </div>
              <div className="flex justify-end px-4 pt-4 pb-2">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5">
                  <p className="font-sans text-[13px] leading-relaxed text-text">
                    best crypto exchange with REST API for automated trading
                  </p>
                </div>
              </div>
              <div className="px-4 pt-2 pb-4">
                <p className="mb-4 font-sans text-[13px] leading-relaxed text-white/70">
                  For automated trading bots, the exchanges with the most reliable REST APIs are Binance, Bybit, and Kraken.
                </p>
                <div className="rounded-xl border border-white/[0.08] bg-[#252830] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-sans text-[13px] font-semibold text-white/90">Mastercard</span>
                    <span className="font-sans text-[10px] text-white/30">Sponsored</span>
                  </div>
                  <p className="mb-1 font-sans text-[14px] font-medium leading-snug text-white">Payments Strategy</p>
                  <p className="font-sans text-[12px] leading-relaxed text-white/50">
                    Payments strategy, economic, AI advisory.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/[0.06] px-4 py-2.5">
                <p className="font-sans text-[11px] text-white/20">
                  Ads do not influence the answers you get from ChatGPT. Your chats stay private.
                </p>
              </div>
              <div className="border-t border-white/[0.06] px-4 py-3">
                <div className="rounded-full border border-white/[0.08] bg-[#252830] px-4 py-2">
                  <span className="font-sans text-[13px] text-white/25">Ask anything</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

/* ── Industry Cards ── */
function IndustryCards({
  oms, enterprise, realEstate,
}: {
  oms: IndustryData | null; enterprise: IndustryData | null; realEstate: IndustryData | null;
}) {
  const cards = [
    {
      name: "Stablecoin & Payments",
      slug: "oms",
      description: "Crypto exchanges, stablecoin issuers, payment APIs, and fintech infrastructure companies advertising on ChatGPT.",
      top: getTopAdvertisers(oms, 4),
    },
    {
      name: "Enterprise & Fintech",
      slug: "enterprise",
      description: "B2B SaaS, cybersecurity, compliance, developer tools, and enterprise software brands targeting technical decision makers.",
      top: getTopAdvertisers(enterprise, 4),
    },
    {
      name: "Real Estate",
      slug: "real-estate",
      description: "Property developers, construction tech, modular building suppliers, and real estate platforms reaching builders and buyers.",
      top: getTopAdvertisers(realEstate, 4),
    },
  ];

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
              Which industries buy sponsored ads
            </h2>
            <p className="mt-2 font-sans text-sm text-text-muted">
              Industries we track, with the top advertisers running campaigns in each vertical.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {cards.map((c, i) => (
              <motion.a
                key={c.slug}
                href={`/${c.slug}/advertisers`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: i * 0.08 }}
                className="group rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-border-strong hover:bg-surface-2 hover:shadow-lg"
              >
                <h3 className="mb-3 font-sans text-[17px] font-semibold text-text group-hover:text-accent transition-colors">
                  {c.name}
                </h3>
                <p className="mb-5 font-sans text-sm leading-relaxed text-text-muted">
                  {c.description}
                </p>
                <div className="border-t border-border pt-4">
                  <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">
                    Top advertisers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.top.map((a) => (
                      <span key={a} className="rounded-md border border-border bg-surface-2 px-2.5 py-1 font-sans text-[12px] text-text-muted">
                        {a}
                      </span>
                    ))}
                    {c.top.length === 0 && (
                      <span className="font-sans text-xs text-text-faint">Loading…</span>
                    )}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function getTopAdvertisers(data: IndustryData | null, limit: number): string[] {
  if (!data?.patterns?.competitor_frequency) return [];
  return data.patterns.competitor_frequency
    .filter((c: { paid_impressions: number }) => c.paid_impressions > 0)
    .sort((a: { paid_impressions: number }, b: { paid_impressions: number }) => b.paid_impressions - a.paid_impressions)
    .slice(0, limit)
    .map((c: { company: string }) => c.company);
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
      <span className="tnum font-sans text-[36px] font-semibold tracking-tight text-text">{value.toLocaleString()}</span>
      <span className="font-sans text-[13px] text-text-faint">{label}</span>
    </div>
  );
}
