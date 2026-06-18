import { motion } from "motion/react";
import { EASE_OUT } from "../../motion/transitions";

// 0–10 bar. Signal blue when high-intent (>=7), else grayscale weight.
export default function IntentMeter({ value, animate = true }: { value: number; animate?: boolean }) {
  const pct = Math.max(0, Math.min(10, value)) / 10;
  const hot = value >= 7;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-20 overflow-hidden rounded-sm bg-ink-200">
        <motion.div
          className={`absolute inset-y-0 left-0 origin-left ${hot ? "bg-signal" : "bg-ink-700"}`}
          style={{ width: `${pct * 100}%` }}
          initial={animate ? { scaleX: 0 } : false}
          whileInView={animate ? { scaleX: 1 } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
      </div>
      <span className={`tnum font-mono text-xs ${hot ? "text-signal" : "text-ink-500"}`}>
        {value.toFixed(value % 1 === 0 ? 0 : 1)}
      </span>
    </div>
  );
}
