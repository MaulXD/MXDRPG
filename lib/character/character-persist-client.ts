"use client";

import type { CharacterSheet, InventoryItem, LootEconomy } from "@/lib/character/types";

export async function patchCharacterRecord(
  characterId: string,
  body: Record<string, unknown>
): Promise<{ character?: CharacterSheet }> {
  const res = await fetch(`/api/characters/${characterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<{ character?: CharacterSheet }>;
}

export async function persistInventoryToCharacter(
  characterId: string,
  inventory: InventoryItem[]
): Promise<{ character?: CharacterSheet }> {
  return patchCharacterRecord(characterId, { inventory });
}

export async function persistLootEconomyToCharacter(
  characterId: string,
  lootEconomy: LootEconomy
): Promise<{ character?: CharacterSheet }> {
  return patchCharacterRecord(characterId, { lootEconomy });
}
