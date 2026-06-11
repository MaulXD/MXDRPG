import { migrateSubclassName } from "@/lib/character/legacy-names";
import { normalizeReligionId } from "@/lib/character/pantheon";
import type { CharacterAttributes, CharacterSheet, CharacterIdentity } from "@/lib/character/types";
import { parseCharacterTalents } from "@/lib/character/subclass-tracks";
import { computeCulinary, hpMaxFor, attributeMod } from "@/lib/character/rules";
import { paMaxForActor } from "@/lib/combat/pa-economy";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import { xpTotalForLevel } from "@/lib/character/xp";
import { syncCombatAbilitiesToInventory } from "@/lib/character/combat-inventory-sync";
import { ensureLoadoutItemsInInventory } from "@/lib/character/inventory-loadout-sync";
import { EMPTY_CULINARY_PROGRESS } from "@/lib/culinary/types";
import { normalizeLegacyConsumables } from "@/lib/character/inventory-normalize";
import { EMPTY_LOOT } from "@/lib/character/loot-storage";
import {
  applyStarterKitToSheet,
  getDefaultStarterKitId,
} from "@/lib/character/starter-kits";

function backfillStarterKitIfBare(sheet: CharacterSheet): CharacterSheet {
  if (sheet.identity.nivel > 1) return sheet;
  const bare =
    (sheet.inventory?.length ?? 0) === 0 &&
    !sheet.combatLoadout &&
    !sheet.armorLoadout;
  if (!bare) return sheet;
  return applyStarterKitToSheet(sheet, {
    classe: sheet.identity.classe,
    raca: sheet.identity.raca,
    antecedente: sheet.identity.antecedente,
    starterKitId: getDefaultStarterKitId(sheet.identity.classe),
  });
}

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
      defesa: resolveActorDefesa({ ...sheet, identity, attributes }),
      iniciativa: sheet.tactical?.iniciativa ?? desMod,
    },
  };
  const withKit = backfillStarterKitIfBare(base);
  const withLegacyConsumables = {
    ...withKit,
    inventory: normalizeLegacyConsumables(withKit.inventory ?? []),
    culinaryProgress: {
      ...EMPTY_CULINARY_PROGRESS,
      ...withKit.culinaryProgress,
      studiedAnatomyCatalogIds: [...(withKit.culinaryProgress?.studiedAnatomyCatalogIds ?? [])],
      activeAssimilations: [...(withKit.culinaryProgress?.activeAssimilations ?? [])],
    },
  };
  return syncCombatAbilitiesToInventory(ensureLoadoutItemsInInventory(withLegacyConsumables));
}
