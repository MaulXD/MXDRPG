import { applyIdentityPatch } from "@/lib/character/identity";
import { applyLevelUp, isCharacterDead, type LevelUpChoices } from "@/lib/character/level-up";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import {
  attributeMod,
  computeCulinary,
  hpMaxFor,
  paMaxFor,
  TALENT_LEVELS,
} from "@/lib/character/rules";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import { applyPerLevelBonuses } from "@/lib/character/per-level-gains";
import { parseCharacterTalents } from "@/lib/character/subclass-tracks";
import type { SheetEditScope } from "@/lib/character/sheet-edit-request";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import {
  buildCharacterFromWizard,
  sanitizeWizardDraftForSave,
  validateWizardDraft,
} from "@/lib/character/build-from-wizard";

function recalcResourcesAtLevel(sheet: CharacterSheet, level: number): CharacterSheet {
  const conMod = attributeMod(sheet.attributes.constituicao);
  const hpMax = hpMaxFor(sheet.identity.classe, level, conMod);
  const paMax = paMaxFor(level, 0);
  const culinary = computeCulinary(
    sheet.identity.classe,
    sheet.identity.raca,
    sheet.identity.linhagem
  );
  const scaled = normalizeCharacter({
    ...sheet,
    identity: { ...sheet.identity, nivel: level },
    culinary,
    resources: {
      vida: { value: isCharacterDead(sheet) ? 0 : hpMax, max: hpMax },
      pontosAcao: { value: paMax, max: paMax },
    },
    tactical: {
      defesa: sheet.armorLoadout?.entryId
        ? resolveActorDefesa({ ...sheet, identity: { ...sheet.identity, nivel: level } })
        : 10 + attributeMod(sheet.attributes.destreza),
      iniciativa: attributeMod(sheet.attributes.destreza),
    },
  });
  return applyPerLevelBonuses(scaled, level);
}

/** Reverte o último nível para reabrir o fluxo de level-up (mantém XP). */
export function prepareCharacterForLastLevelReedit(actor: CharacterSheet): CharacterSheet {
  const nivel = actor.identity.nivel;
  if (nivel <= 1) {
    throw new Error("Personagem no nível 1 — use reconstrução completa.");
  }

  const prevNivel = nivel - 1;
  const talentos = parseCharacterTalents(actor.identity.talentos).filter(
    (t) => t.level !== nivel
  );
  const subclasse = nivel === 2 ? null : (actor.identity.subclasse ?? null);

  const reverted = normalizeCharacter({
    ...actor,
    identity: {
      ...actor.identity,
      nivel: prevNivel,
      subclasse,
      talentos,
    },
  });

  return recalcResourcesAtLevel(reverted, prevNivel);
}

export function finalizeLastLevelReedit(
  prepared: CharacterSheet,
  choices: LevelUpChoices
): CharacterSheet {
  return applyLevelUp(prepared, choices);
}

export function mergeWizardIntoCharacterPreservingCampaign(
  existing: CharacterSheet,
  draft: CharacterWizardDraft,
  scope: SheetEditScope
): CharacterSheet {
  if (scope !== "full_rebuild") {
    throw new Error("mergeWizardIntoCharacterPreservingCampaign exige scope full_rebuild");
  }

  const safeDraft = sanitizeWizardDraftForSave(draft);
  const err = validateWizardDraft(safeDraft);
  if (err) throw new Error(err);

  /** XP acumulado na campanha — preservado para re-subir nível pelo assistente. */
  const xpTotal = Math.max(0, existing.identity.xpTotal ?? 0);

  const levelOne = buildCharacterFromWizard(
    existing.ownerId,
    safeDraft,
    existing.id,
    existing.adventureId ?? existing.campaignRoomId ?? null
  );

  const merged = normalizeCharacter({
    ...levelOne,
    id: existing.id,
    ownerId: existing.ownerId,
    adventureId: existing.adventureId ?? null,
    campaignRoomId: existing.campaignRoomId ?? null,
    inventory: [...existing.inventory],
    lootEconomy: existing.lootEconomy ? { ...existing.lootEconomy } : existing.lootEconomy,
    combatLoadout: existing.combatLoadout ?? null,
    armorLoadout: existing.armorLoadout ?? null,
    identity: {
      ...levelOne.identity,
      nivel: 1,
      xpTotal,
      subclasse: null,
      talentos: [],
    },
    culinary: { trinchar: 0, harmonizacao: 0, coccao: 0, estomagoDeFerro: 0 },
    tactical: {
      defesa: 10 + attributeMod(levelOne.attributes.destreza),
      iniciativa: attributeMod(levelOne.attributes.destreza),
    },
    movement: { walk: 4, run: 6 },
  });

  const withIdentity = applyIdentityPatch(merged, {
    raca: safeDraft.raca,
    classe: safeDraft.classe,
    linhagem: safeDraft.raca === "Meio-Humano" ? safeDraft.linhagem : null,
    antecedente: safeDraft.antecedente,
    attributes: merged.attributes,
  });

  return recalcResourcesAtLevel(withIdentity, 1);
}

export function validateLastLevelReedit(actor: CharacterSheet): string | null {
  if (actor.identity.nivel <= 1) {
    return "Só é possível reeditar o último nível a partir do nível 2.";
  }
  const nivel = actor.identity.nivel;
  const hasLastLevelTalent = parseCharacterTalents(actor.identity.talentos).some(
    (t) => t.level === nivel && (TALENT_LEVELS as readonly number[]).includes(nivel)
  );
  if (nivel === 2 && !actor.identity.subclasse && !hasLastLevelTalent) {
    return null;
  }
  return null;
}
