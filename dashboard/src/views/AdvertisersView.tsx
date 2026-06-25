"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import type { IndustryData } from "../lib/types";
import { staggerParent, fadeUp } from "../motion/transitions";

export default function AdvertisersView({ data }: { data: IndustryData }) {
  const freq = data.patterns.competitor_frequency;
  const router = useRouter();
  const params = useParams<{ industry: string }>();
  const industryId = params?.industry ?? "";

  const paid = useMemo(() => freq.filter((f) => f.paid_impressions > 0), [freq]);

  return (
    <div className="flex flex-col gap-8">
      {paid.length > 0 ? (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="label text-text-faint">Running ads</p>
            <span className="font-sans text-xs text-text-faint">{paid.length} advertisers</span>
          </div>
          <motion.div
            variants={staggerParent(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {paid.map((f) => (
              <motion.button
                key={f.company}
                variants={fadeUp}
                onClick={() => router.push(`/${industryId}/ads?advertiser=${encodeURIComponent(f.company)}`)}
                className="group flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 text-left shadow-sm transition-all duration-200 hover:border-border-strong hover:bg-surface-2 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[15px] font-semibold text-text">{f.company}</span>
                  <span className="rounded-md bg-accent-soft px-2.5 py-1 font-sans text-[11px] font-medium text-accent">
                    {f.paid_impressions} ad{f.paid_impressions > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="tnum font-sans text-[28px] font-medium text-text">{f.total_share}</span>
                  <span className="font-sans text-[11px] tracking-wide text-text-faint">appearances</span>
                </div>
                <span className="font-sans text-xs text-text-faint transition-colors group-hover:text-accent">
                  View {f.paid_impressions} creatives →
                </span>
              </motion.button>
            ))}
          </motion.div>
        </section>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <p className="font-sans text-sm text-text-muted">No advertisers detected</p>
          <p className="mt-1 font-sans text-xs text-text-faint">Run probes to collect data</p>
        </div>
      )}
    </div>
  );
}
