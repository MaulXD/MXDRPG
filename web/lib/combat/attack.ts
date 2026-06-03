import { getEntry } from "@/lib/compendium/registry";
import type { CompendiumEntry } from "@/lib/compendium/types";
import { rollDice } from "@/lib/dice/roll";
import {
  attributeMod,
  extraAttackCount,
  getClass,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import { getMonsterTemplate } from "@/lib/vtt/monsters";
import { monsterCombatActions } from "@/lib/vtt/monster-actions";
import type { BattleToken } from "@/lib/vtt/types";
import { axialDistance } from "@/lib/vtt/hex-math";
import { abilityFromEntry } from "@/lib/combat/compendium-actions";
import { attackRollMode, canTokenAct } from "@/lib/combat/conditions";
import { combineRollModes, formatD20Detail, formatRollMode, rollD20, type RollMode } from "@/lib/combat/d20";
import { parseAreaShape } from "@/lib/combat/area-spell";
import { listSubclassCombatActions } from "@/lib/character/subclass-vtt";
import type {
  AttackMark,
  AttackModifier,
  CombatActionKind,
  CombatActionOption,
  CombatActionRequest,
  CombatLoadout,
  CombatResolution,
  CombatTurnOptions,
} from "@/lib/combat/types";

export type { CombatLoadout, CombatActionOption, CombatTurnOptions, CombatActionRequest };

/** @deprecated use CombatActionOption */
export type ResolvedWeapon = CombatActionOption;

export type AttackRollBreakdown = {
  natural: number;
  attributeMod: number;
  profBonus: number;
  weaponBonus: number;
  total: number;
  attributeLabel: string;
  rollMode: RollMode;
  d20Detail: string;
};

export type DamageBreakdown = {
  formula: string;
  rolls: number[];
  attributeMod: number;
  total: number;
  doubled: boolean;
};

export type AttackResolution = {
  attackerTokenId: string;
  defenderTokenId: string;
  actionKind: CombatActionKind;
  weaponName: string;
  rangeHex: number;
  paCost: number;
  defenderAc: number;
  attack: AttackRollBreakdown;
  hit: boolean;
  critical: boolean;
  criticalFail: boolean;
  damage: DamageBreakdown | null;
  defenderHpBefore: number;
  defenderHpAfter: number;
  summary: string;
  attackIndex?: number;
  attackCount?: number;
};

const UNARMED: CombatActionOption = {
  packId: "unarmed",
  entryId: "unarmed",
  name: "Ataque desarmado",
  kind: "unarmed",
  resolution: "attack",
  damageFormula: "1d4",
  damageType: "contundente",
  attackBonus: 0,
  rangeHex: 1,
  paCost: 1,
  label: "Ataque desarmado · 1 hex · PA 1",
};

const MONSTER_UNARMED: CombatActionOption = {
  ...UNARMED,
  name: "Ataque natural",
  label: "Ataque natural · 1 hex · PA 1",
};

function parseSaveAttribute(raw: string | undefined): AttributeKey | undefined {
  if (!raw) return undefined;
  const map: Record<string, AttributeKey> = {
    for: "forca",
    forca: "forca",
    des: "destreza",
    destreza: "destreza",
    con: "constituicao",
    constituicao: "constituicao",
    int: "inteligencia",
    inteligencia: "inteligencia",
    sab: "sabedoria",
    sabedoria: "sabedoria",
    car: "carisma",
    carisma: "carisma",
  };
  return map[raw.toLowerCase()] ?? undefined;
}

function actionFromEntry(
  entry: CompendiumEntry,
  packId: "armas" | "magias"
): CombatActionOption | null {
  const weapon = entry.system.weapon as
    | { dano?: { formula?: string; tipo?: string }; ataque?: { bonus?: number } }
    | undefined;
  const spell = entry.system.spell as
    | {
        nivel?: number;
        save?: { attribute?: string; cd?: number };
        area?: { shape?: string; radiusHex?: number; hexCount?: number };
      }
    | undefined;
  const tactical = entry.system.tactical as
    | { alcanceHex?: { value?: number }; custoPontosAcao?: { value?: number } }
    | undefined;

  const saveAttr = parseSaveAttribute(spell?.save?.attribute);
  const areaShape = parseAreaShape(spell?.area?.shape);
  const isAreaSpell = packId === "magias" && areaShape !== "single";
  const isSaveSpell = packId === "magias" && Boolean(saveAttr) && Boolean(weapon?.dano?.formula);
  if (packId === "magias" && !weapon?.dano?.formula && !isSaveSpell && !isAreaSpell) return null;

  const rangeHex = tactical?.alcanceHex?.value ?? 1;
  const paCost = tactical?.custoPontosAcao?.value ?? 1;
  const kind: CombatActionKind = packId === "magias" ? "spell" : "weapon";
  const resolution: CombatResolution = isSaveSpell ? "save" : "attack";
  const areaRadiusHex = spell?.area?.radiusHex ?? tactical?.alcanceHex?.value ?? 1;
  const areaHexCount = spell?.area?.hexCount;

  return {
    packId,
    entryId: entry.id,
    name: entry.name,
    kind,
    resolution,
    damageFormula: weapon?.dano?.formula ?? "1d4",
    damageType: weapon?.dano?.tipo ?? (kind === "spell" ? "mágico" : "contundente"),
    attackBonus: weapon?.ataque?.bonus ?? 0,
    rangeHex,
    paCost,
    saveAttribute: saveAttr,
    saveDc: spell?.save?.cd,
    areaShape: packId === "magias" && areaShape !== "single" ? areaShape : undefined,
    areaRadiusHex: areaShape === "burst" ? areaRadiusHex : undefined,
    areaHexCount: areaShape === "wall" ? areaHexCount ?? 3 : undefined,
    label: `${entry.name} · ${rangeHex} hex · PA ${paCost}${isSaveSpell ? " · save" : ""}${areaShape !== "single" ? ` · área ${areaShape}` : ""}`,
  };
}

export function listCombatActions(actor: CharacterSheet): CombatActionOption[] {
  const out: CombatActionOption[] = [];

  for (const item of actor.inventory) {
    if (item.quantity <= 0) continue;
    if (item.packId === "armas" || item.packId === "magias") {
      const entry = getEntry(item.packId, item.entryId);
      if (!entry) continue;
      const action = actionFromEntry(entry, item.packId);
      if (action) out.push(action);
    }
    if (item.packId === "habilidades") {
      const entry = getEntry("habilidades", item.entryId);
      if (!entry) continue;
      const ability = abilityFromEntry(entry);
      if (ability) out.push(ability);
    }
  }

  for (const trackAction of listSubclassCombatActions(actor)) {
    if (!out.some((a) => a.packId === trackAction.packId && a.entryId === trackAction.entryId)) {
      out.push(trackAction);
    }
  }

  if (!out.some((a) => a.kind === "weapon" || a.kind === "unarmed")) {
    if (!out.length) out.push(UNARMED);
  }
  return out;
}

export function listTokenCombatActions(
  token: BattleToken,
  actor: CharacterSheet | null,
  filter?: "weapon" | "spell" | "ability"
): CombatActionOption[] {
  let all: CombatActionOption[];
  if (actor) {
    all = listCombatActions(actor);
  } else if (token.monsterEntryId) {
    const monsterActions = monsterCombatActions(token.monsterEntryId);
    all = monsterActions.length ? [...monsterActions, MONSTER_UNARMED] : [MONSTER_UNARMED];
  } else {
    all = [UNARMED];
  }
  if (!filter) return all;
  if (filter === "weapon") {
    return all.filter((a) => a.kind === "weapon" || a.kind === "unarmed");
  }
  return all.filter((a) => a.kind === filter);
}

export function defaultCombatLoadout(actor: CharacterSheet): CombatLoadout | null {
  const first = listCombatActions(actor).find(
    (a) => a.packId !== "unarmed" && a.kind !== "ability"
  );
  if (!first || first.packId === "unarmed") return null;
  if (first.packId === "armas" || first.packId === "magias" || first.packId === "habilidades") {
    return { packId: first.packId, entryId: first.entryId };
  }
  return null;
}

export function resolveCombatAction(
  actor: CharacterSheet,
  request?: CombatActionRequest
): CombatActionOption {
  const actions = listCombatActions(actor);
  const loadout = actor.combatLoadout ?? defaultCombatLoadout(actor);

  const packId = request?.packId ?? loadout?.packId;
  const entryId = request?.entryId ?? loadout?.entryId;

  if (packId && entryId) {
    const found = actions.find((a) => a.packId === packId && a.entryId === entryId);
    if (found) return found;
  }

  const fallback = actions.find((a) => a.kind === "weapon" || a.kind === "spell") ?? actions[0];
  return fallback ?? UNARMED;
}

export function warriorAttackCount(actor: CharacterSheet, action: CombatActionOption): number {
  if (action.kind !== "weapon") return 1;
  return extraAttackCount(actor.identity.classe, actor.identity.nivel);
}

/** @deprecated */
export function resolveWeaponForActor(actor: CharacterSheet): CombatActionOption {
  return resolveCombatAction(actor, actor.combatLoadout ?? undefined);
}

export function spellcastingAttribute(classId: string): AttributeKey {
  switch (classId) {
    case "Mago":
    case "Artifice":
      return "inteligencia";
    case "Clérigo":
    case "Druida":
      return "sabedoria";
    case "Bardo":
      return "carisma";
    default:
      return "inteligencia";
  }
}

function attackAttribute(actor: CharacterSheet, action: CombatActionOption): AttributeKey {
  if (action.kind === "spell") return spellcastingAttribute(actor.identity.classe);
  return action.rangeHex > 1 ? "destreza" : "forca";
}

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

function isProficient(actor: CharacterSheet, action: CombatActionOption): boolean {
  if (action.kind === "unarmed") return true;
  if (action.kind === "spell") {
    const casters = ["Mago", "Clérigo", "Bardo", "Druida", "Artifice"];
    return casters.includes(actor.identity.classe);
  }
  const cls = getClass(actor.identity.classe);
  if (!cls) return false;
  const p = cls.proficiencies.toLowerCase();
  return p.includes("todas armas") || p.includes("armas simples") || p.includes("armas marciais");
}

function rollActionDamage(formula: string, attrMod: number, critical: boolean): DamageBreakdown {
  const base = rollDice(formula);
  let rolls = [...base.rolls];
  if (critical) {
    const extra = rollDice(formula);
    rolls = [...rolls, ...extra.rolls];
  }
  const total = rolls.reduce((a, b) => a + b, 0) + attrMod;
  return {
    formula,
    rolls,
    attributeMod: attrMod,
    total: Math.max(0, total),
    doubled: critical,
  };
}

export function effectiveDefenderAc(token: BattleToken): number {
  return (token.defesa ?? 10) + (token.defesaBonus ?? 0);
}

export function buildAttackModifiers(
  attacker: BattleToken,
  defender: BattleToken,
  action: CombatActionOption
): { modifier: AttackModifier; consumeAttackerMark: boolean; consumeDefenderFinta: boolean } {
  let attackBonus = attacker.nextAttackBonus ?? 0;
  let rollMode: RollMode = "normal";
  const labels: string[] = [];

  if (attackBonus) labels.push(`+${attackBonus}`);
  if (attacker.allyAttackAdvantage) {
    rollMode = "advantage";
    labels.push("inspiração");
  }
  if (attacker.rangedAttackAdvantage && action.rangeHex > 1) {
    rollMode = combineRollModes(rollMode, "advantage");
    labels.push("tiro certeiro");
  }

  const mark: AttackMark | undefined = attacker.attackMark;
  let consumeAttackerMark = false;
  if (mark && mark.targetId === defender.id) {
    if (mark.attackerDisadvantage) {
      rollMode = "disadvantage";
      labels.push("finta");
      consumeAttackerMark = true;
    } else {
      if (mark.rangedOnly && action.rangeHex <= 1) {
        /* mark stays */
      } else {
        if (mark.bonus) attackBonus += mark.bonus;
        if (mark.advantage || mark.bonus) {
          rollMode = combineRollModes(rollMode, "advantage");
        }
        if (mark.bonus) labels.push(`marca +${mark.bonus}`);
        consumeAttackerMark = true;
      }
    }
  }

  let consumeDefenderFinta = false;
  if (attacker.attackMark?.attackerDisadvantage) {
    rollMode = combineRollModes(rollMode, "disadvantage");
    labels.push("finta");
    consumeAttackerMark = true;
  }

  if (attacker.bonusDamageFormula) {
    labels.push(attacker.bonusDamageFormula);
  }

  return {
    modifier: {
      attackBonus: attackBonus || undefined,
      label: labels.length ? labels.join(", ") : undefined,
      rollMode: rollMode !== "normal" ? rollMode : undefined,
    },
    consumeAttackerMark,
    consumeDefenderFinta,
  };
}

export function attackerAfterAttack(
  attacker: BattleToken,
  action: CombatActionOption,
  consumeAttackerMark: boolean,
  _consumeDefenderFinta: boolean,
  hit: boolean
): Partial<BattleToken> {
  const patch: Partial<BattleToken> = {};
  if (attacker.nextAttackBonus) patch.nextAttackBonus = undefined;
  if (attacker.allyAttackAdvantage) patch.allyAttackAdvantage = undefined;
  if (attacker.rangedAttackAdvantage && action.rangeHex > 1) {
    patch.rangedAttackAdvantage = undefined;
  }
  if (consumeAttackerMark) patch.attackMark = undefined;
  if (attacker.chargeReady && action.rangeHex <= 1) patch.chargeReady = undefined;
  if (hit && attacker.bonusDamageFormula) patch.bonusDamageFormula = undefined;
  return patch;
}

function mergeModifiers(base?: AttackModifier, extra?: AttackModifier): AttackModifier | undefined {
  if (!base && !extra) return undefined;
  const bonus = (base?.attackBonus ?? 0) + (extra?.attackBonus ?? 0);
  return {
    attackBonus: bonus || undefined,
    label: [base?.label, extra?.label].filter(Boolean).join(", ") || undefined,
    rollMode: combineRollModes(base?.rollMode ?? "normal", extra?.rollMode ?? "normal"),
  };
}

function defenderHp(token: BattleToken): number {
  return token.vida ?? 0;
}

export function canAttackTarget(
  attacker: BattleToken,
  defender: BattleToken,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  opts?: { skipRangeCheck?: boolean }
): { ok: boolean; reason?: string } {
  if (action.kind === "ability" && action.selfTarget) {
    return { ok: false, reason: "Use botão de habilidade" };
  }
  if (attacker.id === defender.id) return { ok: false, reason: "Alvo inválido" };

  if (turn?.activeTokenId && attacker.id !== turn.activeTokenId && !turn.bypassTurn) {
    return { ok: false, reason: "Aguarde seu turno na iniciativa" };
  }

  const act = canTokenAct(attacker);
  if (!act.ok) return act;

  const dist = axialDistance(attacker.axial, defender.axial);
  if (!opts?.skipRangeCheck && dist > action.rangeHex) {
    return { ok: false, reason: `Fora de alcance (${dist} hex, máx ${action.rangeHex})` };
  }
  if (attacker.pa < action.paCost) {
    return { ok: false, reason: `PA insuficiente (precisa ${action.paCost})` };
  }
  if (defender.vidaMax != null && defenderHp(defender) <= 0) {
    return { ok: false, reason: "Alvo já derrotado" };
  }
  return { ok: true };
}

function resolveMonsterAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  modifier?: AttackModifier
): AttackResolution {
  const check = canAttackTarget(attackerToken, defenderToken, action, turn);
  if (!check.ok) throw new Error(check.reason ?? "Ataque inválido");

  const template = attackerToken.monsterEntryId
    ? getMonsterTemplate(attackerToken.monsterEntryId)
    : null;
  const fixedMod = template
    ? action.rangeHex > 1
      ? Math.floor((template.agilidade - 10) / 2)
      : Math.floor((template.forca - 10) / 2)
    : 0;

  const built = buildAttackModifiers(attackerToken, defenderToken, action);
  const merged = mergeModifiers(built.modifier, modifier);
  const extraBonus = merged?.attackBonus ?? 0;

  const rollMode = combineRollModes(
    attackRollMode(attackerToken, defenderToken, []),
    merged?.rollMode ?? "normal"
  );
  const naturalRoll = rollD20(rollMode);
  const natural = naturalRoll.natural;
  const attackTotal = natural + fixedMod + action.attackBonus + extraBonus;
  const ac = effectiveDefenderAc(defenderToken);
  const critical = natural === 20;
  const criticalFail = natural === 1;
  const hit = critical || (!criticalFail && attackTotal >= ac);

  const hpBefore = defenderHp(defenderToken);
  let damage: DamageBreakdown | null = null;
  let hpAfter = hpBefore;

  if (hit) {
    damage = rollActionDamage(action.damageFormula, fixedMod, critical);
    hpAfter = Math.max(0, hpBefore - damage.total);
  }

  const name = attackerToken.name;
  const modeTag = rollMode !== "normal" ? ` [${formatRollMode(rollMode)}]` : "";
  let summary: string;
  if (criticalFail) {
    summary = `${name} falha ao atacar! (natural 1)`;
  } else if (!hit) {
    summary = `${name} ataca${modeTag} ${defenderToken.name}: ${attackTotal} vs CA ${ac} — ERROU`;
  } else if (critical) {
    summary = `${name} CRÍTICO${modeTag} em ${defenderToken.name}! ${damage!.total} ${action.damageType}`;
  } else {
    summary = `${name} acerta${modeTag} ${defenderToken.name}: ${attackTotal} vs CA ${ac} — ${damage!.total} ${action.damageType}`;
  }

  return {
    attackerTokenId: attackerToken.id,
    defenderTokenId: defenderToken.id,
    actionKind: action.kind,
    weaponName: action.name,
    rangeHex: action.rangeHex,
    paCost: action.paCost,
    defenderAc: ac,
    attack: {
      natural,
      attributeMod: fixedMod,
      profBonus: 0,
      weaponBonus: action.attackBonus,
      total: attackTotal,
      attributeLabel: action.rangeHex > 1 ? "DES" : "FOR",
      rollMode,
      d20Detail: formatD20Detail(naturalRoll),
    },
    hit,
    critical,
    criticalFail,
    damage,
    defenderHpBefore: hpBefore,
    defenderHpAfter: hpAfter,
    summary,
  };
}

export function resolveAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  actor: CharacterSheet,
  action: CombatActionOption = resolveCombatAction(actor),
  turn?: CombatTurnOptions,
  modifier?: AttackModifier,
  allTokens: BattleToken[] = [],
  opts?: { skipRangeCheck?: boolean }
): AttackResolution {
  const check = canAttackTarget(attackerToken, defenderToken, action, turn, opts);
  if (!check.ok) throw new Error(check.reason ?? "Ataque inválido");

  const attrKey = attackAttribute(actor, action);
  const attrMod = attributeMod(actor.attributes[attrKey]);
  const prof = isProficient(actor, action) ? proficiencyBonus(actor.identity.nivel) : 0;
  const built = buildAttackModifiers(attackerToken, defenderToken, action);
  const merged = mergeModifiers(built.modifier, modifier);
  const extraBonus = merged?.attackBonus ?? 0;
  const rollMode = combineRollModes(
    attackRollMode(attackerToken, defenderToken, allTokens),
    merged?.rollMode ?? "normal"
  );
  const naturalRoll = rollD20(rollMode);
  const natural = naturalRoll.natural;
  const attackTotal = natural + attrMod + prof + action.attackBonus + extraBonus;

  const ac = effectiveDefenderAc(defenderToken);
  const critical = natural === 20;
  const criticalFail = natural === 1;
  const hit = critical || (!criticalFail && attackTotal >= ac);

  const hpBefore = defenderHp(defenderToken);
  let damage: DamageBreakdown | null = null;
  let hpAfter = hpBefore;

  if (hit) {
    const dmgMod = action.kind === "spell" ? 0 : attrMod;
    damage = rollActionDamage(action.damageFormula, dmgMod, critical);
    if (attackerToken.bonusDamageFormula) {
      const extra = rollDice(attackerToken.bonusDamageFormula);
      damage.rolls.push(...extra.rolls);
      damage.total += extra.total;
    }
    hpAfter = Math.max(0, hpBefore - damage.total);
  }

  const attr = attributeLabel(attrKey);
  const verb = action.kind === "spell" ? "conjura" : "ataca";
  const modLabel = merged?.label ? ` (${merged.label})` : "";

  let summary: string;
  if (criticalFail) {
    summary = `${actor.name} falha ao ${verb} com ${action.name}! (natural 1)`;
  } else if (!hit) {
    summary = `${actor.name} ${verb}${modLabel} ${defenderToken.name} com ${action.name}: ${attackTotal} vs CA ${ac} — ERROU`;
  } else if (critical) {
    summary = `${actor.name} CRÍTICO${modLabel} em ${defenderToken.name}! ${damage!.total} ${action.damageType} (${damage!.rolls.join("+")}${damage!.attributeMod ? `+${damage!.attributeMod}` : ""})`;
  } else {
    summary = `${actor.name} acerta${modLabel} ${defenderToken.name}: ${attackTotal} vs CA ${ac} — ${damage!.total} ${action.damageType}`;
  }

  return {
    attackerTokenId: attackerToken.id,
    defenderTokenId: defenderToken.id,
    actionKind: action.kind,
    weaponName: action.name,
    rangeHex: action.rangeHex,
    paCost: action.paCost,
    defenderAc: ac,
    attack: {
      natural,
      attributeMod: attrMod,
      profBonus: prof,
      weaponBonus: action.attackBonus + extraBonus,
      total: attackTotal,
      attributeLabel: attr,
      rollMode,
      d20Detail: formatD20Detail(naturalRoll),
    },
    hit,
    critical,
    criticalFail,
    damage,
    defenderHpBefore: hpBefore,
    defenderHpAfter: hpAfter,
    summary,
  };
}

export function resolveMultiAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  actor: CharacterSheet,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  allTokens: BattleToken[] = []
): AttackResolution[] {
  const count = warriorAttackCount(actor, action);
  const results: AttackResolution[] = [];
  let currentDefender = { ...defenderToken };

  for (let i = 0; i < count; i++) {
    const res = resolveAttack(attackerToken, currentDefender, actor, action, turn, undefined, allTokens);
    res.attackIndex = i + 1;
    res.attackCount = count;
    if (count > 1) {
      res.summary = `[${i + 1}/${count}] ${res.summary}`;
      res.paCost = i === 0 ? action.paCost : 0;
    }
    results.push(res);
    currentDefender = { ...currentDefender, vida: res.defenderHpAfter };
    if ((currentDefender.vida ?? 0) <= 0) break;
  }

  return results;
}

export function resolveTokenAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  action: CombatActionOption,
  actor: CharacterSheet | null,
  turn?: CombatTurnOptions,
  modifier?: AttackModifier,
  allTokens: BattleToken[] = []
): AttackResolution | AttackResolution[] {
  if (!actor) {
    return resolveMonsterAttack(attackerToken, defenderToken, action, turn, modifier);
  }
  if (action.kind === "weapon" && warriorAttackCount(actor, action) > 1) {
    return resolveMultiAttack(attackerToken, defenderToken, actor, action, turn, allTokens);
  }
  return resolveAttack(attackerToken, defenderToken, actor, action, turn, modifier, allTokens);
}

export function formatAttackChatDetail(res: AttackResolution): string {
  const a = res.attack;
  const kind =
    res.actionKind === "spell" ? "Magia" : res.actionKind === "ability" ? "Habilidade" : "Ataque";
  const rollPart = a.d20Detail ?? `1d20=${a.natural}`;
  const parts = [
    `${kind} ${rollPart} +${a.attributeMod}+${a.profBonus}${a.weaponBonus ? `+${a.weaponBonus}` : ""} = ${a.total}`,
    `CA ${res.defenderAc}`,
  ];
  if (res.hit && res.damage) {
    parts.push(
      `Dano ${res.damage.rolls.join("+")}${res.damage.attributeMod ? `+${res.damage.attributeMod}` : ""} = ${res.damage.total}`
    );
    parts.push(`HP ${res.defenderHpBefore}→${res.defenderHpAfter}`);
  }
  return parts.join(" · ");
}

export function getAttackableTargets(
  attacker: BattleToken,
  defender: BattleToken,
  actor: CharacterSheet | null,
  turn?: CombatTurnOptions
): { ok: boolean; reason?: string; action: CombatActionOption | null } {
  if (!actor) return { ok: false, reason: "Sem ficha", action: null };
  const action = resolveCombatAction(actor);
  const check = canAttackTarget(attacker, defender, action, turn);
  return { ...check, action };
}
