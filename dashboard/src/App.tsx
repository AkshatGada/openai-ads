import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, animate, useMotionValue, useMotionValueEvent } from "motion/react";
import DitherField from "./gl/DitherField";
import GrainOverlay from "./components/primitives/GrainOverlay";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import { useIndustryData } from "./hooks/useIndustryData";
import { INDUSTRIES, type IndustryEntry, type IndustryId } from "./lib/registry";

type Phase = "hero" | "dashboard";

// Theme endpoints (mirror index.css :root). Animated via --theme MotionValue.
const DARK = { surface: "#0A0A0A", on: "#FAFAFA" };
const LIGHT = { surface: "#FAFAFA", on: "#0A0A0A" };

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i]! - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("hero");
  const [industryId, setIndustryId] = useState<IndustryId | null>(null);
  const data = useIndustryData(industryId);

  // Dither uniforms (read by the rAF loop; never trigger React renders).
  const threshold = useMotionValue(0.5);
  // Calmer field behind the now text-heavy scrollable landing (was 1.0).
  const opacity = useMotionValue(0.55);
  // 0 = dark (hero), 1 = light (dashboard). Drives CSS theme vars.
  const themeT = useMotionValue(0);

  // Paint theme vars on the document as themeT animates.
  useMotionValueEvent(themeT, "change", (t) => {
    document.documentElement.style.setProperty("--surface", lerpColor(DARK.surface, LIGHT.surface, t));
    document.documentElement.style.setProperty("--on-surface", lerpColor(DARK.on, LIGHT.on, t));
  });

  const selectIndustry = (entry: IndustryEntry) => {
    setIndustryId(entry.id);
    // begin loading immediately; the flip waits until data is ready (below)
  };

  // When data becomes ready while in hero, run the develop+flip and switch phase.
  useEffect(() => {
    if (phase === "hero" && data.status === "ready") {
      // The reveal: theme dark→light, dither "develops" (threshold up) + fades back.
      animate(themeT, 1, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
      animate(threshold, 0.82, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
      animate(opacity, 0.045, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
      setPhase("dashboard");
    }
  }, [data.status, phase, themeT, threshold, opacity]);

  const reset = (entry: IndustryEntry) => {
    // switching industry from the dashboard: just reload, stay in light theme
    setIndustryId(entry.id);
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Above the AnimatePresence boundary → continuous through the morph. */}
      <DitherField threshold={threshold} opacity={opacity} />
      <GrainOverlay />

      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {phase === "hero" ? (
            <Hero key="hero" onSelect={selectIndustry} />
          ) : (
            industryId &&
            data.status === "ready" && (
              <Dashboard key="dashboard" entry={INDUSTRIES[industryId]} data={data.data} onSelect={reset} />
            )
          )}
        </AnimatePresence>
      </LayoutGroup>

      {/* Loading hint between selection and ready (rarely visible with local JSON). */}
      {phase === "hero" && data.status === "loading" && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 font-mono text-eyebrow uppercase text-paper/50">
          Developing…
        </div>
      )}
      {data.status === "error" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-signal">
          Load failed: {data.message}
        </div>
      )}
    </MotionConfig>
  );
}
