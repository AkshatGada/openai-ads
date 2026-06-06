import type { Persona } from "../types.js";

export const defiDeveloper: Persona = {
  name: "defi-developer",
  description: "Full-stack developer building DeFi applications. Working on a yield aggregator that moves funds across lending protocols. Needs blockchain RPC, smart contract, and on-chain data APIs.",
  seedPrompts: [
    "I'm a full-stack developer building DeFi applications. Currently working on a yield aggregator that moves funds across lending protocols on Ethereum, Arbitrum, and Polygon. Our backend is TypeScript with ethers.js for blockchain interactions.",
    "My app needs to interact with Uniswap V3 pools, Aave lending markets, and track on-chain positions in real-time. We're using ethers.js for now but getting rate-limited on public RPCs. Need something more production-grade.",
    "I'm evaluating blockchain RPC providers — Alchemy vs Infura vs QuickNode. I need archive node access, WebSocket support for event listening, and high reliability because we handle real money. What are the tradeoffs on pricing and reliability?",
    "I also need a good API for on-chain data indexing — something like The Graph but with lower latency for real-time position monitoring. Our users need to see their positions update within seconds, not minutes.",
  ],
};
