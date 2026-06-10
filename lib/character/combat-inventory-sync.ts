import type { CharacterSheet } from "@/lib/character/types";
import { syncClassAbilitiesToInventory } from "@/lib/character/class-vtt";
import { syncSubclassTalentsToInventory } from "@/lib/character/subclass-vtt";

export function syncCombatAbilitiesToInventory(actor: CharacterSheet): CharacterSheet {
  return syncClassAbilitiesToInventory(syncSubclassTalentsToInventory(actor));
}
