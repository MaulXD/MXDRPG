import type { TokenCondition } from "@/lib/combat/conditions";
import type { AbilityEffect } from "@/lib/combat/types";

/** Como o efeito expira na mesa virtual. */
export type DurationSpec =
  | { kind: "turns"; count: number }
  | { kind: "rounds"; count: number }
  | { kind: "until_owner_turn_start" }
  | { kind: "until_used" }
  | { kind: "manual" };

export type BuffDurationRule = {
  spec: DurationSpec;
  /** Texto curto para tooltip e livro — ex. `1 turno`, `até próx. turno`. */
  label: string;
  description: string;
};

function turns(n: number): BuffDurationRule {
  const label = n === 1 ? "1 turno" : `${n} turnos`;
  return {
    spec: { kind: "turns", count: n },
    label,
    description: `Expira após ${label} do personagem (ou ao ser consumido, se antes).`,
  };
}

function rounds(n: number): BuffDurationRule {
  const label = n === 1 ? "1 rodada" : `${n} rodadas`;
  return {
    spec: { kind: "rounds", count: n },
    label,
    description: `Expira após ${label} de combate (contador global).`,
  };
}

const UNTIL_OWNER_TURN: BuffDurationRule = {
  spec: { kind: "until_owner_turn_start" },
  label: "até próx. turno",
  description: "Dura até o início do próximo turno do personagem afetado.",
};

const UNTIL_USED: BuffDurationRule = {
  spec: { kind: "until_used" },
  label: "até usar",
  description: "Dura até o efeito ser consumido (ataque, cura, movimento etc.) ou expirar no fim do turno.",
};

/** Durações automáticas dos buffs/debuffs de habilidades na mesa virtual. */
export const ABILITY_BUFF_DURATIONS: Partial<Record<AbilityEffect, BuffDurationRule>> = {
  defense_buff: {
    ...UNTIL_OWNER_TURN,
    description: "Bônus de defesa até o início do próximo turno de quem usou a postura.",
  },
  melee_attack_bonus: turns(1),
  ranged_advantage: turns(1),
  charge: turns(1),
  shadow_step: turns(1),
  wild_shape: turns(1),
  reaction_shift: turns(1),
  mark: turns(1),
  mark_disadvantage: turns(1),
  ally_inspire: turns(1),
};

/** Campos de token com contador automático (sem abilityEffect explícito). */
export const TOKEN_FIELD_BUFF_DURATIONS: Partial<
  Record<"nextAttackBonus" | "bonusDamageFormula" | "attackMark", BuffDurationRule>
> = {
  nextAttackBonus: turns(1),
  bonusDamageFormula: turns(1),
  attackMark: turns(1),
};

/** Duração sugerida quando o mestre aplica condições manualmente (Cap. 3.4). */
export const CONDITION_SUGGESTED_DURATIONS: Partial<
  Record<TokenCondition, { turnsLeft?: number; roundsLeft?: number; note: string }>
> = {
  amedrontado: { roundsLeft: 2, note: "2 rodadas ou até a fonte do medo sumir" },
  cego: { roundsLeft: 2, note: "2 rodadas (cegueira temporária)" },
  atordoado: { turnsLeft: 1, note: "1 turno (atordoamento breve)" },
  envenenado: { roundsLeft: 3, note: "3 rodadas (veneno leve)" },
  prostrado: { note: "Sem contador — até levantar (ação)" },
  restringido: { roundsLeft: 2, note: "2 rodadas (amarrado/enredado)" },
  encantado: { roundsLeft: 3, note: "3 rodadas (encantamento social)" },
};

/** Duração sugerida para condições do livro ainda não rastreadas na mesa. */
export const BOOK_CONDITION_SUGGESTED_DURATIONS: Record<string, string> = {
  Agarrado: "Sem contador — até escapar (Força/Acrobacia)",
  Amedrontado: "2 rodadas ou até a fonte sumir",
  Atordoado: "1 turno",
  Cego: "2 rodadas",
  Encantado: "3 rodadas",
  Envenenado: "3 rodadas",
  Exausto: "Sem contador — níveis permanentes até descanso",
  Incapacitado: "1–2 turnos (efeito da magia)",
  Invisivel: "1 rodada ou até atacar",
  Paralisado: "1–2 turnos",
  Petrificado: "Sem contador — até remoção",
  Prostrado: "Sem contador — até levantar",
  Restringido: "2 rodadas",
  Surdo: "2 rodadas",
};

export function formatDurationSpec(spec: DurationSpec): string {
  switch (spec.kind) {
    case "turns":
      return spec.count === 1 ? "1 turno" : `${spec.count} turnos`;
    case "rounds":
      return spec.count === 1 ? "1 rodada" : `${spec.count} rodadas`;
    case "until_owner_turn_start":
      return "até próx. turno";
    case "until_used":
      return "até usar";
    case "manual":
      return "até remover";
  }
}

export function abilityEffectDurationHint(effect: AbilityEffect | undefined): string | null {
  if (!effect) return null;
  return ABILITY_BUFF_DURATIONS[effect]?.label ?? null;
}

export function conditionSuggestedDurationLabel(condition: TokenCondition): string | null {
  const spec = CONDITION_SUGGESTED_DURATIONS[condition];
  if (!spec) return null;
  if (spec.turnsLeft) return spec.turnsLeft === 1 ? "1 turno (sug.)" : `${spec.turnsLeft} turnos (sug.)`;
  if (spec.roundsLeft) return spec.roundsLeft === 1 ? "1 rodada (sug.)" : `${spec.roundsLeft} rodadas (sug.)`;
  return "Sem contador (sug.)";
}
