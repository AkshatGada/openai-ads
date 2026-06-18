import { motion, useReducedMotion } from "motion/react";

// Real ad creatives observed in ChatGPT (across markets) — the product showing
// itself. These drift in an asymmetric cluster behind/around the hero headline.
interface FloatAd {
  advertiser: string;
  title: string;
  body: string;
  // layout: position + scale + drift timing, hand-tuned for an organic cluster
  x: string;
  y: string;
  scale: number;
  delay: number;
  drift: number; // px of vertical float
}

const ADS: FloatAd[] = [
  { advertiser: "Stripe", title: "Payments, built for scale", body: "Accept money in 135+ currencies with one integration.", x: "4%", y: "12%", scale: 0.92, delay: 0.1, drift: 14 },
  { advertiser: "Zillow", title: "Find your next home", body: "Browse millions of listings with photos and price history.", x: "70%", y: "6%", scale: 0.86, delay: 0.35, drift: -18 },
  { advertiser: "Mastercard", title: "Stablecoin settlement", body: "Move value across borders in seconds, not days.", x: "76%", y: "54%", scale: 0.95, delay: 0.55, drift: 16 },
  { advertiser: "Rocket Mortgage", title: "Get approved in minutes", body: "See real rates and lock yours online today.", x: "2%", y: "58%", scale: 0.83, delay: 0.7, drift: -12 },
  { advertiser: "Ramp", title: "Spend less time on expenses", body: "Corporate cards and automated bookkeeping in one place.", x: "40%", y: "72%", scale: 0.78, delay: 0.85, drift: 20 },
];

export default function FloatingAds() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ADS.map((ad) => (
        <motion.div
          key={ad.advertiser}
          className="absolute hidden w-64 lg:block"
          style={{ left: ad.x, top: ad.y, scale: ad.scale }}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 0.9, y: 0, filter: "blur(0px)" }}
          transition={{ delay: ad.delay + 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, ad.drift, 0] }}
            transition={{ duration: 7 + ad.delay * 3, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/90">{ad.advertiser}</span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-white/30">Sponsored</span>
            </div>
            <p className="text-sm font-medium text-white">{ad.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{ad.body}</p>
          </motion.div>
        </motion.div>
      ))}
      {/* radial vignette so cards fade toward the center where the headline sits */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_45%,rgba(10,10,10,0.85)_35%,transparent_100%)]" />
    </div>
  );
}
