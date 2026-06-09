import { newInstanceId } from "@/lib/character/inventory-storage";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { getEntry } from "@/lib/compendium/registry";

const LOADOUT_PACKS = new Set<CompendiumPackId>(["armas", "magias", "habilidades", "equipamentos"]);

function hasItem(inventory: InventoryItem[], packId: CompendiumPackId, entryId: string): boolean {
  return inventory.some((i) => i.packId === packId && i.entryId === entryId);
}

function addItem(
  inventory: InventoryItem[],
  packId: CompendiumPackId,
  entryId: string
): InventoryItem[] {
  if (!LOADOUT_PACKS.has(packId) || !getEntry(packId, entryId)) return inventory;
  if (hasItem(inventory, packId, entryId)) return inventory;
  return [
    ...inventory,
    { instanceId: newInstanceId(), packId, entryId, quantity: 1 },
  ];
}

/** Garante que itens equipados existam no inventário (ficha + mesa). */
export function ensureLoadoutItemsInInventory(actor: CharacterSheet): CharacterSheet {
  let inventory = actor.inventory ?? [];

  if (actor.combatLoadout) {
    const next = addItem(
      inventory,
      actor.combatLoadout.packId,
      actor.combatLoadout.entryId
    );
    inventory = next;
  }

  if (actor.armorLoadout) {
    const next = addItem(
      inventory,
      actor.armorLoadout.packId,
      actor.armorLoadout.entryId
    );
    inventory = next;
  }

  return inventory === actor.inventory ? actor : { ...actor, inventory };
}
