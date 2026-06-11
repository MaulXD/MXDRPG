import type { InventoryItem } from "@/lib/character/types";

const LEGACY_POC_PREFIX = "equipamentos-poc-";

/** Migra itens PoC gravados no pack equipamentos → consumiveis. */
export function normalizeLegacyConsumables(items: InventoryItem[]): InventoryItem[] {
  let changed = false;
  const result = items.map((item) => {
    if (item.packId === "equipamentos" && item.entryId.startsWith(LEGACY_POC_PREFIX)) {
      changed = true;
      const suffix = item.entryId.slice(LEGACY_POC_PREFIX.length);
      return {
        ...item,
        packId: "consumiveis" as const,
        entryId: `consumiveis-poc-${suffix}`,
      };
    }
    return item;
  });
  return changed ? result : items;
}
