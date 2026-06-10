import type { TokenCondition } from "@/lib/combat/conditions";
import { toggleTokenCondition, tokenConditions } from "@/lib/combat/conditions";
import { ABILITY_BUFF_DURATIONS } from "@/lib/combat/buff-durations";
import type { AbilityEffect } from "@/lib/combat/types";
import type { BattleToken } from "@/lib/vtt/types";

export type TimedEffectKind = "buff" | "debuff" | "condition";

/** Efeito com contador — expira no fim de turno, início do próximo turno do dono, ou fim de rodada. */
export type TimedEffect = {
  id: string;
  kind: TimedEffectKind;
  label: string;
  condition?: TokenCondition;
  /** Decrementa ao fim do turno do dono. */
  turnsLeft?: number;
  /** Decrementa quando a rodada de combate avança. */
  roundsLeft?: number;
  /** Expira ao iniciar o próximo turno do dono (ex.: +defesa até seu próximo turno). */
  expiresOnOwnerTurnStart?: boolean;
  appliedRound?: number;
  appliedActiveIndex?: number;
  clearFields?: (keyof BattleToken)[];
};

export type TimedEffectInput = {
  kind?: TimedEffectKind;
  label: string;
  condition?: TokenCondition;
  turnsLeft?: number;
  roundsLeft?: number;
  expiresOnOwnerTurnStart?: boolean;
  appliedRound?: number;
  appliedActiveIndex?: number;
  clearFields?: (keyof BattleToken)[];
};

export type CombatTickContext = {
  round: number;
  activeIndex: number;
};

function newEffectId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function timedEffectsOf(token: BattleToken): TimedEffect[] {
  return token.timedEffects ?? [];
}

export function formatTimedEffectRemaining(fx: TimedEffect): string | null {
  if (fx.expiresOnOwnerTurnStart) return "até próx. turno";
  if (fx.turnsLeft != null && fx.turnsLeft > 0) {
    return fx.turnsLeft === 1 ? "1 turno" : `${fx.turnsLeft} turnos`;
  }
  if (fx.roundsLeft != null && fx.roundsLeft > 0) {
    return fx.roundsLeft === 1 ? "1 rodada" : `${fx.roundsLeft} rodadas`;
  }
  return null;
}

/** Badge curto para ícone no token — ex.: `3R`, `2T`, `→`. */
export function formatTimedEffectBadge(fx: TimedEffect): string | null {
  if (fx.expiresOnOwnerTurnStart) return "→";
  if (fx.roundsLeft != null && fx.roundsLeft > 0) return `${fx.roundsLeft}R`;
  if (fx.turnsLeft != null && fx.turnsLeft > 0) return `${fx.turnsLeft}T`;
  return null;
}

export function findTimedEffectForField(
  token: BattleToken,
  field: keyof BattleToken
): TimedEffect | undefined {
  return timedEffectsOf(token).find((fx) => fx.clearFields?.includes(field));
}

export function findTimedEffectForCondition(
  token: BattleToken,
  condition: TokenCondition
): TimedEffect | undefined {
  return timedEffectsOf(token).find((fx) => fx.condition === condition);
}

function clearFieldsPatch(fields: (keyof BattleToken)[] | undefined): Partial<BattleToken> {
  if (!fields?.length) return {};
  const patch: Partial<BattleToken> = {};
  for (const key of fields) {
    (patch as Record<string, unknown>)[key] = undefined;
  }
  return patch;
}

function removeCondition(token: BattleToken, condition: TokenCondition): TokenCondition[] {
  return tokenConditions(token).filter((c) => c !== condition);
}

function expireEffect(token: BattleToken, fx: TimedEffect): BattleToken {
  let next = { ...token };
  if (fx.condition) {
    next.conditions = removeCondition(next, fx.condition);
  }
  next = { ...next, ...clearFieldsPatch(fx.clearFields) };
  return next;
}

function isFreshThisTurn(fx: TimedEffect, ctx: CombatTickContext): boolean {
  return fx.appliedRound === ctx.round && fx.appliedActiveIndex === ctx.activeIndex;
}

/** Fim do turno do dono — decrementa `turnsLeft`. */
export function tickTokenTimedEffectsOnTurnEnd(
  token: BattleToken
): { token: BattleToken; expired: TimedEffect[] } {
  const list = timedEffectsOf(token);
  if (!list.length) return { token, expired: [] };

  const expired: TimedEffect[] = [];
  const kept: TimedEffect[] = [];

  for (const fx of list) {
    if (fx.turnsLeft == null) {
      kept.push(fx);
      continue;
    }
    if (fx.turnsLeft <= 1) {
      expired.push(fx);
    } else {
      kept.push({ ...fx, turnsLeft: fx.turnsLeft - 1 });
    }
  }

  let next: BattleToken = { ...token, timedEffects: kept.length ? kept : undefined };
  for (const fx of expired) {
    next = expireEffect(next, fx);
  }
  return { token: next, expired };
}

/** Nova rodada — decrementa `roundsLeft` em todos os tokens. */
export function tickAllTimedEffectsOnNewRound(
  tokens: BattleToken[]
): { tokens: BattleToken[]; expired: { tokenId: string; fx: TimedEffect }[] } {
  const expired: { tokenId: string; fx: TimedEffect }[] = [];
  const nextTokens = tokens.map((token) => {
    const list = timedEffectsOf(token);
    if (!list.length) return token;

    const kept: TimedEffect[] = [];
    let next = token;

    for (const fx of list) {
      if (fx.roundsLeft == null) {
        kept.push(fx);
        continue;
      }
      if (fx.roundsLeft <= 1) {
        expired.push({ tokenId: token.id, fx });
        next = expireEffect(next, fx);
      } else {
        kept.push({ ...fx, roundsLeft: fx.roundsLeft - 1 });
      }
    }

    next.timedEffects = kept.length ? kept : undefined;
    return next;
  });

  return { tokens: nextTokens, expired };
}

/** Início do turno do dono — expira efeitos `expiresOnOwnerTurnStart` (exceto recém-aplicados). */
export function tickTokenTimedEffectsOnTurnStart(
  token: BattleToken,
  ctx: CombatTickContext
): { token: BattleToken; expired: TimedEffect[] } {
  const list = timedEffectsOf(token);
  if (!list.length) return { token, expired: [] };

  const expired: TimedEffect[] = [];
  const kept: TimedEffect[] = [];

  for (const fx of list) {
    if (!fx.expiresOnOwnerTurnStart) {
      kept.push(fx);
      continue;
    }
    if (isFreshThisTurn(fx, ctx)) {
      kept.push(fx);
      continue;
    }
    expired.push(fx);
  }

  let next: BattleToken = { ...token, timedEffects: kept.length ? kept : undefined };
  for (const fx of expired) {
    next = expireEffect(next, fx);
  }
  return { token: next, expired };
}

export function addTimedEffect(token: BattleToken, input: TimedEffectInput): BattleToken {
  const fx: TimedEffect = {
    id: newEffectId("fx"),
    kind: input.kind ?? (input.condition ? "condition" : "buff"),
    label: input.label,
    condition: input.condition,
    turnsLeft: input.turnsLeft,
    roundsLeft: input.roundsLeft,
    expiresOnOwnerTurnStart: input.expiresOnOwnerTurnStart,
    appliedRound: input.appliedRound,
    appliedActiveIndex: input.appliedActiveIndex,
    clearFields: input.clearFields,
  };

  let next: BattleToken = {
    ...token,
    timedEffects: [...timedEffectsOf(token), fx],
  };

  if (input.condition && !tokenConditions(next).includes(input.condition)) {
    next.conditions = [...tokenConditions(next), input.condition];
  }

  return next;
}

export function applyConditionWithDuration(
  token: BattleToken,
  condition: TokenCondition,
  opts?: { turnsLeft?: number; roundsLeft?: number; label?: string; ctx?: CombatTickContext }
): BattleToken {
  const active = tokenConditions(token);
  if (active.includes(condition)) {
    return removeTimedEffectsForCondition(token, condition);
  }

  const hasDuration =
    (opts?.turnsLeft != null && opts.turnsLeft > 0) ||
    (opts?.roundsLeft != null && opts.roundsLeft > 0);

  if (!hasDuration) {
    return { ...token, conditions: toggleTokenCondition(token, condition) };
  }

  return addTimedEffect(token, {
    kind: "debuff",
    label: opts?.label ?? condition,
    condition,
    turnsLeft: opts?.turnsLeft,
    roundsLeft: opts?.roundsLeft,
    appliedRound: opts?.ctx?.round,
    appliedActiveIndex: opts?.ctx?.activeIndex,
  });
}

/** Liga/desliga condição; com duração registra contador de rodadas ou turnos. */
export function toggleConditionWithDuration(
  token: BattleToken,
  condition: TokenCondition,
  opts?: { turnsLeft?: number; roundsLeft?: number; ctx?: CombatTickContext }
): BattleToken {
  if (tokenConditions(token).includes(condition)) {
    return removeTimedEffectsForCondition(token, condition);
  }
  return applyConditionWithDuration(token, condition, opts);
}

export function removeTimedEffectsForCondition(
  token: BattleToken,
  condition: TokenCondition
): BattleToken {
  let next: BattleToken = {
    ...token,
    conditions: removeCondition(token, condition),
    timedEffects: timedEffectsOf(token).filter((fx) => fx.condition !== condition),
  };
  if (!next.timedEffects?.length) next.timedEffects = undefined;
  return next;
}

export function attachDefenseBuffDuration(
  token: BattleToken,
  source: string,
  ctx: CombatTickContext
): BattleToken {
  const withoutOld = {
    ...token,
    timedEffects: timedEffectsOf(token).filter((fx) => !fx.clearFields?.includes("defesaBonus")),
  };
  return addTimedEffect(withoutOld, {
    kind: "buff",
    label: source,
    expiresOnOwnerTurnStart: true,
    appliedRound: ctx.round,
    appliedActiveIndex: ctx.activeIndex,
    clearFields: ["defesaBonus", "defesaBuffSource"],
  });
}

export function attachTurnLimitedBuff(
  token: BattleToken,
  label: string,
  clearFields: (keyof BattleToken)[],
  turnsLeft = 1,
  ctx?: CombatTickContext
): BattleToken {
  const withoutOld = {
    ...token,
    timedEffects: timedEffectsOf(token).filter(
      (fx) => !fx.clearFields?.some((f) => clearFields.includes(f))
    ),
  };
  return addTimedEffect(withoutOld, {
    kind: "buff",
    label,
    turnsLeft,
    appliedRound: ctx?.round,
    appliedActiveIndex: ctx?.activeIndex,
    clearFields,
  });
}

export function formatExpiredNotice(fx: TimedEffect, tokenName: string): string {
  return `${tokenName}: ${fx.label} expirou.`;
}

function chargeBuffLabel(effect: AbilityEffect | undefined): string {
  if (effect === "wild_shape") return "Forma selvagem";
  if (effect === "shadow_step") return "Passo das sombras";
  return "Investida";
}

function chargeBuffFields(token: BattleToken): (keyof BattleToken)[] {
  const fields: (keyof BattleToken)[] = ["chargeReady"];
  if (token.chargeNote?.trim()) fields.push("chargeNote");
  return fields;
}

/** Após aplicar `attackerUpdate` / `defenderUpdate`, registra contadores automáticos. */
export function enrichBuffsWithTimedEffects(
  token: BattleToken,
  updates: Partial<BattleToken>,
  abilityEffect: AbilityEffect | string | undefined,
  ctx: CombatTickContext
): BattleToken {
  let next: BattleToken = { ...token, ...updates };
  const effect = abilityEffect as AbilityEffect | undefined;

  if (effect === "defense_buff" && (next.defesaBonus ?? 0) > 0) {
    next = attachDefenseBuffDuration(next, next.defesaBuffSource ?? "Postura", ctx);
  }
  if (effect === "ranged_advantage" && next.rangedAttackAdvantage) {
    next = attachTurnLimitedBuff(next, "Tiro certeiro", ["rangedAttackAdvantage"], 1, ctx);
  }
  if (next.nextAttackBonus) {
    next = attachTurnLimitedBuff(next, "Golpe preparado", ["nextAttackBonus"], 1, ctx);
  }
  if (next.chargeReady) {
    next = attachTurnLimitedBuff(
      next,
      chargeBuffLabel(effect),
      chargeBuffFields(next),
      1,
      ctx
    );
  }
  if (next.reactionShiftReady) {
    next = attachTurnLimitedBuff(next, "Reflexos", ["reactionShiftReady"], 1, ctx);
  }
  if (next.allyAttackAdvantage) {
    next = attachTurnLimitedBuff(next, "Inspiração", ["allyAttackAdvantage"], 1, ctx);
  }
  if (next.bonusDamageFormula?.trim()) {
    const label = effect && ABILITY_BUFF_DURATIONS[effect]?.label ? "Canalização" : "Dano extra";
    next = attachTurnLimitedBuff(next, label, ["bonusDamageFormula"], 1, ctx);
  }
  if (next.attackMark) {
    const label = next.attackMark.attackerDisadvantage ? "Finta" : "Marca";
    next = attachTurnLimitedBuff(next, label, ["attackMark"], 1, ctx);
  }

  return next;
}

export function clearTimedEffectsForFields(
  token: BattleToken,
  fields: (keyof BattleToken)[]
): BattleToken {
  const next = timedEffectsOf(token).filter(
    (fx) => !fx.clearFields?.some((f) => fields.includes(f))
  );
  if (next.length === timedEffectsOf(token).length) return token;
  return { ...token, timedEffects: next.length ? next : undefined };
}
