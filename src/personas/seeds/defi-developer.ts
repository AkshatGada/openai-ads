import { PersonaSeed } from "../types.js";

export const defiDeveloper: PersonaSeed = {
  id: "defi-developer",
  label: "DeFi Full-Stack Developer",
  description:
    "Full-stack developer building DeFi applications. Working on a yield aggregator that moves funds across lending protocols. Needs blockchain RPC, smart contract, and on-chain data APIs.",
  interests: ["defi", "ethereum", "rpc", "smart-contracts", "api"],
  backstory:
    "Building a yield aggregator on Ethereum, Arbitrum, and Polygon with TypeScript + ethers.js. Rate-limited on public RPCs; needs production-grade infrastructure.",
  declared: {
    country: "US",
    region: "US-CA",
    city: "San Francisco",
    timezone: "America/Los_Angeles",
    locale: "en-US",
  },
  client: { os: "macos", browser: "chrome", browserVersion: 131, isMobile: false },
  seedPrompts: [
    "I'm a full-stack developer building DeFi applications. Currently working on a yield aggregator that moves funds across lending protocols on Ethereum, Arbitrum, and Polygon. Our backend is TypeScript with ethers.js for blockchain interactions.",
    "My app needs to interact with Uniswap V3 pools, Aave lending markets, and track on-chain positions in real-time. We're using ethers.js for now but getting rate-limited on public RPCs. Need something more production-grade.",
    "I'm evaluating blockchain RPC providers — Alchemy vs Infura vs QuickNode. I need archive node access, WebSocket support for event listening, and high reliability because we handle real money. What are the tradeoffs on pricing and reliability?",
    "I also need a good API for on-chain data indexing — something like The Graph but with lower latency for real-time position monitoring. Our users need to see their positions update within seconds, not minutes.",
  ],
  tags: ["defi", "developer", "high-intent"],
};
