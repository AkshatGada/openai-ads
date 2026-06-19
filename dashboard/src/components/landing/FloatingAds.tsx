import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";

// Real ad creatives observed in ChatGPT (across markets) — the product showing
// itself. A cursor-reactive, asymmetric, parallax cluster of glass cards behind
// the hero headline. Tasteful dark glassmorphism + brand-tinted shadow.
interface FloatAd {
  advertiser: string;
  title: string;
  body: string;
  x: string;
  y: string;
  scale: number;
  delay: number;
  drift: number; // vertical float px
  depth: number; // parallax strength (further = smaller)
}

const ADS: FloatAd[] = [
  { advertiser: "Stripe", title: "Payments, built to scale", body: "Accept money in 135+ currencies with one integration.", x: "2%", y: "16%", scale: 0.9, delay: 0.1, drift: 14, depth: 26 },
  { advertiser: "Zillow", title: "Find your next home", body: "Millions of listings, photos, and price history.", x: "72%", y: "8%", scale: 0.82, delay: 0.3, drift: -18, depth: 40 },
  { advertiser: "Mastercard", title: "Settle in seconds", body: "Move value across borders, no wire fees.", x: "78%", y: "52%", scale: 0.94, delay: 0.5, drift: 16, depth: 18 },
  { advertiser: "Rocket Mortgage", title: "Approved in minutes", body: "See real rates and lock yours online.", x: "1%", y: "60%", scale: 0.8, delay: 0.66, drift: -12, depth: 44 },
  { advertiser: "Ramp", title: "Spend less on expenses", body: "Corporate cards + automated books in one place.", x: "44%", y: "76%", scale: 0.76, delay: 0.8, drift: 20, depth: 50 },
];

export default function FloatingAds() {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // smooth the pointer for parallax
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduced]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ADS.map((ad) => (
        <ParallaxCard key={ad.advertiser} ad={ad} sx={sx} sy={sy} reduced={!!reduced} />
      ))}
      {/* soft center scrim so the headline stays readable but the LED dots still show through */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_44%_42%_at_50%_46%,rgba(10,10,10,0.72)_25%,rgba(10,10,10,0.25)_60%,transparent_100%)]" />
    </div>
  );
}

function ParallaxCard({
  ad,
  sx,
  sy,
  reduced,
}: {
  ad: FloatAd;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  reduced: boolean;
}) {
  // closer cards (smaller depth) move more with the cursor
  const px = useTransform(sx, (v) => v * ad.depth);
  const py = useTransform(sy, (v) => v * ad.depth);

  return (
    <motion.div
      className="absolute hidden w-60 lg:block"
      style={{ left: ad.x, top: ad.y, x: reduced ? 0 : px, y: reduced ? 0 : py, scale: ad.scale }}
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: ad.delay + 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, ad.drift, 0] }}
        transition={{ duration: 8 + ad.delay * 3, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-2xl border border-white/[0.12] bg-white/[0.045] p-4 shadow-[0_20px_60px_-15px_rgba(26,60,255,0.18),0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-white/90">{ad.advertiser}</span>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-white/30">Sponsored</span>
        </div>
        <p className="text-sm font-medium leading-snug text-white">{ad.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/45">{ad.body}</p>
      </motion.div>
    </motion.div>
  );
}
