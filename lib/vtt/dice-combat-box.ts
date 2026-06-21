/**
 * Runtime do dice-box (vendor, warm-up, hosts).
 * Modelo de dados: `@/lib/vtt/combat-dice-model`.
 */
import {
  COMBAT_DICE_TIMINGS,
  dieFaceValue,
  formulaToDiceSides,
  getAttackDieColor,
  getAttackSlotBorder,
  getDamageDieColor,
  getDiceBoxRuntimeOptions,
  getDiceBoxCombatOptions,
  DICE_TIER_COLORS,
  DICE_TIER_LABELS,
  DICE_ROLLER_COLOR,
  DAMAGE_DICE_COLOR as DICE_DAMAGE_COLOR,
  HEAL_DICE_COLOR as DICE_HEAL_COLOR,
  CRIT_DICE_COLOR as DICE_CRIT_COLOR,
} from "@/lib/vtt/combat-dice-model";

export type { DiceSides } from "@/lib/vtt/combat-dice-model";
export {
  dieFaceValue,
  formulaToDiceSides,
  getAttackDieColor,
  getAttackSlotBorder,
  getDamageDieColor,
  DICE_TIER_COLORS,
  DICE_TIER_LABELS,
  DICE_ROLLER_COLOR,
  DICE_DAMAGE_COLOR,
  DICE_HEAL_COLOR,
  DICE_CRIT_COLOR,
};

export type DiceBoxInstance = {
  init(): Promise<boolean | void>;
  roll(notation: unknown): Promise<unknown>;
  clear(): unknown;
  show?(): DiceBoxInstance;
  resizeWorld?(): void;
};

export type DiceBoxCtor = new (config: Record<string, unknown>) => DiceBoxInstance;

export const DICE_HOST_HEIGHT = {
  sm: 64,
  md: 88,
  lg: 120,
} as const;

export type DiceHostSize = keyof typeof DICE_HOST_HEIGHT;

/** Altura do host de combate (`.combat-dice-box-host` em vtt.css). */
export const COMBAT_DICE_HOST_PX = 130;

export const DICE_COMBAT_EVICT_MS = COMBAT_DICE_TIMINGS.evictMs;

export const DICE_BOX_REQUIRED_ASSETS = [
  "/vendor/dice-box/dice-box.es.min.js",
  "/vendor/dice-box/style.css",
  "/assets/dice-box/ammo/ammo.wasm.wasm",
  "/assets/dice-box/themes/default/theme.config.json",
] as const;

export const VENDOR_DICE_BOX = "/vendor/dice-box/dice-box.es.min.js";
export const VENDOR_DICE_CSS = "/vendor/dice-box/style.css";

let cssInjected = false;
let vendorCtor: DiceBoxCtor | null = null;
let vendorLoad: Promise<DiceBoxCtor> | null = null;
let warmPromise: Promise<void> | null = null;

/** Só injeta CSS — não baixa WASM/vendor na abertura da mesa. */
export function preloadCombatDiceBox(): void {
  if (typeof window === "undefined" || cssInjected) return;
  cssInjected = true;
  const id = "mxdrpg-dice-box-css";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = VENDOR_DICE_CSS;
    document.head.appendChild(link);
  }
}

export async function loadVendorDiceBox(): Promise<DiceBoxCtor> {
  if (vendorCtor) return vendorCtor;
  if (!vendorLoad) {
    preloadCombatDiceBox();
    vendorLoad = import(/* webpackIgnore: true */ VENDOR_DICE_BOX).then((mod) => {
      const Ctor = (mod as { default: DiceBoxCtor }).default;
      if (!Ctor) throw new Error("dice-box export default ausente");
      vendorCtor = Ctor;
      return Ctor;
    });
  }
  return vendorLoad;
}

export function diceBoxScaleForHost(hostPx: number, reducedMotion: boolean): number {
  const ref = COMBAT_DICE_HOST_PX;
  const base = reducedMotion ? 15 : 18;
  return Math.max(6, Math.round(base * (hostPx / ref)));
}

export function getDiceBoxBaseOptions(reducedMotion: boolean) {
  return getDiceBoxOptionsForHost(COMBAT_DICE_HOST_PX, reducedMotion);
}

export function getDiceBoxOptionsForHost(hostPx: number, reducedMotion: boolean) {
  return {
    ...getDiceBoxRuntimeOptions(reducedMotion),
    scale: diceBoxScaleForHost(hostPx, reducedMotion),
  };
}

export function getDiceBoxCombatPanelOptions(reducedMotion: boolean) {
  return {
    ...getDiceBoxOptionsForHost(COMBAT_DICE_HOST_PX, reducedMotion),
    lightIntensity: 1.28,
    shadowTransparency: 0.68,
    settleTimeout: reducedMotion ? 450 : 650,
  };
}

/** Pré-carrega o bundle JS/WASM sem criar contextos WebGL extras. */
export async function warmCombatDiceBoxes(_reducedMotion = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (warmPromise) return warmPromise;

  warmPromise = loadVendorDiceBox()
    .then(() => {})
    .catch((err) => {
      warmPromise = null;
      console.error("[dice-combat-box] warm failed", err);
      throw err;
    });

  return warmPromise;
}

/** Adia warm-up para idle — não bloqueia paint da mesa. */
export function scheduleCombatDiceWarm(reducedMotion = false): void {
  if (typeof window === "undefined") return;
  preloadCombatDiceBox();
  const run = () => void warmCombatDiceBoxes(reducedMotion);
  if ("requestIdleCallback" in window) {
    (
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 800);
  }
}

export async function verifyDiceBoxAssets(): Promise<{ ok: boolean; missing: string[] }> {
  if (typeof window === "undefined") return { ok: true, missing: [] };
  const missing: string[] = [];
  await Promise.all(
    DICE_BOX_REQUIRED_ASSETS.map(async (path) => {
      try {
        const res = await fetch(path, { method: "HEAD" });
        if (!res.ok) missing.push(path);
      } catch {
        missing.push(path);
      }
    })
  );
  return { ok: missing.length === 0, missing };
}
