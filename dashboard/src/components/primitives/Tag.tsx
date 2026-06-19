type Variant = "default" | "accent" | "positive" | "warning" | "negative";

const STYLES: Record<Variant, string> = {
  default: "border-border text-text-muted",
  accent: "border-accent/40 text-accent bg-accent-soft",
  positive: "border-status-positive/40 text-status-positive bg-status-positive/10",
  warning: "border-status-warning/40 text-status-warning bg-status-warning/10",
  negative: "border-status-negative/40 text-status-negative bg-status-negative/10",
};

export default function Tag({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
