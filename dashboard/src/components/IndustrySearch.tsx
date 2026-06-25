import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { suggestIndustries, resolveIndustry, type IndustryEntry } from "../lib/registry";
import { EASE_OUT, DUR } from "../motion/transitions";

const EXAMPLES = ["stablecoin payments", "real estate", "crypto exchanges", "pre-IPO stocks", "SaaS tools"];

export default function IndustrySearch({
  onSelect,
  autoFocus = true,
}: {
  onSelect: (entry: IndustryEntry) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = suggestIndustries(query);
  const noMatch = query.trim().length > 0 && suggestions.length === 0;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Typewriter cycling placeholder when not focused and no query.
  useEffect(() => {
    if (focused || query) return;
    let charIdx = 0;
    const current = EXAMPLES[placeholderIdx]!;
    const typeInterval = setInterval(() => {
      if (charIdx <= current.length) {
        setTyped(current.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length);
          setTyped("");
        }, 1800);
      }
    }, 60);
    return () => clearInterval(typeInterval);
  }, [focused, query, placeholderIdx]);

  const submit = (entry?: IndustryEntry) => {
    const resolved = entry ?? resolveIndustry(query) ?? suggestions[0];
    if (resolved) {
      onSelect(resolved);
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-0 flex items-center text-text-faint">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder=""
          aria-label="Industry search"
          aria-expanded={focused && (suggestions.length > 0 || noMatch)}
          aria-activedescendant={focused && suggestions[activeIdx] ? `sug-${activeIdx}` : undefined}
          className="w-full border-b border-border bg-transparent py-3 pl-8 font-sans text-lg text-text caret-accent outline-none transition-colors duration-150 placeholder:text-text-faint focus:border-accent md:text-2xl"
        />
        {/* Typewriter placeholder overlay */}
        {!query && !focused && (
          <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 font-sans text-lg leading-none text-text-faint md:text-2xl">
            try {typed}
            <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-accent align-middle" />
          </span>
        )}
        <kbd className="pointer-events-none absolute right-0 hidden font-mono text-[11px] text-text-faint sm:block">
          ⏎
        </kbd>
      </div>

      <AnimatePresence>
        {focused && (suggestions.length > 0 || noMatch) && (
          <motion.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
            className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
            style={{ backdropFilter: "blur(12px)" }}
          >
            {noMatch ? (
              <li className="px-4 py-4">
                <p className="font-sans text-sm text-text">
                  No data for <span className="text-accent">"{query.trim()}"</span> yet.
                </p>
                <p className="mt-1 font-mono text-xs text-text-faint">
                  Probe it now? → (coming soon)
                </p>
              </li>
            ) : (
              suggestions.map((s, i) => (
                <li
                  key={s.id}
                  id={`sug-${i}`}
                  role="option"
                  aria-selected={i === activeIdx}
                >
                  <button
                    type="button"
                    onMouseDown={() => submit(s)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                      i === activeIdx ? "bg-surface-2" : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-sans text-sm text-text">{s.label}</span>
                      <span className="font-mono text-[11px] text-text-faint">{s.tagline}</span>
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                      {s.id}
                    </span>
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
