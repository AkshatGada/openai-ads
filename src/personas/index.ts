// Public API barrel for the persona system.
//
// Sub-modules are imported directly to keep the dependency graph explicit:
//
//   import { PersonaManager } from "./manager.js";
//   import { ChatGPTClient } from "./chatgpt/client.js";
//   import { PERSONA_SEEDS } from "./seeds/index.js";
//
// The CLI lives in `./cli.ts`; tests live in `./tests/`.

export * from "./types.js";
export { PersonaManager, makePersonaFromSeed } from "./manager.js";
export { PersonaCrypto, generateMasterKey } from "./crypto.js";
export { PersonaLock } from "./lock.js";
export { ProxyPool, poolFromEnv } from "./proxy/pool.js";
export { ChatGPTClient, defaultFetcher } from "./chatgpt/client.js";
export { parseSSE } from "./chatgpt/messages.js";
export { computeProofOfWork } from "./chatgpt/sentinel.js";
export * as ChatGptTypes from "./chatgpt/types.js";
export { PERSONA_SEEDS, getSeed, cryptoTrader, defiDeveloper, apiEngineer } from "./seeds/index.js";
