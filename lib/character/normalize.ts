import { migrateSubclassName } from "@/lib/character/legacy-names";
import { normalizeReligionId } from "@/lib/character/pantheon";
import type { CharacterAttributes, CharacterSheet, CharacterIdentity } from "@/lib/character/types";
import { parseCharacterTalents } from "@/lib/character/subclass-tracks";
import { computeCulinary, hpMaxFor, attributeMod } from "@/lib/character/rules";
import { paMaxForActor } from "@/lib/combat/pa-economy";
import { xpTotalForLevel } from "@/lib/character/xp";
import { syncSubclassTalentsToInventory } from "@/lib/character/subclass-vtt";
import { EMPTY_LOOT } from "@/lib/character/loot-storage";

const DEFAULT_ATTRS: CharacterAttributes = {
  forca: 10,
  destreza: 10,
  constituicao: 10,
  inteligencia: 10,
  sabedoria: 10,
  carisma: 10,
};

function migrateAttributes(raw: Record<string, number>): CharacterAttributes {
  return {
    forca: raw.forca ?? 10,
    destreza: raw.destreza ?? raw.agilidade ?? 10,
    constituicao: raw.constituicao ?? 10,
    inteligencia: raw.inteligencia ?? 10,
    sabedoria: raw.sabedoria ?? 10,
    carisma: raw.carisma ?? 10,
  };
}

function defaultXpForLevel(nivel: number): number {
  return xpTotalForLevel(Math.max(1, nivel));
}

export function normalizeIdentity(identity: Partial<CharacterIdentity> & { nivel: number }): CharacterIdentity {
  return {
    nivel: identity.nivel,
    xpTotal: identity.xpTotal ?? defaultXpForLevel(identity.nivel),
    raca: identity.raca ?? "Humano",
    classe: identity.classe ?? "Guerreiro",
    subclasse: migrateSubclassName(identity.subclasse ?? null) ?? null,
    linhagem: identity.linhagem ?? null,
    antecedente: identity.antecedente ?? "Explorador",
    religiao: normalizeReligionId(identity.religiao),
    talentos: parseCharacterTalents(identity.talentos),
  };
}

export function normalizeCharacter(sheet: CharacterSheet): CharacterSheet {
  const adventureId =
    sheet.adventureId?.trim() || sheet.campaignRoomId?.trim() || null;
  const identity = normalizeIdentity(sheet.identity);
  const attributes = migrateAttributes(sheet.attributes as unknown as Record<string, number>);
  const conMod = attributeMod(attributes.constituicao);
  const hpMax = hpMaxFor(identity.classe, identity.nivel, conMod);
  const paMax = paMaxForActor({ ...sheet, identity, attributes });
  const desMod = attributeMod(attributes.destreza);
  const culinary = sheet.culinary ?? computeCulinary(identity.classe, identity.raca, identity.linhagem);

  const base = {
    ...sheet,
    adventureId,
    campaignRoomId: undefined,
    identity,
    attributes,
    culinary,
    lootEconomy: sheet.lootEconomy ?? EMPTY_LOOT,
    resources: {
      vida: {
        max: hpMax,
        value: Math.min(sheet.resources?.vida?.value ?? hpMax, hpMax),
      },
      pontosAcao: {
        max: paMax,
        value: Math.min(sheet.resources?.pontosAcao?.value ?? paMax, paMax),
      },
    },
    tactical: {
      defesa: sheet.tactical?.defesa ?? 10 + desMod,
      iniciativa: sheet.tactical?.iniciativa ?? desMod,
    },
  };
  return syncSubclassTalentsToInventory(base);
}
