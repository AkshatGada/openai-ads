import { PersonaSeed } from "../types.js";
import { cryptoTrader } from "./crypto-trader.js";
import { defiDeveloper } from "./defi-developer.js";
import { apiEngineer } from "./api-engineer.js";

export const PERSONA_SEEDS: PersonaSeed[] = [cryptoTrader, defiDeveloper, apiEngineer];

export function getSeed(id: string): PersonaSeed | undefined {
  return PERSONA_SEEDS.find((s) => s.id === id);
}

export { cryptoTrader, defiDeveloper, apiEngineer };
