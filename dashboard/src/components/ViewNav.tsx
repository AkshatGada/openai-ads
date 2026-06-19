import { motion } from "motion/react";

export type ViewId = "advertisers" | "ads" | "prompts";

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: "advertisers", label: "Advertisers" },
  { id: "ads", label: "Ads" },
  { id: "prompts", label: "Prompts" },
];

export default function ViewNav({ active, onChange }: { active: ViewId; onChange: (v: ViewId) => void }) {
  return (
    <nav className="flex gap-1 border-b border-border">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className="relative px-4 py-2.5 font-sans text-sm transition-colors"
        >
          <span className={active === v.id ? "text-text" : "text-text-faint hover:text-text-muted"}>
            {v.label}
          </span>
          {active === v.id && (
            <motion.span
              layoutId="nav-underline"
              className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
