"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";

const FLOATING_ADS = [
  { advertiser: "Mastercard", title: "Payments Strategy", body: "Payments strategy, economic, AI advisory." },
  { advertiser: "BestMoney", title: "Start Processing Cards", body: "Compare the Top Payment Processing Services in 2026." },
  { advertiser: "Astra Security", title: "AI Powered Offensive Pentests", body: "High quality pentests in hours, not days." },
  { advertiser: "Rippling", title: "SOC 2 Done in Days", body: "No chasing tickets. No fire drills at audit time." },
  { advertiser: "SAP", title: "Build resilient supply chains", body: "AI-driven logistics for global operations." },
  { advertiser: "Pebl", title: "All-in-one business banking", body: "Instant accounts, payments, and invoicing." },
];

const POSITIONS = [
  { x: "6%", y: "18%", depth: 30, delay: 0, rotate: -3 },
  { x: "70%", y: "10%", depth: 50, delay: 0.8, rotate: 2 },
  { x: "12%", y: "62%", depth: 40, delay: 1.6, rotate: 1.5 },
  { x: "76%", y: "58%", depth: 60, delay: 2.4, rotate: -2 },
  { x: "42%", y: "75%", depth: 35, delay: 3.2, rotate: 0.5 },
  { x: "48%", y: "25%", depth: 25, delay: 4.0, rotate: -1 },
];

export default function FloatingCreatives() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    mouseX.set(x * 40);
    mouseY.set(y * 40);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {FLOATING_ADS.map((ad, i) => {
        const pos = POSITIONS[i]!;
        return (
          <FloatingCard key={ad.advertiser} ad={ad} pos={pos} smoothX={smoothX} smoothY={smoothY} index={i} />
        );
      })}
    </div>
  );
}

function FloatingCard({
  ad,
  pos,
  smoothX,
  smoothY,
  index,
}: {
  ad: { advertiser: string; title: string; body: string };
  pos: { x: string; y: string; depth: number; delay: number; rotate: number };
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  index: number;
}) {
  const x = useTransform(smoothX, (v) => v * (pos.depth / 60));
  const y = useTransform(smoothY, (v) => v * (pos.depth / 60));

  return (
    <motion.div
      className="absolute"
      style={{ left: pos.x, top: pos.y, x, y, rotate: pos.rotate }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: [0, 0.28, 0.24],
        scale: 1,
        y: [0, -14, 0],
      }}
      transition={{
        opacity: { duration: 1.8, delay: pos.delay, ease: "easeOut" },
        scale: { duration: 1.8, delay: pos.delay, ease: "easeOut" },
        y: { duration: 9 + index * 1.5, repeat: Infinity, ease: "easeInOut", delay: pos.delay },
      }}
    >
      <div
        className="w-60 rounded-lg border border-border bg-surface p-4 shadow-2xl"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
          <span className="font-sans text-xs font-semibold text-text">{ad.advertiser}</span>
          <span className="font-sans text-[10px] font-medium tracking-wide text-text-faint">Sponsored</span>
        </div>
        <h4 className="mb-1 font-sans text-sm font-medium leading-snug text-text">{ad.title}</h4>
        <p className="font-sans text-xs leading-relaxed text-text-muted">{ad.body}</p>
      </div>
    </motion.div>
  );
}
