import type { InventoryItem } from "./types";

const PREFIX = "eldarin-inventory-";

export function loadInventory(characterId: string, seed: InventoryItem[]): InventoryItem[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(PREFIX + characterId);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as InventoryItem[];
    if (!Array.isArray(parsed)) return seed;
    // Servidor é fonte de verdade quando tem itens e o cache local está vazio.
    if (seed.length > 0 && parsed.length === 0) {
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
