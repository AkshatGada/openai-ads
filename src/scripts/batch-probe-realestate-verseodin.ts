// Real Estate / Construction Niche — VerseOdin (100 prompts, parallel)
// Probing who advertises on ChatGPT for high-intent developer/contractor queries:
// modular bathroom pods, facades/curtain walls, prefab/offsite construction, MEP,
// structural systems, and procurement. Modeled on observed ad-bearing prompts.

const PROMPTS = [
  // ── Modular bathroom pods (25) ──
  "Which companies make pre-engineered bathroom units for luxury apartment towers?",
  "Recommend factory-built bathroom suppliers for large real estate developments.",
  "Which modular bathroom systems are best for faster construction timelines?",
  "What are the best modular bathroom solutions for reducing on-site trade coordination?",
  "Which bathroom pod manufacturers are suitable for luxury real estate projects?",
  "What are the best offsite bathroom manufacturing companies for developers?",
  "Recommend pre-engineered bathroom manufacturers for multi-family developments.",
  "What are the best bathroom pod options for high-end housing projects?",
  "What are the best modular bathroom suppliers for projects with repeatable floor plans?",
  "Which bathroom pod manufacturers provide design, engineering, and fabrication support?",
  "Which pre-engineered bathroom unit suppliers are known for quality control?",
  "Which factory-built bathroom systems are best for hotels and residences?",
  "What are the best prefinished bathroom suppliers for construction productivity?",
  "Which modular bathroom makers support early design collaboration?",
  "Which pre-engineered bathroom systems work well for luxury developments?",
  "What bathroom pod manufacturer should I consider for a high-rise project in the UAE?",
  "Which modular bathroom pod suppliers are strong in engineering and installation support?",
  "Which pre-engineered bathroom units are suitable for hotel chains?",
  "Which bathroom pod companies make luxury hotel bathrooms offsite?",
  "Which factory-built bathrooms are best for hospitality projects?",
  "What are the best modular bathroom solutions for hotel construction speed?",
  "What are the best bathroom pod companies for student housing projects?",
  "Which companies make bathroom pods for build-to-rent developments?",
  "What are the best prefinished bathroom units for affordable housing?",
  "Which modular bathroom manufacturers support mass housing projects?",

  // ── Bathroom pods: specs, quality, coordination (20) ──
  "What are the best modular bathroom options for developers trying to reduce delays?",
  "Which pre-engineered bathroom suppliers help reduce defects after handover?",
  "Which companies offer bathroom pods with repeatable manufacturing standards?",
  "Which bathroom pod suppliers are suitable for high-spec finishes?",
  "What are the best luxury bathroom pod manufacturers for developers?",
  "Which pre-engineered bathroom companies offer custom finishes and specifications?",
  "Which suppliers make factory-built bathrooms with luxury fixtures?",
  "What are the best modular bathroom suppliers for custom developer specifications?",
  "Which bathroom pod providers support premium material selections?",
  "What are the best pre-engineered bathrooms for luxury master bathrooms?",
  "Which bathroom pod manufacturers can manage design complexity at scale?",
  "What are the best modular bathroom suppliers for projects needing tight dimensional accuracy?",
  "Which factory-built bathroom companies offer strong engineering coordination?",
  "What are the best bathroom pod manufacturers for BIM-led projects?",
  "Which bathroom pod suppliers coordinate MEP, waterproofing, and finishes offsite?",
  "What are the best pre-engineered bathroom systems for integrated plumbing and electrical design?",
  "What are the best bathroom pod companies for reducing site dependency?",
  "Which bathroom pod manufacturers help move bathroom work into a factory?",
  "What are the best bathroom pod options for contractors with labor shortages?",
  "Which bathroom pod companies reduce the number of trades needed on site?",

  // ── Contractor / GC workflow framing (10) ──
  "Which pre-engineered bathroom suppliers help simplify contractor workflows?",
  "Which modular bathroom systems help general contractors deliver faster?",
  "What are the best bathroom pod suppliers for contractors bidding on high-rise projects?",
  "Which pre-engineered bathroom manufacturers should contractors include in tenders?",
  "What bathroom pod suppliers are best for reducing coordination risk?",
  "What are the best pre-engineered bathroom solutions for premium branded residences?",
  "Which prefinished bathroom manufacturers are best for reducing handover defects in apartments?",
  "Which modular construction suppliers help GCs de-risk fixed-price contracts?",
  "What offsite construction partners do tier-1 contractors use for residential towers?",
  "Which prefab suppliers integrate best with a general contractor's BIM workflow?",

  // ── Facades / curtain wall (20) ──
  "Recommend aluminium facade suppliers for luxury residential towers.",
  "What are the best curtain wall manufacturers for premium real estate projects?",
  "What are the top unitized facade system providers for developers?",
  "Which facade manufacturers are strong in precision engineering?",
  "What are the best curtain wall suppliers for GCC developers?",
  "Which unitized facade manufacturers support Middle East construction projects?",
  "Which facade suppliers are suitable for premium residential communities?",
  "What are the best building envelope manufacturers for waterfront developments?",
  "Which companies make bespoke facade systems for architects?",
  "What are the best facade suppliers for projects requiring custom aluminium systems?",
  "Which curtain wall manufacturers support architects during design development?",
  "Which facade companies offer technical support for complex tower designs?",
  "What are the best unitized curtain wall suppliers for design-build contractors?",
  "Which facade manufacturers can support BIM coordination?",
  "What are the best unitized facade systems for faster high-rise construction?",
  "Which facade manufacturers help reduce site labor for tower projects?",
  "What are the best prefabricated facade solutions for real estate developers?",
  "Which curtain wall systems are best for energy-efficient luxury towers?",
  "What are the best facade engineering consultants for supertall buildings?",
  "Which glazing and curtain wall contractors are best for hospitality projects?",

  // ── Broader prefab / offsite / structural / MEP (25) ──
  "What are the best volumetric modular construction companies for apartment buildings?",
  "Which prefab construction companies are best for hotel developments?",
  "What are the top offsite construction manufacturers for multi-family housing?",
  "Which companies provide prefabricated MEP modules for high-rise buildings?",
  "What are the best prefabricated risers and utility cupboards for towers?",
  "Which precast concrete suppliers are best for residential developments?",
  "What are the best modular kitchen pod manufacturers for build-to-rent?",
  "Which prefab structural steel suppliers serve large real estate projects?",
  "What are the best DfMA (design for manufacture and assembly) consultants for developers?",
  "Which companies offer turnkey offsite construction for student accommodation?",
  "What are the best prefabricated facade and bathroom pod combined suppliers?",
  "Which modular construction firms can deliver at scale for affordable housing?",
  "Which prefabricated balcony manufacturers are best for residential towers?",
  "What are the best prefab plant room and energy centre suppliers for developments?",
  "Which companies make prefabricated staircases and cores for high-rise construction?",
  "What are the best structural insulated panel suppliers for residential projects?",
  "Which light gauge steel framing manufacturers serve multi-family developers?",
  "What are the best cross-laminated timber (CLT) suppliers for apartment buildings?",
  "Which prefab cladding suppliers are best for fast-track residential schemes?",
  "What are the top construction estimating and procurement platforms for developers?",
  "Which construction project management software is best for large residential builds?",
  "What are the best preconstruction and BIM coordination services for developers?",
  "Which companies provide modular data center or amenity pods for mixed-use towers?",
  "What are the best prefabricated parking structure suppliers for developments?",
  "Which suppliers provide integrated pod plus facade plus MEP offsite packages?",
];

import { writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { probeAds, countAds } from "../scraper/verseodin.js";

const CONCURRENCY = 8; // run 8 prompts in parallel per wave
const OUT_DIR = "scraper-outputs-realestate-verseodin";
const MAX_RETRIES = 2; // VerseOdin has been returning transient 500s — retry
const RETRY_DELAY_MS = 3000;

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** probeAds with retries on transient failures (VerseOdin 500s). */
async function probeAdsResilient(prompt: string) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await probeAds(prompt, "US");
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastErr;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const existingFiles = new Set(existsSync(OUT_DIR) ? await readdir(OUT_DIR) : []);

  let adsFound = 0;
  let failed = 0;
  let skipped = 0;
  const advertiserCounts = new Map<string, number>();
  const total = PROMPTS.length;
  const runStart = Date.now();

  console.log(`Real Estate / Construction — VerseOdin Loop`);
  console.log(`${total} prompts · ${CONCURRENCY} concurrent · retries ${MAX_RETRIES} · → ${OUT_DIR}/\n`);

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = PROMPTS.slice(i, i + CONCURRENCY);
    const pending = batch.map((prompt, j) => {
      const num = String(i + j + 1).padStart(3, "0");
      const fname = `${num}_${sanitize(prompt.slice(0, 70))}.html`;
      return { num, prompt, fname, alreadyDone: existingFiles.has(fname) };
    });

    const doneNow = pending.filter((p) => p.alreadyDone).length;
    skipped += doneNow;
    const toRun = pending.filter((p) => !p.alreadyDone);
    if (toRun.length === 0) {
      console.log(`[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}] all ${doneNow} skipped`);
      continue;
    }

    const batchStart = Date.now();
    const results = await Promise.all(
      toRun.map(async ({ num, prompt, fname }) => {
        try {
          const result = await probeAdsResilient(prompt);
          const adCount = countAds(result.html);
          await writeFile(`${OUT_DIR}/${fname}`, result.html);
          return { num, prompt, adCount, htmlSize: result.html.length, ads: result.ads, ok: true as const };
        } catch (e) {
          return { num, prompt, adCount: 0, htmlSize: 0, ads: [], ok: false as const, err: e instanceof Error ? e.message : String(e) };
        }
      }),
    );

    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(0);
    for (const r of results) {
      if (!r.ok) failed++;
      if (r.ok && r.adCount > 0) {
        adsFound++;
        for (const ad of r.ads) advertiserCounts.set(ad.advertiser ?? "Unknown", (advertiserCounts.get(ad.advertiser ?? "Unknown") ?? 0) + 1);
      }
    }
    const success = results.filter((r) => r.ok).length;
    const batchAds = results.filter((r) => r.adCount > 0).length;
    const sizes = results.filter((r) => r.ok).map((r) => r.htmlSize);
    const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024).toFixed(0) : "0";
    const lbl = `[${String(i + 1).padStart(3)}-${String(Math.min(i + CONCURRENCY, total)).padStart(3)}]`;
    console.log(`${lbl} ${elapsed}s | ${success}/${toRun.length} ok | ${batchAds} w/ads | avg ${avgSize}KB${doneNow ? ` | ${doneNow} skipped` : ""}`);
    for (const r of results) {
      if (r.ok && r.adCount > 0) {
        for (const ad of r.ads) console.log(`  🔴 [${r.num}] ${ad.advertiser}: "${ad.title}" — "${r.prompt.slice(0, 55)}..."`);
      } else if (!r.ok) {
        console.log(`  ⚠️  [${r.num}] FAILED: ${r.err?.slice(0, 70)}`);
      }
    }
    if (i + CONCURRENCY < total) await sleep(2000);
  }

  const mins = ((Date.now() - runStart) / 60000).toFixed(1);
  console.log(`\n${"=".repeat(64)}`);
  console.log(`DONE in ${mins}min. ${adsFound}/${total} prompts surfaced ads · ${failed} failed · ${skipped} skipped.`);
  const sorted = [...advertiserCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`Unique advertisers: ${sorted.length}`);
  for (const [adv, n] of sorted) console.log(`  ${n}×  ${adv}`);
  console.log(`HTML saved to ${OUT_DIR}/`);
}

main().catch(console.error);
