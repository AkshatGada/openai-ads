import { motion } from "motion/react";
import type { IndustryData } from "../lib/types";
import StatCard from "../components/primitives/StatCard";
import SectionHeading from "../components/primitives/SectionHeading";
import Tag from "../components/primitives/Tag";
import { asCompetition, humanize, pct } from "../lib/format";
import { EASE_OUT } from "../motion/transitions";

function DensityRow({ label, ads, probes, rate, competition }: { label: string; ads: number; probes: number; rate: number; competition: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-ink-100 py-3">
      <span className="w-48 shrink-0 font-sans text-sm text-ink-950">{humanize(label)}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-ink-100">
        <motion.div
          className={`absolute inset-y-0 left-0 origin-left ${competition === "high" ? "bg-ink-950" : competition === "medium" ? "bg-ink-600" : competition === "low" ? "bg-ink-400" : "bg-ink-300"}`}
          style={{ width: `${Math.max(rate, 2)}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
      </div>
      <span className="tnum w-16 text-right font-mono text-xs text-ink-500">{pct(rate)}</span>
      <span className="tnum w-20 text-right font-mono text-xs text-ink-400">{ads}/{probes}</span>
      <Tag variant={asCompetition(competition)}>{competition}</Tag>
    </div>
  );
}

export default function OverviewView({ data }: { data: IndustryData }) {
  const p = data.patterns;
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap divide-x divide-ink-200">
        <StatCard label="Prompts Probed" value={p.total_probes} />
        <StatCard label="Ads Observed" value={p.total_ads} />
        <StatCard label="Ad Rate" value={p.ad_rate_pct} suffix="%" decimals={1} signal={p.ad_rate_pct > 0} />
        <StatCard label="Advertisers" value={p.advertisers.length} />
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading index="01" title="Ad density by persona" sub="who's being targeted" />
        <div>
          {p.ad_density_by_persona.map((d) => (
            <DensityRow key={d.persona} label={d.persona} ads={d.ads} probes={d.probes} rate={d.rate} competition={d.competition} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading index="01" title="Ad density by need" sub="which intents draw ads" />
        <div>
          {p.ad_density_by_need.map((d) => (
            <DensityRow key={d.need} label={d.need} ads={d.ads} probes={d.probes} rate={d.rate} competition={d.competition} />
          ))}
        </div>
      </section>
    </div>
  );
}
