import { motion } from "motion/react";

export type ViewId = "overview" | "ads" | "competitors" | "blueocean" | "prompts";

export const VIEWS: { id: ViewId; label: string; index: string }[] = [
  { id: "overview", label: "Overview", index: "01" },
  { id: "ads", label: "Ads Running", index: "02" },
  { id: "competitors", label: "Competitors", index: "03" },
  { id: "blueocean", label: "Blue Ocean", index: "04" },
  { id: "prompts", label: "Prompts", index: "05" },
];

export default function ViewNav({ active, onChange }: { active: ViewId; onChange: (v: ViewId) => void }) {
  return (
    <nav className="flex gap-1 border-b border-ink-200">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className="relative px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] transition-colors"
        >
          <span className={active === v.id ? "text-ink-950" : "text-ink-400 hover:text-ink-700"}>
            <span className="mr-1.5 text-ink-300">{v.index}</span>
            {v.label}
          </span>
          {active === v.id && (
            <motion.span
              layoutId="nav-underline"
              className="absolute inset-x-0 -bottom-px h-0.5 bg-signal"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
