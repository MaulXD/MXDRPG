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
  "luz-penitente": "habilidades-luz-penitente",
  "escudo-solar": "habilidades-escudo-solar",
  "julgamento-ardente": "habilidades-julgamento-ardente",
  "coroa-de-fogo": "habilidades-coroa-de-fogo",
  "lamina-dos-sepulcros": "habilidades-lamina-dos-sepulcros",
  "voto-de-caca": "habilidades-voto-de-caca",
  "marca-do-limiar": "habilidades-marca-do-limiar",
  "processao-silenciosa": "habilidades-processao-silenciosa",
  "mordida-do-voto": "habilidades-mordida-do-voto",
  "fera-interior": "habilidades-fera-interior",
  "carga-do-juramento": "habilidades-carga-do-juramento",
  "pele-de-quimera": "habilidades-pele-de-quimera",
  "toque-da-voragem": "habilidades-raio-do-pacto-psiquico",
  "olhar-entre-dimensoes": "habilidades-olhar-entre-dimensoes",
  "agarrao-do-pacto": "habilidades-agarrao-do-pacto",
  "mente-partida": "habilidades-mente-partida",
  "contrato-ardente": "habilidades-raio-do-pacto-ardente",
  "sangue-do-patrono": "habilidades-sangue-do-patrono",
  "pacto-de-ferro": "habilidades-pacto-de-ferro",
  "correntes-infernais": "habilidades-correntes-infernais",
  "sussurro-salino": "habilidades-raio-do-pacto-salino",
  "corrente-mental": "habilidades-corrente-mental",
  "manto-de-bruma": "habilidades-manto-de-bruma",
  "puxao-abissal": "habilidades-puxao-abissal",
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
  Artífice: "habilidades-barreira-de-cobre",
  Paladino: "habilidades-imposicao-de-maos",
  Bruxo: "habilidades-raio-do-pacto",
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
