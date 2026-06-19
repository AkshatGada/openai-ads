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
        // Accent — "Ember orange". The only chromatic color, used as signal.
        signal: "#FF5C00",
      },
      fontFamily: {
        // Doto = dot-matrix (display, labels, numbers). Geist = body. Geist Mono = data/prompts.
        dot: ['"Doto"', '"Geist Fallback"', "system-ui", "sans-serif"],
        display: ['"Doto"', '"Geist Fallback"', "system-ui", "sans-serif"],
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
        // Dot-matrix display: blocky, so a touch smaller + airy line-height.
        hero: ["clamp(2.5rem, 5.5vw, 5rem)", { lineHeight: "1.08", letterSpacing: "0.01em" }],
        display: ["clamp(1.75rem, 3.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "0.01em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.2em" }],
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        inout: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
