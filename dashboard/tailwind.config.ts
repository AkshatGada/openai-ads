import type { Config } from "tailwindcss";

// Design tokens — "Bloomberg terminal redesigned by Apple."
// Cool-cast near-black ground, single teal-cyan accent, hairline structure.
// See dashboard/DESIGN_RESEARCH.md for the full system spec.

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Surfaces — cool-cast near-black (hue 240), stepping in lightness increments.
        // Dark mode is default; light mode tokens are applied via [data-theme="light"].
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        // The single accent — teal-cyan. Signal, not decoration.
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          fg: "var(--accent-fg)",
        },
        // Semantic status — state, not brand. Used on pills, deltas, priority.
        status: {
          positive: "var(--positive)",
          warning: "var(--warning)",
          negative: "var(--negative)",
          info: "var(--info)",
        },
        // Light-mode paper (kept for legacy compatibility during migration).
        paper: "var(--bg)",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "ui-monospace", "monospace"],
        display: ['"Space Grotesk"', '"Inter"', "system-ui", "sans-serif"],
        dot: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        // 13px base, data-density optimized. See DESIGN_RESEARCH.md §2.
        display: ["2.125rem", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "300" }],
        h1: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["1.0625rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["0.9375rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1.45", fontWeight: "400" }],
        label: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.04em", fontWeight: "600" }],
        caption: ["0.6875rem", { lineHeight: "1.4", fontWeight: "400" }],
        metric: ["1.75rem", { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "300" }],
        // Legacy hero size (kept for migration).
        hero: ["clamp(2.5rem, 5.5vw, 5rem)", { lineHeight: "1.08" }],
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.2em" }],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        md: "4px",
        lg: "8px",
        full: "9999px",
      },
      letterSpacing: {
        eyebrow: "0.04em",
        tightish: "-0.02em",
        tighter2: "-0.04em",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        inout: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      // Remove old ink ramp — replaced by semantic tokens above.
      // (Leaving the key present but empty so old class refs error visibly
      //  during migration rather than silently using wrong colors.)
    },
  },
  plugins: [],
} satisfies Config;
