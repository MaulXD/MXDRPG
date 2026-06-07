import type { TokenCondition } from "@/lib/combat/conditions";
import { hasCondition } from "@/lib/combat/conditions";
import type { PaTurnRules } from "@/lib/combat/pa-economy";
import { PA_ACCUMULATION_CAP_DEFAULT, PA_RECOVERY_PER_TURN } from "@/lib/combat/pa-economy";
import type { BattleToken } from "@/lib/vtt/types";

/** Recuperação padrão por turno (alias). */
export { PA_RECOVERY_PER_TURN } from "@/lib/combat/pa-economy";

/** Teto de PA acumulados entre turnos (sobra no pool). */
export { PA_ACCUMULATION_CAP_DEFAULT as PA_ACCUMULATION_CAP } from "@/lib/combat/pa-economy";

/** @deprecated Sem teto de gasto por turno — bônus de PA podem permitir gastar mais no mesmo turno. */
export const PA_SPEND_CAP_PER_TURN = 999;

/** @deprecated Pool unificado; legado de “bank” separado. */
export const PA_BANK_MAX = 2;
export const PA_BANK_STACK_MAX = PA_BANK_MAX;

export function accumulationCap(rules?: Pick<PaTurnRules, "accumulationCap">): number {
  return rules?.accumulationCap ?? PA_ACCUMULATION_CAP_DEFAULT;
}

/** @deprecated Use `accumulationCap`. */
export function paPoolCap(rules?: Pick<PaTurnRules, "accumulationCap">): number {
  return accumulationCap(rules);
}

export function tokenBankedPa(token: BattleToken): number {
  return Math.max(0, Math.min(PA_BANK_STACK_MAX, token.bankedPa ?? 0));
}

export function tokenPaSpentThisTurn(token: BattleToken): number {
  return Math.max(0, token.paSpentThisTurn ?? 0);
}

/** PA disponíveis para gastar agora (pool + legado banked). */
export function tokenSpendablePa(token: BattleToken): number {
  const pool = Math.max(0, token.pa ?? 0);
  const legacy = tokenBankedPa(token);
  return pool + legacy;
}

/** Funde `bankedPa` legado no pool (sem cortar acima do teto de acúmulo — isso é só ao passar turno). */
export function materializeCombatPa(token: BattleToken, paMax: number): BattleToken {
  const pool = Math.max(0, token.pa ?? 0) + tokenBankedPa(token);
  return {
    ...token,
    paMax,
    pa: pool,
    bankedPa: 0,
    paSpentThisTurn: token.paSpentThisTurn ?? 0,
  };
}

/** Zera pool antes de conceder PA no turno — evita carry fantasma do spawn (ex. 5+5=9). */
export function clearCombatPaPool(token: BattleToken): BattleToken {
  return {
    ...token,
    pa: 0,
    bankedPa: 0,
    paSpentThisTurn: 0,
    peaoFreeMoveUsed: false,
  };
}

/** Ao receber Atordoado: zera PA (livro / DOS stun). */
export function clearBankedPaOnStun(token: BattleToken): BattleToken {
  if (!hasCondition(token, "atordoado")) return token;
  if ((token.pa ?? 0) === 0 && (token.bankedPa ?? 0) === 0) return token;
  return { ...token, pa: 0, bankedPa: 0 };
}

export type EndTurnPaBankPlan = {
  remaining: number;
  saved: number;
  discarded: number;
  totalBankedAfter: number;
  afterNextTurn?: number;
  poolCap?: number;
};

/** Aviso ao passar turno: sobra de PA (estilo DOS). */
export function planEndOfTurnPaBank(
  token: BattleToken,
  rules?: PaTurnRules
): EndTurnPaBankPlan | null {
  const pool = Math.max(0, token.pa ?? 0);
  const legacy = tokenBankedPa(token);
  const remaining = pool + legacy;
  if (remaining <= 0) return null;

  if (hasCondition(token, "atordoado")) {
    return { remaining, saved: 0, discarded: remaining, totalBankedAfter: 0 };
  }

  const recovery = rules?.recoveryPerTurn ?? PA_RECOVERY_PER_TURN;
  const cap = accumulationCap(rules);
  const saved = Math.min(cap, remaining);
  const discarded = Math.max(0, remaining - cap);
  const afterNextTurn =
    rules?.turnStartPa != null
      ? Math.min(cap, rules.turnStartPa)
      : Math.min(cap, saved + recovery);

  return {
    remaining,
    saved,
    discarded,
    totalBankedAfter: saved,
    afterNextTurn,
    poolCap: cap,
  };
}

/** @deprecated Use `formatTurnStartCombatNotice`. */
export function formatTurnStartPaNotice(tokenName: string, pa: number): string {
  const label = pa === 1 ? "1 PA" : `${pa} PA`;
  return `${tokenName}: ${label} restituídos neste turno.`;
}

/** Log de combate ao iniciar turno — foco em quem joga; PA só quando não é o padrão. */
export function formatTurnStartCombatNotice(
  tokenName: string,
  round: number,
  paAfter: number,
  rules: PaTurnRules,
  carryBefore: number
): string {
  const head = `Turno de ${tokenName} · R${round}`;

  if (rules.turnStartPa != null) {
    const label = paAfter === 1 ? "1 PA" : `${paAfter} PA`;
    return `${head} — ${label} (talento)`;
  }

  const recovery = rules.recoveryPerTurn;
  const carry = Math.max(0, carryBefore);

  if (carry <= 0 && paAfter === recovery) {
    return head;
  }

  if (carry > 0) {
    const gained = paAfter - carry;
    const paLabel = paAfter === 1 ? "1 PA" : `${paAfter} PA`;
    if (gained > 0) {
      const gainedLabel = gained === 1 ? "1 recuperado" : `${gained} recuperados`;
      const carryLabel = carry === 1 ? "1 acumulado" : `${carry} acumulados`;
      return `${head} — ${paLabel} (${carryLabel} + ${gainedLabel})`;
    }
    const carryLabel = carry === 1 ? "1 acumulado" : `${carry} acumulados`;
    return `${head} — ${paLabel} (${carryLabel})`;
  }

  if (paAfter !== recovery) {
    const label = paAfter === 1 ? "1 PA" : `${paAfter} PA`;
    return `${head} — ${label}`;
  }

  return head;
}

/** PA descartados ao passar turno (só quando passa do teto). */
export function formatEndTurnPaDiscardNotice(
  tokenName: string,
  discarded: number,
  cap: number
): string {
  const waste =
    discarded === 1 ? "1 PA perdido" : `${discarded} PA perdidos`;
  return `${tokenName}: ${waste} (teto de acúmulo ${cap}).`;
}

/** Toast quando atordoado pula turno. */
export function formatStunSkipNotice(tokenName: string): string {
  return `${tokenName} está atordoado — turno passado sem guardar PA.`;
}

export function formatEndTurnPaBankMessage(plan: EndTurnPaBankPlan, rules?: PaTurnRules): string {
  const recovery = rules?.recoveryPerTurn ?? PA_RECOVERY_PER_TURN;
  const cap = plan.poolCap ?? accumulationCap(rules);
  const next = plan.afterNextTurn ?? Math.min(cap, plan.saved + recovery);
  const rest =
    plan.remaining === 1 ? "1 PA no pool" : `${plan.remaining} PA no pool`;

  if (plan.discarded > 0) {
    const waste =
      plan.discarded === 1
        ? "1 PA acima do teto de acúmulo"
        : `${plan.discarded} PA acima do teto de acúmulo`;
    return `${rest} · guarda até ${plan.saved}/${cap} (${waste} perdidos). Próximo turno: ~${next} PA.`;
  }

  if (rules?.turnStartPa != null) {
    return `${rest} · próximo turno inicia com ${rules.turnStartPa} PA (talento).`;
  }

  const nextLabel = next === 1 ? "1 PA" : `${next} PA`;
  return `${rest} · próximo turno: ${plan.saved} + ${recovery} recuperação = ${nextLabel} (acumula até ${cap}).`;
}

/** Fim do turno: sobra no pool, cortada pelo teto de acúmulo (9 padrão). */
export function bankPaAtEndOfTurn(token: BattleToken, rules?: PaTurnRules): BattleToken {
  if (hasCondition(token, "atordoado")) {
    return { ...token, pa: 0, bankedPa: 0, paSpentThisTurn: 0 };
  }
  const cap = accumulationCap(rules);
  const pool = Math.max(0, token.pa ?? 0) + tokenBankedPa(token);
  return {
    ...token,
    pa: Math.min(cap, pool),
    bankedPa: 0,
    paSpentThisTurn: 0,
  };
}

/** Início de combate / iniciativa: pool = recuperação (sem sobra). */
export function startTurnPaFull(token: BattleToken, rules: PaTurnRules): BattleToken {
  const pa =
    rules.turnStartPa != null
      ? rules.turnStartPa
      : Math.min(accumulationCap(rules), rules.recoveryPerTurn);
  return {
    ...token,
    paMax: rules.recoveryPerTurn,
    pa,
    bankedPa: 0,
    paSpentThisTurn: 0,
    peaoFreeMoveUsed: false,
  };
}

/** Início do turno: sobra + recuperação, teto de acúmulo; ou PA fixo (Canhão de Vidro). */
export function refreshPaAtTurnStart(token: BattleToken, rules: PaTurnRules): BattleToken {
  const cap = accumulationCap(rules);
  let pa: number;
  if (rules.turnStartPa != null) {
    pa = rules.turnStartPa;
  } else {
    const carry = Math.max(0, token.pa ?? 0) + tokenBankedPa(token);
    pa = Math.min(cap, carry + rules.recoveryPerTurn);
  }
  return {
    ...token,
    paMax: rules.recoveryPerTurn,
    pa,
    bankedPa: 0,
    paSpentThisTurn: 0,
    peaoFreeMoveUsed: false,
  };
}

/** Bônus de PA no turno (Carrasco, Adrenalina, etc.) — pode ultrapassar o teto de acúmulo. */
export function grantPaBonus(token: BattleToken, amount: number): BattleToken {
  if (amount <= 0) return token;
  return { ...token, pa: Math.max(0, (token.pa ?? 0) + amount) };
}

export type PaSpendCheck = { ok: true; cost: number } | { ok: false; reason: string };

export function checkCanSpendPa(token: BattleToken, cost: number): PaSpendCheck {
  if (cost <= 0) return { ok: true, cost: 0 };
  if (hasCondition(token, "atordoado")) {
    return { ok: false, reason: "Atordoado — não pode gastar PA" };
  }
  const spendable = tokenSpendablePa(token);
  if (spendable < cost) {
    return {
      ok: false,
      reason: `PA insuficiente (precisa ${cost}, tem ${spendable})`,
    };
  }
  return { ok: true, cost };
}

export function applyPaSpend(token: BattleToken, cost: number): BattleToken {
  const paMax = token.paMax ?? PA_RECOVERY_PER_TURN;
  const prepared = materializeCombatPa(token, paMax);
  const check = checkCanSpendPa(prepared, cost);
  if (!check.ok) return token;

  const pa = Math.max(0, (prepared.pa ?? 0) - cost);

  return {
    ...token,
    paMax,
    pa,
    bankedPa: 0,
    paSpentThisTurn: tokenPaSpentThisTurn(prepared) + cost,
  };
}

export function applyConditionPaRules(token: BattleToken): BattleToken {
  return clearBankedPaOnStun(token);
}
