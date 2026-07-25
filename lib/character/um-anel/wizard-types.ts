import type { TorAttributeKey, TorCallingId, TorCombatProficiencyId, TorCultureId, TorSkillId } from "./types";

export type TorCharacterWizardDraft = {
  name: string;
  age: number | null;
  culture: TorCultureId | null;
  attributeOptionIndex: number | null;
  /** Só usado pela Cultura Rangers (bônus "Reis dos Homens": +1 num Atributo). */
  rangerAttributeBonus: TorAttributeKey | null;
  cultureFavouredSkill: TorSkillId | null;
  calling: TorCallingId | null;
  favouredCallingSkills: TorSkillId[];
  /** Só usado pela Vocação Campeão (Conhecimento do Inimigo). */
  enemyLoreChoice: string | null;
  combatProficiencyChoiceA: TorCombatProficiencyId | null;
  combatProficiencyChoiceB: TorCombatProficiencyId | null;
  distinctiveFeatures: string[];
  reward: string | null;
  virtue: string | null;
  /** Uma arma por Proficiência de Combate com rating > 0 (livro: "one weapon for each
   * Combat Proficiency for which they have a rating"). */
  weaponChoices: Partial<Record<TorCombatProficiencyId, string>>;
  /** Toda ficha inicial vem com uma armadura (livro: "starts with one suit of armour"). */
  armourId: string | null;
  helm: boolean;
  shieldId: string | null;
  biography: string;
};

export const EMPTY_TOR_WIZARD_DRAFT: TorCharacterWizardDraft = {
  name: "",
  age: null,
  culture: null,
  attributeOptionIndex: null,
  rangerAttributeBonus: null,
  cultureFavouredSkill: null,
  calling: null,
  favouredCallingSkills: [],
  enemyLoreChoice: null,
  combatProficiencyChoiceA: null,
  combatProficiencyChoiceB: null,
  distinctiveFeatures: [],
  reward: null,
  virtue: null,
  weaponChoices: {},
  armourId: null,
  helm: false,
  shieldId: null,
  biography: "",
};

/** Proficiências ativas (rating > 0) — deduplica quando A e B caem na mesma. */
export function activeCombatProficiencies(
  draft: Pick<TorCharacterWizardDraft, "combatProficiencyChoiceA" | "combatProficiencyChoiceB">
): TorCombatProficiencyId[] {
  return [...new Set([draft.combatProficiencyChoiceA, draft.combatProficiencyChoiceB].filter((x): x is TorCombatProficiencyId => Boolean(x)))];
}

export function validateTorWizardDraft(draft: TorCharacterWizardDraft): string | null {
  if (!draft.name.trim()) return "Escolha um nome para o aventureiro";
  if (!draft.culture) return "Escolha uma Cultura";
  if (draft.attributeOptionIndex === null) return "Escolha um conjunto de Atributos";
  if (draft.culture === "rangers" && !draft.rangerAttributeBonus) {
    return "Escolha em qual Atributo aplicar o bônus de Rangers do Norte";
  }
  if (!draft.cultureFavouredSkill) return "Escolha a Perícia Favorecida da Cultura";
  if (!draft.calling) return "Escolha uma Vocação";
  if (draft.favouredCallingSkills.length !== 2) return "Escolha 2 Perícias Favorecidas da Vocação";
  if (draft.calling === "campeao" && !draft.enemyLoreChoice) {
    return "Escolha o tipo de inimigo do Conhecimento do Inimigo";
  }
  if (!draft.combatProficiencyChoiceA) return "Escolha a Proficiência de Combate principal";
  if (!draft.combatProficiencyChoiceB) return "Escolha a Proficiência de Combate adicional";
  if (draft.distinctiveFeatures.length !== 2) return "Escolha 2 Traços Distintivos";
  if (!draft.reward) return "Escolha uma Recompensa inicial";
  if (!draft.virtue) return "Escolha uma Virtude inicial";
  for (const prof of activeCombatProficiencies(draft)) {
    if (!draft.weaponChoices[prof]) return "Escolha uma arma pra cada Proficiência de Combate";
  }
  if (!draft.armourId) return "Escolha uma armadura inicial";
  return null;
}
