import { attributeMod, proficiencyBonus } from "@/lib/character/rules";
import type { AttributeKey } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import type { BattleToken } from "@/lib/vtt/types";
import { rollDice } from "@/lib/dice/roll";
import { saveRollMode } from "@/lib/combat/conditions";
import { isPoisonDamageType, resistedDamageAmount } from "@/lib/combat/damage-resist";
import { formatD20Detail, formatRollMode, rollD20, type RollMode } from "@/lib/combat/d20";
import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";
import { canActOnCombatTurn, TURN_WAIT_MSG } from "@/lib/combat/turn-guard";
import { canAttackTarget, spellcastingAttribute } from "@/lib/combat/attack";
import {
  actionWithChannel,
  clampChannelExtraPa,
  totalChannelPaCost,
} from "@/lib/combat/spell-channel";
import type { DamageBreakdown } from "@/lib/combat/attack";

export type SaveRollBreakdown = {
  natural: number;
  attributeMod: number;
  profBonus: number;
  total: number;
  attributeLabel: string;
  dc: number;
  success: boolean;
  rollMode: RollMode;
  d20Detail: string;
};

export type SaveSpellResolution = {
  attackerTokenId: string;
  defenderTokenId: string;
  actionKind: "spell";
  weaponName: string;
  rangeCells: number;
  paCost: number;
  save: SaveRollBreakdown;
  damage: DamageBreakdown;
  defenderHpBefore: number;
  defenderHpAfter: number;
  summary: string;
};

function attributeLabel(key: AttributeKey): string {
  const map: Record<AttributeKey, string> = {
    forca: "FOR",
    destreza: "DES",
    constituicao: "CON",
    inteligencia: "INT",
    sabedoria: "SAB",
    carisma: "CAR",
  };
  return map[key];
}

function defenderHp(token: BattleToken): number {
  return token.vida ?? 0;
}

export function computeSpellSaveDc(
  actor: CharacterSheet,
  action: CombatActionOption
): number {
  if (action.saveDc != null) return action.saveDc;
  const attrKey = spellcastingAttribute(actor.identity.classe);
  const mod = attributeMod(actor.attributes[attrKey]);
  return 8 + proficiencyBonus(actor.identity.nivel) + mod;
}

function rollSaveDamage(
  formula: string,
  half: boolean
): DamageBreakdown {
  const base = rollDice(formula);
  const final = half ? Math.floor(base.total / 2) : base.total;
  return {
    formula,
    rolls: base.rolls,
    attributeMod: base.modifier,
    total: Math.max(0, final),
    doubled: false,
  };
}

export function resolveSaveSpell(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  actor: CharacterSheet,
  defenderActor: CharacterSheet | null,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  opts?: { skipRangeCheck?: boolean; channelExtraPa?: number; skipPaCheck?: boolean }
): SaveSpellResolution {
  const channelExtra = clampChannelExtraPa(action, opts?.channelExtraPa ?? 0);
  const resolved = actionWithChannel(action, channelExtra);

  if (!opts?.skipRangeCheck) {
    const check = canAttackTarget(attackerToken, defenderToken, action, turn, {
      actor,
      channelExtraPa: channelExtra,
      skipPaCheck: opts?.skipPaCheck,
    });
    if (!check.ok) throw new Error(check.reason ?? "Magia inválida");
  } else if (
    !canActOnCombatTurn(attackerToken.id, {
      activeTokenId: turn?.activeTokenId,
      bypassTurn: turn?.bypassTurn,
      combatHasOrder: turn?.combatHasOrder,
    })
  ) {
    throw new Error(TURN_WAIT_MSG);
  }

  const saveKey = resolved.saveAttribute ?? "constituicao";
  const dc = computeSpellSaveDc(actor, resolved);

  const saveAttr =
    defenderActor?.attributes[saveKey] ??
    (saveKey === "constituicao" ? 10 : 10);
  const saveMod = attributeMod(saveAttr);
  const saveProf = defenderActor
    ? proficiencyBonus(defenderActor.identity.nivel)
    : 0;
  const saveCtx = { poison: isPoisonDamageType(resolved.damageType) };
  const rollMode = saveRollMode(defenderToken, saveCtx);
  const naturalRoll = rollD20(rollMode);
  const natural = naturalRoll.natural;
  const saveTotal = natural + saveMod + saveProf;
  const success = saveTotal >= dc;

  const hpBefore = defenderHp(defenderToken);
  const damage =
    resolved.damageFormula === "0"
      ? { formula: "0", rolls: [], attributeMod: 0, total: 0, doubled: false }
      : rollSaveDamage(resolved.damageFormula, success);
  const resistedTotal = resistedDamageAmount(
    damage.total,
    defenderToken,
    resolved.damageType
  );
  const hpAfter = Math.max(0, hpBefore - resistedTotal);

  const attr = attributeLabel(saveKey);
  const modeTag = rollMode !== "normal" ? ` [${formatRollMode(rollMode)}]` : "";
  const outcome = success ? "resistiu (metade)" : "falhou (dano pleno)";
  const channelTag = channelExtra > 0 ? ` [canalizado +${channelExtra} PA]` : "";
  const dmgNote =
    resistedTotal < damage.total
      ? `${resistedTotal} ${resolved.damageType} (resist.)`
      : `${damage.total} ${resolved.damageType}`;
  const summary = `${actor.name} conjura ${resolved.name}${channelTag}${modeTag} em ${defenderToken.name}: teste ${attr} ${saveTotal} vs CD ${dc} — ${outcome} — ${dmgNote}`;

  return {
    attackerTokenId: attackerToken.id,
    defenderTokenId: defenderToken.id,
    actionKind: "spell",
    weaponName: resolved.name,
    rangeCells: resolved.rangeCells,
    paCost: totalChannelPaCost(actor, action, channelExtra, attackerToken),
    save: {
      natural,
      attributeMod: saveMod,
      profBonus: saveProf,
      total: saveTotal,
      attributeLabel: attr,
      dc,
      success,
      rollMode,
      d20Detail: formatD20Detail(naturalRoll),
    },
    damage,
    defenderHpBefore: hpBefore,
    defenderHpAfter: hpAfter,
    summary,
  };
}

export function formatSaveChatDetail(res: SaveSpellResolution): string {
  const s = res.save;
  const rollPart = s.d20Detail ?? `1d20=${s.natural}`;
  return [
    `Teste ${rollPart} +${s.attributeMod}${s.profBonus ? `+${s.profBonus}` : ""} = ${s.total}`,
    `CD ${s.dc}`,
    s.success ? "Sucesso (metade)" : "Falha (pleno)",
    `Dano ${res.damage.rolls.join("+")} = ${res.damage.total}`,
    `HP ${res.defenderHpBefore}→${res.defenderHpAfter}`,
  ].join(" · ");
}
