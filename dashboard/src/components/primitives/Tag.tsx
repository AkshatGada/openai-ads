import type { Competition, GapValue } from "../../lib/format";

type Variant = "default" | "signal" | Competition | GapValue;

const STYLES: Record<string, string> = {
  default: "border-ink-300 text-ink-600",
  signal: "border-signal text-signal",
  none: "border-ink-200 text-ink-400",
  low: "border-ink-300 text-ink-500",
  medium: "border-ink-500 text-ink-700",
  high: "border-ink-900 text-ink-950 bg-ink-950/[0.04]",
  LOW: "border-ink-300 text-ink-500",
  MEDIUM: "border-ink-500 text-ink-700",
  HIGH: "border-signal text-signal bg-signal/[0.06]",
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] ${
        STYLES[variant] ?? STYLES.default
      }`}
    >
      {children}
    </span>
  );
}
