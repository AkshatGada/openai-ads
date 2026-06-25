import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { suggestIndustries, resolveIndustry, type IndustryEntry } from "@/lib/data";

// The hero centerpiece. Carries layoutId="recon-search" so it MORPHS from
// hero-center into the dashboard header. `compact` switches the dashboard-header form.
export default function SearchBar({
  compact = false,
  onSelect,
}: {
  compact?: boolean;
  onSelect: (entry: IndustryEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const suggestions = suggestIndustries(query);
  const unknown = query.trim().length > 0 && suggestions.length === 0;

  const submit = (q: string) => {
    const entry = resolveIndustry(q) ?? suggestions[0];
    if (entry) {
      onSelect(entry);
      setQuery("");
      setFocused(false);
    }
  };

  return (
    <motion.div
      layoutId="recon-search"
      className={compact ? "relative w-full max-w-sm" : "relative w-full max-w-2xl"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className="relative"
      >
        <motion.input
          layout="position"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={compact ? "Search another industry…" : "Name your industry…"}
          aria-label="Industry search"
          className={
            compact
              ? "w-full border-b border-ink-300 bg-transparent pb-1.5 font-sans text-sm text-ink-950 caret-signal outline-none placeholder:text-ink-400 focus:border-signal"
              : "w-full border-b-2 border-paper/30 bg-transparent pb-3 text-center font-display text-3xl text-paper caret-signal outline-none transition-colors placeholder:text-paper/30 focus:border-signal md:text-5xl"
          }
        />
      </form>

      <AnimatePresence>
        {focused && (suggestions.length > 0 || unknown) && (
          <motion.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className={`absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-md border ${
              compact ? "border-ink-200 bg-paper" : "border-paper/20 bg-ink-900"
            }`}
          >
            {unknown ? (
              <li className={`px-4 py-3 font-mono text-xs ${compact ? "text-ink-400" : "text-paper/50"}`}>
                No coverage yet. Try “stablecoin” or “real estate”.
              </li>
            ) : (
              suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={() => submit(s.id)}
                    className={`flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition-colors ${
                      compact ? "hover:bg-ink-100" : "hover:bg-paper/10"
                    }`}
                  >
                    <span className={`font-sans text-sm ${compact ? "text-ink-950" : "text-paper"}`}>{s.label}</span>
                    <span className={`font-mono text-[0.625rem] uppercase tracking-[0.1em] ${compact ? "text-ink-400" : "text-paper/40"}`}>
                      {s.id}
                    </span>
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
