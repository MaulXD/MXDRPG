import type { InventoryItem } from "./types";

const PREFIX = "eldarin-inventory-";

function inventoryKeys(items: InventoryItem[]): Set<string> {
  return new Set(items.map((i) => `${i.packId}:${i.entryId}`));
}

/** Servidor vence quando o cache local está vazio ou incompleto (ex.: kit inicial do wizard). */
function shouldPreferSeed(seed: InventoryItem[], cached: InventoryItem[]): boolean {
  if (seed.length === 0) return false;
  if (cached.length === 0) return true;
  if (seed.length > cached.length) return true;
  const cachedKeys = inventoryKeys(cached);
  return seed.some((item) => !cachedKeys.has(`${item.packId}:${item.entryId}`));
}

export function loadInventory(characterId: string, seed: InventoryItem[]): InventoryItem[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(PREFIX + characterId);
    if (!raw) {
      if (seed.length > 0) saveInventory(characterId, seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as InventoryItem[];
    if (!Array.isArray(parsed)) {
      if (seed.length > 0) saveInventory(characterId, seed);
      return seed;
    }
    if (shouldPreferSeed(seed, parsed)) {
      saveInventory(characterId, seed);
      return seed;
    }
    return parsed;
  } catch {
    return seed;
  }
}

export function saveInventory(characterId: string, items: InventoryItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + characterId, JSON.stringify(items));
}

export function newInstanceId(): string {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
