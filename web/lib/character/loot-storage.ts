import type { LootEconomy } from "./types";

const PREFIX = "eldarin-loot-";

export const EMPTY_LOOT: LootEconomy = {
  po: 0,
  especiarias: {},
  minerios: {},
  tesouros: {},
};

export function loadLoot(characterId: string, seed: LootEconomy): LootEconomy {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(PREFIX + characterId);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as LootEconomy;
    if (typeof parsed !== "object" || parsed === null) return seed;
    return {
      po: typeof parsed.po === "number" ? parsed.po : seed.po,
      especiarias: parsed.especiarias ?? seed.especiarias,
      minerios: parsed.minerios ?? seed.minerios,
      tesouros: parsed.tesouros ?? seed.tesouros,
    };
  } catch {
    return seed;
  }
}

export function saveLoot(characterId: string, loot: LootEconomy): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + characterId, JSON.stringify(loot));
}

export function lootStackTotal(stacks: Record<string, number>): number {
  return Object.values(stacks).reduce((a, n) => a + (Number.isFinite(n) ? n : 0), 0);
}
