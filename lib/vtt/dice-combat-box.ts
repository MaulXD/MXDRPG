import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";

export type DiceSides = 4 | 6 | 8 | 12 | 20;

export const DICE_TIER_COLORS: Record<PortraitFrameTier, string> = {
  hero: "#4a90d9",
  monster: "#d4b84a",
  elite: "#9b59d4",
  miniboss: "#e88832",
  boss: "#d43838",
};

export const DICE_TIER_LABELS: Record<PortraitFrameTier, string> = {
  hero: "Jogador",
  monster: "Monstro",
  elite: "Elite",
  miniboss: "Miniboss",
  boss: "Boss",
};

/** Borda/glow do slot — igual ao preview HTML. */
export function getAttackSlotBorder(tier: PortraitFrameTier): string {
  const map: Record<PortraitFrameTier, string> = {
    hero: "rgba(74,144,217,0.65)",
    monster: "rgba(212,184,74,0.65)",
    elite: "rgba(155,89,212,0.65)",
    miniboss: "rgba(232,136,50,0.65)",
    boss: "rgba(212,56,56,0.65)",
  };
  return map[tier];
}

export const DICE_DAMAGE_COLOR = "#e05040";
export const DICE_HEAL_COLOR = "#46c878";
export const DICE_CRIT_COLOR = "#ffc840";

export const DICE_COMBAT_EVICT_MS = 340;

/** Mesmo bundle do preview (`public/preview-combate-dados.html`). */
export const VENDOR_DICE_BOX = "/vendor/dice-box/dice-box.es.min.js";
export const VENDOR_DICE_CSS = "/vendor/dice-box/style.css";

let combatDicePreloadStarted = false;

/** Pré-carrega CSS + módulo antes do 1º ataque (combat mode). */
export function preloadCombatDiceBox(): void {
  if (typeof window === "undefined" || combatDicePreloadStarted) return;
  combatDicePreloadStarted = true;
  const id = "mxdrpg-dice-box-css";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = VENDOR_DICE_CSS;
    document.head.appendChild(link);
  }
  void import(/* webpackIgnore: true */ VENDOR_DICE_BOX).catch((err) =>
    console.error("[dice-combat-box] preload", err)
  );
}

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
    settleTimeout: reducedMotion ? 900 : 1400,
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
