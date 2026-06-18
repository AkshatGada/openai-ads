import type { Config } from "tailwindcss";

// Tokens are the contract from design.md ("Monochrome Recon"). Do not add colors.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0A",
          900: "#141414",
          800: "#1F1F1F",
          700: "#2E2E2E",
          600: "#525252",
          500: "#6B6B6B",
          400: "#A3A3A3",
          300: "#C9C9C9",
          200: "#E5E5E5",
          100: "#F2F2F2",
          50: "#FAFAFA",
        },
        paper: "#FFFFFF",
        signal: "#1A3CFF",
      },
      fontFamily: {
        // Professional, clean sans for everything; mono for data/prompts.
        // Metric-matched fallback declared in index.css to suppress CLS.
        display: ['"Geist"', '"Geist Fallback"', "system-ui", "sans-serif"],
        sans: ['"Geist"', '"Geist Fallback"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "2px", md: "4px", lg: "8px" },
      letterSpacing: {
        eyebrow: "0.18em",
        tightish: "-0.02em",
        tighter2: "-0.03em",
      },
      fontSize: {
        // Sans display: large but engineered (tight tracking), not editorial-huge.
        hero: ["clamp(2.75rem, 6.5vw, 6rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        display: ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.18em" }],
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        inout: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
