import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

/** Animate a number from 0 → target when `active` becomes true. Tabular-nums in CSS. */
export function useCountUp(target: number, active: boolean, decimals = 0): number {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setValue(target);
      return;
    }
    const factor = Math.pow(10, decimals);
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v * factor) / factor),
    });
    return () => controls.stop();
  }, [target, active, reduced, decimals]);

  return value;
}
