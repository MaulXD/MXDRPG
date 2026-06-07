import { attributeMod, proficiencyBonus } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import type { BattleToken } from "@/lib/vtt/types";
import { rollDice } from "@/lib/dice/roll";
import { effectivePaCost } from "@/lib/combat/pa-economy";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";
import { rechargeBlockReason } from "@/lib/combat/recharge";
import { applyConditionWithDuration } from "@/lib/combat/timed-effects";
import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";
import { spellcastingAttribute } from "@/lib/combat/attack";
import type { SpellEffectKind } from "@/lib/combat/spell-parse";

export type SpellUtilityResolution = {
  paCost: number;
  summary: string;
  casterUpdate?: Partial<BattleToken>;
  targetTokenId?: string;
  targetUpdate?: Partial<BattleToken>;
  targetHpAfter?: number;
};

const DEBUFF_CONDITION: Partial<Record<string, import("@/lib/combat/conditions").TokenCondition>> = {
  "magias-sono": "atordoado",
  "magias-doce-confuso": "amedrontado",
  "magias-contagio-necrotico": "envenenado",
};

function assertTurn(token: BattleToken, turn?: CombatTurnOptions): void {
  if (turn?.activeTokenId && token.id !== turn.activeTokenId && !turn.bypassTurn) {
    throw new Error("Aguarde seu turno na iniciativa");
  }
}

export function resolveSpellUtility(
  caster: BattleToken,
  target: BattleToken | null,
  actor: CharacterSheet,
  action: CombatActionOption,
  turn?: CombatTurnOptions
): SpellUtilityResolution {
  assertTurn(caster, turn);
  const rechargeReason = rechargeBlockReason(caster, action, turn?.combatRound ?? 1);
  if (rechargeReason) throw new Error(rechargeReason);

  const paNeed = effectivePaCost(actor, action);
  const paCheck = checkCanSpendPa(caster, paNeed);
  if (!paCheck.ok) throw new Error(paCheck.reason ?? "PA insuficiente");

  const effect = (action.spellEffect ?? "utility") as SpellEffectKind;
  const ally = target ?? caster;

  if (effect === "stabilize") {
    const hp = ally.vida ?? 0;
    if (hp > 0) throw new Error("Alvo precisa estar a 0 HP");
    return {
      paCost: paNeed,
      summary: `${actor.name} estabiliza ${ally.name} — para de falhar em morte.`,
      targetTokenId: ally.id,
      targetHpAfter: 0,
    };
  }

  if (effect === "revive") {
    if ((ally.vida ?? 0) > 0) throw new Error("Alvo ainda está vivo");
    return {
      paCost: paNeed,
      summary: `${actor.name} ressuscita ${ally.name} com 1 HP.`,
      targetTokenId: ally.id,
      targetHpAfter: 1,
    };
  }

  if (effect === "ac_buff") {
    const amount = action.defesaBuffAmount ?? 2;
    return {
      paCost: paNeed,
      summary: `${actor.name} conjura ${action.name} — +${amount} defesa em ${caster.name}.`,
      casterUpdate: { defesaBonus: (caster.defesaBonus ?? 0) + amount },
    };
  }

  if (effect === "heal" && action.damageFormula && action.damageFormula !== "0") {
    const castKey = spellcastingAttribute(actor.identity.classe);
    const mod = attributeMod(actor.attributes[castKey]);
    const roll = rollDice(action.damageFormula);
    const total = roll.total + mod;
    const hpBefore = ally.vida ?? 0;
    const hpMax = ally.vidaMax ?? hpBefore;
    const hpAfter = Math.min(hpMax, hpBefore + total);
    return {
      paCost: paNeed,
      summary: `${actor.name} cura ${ally.name} com ${action.name}: +${total} HP (${hpBefore}→${hpAfter}).`,
      targetTokenId: ally.id,
      targetHpAfter: hpAfter,
    };
  }

  if (effect === "debuff" && target && action.saveAttribute) {
    const cond = DEBUFF_CONDITION[action.entryId];
    let targetUpdate: Partial<BattleToken> | undefined;
    if (cond) {
      const patched = applyConditionWithDuration(target, cond, {
        roundsLeft: 10,
        label: action.name,
      });
      targetUpdate = patched;
    }
    return {
      paCost: paNeed,
      summary: `${actor.name} conjura ${action.name} em ${target.name}${cond ? ` — condição ${cond} se falhar no teste` : ""}.`,
      targetTokenId: target.id,
      targetUpdate,
    };
  }

  return {
    paCost: paNeed,
    summary: `${actor.name} conjura ${action.name}.`,
    casterUpdate: action.selfTarget ? {} : undefined,
  };
}
