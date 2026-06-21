/**
 * Modelo único de dados de combate — espelho JS de `lib/vtt/combat-dice-model.ts`
 * para o preview estático (`preview-combate-dados.html`).
 */

export const COMBAT_DICE_TIMINGS = {
  mark: 40,
  attackRoll: 950,
  damageRoll: 800,
  missHold: 250,
  afterResolve: 150,
  evictMs: 340,
};

export const COMBAT_DICE_TIMINGS_REDUCED = {
  mark: 20,
  attackRoll: 420,
  damageRoll: 360,
  missHold: 120,
  afterResolve: 100,
  evictMs: 200,
};

export const DAMAGE_DICE_COLOR = "#e05040";
export const HEAL_DICE_COLOR = "#46c878";
export const CRIT_DICE_COLOR = "#ffc840";
export const DICE_ROLLER_COLOR = "#6b9e8c";

export const DICE_LANDING_MS = 280;
export const DICE_LANDING_MS_REDUCED = 100;
export const COMBAT_ATTACK_MIN_SPIN_MS = 480;
export const COMBAT_ATTACK_MIN_SPIN_MS_REDUCED = 180;

export const ACTOR_TIER_VISUAL = {
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

export const PREVIEW_TIER_ALIASES = {
  player: "hero",
  monster: "monster",
  elite: "elite",
  miniboss: "miniboss",
  boss: "boss",
};

const STANDARD_SIDES = [4, 6, 8, 10, 12, 20];

function parsePrimaryDie(formula) {
  const m = String(formula).trim().match(/d(\d+)/i);
  if (m) return Math.min(100, Math.max(2, parseInt(m[1], 10)));
  return 20;
}

export function resolveCombatDiceTimings(reducedMotion = false) {
  return reducedMotion ? COMBAT_DICE_TIMINGS_REDUCED : COMBAT_DICE_TIMINGS;
}

export function tierVisual(tier) {
  return ACTOR_TIER_VISUAL[tier] ?? ACTOR_TIER_VISUAL.monster;
}

export function previewTierVisual(alias) {
  const tier = PREVIEW_TIER_ALIASES[alias] ?? "monster";
  return tierVisual(tier);
}

export function formulaToDiceSides(formula, fallback = 8) {
  const raw = parsePrimaryDie(formula?.trim() || `1d${fallback}`);
  if (STANDARD_SIDES.includes(raw)) return raw;
  if (raw <= 4) return 4;
  if (raw <= 6) return 6;
  if (raw <= 8) return 8;
  if (raw <= 10) return 10;
  if (raw <= 12) return 12;
  return 20;
}

export function dieFaceValue(total, sides) {
  if (total == null || !Number.isFinite(total)) return undefined;
  const n = Math.round(total);
  if (n < 1) return undefined;
  return Math.min(n, sides);
}

export function damageDiceColor(opts = {}) {
  if (opts.isHeal) return HEAL_DICE_COLOR;
  if (opts.isCrit) return CRIT_DICE_COLOR;
  return DAMAGE_DICE_COLOR;
}

export function damageDiceBorder(opts = {}) {
  if (opts.isCrit) return "rgba(255, 200, 48, 0.72)";
  if (opts.isHeal) return "rgba(70, 200, 120, 0.65)";
  return "rgba(224, 80, 64, 0.65)";
}

export function toDiceBoxRoll(spec, faceOverride) {
  const face = faceOverride ?? spec.value;
  return {
    qty: spec.qty,
    sides: spec.sides,
    ...(face != null ? { value: face } : {}),
    themeColor: spec.themeColor,
  };
}

export function buildAttackRollSpec(tier, natural, saveNatural) {
  const attacker = tierVisual(tier);
  const value = natural ?? saveNatural ?? undefined;
  return {
    qty: 1,
    sides: 20,
    ...(value != null ? { value } : {}),
    themeColor: attacker.color,
  };
}

export function buildDamageRollSpec(damageTotal, damageFormula, opts = {}) {
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

export function buildPreviewSequence(mode, nat, dmg, attackerAlias, reducedMotion = false) {
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

export function getDiceBoxRuntimeOptions(reducedMotion = false) {
  return {
    assetPath: "/assets/dice-box/",
    origin: typeof window !== "undefined" ? window.location.origin : "",
    theme: "default",
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
    settleTimeout: reducedMotion ? 550 : 850,
    enableShadows: !reducedMotion,
    shadowTransparency: 0.72,
    lightIntensity: 1.05,
    offscreen: true,
  };
}
