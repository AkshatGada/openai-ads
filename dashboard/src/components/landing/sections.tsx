import { motion } from "motion/react";
import { fadeUp, staggerParent } from "../../motion/transitions";

// Sections alternate LIGHT and dark for rhythm. Copy is written in a sharp,
// human voice — short sentences, real specifics, no em-dashes.

function Eyebrow({ children, on = "light" }: { children: React.ReactNode; on?: "light" | "dark" }) {
  return (
    <p className={`mb-4 font-mono text-eyebrow uppercase ${on === "light" ? "text-signal" : "text-signal"}`}>
      {children}
    </p>
  );
}

function reveal(margin = "-15%") {
  return { variants: fadeUp, initial: "hidden" as const, whileInView: "show" as const, viewport: { once: true, margin } };
}

// ── 01 · Why now — LIGHT, big stat band ──
export function WhyNowSection() {
  const stats = [
    { n: "97%", l: "of ChatGPT answers show no ad at all. The space is wide open." },
    { n: "3%", l: "fill rate today. Get in before the bidding wars start." },
    { n: "1", l: "ad per answer, most of the time. You get the whole stage." },
  ];
  return (
    <section id="why-now" className="bg-paper px-6 py-28 text-ink-950 md:px-12 md:py-36">
      <div className="mx-auto max-w-[1100px]">
        <Eyebrow>01 · Why now</Eyebrow>
        <motion.h2 {...reveal()} className="max-w-3xl font-display text-display font-semibold">
          Your buyers are asking ChatGPT for help right now. Almost nobody is answering with an ad.
        </motion.h2>
        <motion.p {...reveal()} className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-ink-600">
          People tell ChatGPT what they actually want, in full sentences, with all their constraints. That is the
          richest buying signal on the internet. And the ad auction sitting next to it is nearly empty.
        </motion.p>

        <motion.div
          {...staggerWrap()}
          className="mt-16 grid grid-cols-1 overflow-hidden rounded-2xl border border-ink-200 md:grid-cols-3"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className={`p-10 ${i < 2 ? "border-b border-ink-200 md:border-b-0 md:border-r" : ""}`}
            >
              <div className="tnum font-display text-6xl font-semibold tracking-tight">{s.n}</div>
              <p className="mt-4 font-sans text-sm leading-relaxed text-ink-500">{s.l}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── 02 · Context vs keywords — DARK, side-by-side with a mock answer+ad ──
export function HowItWorksSection() {
  return (
    <section id="how" className="bg-ink-950 px-6 py-28 text-paper md:px-12 md:py-36">
      <div className="mx-auto max-w-[1100px]">
        <Eyebrow on="dark">02 · How the ads work</Eyebrow>
        <motion.h2 {...reveal()} className="max-w-3xl font-display text-display font-semibold">
          It runs on intent, not keywords.
        </motion.h2>
        <motion.p {...reveal()} className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-paper/60">
          Google makes you bid on words. Everyone bids on the same words, so it turns into a price fight. ChatGPT
          reads the whole conversation and matches an ad to what the person is trying to do.
        </motion.p>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div {...reveal("-5%")} className="rounded-2xl border border-paper/10 p-8">
            <p className="mb-4 font-mono text-eyebrow uppercase text-paper/40">Google · a keyword</p>
            <code className="block rounded-md bg-paper/5 px-3 py-2 font-mono text-sm text-paper/60">payment platform api</code>
            <p className="mt-5 font-sans text-sm leading-relaxed text-paper/50">
              You buy a string. So does every competitor. The highest bidder wins the click, and the price only goes up.
            </p>
          </motion.div>

          <motion.div {...reveal("-5%")} className="rounded-2xl border border-signal/40 bg-signal/[0.06] p-8">
            <p className="mb-4 font-mono text-eyebrow uppercase text-signal">ChatGPT · the live conversation</p>
            {/* mock chat: user asks, ad appears */}
            <div className="rounded-lg bg-ink-900 p-4">
              <p className="font-sans text-sm text-paper/70">
                "I run a marketplace paying 5,000 sellers in 30 countries. Wire fees are killing us. What can I switch to?"
              </p>
              <div className="mt-3 rounded-lg border border-paper/10 bg-paper/[0.04] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-paper/90">Mastercard</span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-paper/30">Sponsored</span>
                </div>
                <p className="text-sm font-medium text-paper">Pay sellers in seconds, not days</p>
                <p className="mt-0.5 text-xs text-paper/45">Cross-border settlement, no wire fees.</p>
              </div>
            </div>
            <p className="mt-5 font-sans text-sm leading-relaxed text-paper/60">
              The buyer already described the problem. The ad answers it. No keyword to outbid, just the right moment.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── 03 · Why a library — LIGHT, 3 capability cards ──
export function WhyMeasureSection() {
  const cards = [
    ["The real creatives", "The exact advertiser, headline, and body that ChatGPT showed. Not a guess, the live ad."],
    ["The prompts behind them", "The literal questions that triggered each ad, so you know what to write for."],
    ["The open lanes", "High-intent topics where nobody is advertising yet. That is where you move first."],
  ];
  return (
    <section id="why-measure" className="bg-ink-50 px-6 py-28 text-ink-950 md:px-12 md:py-36">
      <div className="mx-auto max-w-[1100px]">
        <Eyebrow>03 · Why a library</Eyebrow>
        <motion.h2 {...reveal()} className="max-w-3xl font-display text-display font-semibold">
          A model can guess at ad copy. It cannot tell you what is actually running.
        </motion.h2>
        <motion.p {...reveal()} className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-ink-600">
          The only place to learn which prompts trigger ads, which rivals show up, and what they say is the live
          ChatGPT auction. So we probe it directly and keep the results in one searchable library.
        </motion.p>
        <motion.div {...staggerWrap()} className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map(([t, d]) => (
            <motion.div key={t} variants={fadeUp} className="rounded-2xl border border-ink-200 bg-paper p-7">
              <p className="font-display text-xl font-semibold">{t}</p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-500">{d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── 04 · Three steps — DARK ──
export function StepsSection() {
  const steps = [
    ["Name your market", "Type what you sell. We map it to the conversations your buyers are already having."],
    ["See what's running", "Every creative, every advertiser, and the prompt that surfaced it, in one library."],
    ["Take the open lanes", "Find the high-intent topics with zero competition and move before the window closes."],
  ];
  return (
    <section id="steps" className="bg-ink-950 px-6 py-28 text-paper md:px-12 md:py-36">
      <div className="mx-auto max-w-[1100px]">
        <Eyebrow on="dark">04 · How you use it</Eyebrow>
        <motion.h2 {...reveal()} className="font-display text-display font-semibold">Three steps to the whole picture.</motion.h2>
        <div className="mt-14 flex flex-col">
          {steps.map(([t, d], i) => (
            <motion.div key={t} {...reveal("-5%")} className="flex items-start gap-8 border-t border-paper/10 py-9">
              <span className="tnum font-display text-4xl font-semibold text-signal">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-display text-xl font-semibold text-paper">{t}</p>
                <p className="mt-1.5 max-w-xl font-sans text-base leading-relaxed text-paper/50">{d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 05 · CTA — LIGHT ──
export function CtaSection({ onCta }: { onCta: () => void }) {
  return (
    <section id="cta" className="bg-paper px-6 py-32 text-center text-ink-950 md:px-12">
      <div className="mx-auto max-w-2xl">
        <motion.h2 {...reveal()} className="font-display text-display font-semibold">
          See who is advertising in your market.
        </motion.h2>
        <motion.p {...reveal()} className="mx-auto mt-5 max-w-md font-sans text-lg text-ink-500">
          It takes one word to find out.
        </motion.p>
        <motion.button
          {...reveal()}
          onClick={onCta}
          className="mt-9 rounded-lg bg-ink-950 px-8 py-3.5 font-sans text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
        >
          Open the library
        </motion.button>
        <p className="mt-20 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-400">
          GPT Ads Library · Ad intelligence for ChatGPT
        </p>
      </div>
    </section>
  );
}

function staggerWrap() {
  return { variants: staggerParent(0.1), initial: "hidden" as const, whileInView: "show" as const, viewport: { once: true, margin: "-10%" } };
}
