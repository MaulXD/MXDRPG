import { getEntry } from "@/lib/compendium/registry";

import { attributeMod } from "@/lib/character/rules";

import type { CharacterSheet } from "@/lib/character/types";

import { rollDice } from "@/lib/dice/roll";

import type { BattleToken } from "@/lib/vtt/types";

import { tokenAxialDistance } from "@/lib/vtt/creature-size";

import { getMonsterTemplate } from "@/lib/vtt/monsters";

import { axialDistance, hexDirection, HEX_DIRECTIONS } from "@/lib/vtt/hex-math";

import { abilityFromEntry } from "@/lib/combat/compendium-actions";

import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";

import {

  resolveAttack,

  resolveCombatAction,

  resolveTokenAttack,

  type AttackResolution,

} from "@/lib/combat/attack";

import { resolveSaveSpell, type SaveSpellResolution } from "@/lib/combat/spell";

import { combineRollModes, type RollMode } from "@/lib/combat/d20";

import { toggleTokenCondition } from "@/lib/combat/conditions";
import { effectivePaCost } from "@/lib/combat/pa-economy";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";



export type AbilityResolution =

  | {

      kind: "buff";

      tokenId: string;

      defesaBonus: number;

      summary: string;

      paCost: number;

      buffSource: string;

      attackerUpdate: Partial<BattleToken>;

    }

  | { kind: "charge"; tokenId: string; summary: string; paCost: number; attackerUpdate: Partial<BattleToken> }

  | { kind: "attack"; attack: AttackResolution; paCost: number; attackerUpdate?: Partial<BattleToken> }

  | {

      kind: "mark";

      summary: string;

      paCost: number;

      attackerUpdate: Partial<BattleToken>;

      defenderUpdate?: Partial<BattleToken>;

    }

  | {

      kind: "heal";

      summary: string;

      paCost: number;

      defenderTokenId: string;

      defenderHpAfter: number;

      attackerUpdate: Partial<BattleToken>;

    }

  | {

      kind: "spell_strike";

      attack: AttackResolution;

      paCost: number;

      attackerUpdate?: Partial<BattleToken>;

    }

  | {

      kind: "spell_save";

      save: SaveSpellResolution;

      paCost: number;

      defenderUpdate?: Partial<BattleToken>;

    }

  | {

      kind: "ally_buff";

      summary: string;

      paCost: number;

      defenderUpdate: Partial<BattleToken>;

      attackerUpdate: Partial<BattleToken>;

    };



export function listCombatAbilities(actor: CharacterSheet): CombatActionOption[] {

  const out: CombatActionOption[] = [];

  for (const item of actor.inventory) {

    if (item.quantity <= 0 || item.packId !== "habilidades") continue;

    const entry = getEntry("habilidades", item.entryId);

    if (!entry) continue;

    const ability = abilityFromEntry(entry);

    if (ability) out.push(ability);

  }

  return out;

}



export function isAllyToken(attacker: BattleToken, other: BattleToken): boolean {

  if (other.id === attacker.id) return false;

  if (attacker.monsterEntryId) return Boolean(other.monsterEntryId);

  return Boolean(other.linked && other.actorId && !other.monsterEntryId);

}



export function isEnemyToken(attacker: BattleToken, other: BattleToken): boolean {

  if (other.id === attacker.id) return false;

  if (attacker.monsterEntryId) return !other.monsterEntryId;

  return Boolean(other.monsterEntryId || !other.linked);

}



export function hasFlanking(

  attacker: BattleToken,

  defender: BattleToken,

  tokens: BattleToken[]

): boolean {

  const dir = hexDirection(defender.axial, attacker.axial);

  if (dir === null) return false;

  const opp = HEX_DIRECTIONS[(dir + 3) % 6];

  const oppositeHex = { q: defender.axial.q + opp.q, r: defender.axial.r + opp.r };

  return tokens.some(

    (t) =>

      t.id !== attacker.id &&

      t.id !== defender.id &&

      t.axial.q === oppositeHex.q &&

      t.axial.r === oppositeHex.r

  );

}



export function flankingAttackBonus(

  attacker: BattleToken,

  defender: BattleToken,

  tokens: BattleToken[]

): number {

  return hasFlanking(attacker, defender, tokens) ? 2 : 0;

}



function assertTurnAndPa(

  token: BattleToken,

  action: CombatActionOption,

  actor: CharacterSheet | null,

  turn?: CombatTurnOptions

): void {

  if (turn?.activeTokenId && token.id !== turn.activeTokenId && !turn.bypassTurn) {

    throw new Error("Aguarde seu turno na iniciativa");

  }

  const paNeed = effectivePaCost(actor, action);
  const paCheck = checkCanSpendPa(token, paNeed);
  if (!paCheck.ok) throw new Error(paCheck.reason ?? "PA insuficiente");

}



export function resolveAbilityBuff(

  token: BattleToken,

  action: CombatActionOption,

  actor: CharacterSheet | null,

  turn?: CombatTurnOptions

): AbilityResolution {

  assertTurnAndPa(token, action, actor, turn);

  const name = actor?.name ?? token.name;

  const effect = action.abilityEffect;



  if (effect === "defense_buff") {

    const amount = action.defesaBuffAmount ?? 2;

    return {

      kind: "buff",

      tokenId: token.id,

      defesaBonus: amount,

      paCost: effectivePaCost(actor, action),

      buffSource: action.name,

      summary: `${name} assume ${action.name} (+${amount} defesa até próximo turno).`,

      attackerUpdate: {

        defesaBonus: amount,

        defesaBuffSource: action.name,

      },

    };

  }



  if (effect === "reaction_shift") {

    return {

      kind: "buff",

      tokenId: token.id,

      defesaBonus: 0,

      paCost: effectivePaCost(actor, action),

      buffSource: action.name,

      summary: `${name} usa ${action.name} — pode deslocar 1 hex (reação).`,

      attackerUpdate: { reactionShiftReady: true, defesaBonus: 0 },

    };

  }



  if (effect === "wild_shape") {

    return {

      kind: "buff",

      tokenId: token.id,

      defesaBonus: 0,

      paCost: effectivePaCost(actor, action),

      buffSource: action.name,

      summary: `${name} prepara ${action.name} (transformação no próximo movimento).`,

      attackerUpdate: { chargeReady: true, chargeNote: "Forma Selvagem" },

    };

  }



  if (effect === "ranged_advantage") {

    return {

      kind: "buff",

      tokenId: token.id,

      defesaBonus: 0,

      paCost: effectivePaCost(actor, action),

      buffSource: action.name,

      summary: `${name} usa ${action.name} — próximo ataque à distância com vantagem.`,

      attackerUpdate: { rangedAttackAdvantage: true },

    };

  }



  if (effect === "shadow_step") {

    return {

      kind: "charge",

      tokenId: token.id,

      paCost: effectivePaCost(actor, action),

      summary: `${name} usa ${action.name} — teleporte até ${action.rangeHex} hex (sem provocar).`,

      attackerUpdate: {

        chargeReady: true,

        chargeNote: "Passo das Sombras (teleporte)",

      },

    };

  }



  if (effect === "charge") {

    return {

      kind: "charge",

      tokenId: token.id,

      paCost: effectivePaCost(actor, action),

      summary: `${name} usa ${action.name} — mova até ${action.rangeHex} hex em linha reta (sem provocar). Próximo ataque corpo a corpo pode ser feito.`,

      attackerUpdate: { chargeReady: true, chargeNote: undefined },

    };

  }



  if (effect === "melee_attack_bonus" && action.selfTarget) {

    return {

      kind: "buff",

      tokenId: token.id,

      defesaBonus: 0,

      paCost: effectivePaCost(actor, action),

      buffSource: action.name,

      summary: `${name} prepara ${action.name} (+2 no próximo ataque corpo a corpo).`,

      attackerUpdate: { nextAttackBonus: 2 },

    };

  }

  if (!effect) {
    const detail = action.label ?? action.name;
    return {
      kind: "buff",
      tokenId: token.id,
      defesaBonus: 0,
      paCost: effectivePaCost(actor, action),
      buffSource: action.name,
      summary: `${name} — ${detail}`,
      attackerUpdate: {},
    };
  }

  throw new Error("Habilidade não suportada");

}



export function resolveAbilityMark(

  attacker: BattleToken,

  defender: BattleToken,

  action: CombatActionOption,

  actor: CharacterSheet | null,

  turn?: CombatTurnOptions

): AbilityResolution {

  assertTurnAndPa(attacker, action, actor, turn);

  const name = actor?.name ?? attacker.name;



  if (action.abilityEffect === "mark_disadvantage") {

    return {

      kind: "mark",

      paCost: effectivePaCost(actor, action),

      summary: `${name} usa Finta em ${defender.name} — alvo sofre desvantagem no próximo ataque.`,

      attackerUpdate: {},

      defenderUpdate: {

        attackMark: {

          targetId: defender.id,

          attackerDisadvantage: true,

        },

      },

    };

  }



  if (action.abilityEffect === "mark") {

    const isHunter = action.name.includes("Caçador");

    return {

      kind: "mark",

      paCost: effectivePaCost(actor, action),

      summary: isHunter

        ? `${name} marca ${defender.name} (+2 próximo ataque à distância).`

        : `${name} marca ${defender.name}.`,

      attackerUpdate: {

        attackMark: {

          targetId: defender.id,

          bonus: isHunter ? 2 : 0,

          rangedOnly: isHunter,

        },

      },

    };

  }



  throw new Error("Marca inválida");

}



export function resolveAbilityAlly(

  attacker: BattleToken,

  ally: BattleToken,

  action: CombatActionOption,

  actor: CharacterSheet | null,

  turn?: CombatTurnOptions

): AbilityResolution {

  assertTurnAndPa(attacker, action, actor, turn);

  const name = actor?.name ?? attacker.name;



  if (action.abilityEffect === "ally_inspire") {

    return {

      kind: "ally_buff",

      paCost: effectivePaCost(actor, action),

      summary: `${name} inspira ${ally.name} — vantagem no próximo ataque.`,

      attackerUpdate: {},

      defenderUpdate: { allyAttackAdvantage: true },

    };

  }



  if (action.abilityEffect === "heal_touch") {

    const roll = rollDice(action.damageFormula || "1d6");

    const heal = roll.total;

    const hpBefore = ally.vida ?? 0;

    const hpMax = ally.vidaMax ?? hpBefore;

    const hpAfter = Math.min(hpMax, hpBefore + heal);

    return {

      kind: "heal",

      paCost: effectivePaCost(actor, action),

      summary: `${name} canta sobre ${ally.name} — recupera ${heal} HP (${hpBefore}→${hpAfter}).`,

      defenderTokenId: ally.id,

      defenderHpAfter: hpAfter,

      attackerUpdate: {},

    };

  }



  throw new Error("Habilidade de aliado inválida");

}



export function resolveAbilitySpellStrike(

  attacker: BattleToken,

  defender: BattleToken,

  actor: CharacterSheet | null,

  action: CombatActionOption,

  turn?: CombatTurnOptions

): AbilityResolution {

  assertTurnAndPa(attacker, action, actor, turn);



  const attrMod =

    actor && action.damageAttribute

      ? attributeMod(actor.attributes[action.damageAttribute])

      : attacker.monsterEntryId

        ? Math.floor(

            ((getMonsterTemplate(attacker.monsterEntryId)?.ameaca ?? 1) * 2 + 8 - 10) / 2

          )

        : 0;



  const spellAction: CombatActionOption = {

    ...action,

    kind: "spell",

    attackBonus: action.attackBonus,

    damageFormula: action.damageFormula,

  };



  const raw = resolveTokenAttack(attacker, defender, spellAction, actor, turn);
  const attack = (Array.isArray(raw) ? raw[0] : raw) as AttackResolution;

  if (attrMod && attack.hit && attack.damage) {
    attack.damage.attributeMod += attrMod;
    attack.damage.total += attrMod;
    attack.summary += ` (+${attrMod} mod)`;
    if (attack.defenderHpBefore != null) {
      attack.defenderHpAfter = Math.max(0, attack.defenderHpBefore - attack.damage.total);
    }
  }

  return { kind: "spell_strike", attack, paCost: action.paCost };

}



export function resolveAbilityRestrain(

  attacker: BattleToken,

  defender: BattleToken,

  actor: CharacterSheet,

  action: CombatActionOption,

  defenderActor: CharacterSheet | null,

  turn?: CombatTurnOptions

): AbilityResolution {

  const save = resolveSaveSpell(attacker, defender, actor, defenderActor, action, turn);

  const conditions = toggleTokenCondition(defender, "restringido");

  return {

    kind: "spell_save",

    save: {

      ...save,

      summary: `${save.summary} — ${defender.name} fica restringido.`,

    },

    paCost: effectivePaCost(actor, action),

    defenderUpdate: { conditions },

  };

}



export function resolveAbilityAttack(

  attackerToken: BattleToken,

  defenderToken: BattleToken,

  actor: CharacterSheet,

  action: CombatActionOption,

  allTokens: BattleToken[],

  turn?: CombatTurnOptions

): AbilityResolution {

  const flanking = hasFlanking(attackerToken, defenderToken, allTokens);

  const adjacent = axialDistance(attackerToken.axial, defenderToken.axial) <= 1;

  const isEmboscada = action.name === "Emboscada";



  let bonus = action.attackBonus;

  let rollMode: RollMode = flanking ? "advantage" : "normal";

  const labels: string[] = [];



  if (flanking) labels.push("flanqueio (vantagem)");

  if (isEmboscada && adjacent) {

    rollMode = combineRollModes(rollMode, "advantage");

    labels.push("emboscada");

  }

  if (bonus > 0) labels.push(`+${bonus}`);



  const weaponAction = resolveCombatAction(actor, {

    packId: "armas",

    entryId: actor.combatLoadout?.packId === "armas" ? actor.combatLoadout.entryId : undefined,

  });



  const meleeAction: CombatActionOption =

    weaponAction.kind === "weapon" && weaponAction.rangeHex <= 1

      ? { ...weaponAction, attackBonus: weaponAction.attackBonus + bonus }

      : {

          ...weaponAction,

          rangeHex: 1,

          attackBonus: weaponAction.attackBonus + bonus,

        };



  const attack = resolveAttack(

    attackerToken,

    defenderToken,

    actor,

    meleeAction,

    turn,

    {

      attackBonus: bonus,

      label: labels.length ? labels.join(", ") : undefined,

      rollMode,

    },

    allTokens

  );



  if (labels.length && attack.summary.includes("acerta")) {

    attack.summary = attack.summary.replace(" acerta ", ` acerta (${labels.join(", ")}) `);

  }



  const attackerUpdate: Partial<BattleToken> = {};

  if (action.bonusDamageFormula && attack.hit && attack.damage) {

    const extra = rollDice(action.bonusDamageFormula);

    attack.damage.rolls.push(...extra.rolls);

    attack.damage.total += extra.total;

    attack.summary += ` +${extra.total} ${action.damageType || "radiante"}`;

  }



  return { kind: "attack", attack, paCost: effectivePaCost(actor, action), attackerUpdate };

}



export function resolveAbilityUse(

  attacker: BattleToken,

  defender: BattleToken | null,

  actor: CharacterSheet | null,

  action: CombatActionOption,

  allTokens: BattleToken[],

  turn?: CombatTurnOptions,

  defenderActor?: CharacterSheet | null

): AbilityResolution {

  const effect = action.abilityEffect;



  if (action.selfTarget) {

    return resolveAbilityBuff(attacker, action, actor, turn);

  }



  if (!defender) throw new Error("Alvo obrigatório");



  if (action.allyTarget) {

    return resolveAbilityAlly(attacker, defender, action, actor, turn);

  }



  if (effect === "mark" || effect === "mark_disadvantage") {

    return resolveAbilityMark(attacker, defender, action, actor, turn);

  }

  if (effect === "spell_strike") {

    return resolveAbilitySpellStrike(attacker, defender, actor, action, turn);

  }



  if (effect === "restrain" && actor) {

    return resolveAbilityRestrain(attacker, defender, actor, action, defenderActor ?? null, turn);

  }



  if (effect === "melee_attack_bonus" && actor) {

    return resolveAbilityAttack(attacker, defender, actor, action, allTokens, turn);

  }



  throw new Error("Habilidade não suportada");

}



export function canUseAbility(

  token: BattleToken,

  action: CombatActionOption,

  turn?: CombatTurnOptions,

  actor?: CharacterSheet | null

): { ok: boolean; reason?: string } {

  if (turn?.activeTokenId && token.id !== turn.activeTokenId && !turn.bypassTurn) {

    return { ok: false, reason: "Aguarde seu turno na iniciativa" };

  }

  const paNeed = effectivePaCost(actor ?? null, action);
  const paCheck = checkCanSpendPa(token, paNeed);
  if (!paCheck.ok) return { ok: false, reason: paCheck.reason };

  return { ok: true };

}



export function canAbilityTarget(

  attacker: BattleToken,

  defender: BattleToken,

  action: CombatActionOption,

  turn?: CombatTurnOptions,

  actor?: CharacterSheet | null

): { ok: boolean; reason?: string } {

  if (action.selfTarget) return { ok: false, reason: "Use botão de habilidade" };



  const dist = tokenAxialDistance(attacker, defender);

  if (dist > action.rangeHex) {

    return { ok: false, reason: `Fora de alcance (${dist} hex, máx ${action.rangeHex})` };

  }



  if (action.allyTarget) {

    if (!isAllyToken(attacker, defender)) {

      return { ok: false, reason: "Selecione um aliado linkado" };

    }

    if (defender.vidaMax != null && (defender.vida ?? 0) <= 0) {

      return { ok: false, reason: "Aliado derrotado" };

    }

    return canUseAbility(attacker, action, turn, actor);

  }



  if (!isEnemyToken(attacker, defender)) {

    return { ok: false, reason: "Alvo inválido" };

  }

  if (defender.vidaMax != null && (defender.vida ?? 0) <= 0) {

    return { ok: false, reason: "Alvo já derrotado" };

  }

  return canUseAbility(attacker, action, turn, actor);

}


