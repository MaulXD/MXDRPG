import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import { newInstanceId } from "@/lib/character/inventory-storage";
import { getSubclassTrack } from "@/lib/character/subclass-tracks";
import { getEntry } from "@/lib/compendium/registry";

/** Habilidades de classe concedidas por nível (mesa / combate). */
const CLASS_ABILITY_BY_LEVEL: Partial<
  Record<string, (level: number, subclassTrackId: string | null) => string[]>
> = {
  Paladino(level) {
    const ids: string[] = [];
    if (level >= 1) ids.push("habilidades-imposicao-de-maos");
    if (level >= 2) ids.push("habilidades-golpe-sagrado");
    return ids;
  },
  Bruxo(level, subclassTrackId) {
    if (level < 1) return [];
    const raioBySubclass: Record<string, string> = {
      "filho-da-voragem": "habilidades-raio-do-pacto-psiquico",
      "herdeiro-do-sangue": "habilidades-raio-do-pacto-ardente",
      "voz-das-profundezas": "habilidades-raio-do-pacto-salino",
    };
    return [raioBySubclass[subclassTrackId ?? ""] ?? "habilidades-raio-do-pacto"];
  },
};

function addHabilidade(inventory: InventoryItem[], entryId: string): InventoryItem[] {
  if (!getEntry("habilidades", entryId)) return inventory;
  if (inventory.some((i) => i.packId === "habilidades" && i.entryId === entryId)) return inventory;
  return [
    ...inventory,
    { instanceId: newInstanceId(), packId: "habilidades", entryId, quantity: 1 },
  ];
}

export function classAbilityEntryIds(actor: CharacterSheet): string[] {
  const resolver = CLASS_ABILITY_BY_LEVEL[actor.identity.classe];
  if (!resolver) return [];
  const track = getSubclassTrack(actor.identity.subclasse);
  return resolver(actor.identity.nivel, track?.id ?? null);
}

const BRUXO_RAIO_ENTRY_IDS = [
  "habilidades-raio-do-pacto",
  "habilidades-raio-do-pacto-psiquico",
  "habilidades-raio-do-pacto-ardente",
  "habilidades-raio-do-pacto-salino",
];

export function syncClassAbilitiesToInventory(actor: CharacterSheet): CharacterSheet {
  const entryIds = classAbilityEntryIds(actor);
  const keep = new Set(entryIds);

  let inventory = actor.inventory;
  if (actor.identity.classe === "Bruxo") {
    inventory = inventory.filter(
      (i) =>
        !(
          i.packId === "habilidades" &&
          BRUXO_RAIO_ENTRY_IDS.includes(i.entryId) &&
          !keep.has(i.entryId)
        )
    );
  }

  for (const entryId of entryIds) {
    inventory = addHabilidade(inventory, entryId);
  }

  return inventory === actor.inventory ? actor : { ...actor, inventory };
}
