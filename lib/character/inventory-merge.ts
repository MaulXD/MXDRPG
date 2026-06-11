import type { CompendiumPackId } from "@/lib/compendium/types";
import type { InventoryItem } from "@/lib/character/types";
import { newInstanceId } from "@/lib/character/inventory-storage";
import type { InventoryItemRequest } from "@/lib/character/inventory-item-request";

export function mergeInventoryItem(
  items: InventoryItem[],
  request: Pick<
    InventoryItemRequest,
    "packId" | "entryId" | "quantity" | "mergeExisting" | "instanceId"
  >
): InventoryItem[] {
  const packId = request.packId as CompendiumPackId;

  if (request.mergeExisting) {
    const existing = items.find((i) => i.packId === packId && i.entryId === request.entryId);
    if (existing) {
      return items.map((i) =>
        i.instanceId === existing.instanceId
          ? { ...i, quantity: i.quantity + request.quantity }
          : i
      );
    }
  }

  return [
    ...items,
    {
      instanceId: request.instanceId ?? newInstanceId(),
      packId,
      entryId: request.entryId,
      quantity: request.quantity,
    },
  ];
}
