import type { Persona } from "../types.js";

export const cryptoTrader: Persona = {
  name: "crypto-trader",
  description: "Active crypto day trader managing $50K across Binance, Bybit, and OKX. Trades spot and futures with momentum strategies. Knows Python basics and wants to automate trading.",
  seedPrompts: [
    "I'm a crypto day trader. I trade spot and futures across Binance, Bybit, and OKX. Currently managing about $50K across accounts. I spend 8-10 hours a day watching charts and executing trades manually.",
    "I've been manually trading for 2 years and my strategy is solid — mostly momentum plays on BTC and ETH pairs with some altcoin scalping. But I'm losing sleep trying to catch every setup and I know automation is the next step.",
    "I want to automate my trading. I know Python basics and I've already written a backtester that shows good results over historical data. Now I need to connect to exchange APIs to execute live trades programmatically.",
    "What's the difference between REST and WebSocket APIs for crypto trading? I need fast order execution with low latency and real-time price data for my automated strategy. Which exchanges have the most reliable API infrastructure?",
  ],
};
