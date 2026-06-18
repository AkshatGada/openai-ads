import { useInView } from "motion/react";
import { useRef } from "react";
import { useCountUp } from "../../hooks/useCountUp";

// Big tabular numeral with an eyebrow label. No box — separated by hairlines in a row.
export default function StatCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  signal = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  signal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const n = useCountUp(value, inView, decimals);

  return (
    <div ref={ref} className="flex flex-col gap-2 px-6 py-5 first:pl-0">
      <span className="font-mono text-eyebrow uppercase text-ink-400">{label}</span>
      <span className={`tnum font-mono text-4xl tracking-tightish ${signal ? "text-signal" : "text-ink-950"}`}>
        {n.toFixed(decimals)}
        <span className="text-2xl text-ink-400">{suffix}</span>
      </span>
    </div>
  );
}
