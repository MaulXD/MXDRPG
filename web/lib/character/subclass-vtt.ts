import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import { getEntry } from "@/lib/compendium/registry";
import { newInstanceId } from "@/lib/character/inventory-storage";
import {
  getSubclassTrack,
  parseCharacterTalents,
  type SubclassTalent,
} from "@/lib/character/subclass-tracks";
import { abilityFromEntry } from "@/lib/combat/compendium-actions";
import type { CombatActionOption } from "@/lib/combat/types";

/**
 * Talentos de subclasse → entrada do compêndio de habilidades (mesa / combate).
 * Expandir por trilha conforme o bestiário de habilidades crescer.
 */
const TALENT_HABILIDADE: Record<string, string> = {
  "corte-limpo": "habilidades-golpe-devastador",
  "maestria-de-acougue": "habilidades-golpe-flanqueador",
  "abate-perfeito": "habilidades-investida-do-guerreiro",
  "sangue-de-predador": "habilidades-furia-controlada",
  "percussao-penetrante": "habilidades-golpe-devastador",
  "estrutura-quitinosa": "habilidades-postura-defensiva",
  "esmagamento-total": "habilidades-investida-do-guerreiro",
  "corpo-de-crustaceo": "habilidades-barreira-de-cobre",
  "tiro-de-precisao": "habilidades-tiro-certeiro",
  "olho-de-falcao": "habilidades-olhar-do-cacador",
  "golpe-celeste": "habilidades-golpe-flanqueador",
  "chama-controlada": "habilidades-raio-arcano",
  "combustao-arcana": "habilidades-raio-arcano",
  "pico-de-acucar": "habilidades-furia-controlada",
  "forma-aprimorada": "habilidades-forma-selvagem",
};

const CLASS_FALLBACK: Record<string, string> = {
  Guerreiro: "habilidades-investida-do-guerreiro",
  Patrulheiro: "habilidades-olhar-do-cacador",
  Ladino: "habilidades-passo-das-sombras",
  Mago: "habilidades-raio-arcano",
  Clérigo: "habilidades-canalizar-energia",
  Bardo: "habilidades-inspiracao-de-batalha",
  Bárbaro: "habilidades-furia-controlada",
  Druida: "habilidades-forma-selvagem",
  Artifice: "habilidades-barreira-de-cobre",
};

export function habilidadeEntryForTalent(
  talent: SubclassTalent,
  classId: string
): string | null {
  const mapped = TALENT_HABILIDADE[talent.id];
  if (mapped && getEntry("habilidades", mapped)) return mapped;
  const fallback = CLASS_FALLBACK[classId];
  if (fallback && getEntry("habilidades", fallback)) return fallback;
  return null;
}

export function syncSubclassTalentsToInventory(actor: CharacterSheet): CharacterSheet {
  const track = getSubclassTrack(actor.identity.subclasse);
  if (!track) return actor;

  const owned = parseCharacterTalents(actor.identity.talentos);
  let inventory = [...actor.inventory];

  for (const talent of owned) {
    if (talent.level === 20) continue;
    const entryId = habilidadeEntryForTalent(
      track.talents.find((t) => t.id === talent.id) ?? {
        level: talent.level,
        id: talent.id,
        name: talent.name,
        kind: "talent",
        requires: null,
      },
      track.classId
    );
    if (!entryId) continue;
    if (inventory.some((i) => i.packId === "habilidades" && i.entryId === entryId)) continue;
    inventory = [
      ...inventory,
      {
        instanceId: newInstanceId(),
        packId: "habilidades",
        entryId,
        quantity: 1,
      },
    ];
  }

  return inventory === actor.inventory ? actor : { ...actor, inventory };
}

export function listSubclassCombatActions(actor: CharacterSheet): CombatActionOption[] {
  const synced = syncSubclassTalentsToInventory(actor);
  const owned = parseCharacterTalents(synced.identity.talentos);
  const track = getSubclassTrack(synced.identity.subclasse);
  if (!track) return [];

  const out: CombatActionOption[] = [];
  const seen = new Set<string>();

  for (const t of owned) {
    if (t.level === 20) continue;
    const talent = track.talents.find((x) => x.id === t.id);
    const entryId = habilidadeEntryForTalent(
      talent ?? { level: t.level, id: t.id, name: t.name, kind: "talent", requires: null },
      track.classId
    );
    if (!entryId || seen.has(entryId)) continue;
    const entry = getEntry("habilidades", entryId);
    if (!entry) continue;
    const ability = abilityFromEntry(entry);
    if (!ability) continue;
    seen.add(entryId);
    out.push({
      ...ability,
      label: `${t.name} (trilha) · ${ability.label.split("·").slice(1).join("·").trim() || ability.label}`,
    });
  }

  return out;
}
