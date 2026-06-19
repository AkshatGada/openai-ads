import type { Transition, Variants } from "motion/react";

// ── Spring tokens ──────────────────────────────────────────────
// Critically-damped (ζ≈1) for professional settle — no bounce.
// See DESIGN_RESEARCH.md §4.

export const SPRING: Transition = { type: "spring", stiffness: 300, damping: 30 };
export const SPRING_TAP: Transition = { type: "spring", stiffness: 500, damping: 30 };
export const SPRING_HEAVY: Transition = { type: "spring", stiffness: 200, damping: 40 };

// ── Easing curves ──────────────────────────────────────────────
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN: [number, number, number, number] = [0.7, 0, 0.84, 0];
export const EASE_INOUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

// ── Duration (seconds) ─────────────────────────────────────────
export const DUR = { fast: 0.15, base: 0.25, slow: 0.4 } as const;

// ── Composite variants ─────────────────────────────────────────

export const staggerParent = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE_OUT } },
};

export const lineReveal: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: DUR.slow, ease: EASE_OUT } },
};

// View crossfade + small slide.
export const viewSwap: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE_IN } },
};

// Drawer slide from right.
export const drawerIn: Variants = {
  hidden: { x: "100%" },
  show: { x: 0, transition: SPRING },
  exit: { x: "100%", transition: { duration: DUR.base, ease: EASE_IN } },
};
