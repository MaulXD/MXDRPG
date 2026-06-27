/**
 * Modelo único de dados de combate — fonte de verdade compartilhada com
 * `public/combat-dice-model.mjs` (preview) e a mesa (React).
 *
 * Contrato do preview: timings + tier visual + DiceRollSpec + CombatDiceSequence.
 */
import { parsePrimaryDie } from "@/lib/room/chat-events";
import type { CombatFxState } from "@/lib/vtt/combat-fx-types";
import type { BattleToken } from "@/lib/vtt/types";
import { resolvePortraitFrameTier, type PortraitFrameTier } from "@/lib/vtt/portrait-frame";

export type DiceSides = 4 | 6 | 8 | 10 | 12 | 20;

export type DiceRollSpec = {
  qty: 1;
  sides: DiceSides;
  value?: number;
  themeColor: string;
};

export type ActorTierVisual = {
  label: string;
  short: string;
  color: string;
  border: string;
};

export type CombatDiceTimings = {
  mark: number;
  attackRoll: number;
  damageRoll: number;
  missHold: number;
  afterResolve: number;
  evictMs: number;
};

/** Timings de combate — tempo para o dado cair e ler o resultado. */
export const COMBAT_DICE_TIMINGS: CombatDiceTimings = {
  mark: 30,
  attackRoll: 620,
  damageRoll: 520,
  missHold: 200,
  afterResolve: 120,
  evictMs: 380,
};

export const COMBAT_DICE_TIMINGS_REDUCED: CombatDiceTimings = {
  mark: 20,
  attackRoll: 420,
  damageRoll: 360,
  missHold: 160,
  afterResolve: 120,
  evictMs: 280,
};

export const DICE_LANDING_MS = 220;
export const DICE_LANDING_MS_REDUCED = 120;

/** Mínimo de “giro” do d20 antes de revelar resultado (ms). */
export const COMBAT_ATTACK_MIN_SPIN_MS = 420;
export const COMBAT_ATTACK_MIN_SPIN_MS_REDUCED = 240;

/** Tempo físico do dice-box até o dado pousar — alinhado ao painel de combate. */
export const COMBAT_DICE_SETTLE_MS = 480;
export const COMBAT_DICE_SETTLE_MS_REDUCED = 280;

export const DAMAGE_DICE_COLOR = "#e05040";
export const HEAL_DICE_COLOR = "#46c878";
export const CRIT_DICE_COLOR = "#ffc840";
export const DICE_ROLLER_COLOR = "#6b9e8c";

/** Tiers visuais — espelha ACTOR_TIERS do preview. */
export const ACTOR_TIER_VISUAL: Record<PortraitFrameTier, ActorTierVisual> = {
  hero: {
    label: "Jogador",
    short: "PLYR",
    color: "#4a90d9",
    border: "rgba(74,144,217,0.65)",
  },
  monster: {
    label: "Monstro",
    short: "GOBL",
    color: "#d4b84a",
    border: "rgba(212,184,74,0.65)",
  },
  elite: {
    label: "Elite",
    short: "ELIT",
    color: "#9b59d4",
    border: "rgba(155,89,212,0.65)",
  },
  miniboss: {
    label: "Miniboss",
    short: "MINI",
    color: "#e88832",
    border: "rgba(232,136,50,0.65)",
  },
  boss: {
    label: "Boss",
    short: "BOSS",
    color: "#d43838",
    border: "rgba(212,56,56,0.65)",
  },
};

/** Aliases do `<select>` do preview HTML. */
export const PREVIEW_TIER_ALIASES: Record<string, PortraitFrameTier> = {
  player: "hero",
  monster: "monster",
  elite: "elite",
  miniboss: "miniboss",
  boss: "boss",
};

export type CombatDiceSequence = {
  id: string;
  timings: CombatDiceTimings;
  attacker: ActorTierVisual;
  attack: DiceRollSpec;
  attackSlotLabel: string;
  damage?: DiceRollSpec;
  damageSlotLabel?: string;
  damageSlotBorder?: string;
  hit: boolean;
  crit?: boolean;
  heal?: boolean;
};

export type DiceCombatUiState = {
  attackRolling: boolean;
  attackLocked: boolean;
  showDamage: boolean;
  damageRolling: boolean;
  evicting: boolean;
};

const STANDARD_SIDES: DiceSides[] = [4, 6, 8, 10, 12, 20];

export function resolveCombatDiceTimings(reducedMotion = false): CombatDiceTimings {
  return reducedMotion ? COMBAT_DICE_TIMINGS_REDUCED : COMBAT_DICE_TIMINGS;
}

export function tierVisual(tier: PortraitFrameTier): ActorTierVisual {
  return ACTOR_TIER_VISUAL[tier];
}

export function previewTierVisual(alias: string): ActorTierVisual {
  const tier = PREVIEW_TIER_ALIASES[alias] ?? "monster";
  return tierVisual(tier);
}

export function formulaToDiceSides(
  formula: string | null | undefined,
  fallback: DiceSides = 8
): DiceSides {
  const raw = parsePrimaryDie(formula?.trim() || `1d${fallback}`);
  if (STANDARD_SIDES.includes(raw as DiceSides)) return raw as DiceSides;
  if (raw <= 4) return 4;
  if (raw <= 6) return 6;
  if (raw <= 8) return 8;
  if (raw <= 10) return 10;
  if (raw <= 12) return 12;
  return 20;
}

export function dieFaceValue(
  total: number | null | undefined,
  sides: DiceSides
): number | undefined {
  if (total == null || !Number.isFinite(total)) return undefined;
  const n = Math.round(total);
  if (n < 1) return undefined;
  return Math.min(n, sides);
}

export function damageDiceColor(opts: { isHeal?: boolean; isCrit?: boolean }): string {
  if (opts.isHeal) return HEAL_DICE_COLOR;
  if (opts.isCrit) return CRIT_DICE_COLOR;
  return DAMAGE_DICE_COLOR;
}

export function damageDiceBorder(opts: { isHeal?: boolean; isCrit?: boolean }): string {
  if (opts.isCrit) return "rgba(255, 200, 48, 0.72)";
  if (opts.isHeal) return "rgba(70, 200, 120, 0.65)";
  return "rgba(224, 80, 64, 0.65)";
}

/** Payload aceito pelo dice-box `.roll()`. */
export function toDiceBoxRoll(spec: DiceRollSpec, faceOverride?: number) {
  const face = faceOverride ?? spec.value;
  return {
    qty: spec.qty,
    sides: spec.sides,
    ...(face != null ? { value: face } : {}),
    themeColor: spec.themeColor,
  };
}

export function buildAttackRollSpec(
  tier: PortraitFrameTier,
  natural: number | null | undefined
): DiceRollSpec {
  const attacker = tierVisual(tier);
  return {
    qty: 1,
    sides: 20,
    ...(natural != null ? { value: natural } : {}),
    themeColor: attacker.color,
  };
}

/** Assinatura estável — dispara nova rolagem quando o servidor preenche o pending. */
export function combatFxRollSignature(fx: CombatFxState): string {
  return [
    fx.attackNatural ?? "",
    fx.attackTotal ?? "",
    fx.defenderAc ?? "",
    fx.saveTotal ?? "",
    fx.saveDc ?? "",
    fx.hit === true ? "1" : fx.hit === false ? "0" : "",
    fx.criticalFail ? "cf" : "",
  ].join(":");
}

/** Só rola/revela quando o chat trouxe natural + total + CA/CD (ou save). */
export function isCombatFxRollReady(fx: CombatFxState): boolean {
  if (fx.isHeal && fx.attackNatural == null && fx.attackTotal == null && fx.saveTotal == null) {
    return true;
  }
  if (fx.saveTotal != null && fx.saveDc != null) {
    return fx.attackNatural != null || fx.saveTotal != null;
  }
  return (
    fx.attackNatural != null &&
    fx.attackTotal != null &&
    fx.defenderAc != null &&
    (fx.hit === true || fx.hit === false || fx.criticalFail === true)
  );
}

export function buildDamageRollSpec(
  damageTotal: number | null | undefined,
  damageFormula: string | null | undefined,
  opts: { isHeal?: boolean; isCrit?: boolean }
): DiceRollSpec | null {
  if (damageTotal == null || damageTotal <= 0) return null;
  const sides = formulaToDiceSides(damageFormula, 8);
  const face = dieFaceValue(damageTotal, sides);
  return {
    qty: 1,
    sides,
    ...(face != null ? { value: face } : {}),
    themeColor: damageDiceColor(opts),
  };
}

export function diceRollSpecFromFormula(
  formula: string,
  total: number | null,
  themeColor = DICE_ROLLER_COLOR
): DiceRollSpec {
  const sides = formulaToDiceSides(formula, 20);
  const face = total != null ? dieFaceValue(total, sides) : undefined;
  return {
    qty: 1,
    sides,
    ...(face != null ? { value: face } : {}),
    themeColor,
  };
}

function resolveAttackerTier(fx: CombatFxState, tokens: BattleToken[]): PortraitFrameTier {
  const id = fx.attackerTokenId;
  if (!id) return "hero";
  const token = tokens.find((t) => t.id === id);
  return token ? resolvePortraitFrameTier(token) : "hero";
}

function sequenceHit(fx: CombatFxState): boolean {
  if (fx.isHeal) return true;
  if (fx.hit === false && fx.saveTotal == null) return false;
  if (fx.hit || fx.saveTotal != null) return true;
  return false;
}

/** Adapta FX da mesa → modelo do preview. */
export function combatFxToDiceSequence(
  fx: CombatFxState,
  tokens: BattleToken[],
  reducedMotion = false
): CombatDiceSequence {
  const tier = resolveAttackerTier(fx, tokens);
  const attacker = tierVisual(tier);
  const hit = sequenceHit(fx);
  const damage = hit
    ? buildDamageRollSpec(fx.damageTotal, fx.damageFormula, {
        isHeal: fx.isHeal,
        isCrit: fx.critical,
      })
    : null;

  return {
    id: fx.id,
    timings: resolveCombatDiceTimings(reducedMotion),
    attacker,
    attack: buildAttackRollSpec(tier, fx.attackNatural),
    attackSlotLabel: `Ataque d20 · ${attacker.label}`,
    ...(damage
      ? {
          damage,
          damageSlotLabel: fx.isHeal ? "Cura" : fx.critical ? "Crítico" : `Dano d${damage.sides}`,
          damageSlotBorder: damageDiceBorder({ isHeal: fx.isHeal, isCrit: fx.critical }),
        }
      : {}),
    hit,
    crit: fx.critical,
    heal: fx.isHeal,
  };
}

/** Entrada do preview (Simular acerto/erro/crit). */
export function buildPreviewSequence(
  mode: "hit" | "miss" | "crit",
  nat: number,
  dmg: number,
  attackerAlias: string,
  reducedMotion = false
): CombatDiceSequence {
  const tier = PREVIEW_TIER_ALIASES[attackerAlias] ?? "monster";
  const attacker = tierVisual(tier);
  const hit = mode !== "miss";
  const isCrit = mode === "crit";
  const damage = hit ? buildDamageRollSpec(dmg, "1d8", { isCrit }) : null;

  return {
    id: `preview-${mode}-${nat}-${dmg}`,
    timings: resolveCombatDiceTimings(reducedMotion),
    attacker,
    attack: buildAttackRollSpec(tier, nat),
    attackSlotLabel: `Ataque d20 · ${attacker.label}`,
    ...(damage
      ? {
          damage,
          damageSlotLabel: isCrit ? "Crítico" : `Dano d${damage.sides}`,
          damageSlotBorder: damageDiceBorder({ isCrit }),
        }
      : {}),
    hit,
    crit: isCrit,
  };
}

/** Opções físicas do dice-box — espelha DICE_BOX_OPTS do preview. */
export function getDiceBoxRuntimeOptions(reducedMotion = false) {
  return {
    assetPath: "/assets/dice-box/",
    origin: typeof window !== "undefined" ? window.location.origin : "",
    theme: "default" as const,
    scale: reducedMotion ? 15 : 18,
    startingHeight: 9,
    throwForce: reducedMotion ? 3 : 4,
    spinForce: reducedMotion ? 2.5 : 3.5,
    gravity: 1.15,
    mass: 1.1,
    friction: 1,
    restitution: 0,
    linearDamping: 0.55,
    angularDamping: 0.55,
    settleTimeout: reducedMotion ? 280 : 480,
    enableShadows: !reducedMotion,
    shadowTransparency: 0.72,
    lightIntensity: 1.05,
    offscreen: true,
  };
}

/** Opções do painel de combate — faces legíveis como no preview. */
export function getDiceBoxCombatOptions(reducedMotion = false) {
  return {
    ...getDiceBoxRuntimeOptions(reducedMotion),
    scale: reducedMotion ? 16 : 20,
    lightIntensity: 1.35,
    shadowTransparency: 0.65,
    settleTimeout: reducedMotion ? 280 : 480,
  };
}

/** Compat — cores/labels derivados do tier visual. */
export const DICE_TIER_COLORS: Record<PortraitFrameTier, string> = {
  hero: ACTOR_TIER_VISUAL.hero.color,
  monster: ACTOR_TIER_VISUAL.monster.color,
  elite: ACTOR_TIER_VISUAL.elite.color,
  miniboss: ACTOR_TIER_VISUAL.miniboss.color,
  boss: ACTOR_TIER_VISUAL.boss.color,
};

export const DICE_TIER_LABELS: Record<PortraitFrameTier, string> = {
  hero: ACTOR_TIER_VISUAL.hero.label,
  monster: ACTOR_TIER_VISUAL.monster.label,
  elite: ACTOR_TIER_VISUAL.elite.label,
  miniboss: ACTOR_TIER_VISUAL.miniboss.label,
  boss: ACTOR_TIER_VISUAL.boss.label,
};

export function getAttackSlotBorder(tier: PortraitFrameTier): string {
  return ACTOR_TIER_VISUAL[tier].border;
}

export function getAttackDieColor(tier: PortraitFrameTier): string {
  return ACTOR_TIER_VISUAL[tier].color;
}

export function getDamageDieColor(opts: { isHeal?: boolean; isCrit?: boolean }): string {
  return damageDiceColor(opts);
}
