// Batch probe: 50 prompts with "API" across sectors → test if "API" triggers ads
// Theory: the word "API" in prompts is a strong ad auction signal

const PROMPTS = [
  // ── FinTech APIs (10) ──
  "What's the best stock market data API with real-time prices and WebSocket streaming support?",
  "I need a payment processing API like Stripe or Square that handles international transactions",
  "Looking for a banking API that lets me connect user accounts and fetch transaction history",
  "Which open banking API is best for building a personal finance dashboard — Plaid vs Yodlee vs Tink?",
  "Best forex exchange rate API for real-time currency conversion in a SaaS app",
  "I need a credit score API for my lending platform — which provider has the most accurate data?",
  "What's the best brokerage API for executing stock trades programmatically with OAuth support?",
  "Looking for a cryptocurrency price API that covers hundreds of exchanges with low latency",
  "Which KYC and identity verification API is easiest to integrate for a fintech onboarding flow?",
  "I need an API for accessing SEC filings and company financial data for an investment research tool",

  // ── DevTools / API Platforms (10) ──
  "What's the best API gateway for managing microservices with rate limiting and authentication?",
  "I need a low-code API builder that lets me create REST endpoints from a database without writing code",
  "Best API testing tool with automated regression tests and CI/CD integration for my team",
  "Looking for an API documentation platform that generates OpenAPI specs from my code automatically",
  "Which API monitoring service is best — alerting on downtime, latency, and error rate spikes?",
  "I need a web scraping API that handles JavaScript rendering and rotating proxies for e-commerce data",
  "Best GraphQL API platform for building a unified data layer across multiple backend services",
  "What's the best API for sending transactional emails with templates, analytics, and high deliverability?",
  "Looking for an SMS and push notification API that works reliably across iOS and Android",
  "I need a file upload and transformation API that handles images, PDFs, and video processing in the cloud",

  // ── E-commerce & Retail APIs (8) ──
  "What's the best product search API for building an e-commerce marketplace with millions of SKUs?",
  "I need a shipping and logistics API that calculates rates and generates labels across multiple carriers",
  "Best inventory management API that syncs stock levels across Shopify, Amazon, and my warehouse",
  "Looking for an e-commerce recommendation engine API that provides personalized product suggestions",
  "Which returns management API is best for automating RMA and refund workflows in an online store?",
  "I need a tax calculation API for e-commerce that handles sales tax, VAT, and GST across jurisdictions",
  "Best product review aggregation API for displaying verified customer reviews on my product pages",
  "Looking for an order fulfillment API that connects to 3PL warehouses and provides real-time tracking",

  // ── Healthcare & MedTech APIs (5) ──
  "What's the best healthcare API for accessing medical records with HIPAA compliance built in?",
  "I need a telemedicine API for scheduling appointments, video consultations, and prescription management",
  "Best fitness tracking API that pulls data from Apple Health, Fitbit, and Garmin into one dashboard",
  "Looking for a pharmacy API that checks drug interactions and provides dosage recommendations",
  "Which lab results API is best for integrating blood work and diagnostic data into a patient portal?",

  // ── Travel & Hospitality APIs (5) ──
  "What's the best flight search API for building a travel booking app with real-time pricing?",
  "I need a hotel booking API that aggregates rates from Booking.com, Expedia, and direct hotel systems",
  "Best weather API for a travel planning app — needs hourly forecasts and severe weather alerts globally",
  "Looking for a maps and geocoding API for a logistics app with route optimization and traffic data",
  "Which car rental API has the best coverage for integrating vehicle booking into a travel aggregator?",

  // ── Marketing & MarTech APIs (5) ──
  "What's the best email marketing API for sending automated campaigns with segmentation and A/B testing?",
  "I need a social media management API that lets me schedule posts and pull analytics across platforms",
  "Best customer data platform API for unifying user profiles across web, mobile, and email touchpoints",
  "Looking for an SEO analytics API that provides keyword rankings, backlinks, and competitor research data",
  "Which CRM API is easiest to integrate — Salesforce vs HubSpot vs Pipedrive for a SaaS product?",

  // ── AI / Machine Learning APIs (5) ──
  "What's the best LLM API for production use — OpenAI vs Anthropic vs Gemini for chat and completions?",
  "I need a text-to-speech API with natural sounding voices and real-time streaming support",
  "Best image generation API for creating product photos and marketing visuals at scale",
  "Looking for a sentiment analysis API that processes customer reviews and social mentions accurately",
  "Which embeddings API is best for building a semantic search engine over a large document corpus?",

  // ── Data & Infrastructure APIs (2) ──
  "What's the best API for accessing global company data with firmographics, funding, and executive information?",
  "I need a webhook and event streaming API for building real-time data pipelines between services",
];

import { writeFile, mkdir } from "node:fs/promises";
import { probeAds, extractAdsFromHtml } from "../scraper/client.js";

const OUT_DIR = "scraper-outputs-api";

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60).toLowerCase();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let adsFound = 0;

  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i]!;
    const num = String(i + 1).padStart(2, "0");
    process.stdout.write(`[${num}/50] `);

    try {
      const result = await probeAds(prompt, "United States");
      const adCount = adCountFromHtml(result.html);
      await writeFile(`${OUT_DIR}/${num}_${sanitize(prompt)}.html`, result.html);

      if (adCount > 0) {
        adsFound++;
        const parsed = extractAdsFromHtml(result.html);
        for (const ad of parsed) {
          console.log(`\n    🔴 AD: ${ad.advertiser} — "${ad.title}"`);
        }
      }
      console.log(`ads=${adCount} html=${result.html.length}`);
    } catch (e) {
      console.log(`✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    }

    if (i < PROMPTS.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE. ${adsFound}/${PROMPTS.length} prompts had ads.`);
  console.log(`HTML files saved to ${OUT_DIR}/`);
}

function adCountFromHtml(html: string): number {
  return (html.match(/data-ad-card-root="true"/g) || []).length;
}

main().catch(console.error);
