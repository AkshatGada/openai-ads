import { motion } from "motion/react";
import type { Theme } from "../lib/theme";
import { EASE_OUT, DUR } from "../motion/transitions";

// ── Theme toggle button ────────────────────────────────────────
// Circle reveal via View Transitions API when supported, falls back
// to instant toggle otherwise.
function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const handleToggle = () => {
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => onToggle());
    } else {
      onToggle();
    }
  };

  const isDark = theme === "dark";
  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`${isDark ? "Light" : "Dark"} mode`}
      className="grid h-8 w-8 place-items-center rounded-md border border-border text-text-muted transition-colors duration-150 hover:border-border-strong hover:text-text"
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: DUR.fast, ease: EASE_OUT }}
        className="text-sm leading-none"
      >
        {isDark ? "◐" : "◑"}
      </motion.span>
    </button>
  );
}

// ── Header ─────────────────────────────────────────────────────
// Persistent top bar. Logo + wordmark on the left, breadcrumb slot
// in the center, ⌘K hint + theme toggle on the right.
export interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  breadcrumb?: React.ReactNode;
  onCommandPalette?: () => void;
}

export default function Header({ theme, onToggleTheme, breadcrumb, onCommandPalette }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-6 py-3 md:px-10">
        {/* ── Logo + wordmark ── */}
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-accent-fg">
            G
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-text">
            ChatGPT Ads Library
          </span>
        </div>

        {/* ── Breadcrumb (optional, center-left) ── */}
        {breadcrumb && (
          <div className="hidden items-center gap-2 text-text-faint sm:flex">
            <span className="text-text-faint">/</span>
            {breadcrumb}
          </div>
        )}

        {/* ── Right cluster ── */}
        <div className="ml-auto flex items-center gap-3">
          {/* ⌘K hint */}
          <button
            onClick={onCommandPalette}
            className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-text-faint transition-colors duration-150 hover:border-border-strong hover:text-text-muted sm:flex"
          >
            <span>⌘K</span>
          </button>

          {/* Theme toggle */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
