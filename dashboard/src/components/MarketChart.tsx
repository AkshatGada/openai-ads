"use client";

import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label,
} from "recharts";
import type { IndustryData } from "@/lib/types";
import { DUR, EASE_OUT } from "@/motion/transitions";

const ACCENT = "#ff6b3d";
const MUTED = "#5c636f";
const SURFACE = "#16191e";
const BORDER = "#2a2f37";

const tooltipStyle = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "Inter, system-ui, sans-serif",
};

interface Props {
  oms: IndustryData | null;
  realEstate: IndustryData | null;
  topAdvertisers: [string, number][];
}

export default function MarketChart({ oms, realEstate, topAdvertisers }: Props) {
  const omsAds = oms?.probes?.reduce((s, p) => s + p.ads.length, 0) ?? 0;
  const reAds = realEstate?.probes?.reduce((s, p) => s + p.ads.length, 0) ?? 0;

  const pieData = [
    { name: "Stablecoin", value: omsAds, color: ACCENT },
    { name: "Real Estate", value: reAds, color: MUTED },
  ].filter((d) => d.value > 0);

  const barData = topAdvertisers.slice(0, 8).map(([name, count]) => ({
    name: name.length > 21 ? name.slice(0, 21) + "\u2026" : name,
    ads: count,
  }));

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
              Market overview
            </p>
            <h2 className="font-sans text-2xl font-semibold text-text md:text-3xl">
              Ad distribution & volume
            </h2>
            <p className="mt-2 font-sans text-sm text-text-muted">
              Proportion of ads across tracked industries and top advertiser share.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Donut chart */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="mb-5 font-sans text-[13px] font-medium text-text-muted">
                Ad share by industry
              </p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      animationBegin={200}
                      animationDuration={800}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color} fillOpacity={i === 0 ? 1 : 0.45} />
                      ))}
                      <Label
                        value={pieData.reduce((s, d) => s + d.value, 0)}
                        position="center"
                        style={{ fill: "#e6e8eb", fontSize: 22, fontWeight: 500 }}
                      />
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#9aa1ac" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color, opacity: d.name === "Stablecoin" ? 1 : 0.45 }} />
                    <span className="font-sans text-xs text-text-faint">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal bar chart */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="mb-5 font-sans text-[13px] font-medium text-text-muted">
                Top advertisers by volume
              </p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    barSize={18}
                    barGap={6}
                  >
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#5c636f", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,107,61,0.06)" }}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#9aa1ac" }}
                    />
                    <Bar
                      dataKey="ads"
                      radius={[0, 4, 4, 0]}
                      fill={ACCENT}
                      animationBegin={400}
                      animationDuration={600}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
