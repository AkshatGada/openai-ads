import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, animate, useMotionValue, useMotionValueEvent } from "motion/react";
import DotMatrixField from "./gl/DotMatrixField";
import GrainOverlay from "./components/primitives/GrainOverlay";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import { useIndustryData } from "./hooks/useIndustryData";
import { INDUSTRIES, type IndustryEntry, type IndustryId } from "./lib/registry";

type Phase = "hero" | "dashboard";

// Theme endpoints (mirror index.css :root). Animated via a 0..1 MotionValue.
const DARK = { surface: "#0A0A0A", on: "#FAFAFA" };
const LIGHT = { surface: "#FFFFFF", on: "#0A0A0A" };

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

  // LED dot-field uniforms (read by the rAF loop; never trigger React renders).
  const fieldOpacity = useMotionValue(0.9); // bright glowing dots on the dark landing
  const dark = useMotionValue(1); // 1 = dark/glow, 0 = light/grey grid
  // 0 = dark hero, 1 = light dashboard. Drives CSS theme vars.
  const themeT = useMotionValue(0);

  useMotionValueEvent(themeT, "change", (t) => {
    document.documentElement.style.setProperty("--surface", lerpColor(DARK.surface, LIGHT.surface, t));
    document.documentElement.style.setProperty("--on-surface", lerpColor(DARK.on, LIGHT.on, t));
  });

  const selectIndustry = (entry: IndustryEntry) => setIndustryId(entry.id);

  // When data is ready while in hero, run the dark→light flip + dim the field.
  useEffect(() => {
    if (phase === "hero" && data.status === "ready") {
      const ease = [0.16, 1, 0.3, 1] as const;
      animate(themeT, 1, { duration: 0.7, ease });
      animate(dark, 0, { duration: 0.7, ease }); // dots invert: glow → grey grid
      animate(fieldOpacity, 0.5, { duration: 0.7, ease }); // faint behind white dashboard
      setPhase("dashboard");
    }
  }, [data.status, phase, themeT, dark, fieldOpacity]);

  const reset = (entry: IndustryEntry) => setIndustryId(entry.id);

  return (
    <MotionConfig reducedMotion="user">
      {/* Above the AnimatePresence boundary → continuous through the morph. */}
      <DotMatrixField opacity={fieldOpacity} dark={dark} />
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

      {phase === "hero" && data.status === "loading" && (
        <div className="dot-label pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 text-eyebrow uppercase text-paper/50">
          Loading
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
