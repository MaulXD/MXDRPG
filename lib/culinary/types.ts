/** Qualidade da refeição (Cap. 5.3). */
export type MealQuality = "gororoba" | "comum" | "gourmet" | "perfeito";

export type AssimilatedAbility = {
  entryId: string;
  name: string;
  effectLabel: string;
  specimenCatalogId: string;
  acquiredAt: number;
  /** Timestamp; null = até descanso longo (manual). */
  expiresAt: number | null;
};

export type CharacterCulinaryProgress = {
  /** MON-### estudados com sucesso (Cap. 5.1). */
  studiedAnatomyCatalogIds: string[];
  activeAssimilations: AssimilatedAbility[];
  /** Dias sem refeição completa (Cap. 5 — exaustão por fome). */
  daysWithoutMeal: number;
};

export const EMPTY_CULINARY_PROGRESS: CharacterCulinaryProgress = {
  studiedAnatomyCatalogIds: [],
  activeAssimilations: [],
  daysWithoutMeal: 0,
};

export type StructuredMealInput = {
  monsterEntryId: string;
  participantActorIds: string[];
  cookActorId: string;
  coccaoRoll: number;
  plateD4: number;
  focusAssimEntryId: string;
  extraAssimEntryIds: string[];
};

export type StructuredMealResult = {
  quality: MealQuality;
  hpHealedByActor: Record<string, number>;
  assimilationsByActor: Record<string, AssimilatedAbility[]>;
  chatLines: string[];
};
