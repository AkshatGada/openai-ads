import { motion } from "motion/react";

export type ViewId = "ads" | "prompts" | "advertisers";

export const VIEWS: { id: ViewId; label: string; index: string }[] = [
  { id: "ads", label: "Ad Creatives", index: "01" },
  { id: "prompts", label: "Prompts", index: "02" },
  { id: "advertisers", label: "Advertisers", index: "03" },
];

export default function ViewNav({ active, onChange }: { active: ViewId; onChange: (v: ViewId) => void }) {
  return (
    <nav className="flex gap-1 border-b border-ink-200">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className="dot-label relative px-4 py-3 text-xs uppercase transition-colors"
        >
          <span className={active === v.id ? "text-ink-950" : "text-ink-400 hover:text-ink-700"}>
            <span className={`mr-1.5 ${active === v.id ? "text-signal" : "text-ink-300"}`}>{v.index}</span>
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
