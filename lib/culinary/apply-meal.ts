import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import {
  hpHealedByMealQuality,
  maxAssimilationPicksFromPlate,
  mealQualityFromCoccaoRoll,
  mealQualityLabel,
  paRestoredByMealQuality,
} from "@/lib/culinary/meal-rules";
import {
  listSpecimenAssimilations,
  monsterCatalogId,
} from "@/lib/culinary/specimen";
import type {
  AssimilatedAbility,
  CharacterCulinaryProgress,
  StructuredMealInput,
  StructuredMealResult,
} from "@/lib/culinary/types";

const MEAL_DURATION_MS = 24 * 60 * 60 * 1000;

function culinaryProgress(actor: CharacterSheet): CharacterCulinaryProgress {
  return actor.culinaryProgress ?? { studiedAnatomyCatalogIds: [], activeAssimilations: [], daysWithoutMeal: 0 };
}

function validateAssimilationPicks(
  monsterEntryId: string,
  focusId: string,
  extraIds: string[],
  plateD4: number
): string | null {
  const options = listSpecimenAssimilations(monsterEntryId);
  if (!options.length) return "Monstro sem tabela de assimilação (001–060).";

  const allowed = new Set(options.map((o) => o.entryId));
  if (!allowed.has(focusId)) return "Foco inválido para este espécime.";

  const maxPicks = maxAssimilationPicksFromPlate(plateD4);
  const chosen = [focusId, ...extraIds.filter((id) => id && id !== focusId)];
  const unique = [...new Set(chosen)];
  if (unique.length > maxPicks) {
    return `Prato estruturado permite no máximo ${maxPicks} habilidade(s) (d4=${plateD4}).`;
  }

  for (const id of unique) {
    if (!allowed.has(id)) return `Habilidade inválida: ${id}`;
  }
  return null;
}

function buildAssimilations(
  monsterEntryId: string,
  focusId: string,
  extraIds: string[],
  acquiredAt: number
): AssimilatedAbility[] {
  const catalogId = monsterCatalogId(monsterEntryId) ?? "MON-???";
  const options = listSpecimenAssimilations(monsterEntryId);
  const chosen = [...new Set([focusId, ...extraIds.filter((id) => id && id !== focusId)])];

  return chosen.map((entryId) => {
    const opt = options.find((o) => o.entryId === entryId);
    return {
      entryId,
      name: opt?.name ?? entryId,
      effectLabel: opt?.effectLabel ?? "",
      specimenCatalogId: catalogId,
      acquiredAt,
      expiresAt: acquiredAt + MEAL_DURATION_MS,
    };
  });
}

export function applyStructuredMealToActor(
  actor: CharacterSheet,
  assimilations: AssimilatedAbility[],
  quality: ReturnType<typeof mealQualityFromCoccaoRoll>,
  hpHealed: number,
  paRestored: number
): CharacterSheet {
  const progress = culinaryProgress(actor);
  const existing = progress.activeAssimilations.filter(
    (a) => !assimilations.some((n) => n.entryId === a.entryId)
  );

  const next: CharacterSheet = {
    ...actor,
    resources: {
      vida: {
        ...actor.resources.vida,
        value: Math.min(actor.resources.vida.max, actor.resources.vida.value + hpHealed),
      },
      pontosAcao: {
        ...actor.resources.pontosAcao,
        value: Math.min(actor.resources.pontosAcao.max, actor.resources.pontosAcao.value + paRestored),
      },
    },
    culinaryProgress: {
      ...progress,
      activeAssimilations: [...existing, ...assimilations],
      daysWithoutMeal: 0,
    },
  };

  return normalizeCharacter(next);
}

export function validateStructuredMealInput(input: StructuredMealInput): string | null {
  if (!input.monsterEntryId?.trim()) return "Informe o monstro preparado.";
  if (!input.participantActorIds?.length) return "Selecione ao menos um participante.";
  if (!input.cookActorId?.trim()) return "Informe o cozinheiro.";
  if (!Number.isFinite(input.coccaoRoll)) return "Rolagem de Coccao inválida.";
  const d4 = Math.floor(input.plateD4);
  if (d4 < 1 || d4 > 4) return "Rolagem do d4 deve ser 1–4.";
  if (!input.focusAssimEntryId?.trim()) return "Escolha o Foco (habilidade garantida).";
  return validateAssimilationPicks(
    input.monsterEntryId,
    input.focusAssimEntryId,
    input.extraAssimEntryIds ?? [],
    d4
  );
}

export function resolveStructuredMeal(
  input: StructuredMealInput,
  actors: Record<string, CharacterSheet>,
  gororobaHpRoll?: number
): { ok: true; result: StructuredMealResult; updatedActors: Record<string, CharacterSheet> } | { ok: false; error: string } {
  const err = validateStructuredMealInput(input);
  if (err) return { ok: false, error: err };

  const quality = mealQualityFromCoccaoRoll(input.coccaoRoll);
  const now = Date.now();
  const assimilations = buildAssimilations(
    input.monsterEntryId,
    input.focusAssimEntryId,
    input.extraAssimEntryIds ?? [],
    now
  );

  const catalogId = monsterCatalogId(input.monsterEntryId) ?? input.monsterEntryId;
  const monsterName = listSpecimenAssimilations(input.monsterEntryId).length
    ? catalogId
    : input.monsterEntryId;

  const hpHealedByActor: Record<string, number> = {};
  const assimilationsByActor: Record<string, AssimilatedAbility[]> = {};
  const updatedActors: Record<string, CharacterSheet> = { ...actors };
  const chatLines: string[] = [
    `Refeição (${mealQualityLabel(quality)}) — ${monsterName} · d4=${input.plateD4} · ${assimilations.length} assimilação(ões).`,
  ];

  for (const actorId of input.participantActorIds) {
    const actor = actors[actorId];
    if (!actor) return { ok: false, error: `Personagem ${actorId} não encontrado.` };

    const hpHealed = hpHealedByMealQuality(quality, actor, gororobaHpRoll);
    const paRestored = paRestoredByMealQuality(quality, actor);
    const next = applyStructuredMealToActor(actor, assimilations, quality, hpHealed, paRestored);

    updatedActors[actorId] = next;
    hpHealedByActor[actorId] = hpHealed;
    assimilationsByActor[actorId] = assimilations;
    chatLines.push(
      `${actor.name}: +${hpHealed} HP${paRestored ? `, +${paRestored} PA` : ""} · ${assimilations.map((a) => a.name).join(", ")}`
    );
  }

  return {
    ok: true,
    result: { quality, hpHealedByActor, assimilationsByActor, chatLines },
    updatedActors,
  };
}
