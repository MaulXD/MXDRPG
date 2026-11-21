import { syncCombatAbilitiesToInventory } from "@/lib/character/combat-inventory-sync";
import type { CharacterSheet } from "@/lib/character/types";

/**
 * BV-045b: chaves "packId:entryId" dos recursos que a propria ficha sincroniza
 * (habilidades de classe e talentos de subclasse). Origem = a sincronizacao sobre
 * inventario vazio: o que ela colocaria sozinha. Nao depende de campo no item.
 * Habilidade escolhida pelo dono fora dessa lista continua contando como item.
 */
export function classResourceKeysFor(actor: CharacterSheet): Set<string> {
  const synced = syncCombatAbilitiesToInventory({ ...actor, inventory: [] }).inventory;
  return new Set(synced.map((i) => `${i.packId}:${i.entryId}`));
}
