import type { Transition, Variants } from "motion/react";

// ONE spring, ONE ease — the house motion language (mechanical, decisive).
export const SPRING: Transition = { type: "spring", stiffness: 260, damping: 30, mass: 1 };
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const DUR = { fast: 0.18, base: 0.32, slow: 0.6 } as const;

// Staggered container (hero load, card lists).
export const staggerParent = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// Fade-up child.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};

// Clip-path line reveal (mask-up) for display headlines.
export const lineReveal: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: DUR.slow, ease: EASE_OUT } },
};

// View crossfade + small slide.
export const viewSwap: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE_OUT } },
};
