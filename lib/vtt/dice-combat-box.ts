import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";

export type DiceSides = 4 | 6 | 8 | 12 | 20;

export const DICE_TIER_COLORS: Record<PortraitFrameTier, string> = {
  hero: "#4a90d9",
  monster: "#d4b84a",
  elite: "#9b59d4",
  miniboss: "#e88832",
  boss: "#d43838",
};

export const DICE_DAMAGE_COLOR = "#e05040";
export const DICE_HEAL_COLOR = "#46c878";
export const DICE_CRIT_COLOR = "#ffc840";

export const DICE_COMBAT_EVICT_MS = 340;

export function getAttackDieColor(tier: PortraitFrameTier): string {
  return DICE_TIER_COLORS[tier];
}

export function getDamageDieColor(opts: {
  isHeal?: boolean;
  isCrit?: boolean;
}): string {
  if (opts.isHeal) return DICE_HEAL_COLOR;
  if (opts.isCrit) return DICE_CRIT_COLOR;
  return DICE_DAMAGE_COLOR;
}

export function getDiceBoxBaseOptions(reducedMotion: boolean) {
  return {
    assetPath: "/assets/dice-box/",
    origin: typeof window !== "undefined" ? window.location.origin : "",
    theme: "default" as const,
    scale: reducedMotion ? 14 : 16,
    startingHeight: 9,
    throwForce: reducedMotion ? 3 : 4,
    spinForce: reducedMotion ? 2.5 : 3.5,
    gravity: 1.15,
    mass: 1.1,
    friction: 1,
    restitution: 0,
    linearDamping: 0.55,
    angularDamping: 0.55,
    settleTimeout: 4500,
    enableShadows: !reducedMotion,
    shadowTransparency: 0.72,
    lightIntensity: 1.05,
    offscreen: true,
  };
}

/** Valor exibido na face quando o dado é um único dN (dano total pode exceder N). */
export function dieFaceValue(total: number | null | undefined, sides: DiceSides): number | undefined {
  if (total == null || !Number.isFinite(total)) return undefined;
  const n = Math.round(total);
  if (n < 1) return undefined;
  return Math.min(n, sides);
}
