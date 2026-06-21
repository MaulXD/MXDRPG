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

export const DICE_COMBAT_EVICT_MS = COMBAT_DICE_TIMINGS.evictMs;

export const DICE_BOX_REQUIRED_ASSETS = [
  "/vendor/dice-box/dice-box.es.min.js",
  "/vendor/dice-box/style.css",
  "/assets/dice-box/ammo/ammo.wasm.wasm",
  "/assets/dice-box/themes/default/theme.config.json",
] as const;

export const VENDOR_DICE_BOX = "/vendor/dice-box/dice-box.es.min.js";
export const VENDOR_DICE_CSS = "/vendor/dice-box/style.css";

let combatDicePreloadStarted = false;
let vendorCtor: DiceBoxCtor | null = null;
let vendorLoad: Promise<DiceBoxCtor> | null = null;
let warmPromise: Promise<void> | null = null;

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
  void loadVendorDiceBox().catch((err) => console.error("[dice-combat-box] preload", err));
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
  const ref = 130;
  const base = reducedMotion ? 15 : 18;
  return Math.max(6, Math.round(base * (hostPx / ref)));
}

export function getDiceBoxBaseOptions(reducedMotion: boolean) {
  return getDiceBoxRuntimeOptions(reducedMotion);
}

export function getDiceBoxOptionsForHost(hostPx: number, reducedMotion: boolean) {
  return {
    ...getDiceBoxRuntimeOptions(reducedMotion),
    scale: diceBoxScaleForHost(hostPx, reducedMotion),
  };
}

function ensureWarmDom(): { attackId: string; damageId: string } {
  const rootId = "mxdrpg-dice-warm-root";
  if (!document.getElementById(rootId)) {
    const root = document.createElement("div");
    root.id = rootId;
    root.setAttribute("aria-hidden", "true");
    root.style.cssText =
      "position:fixed;left:-9999px;top:0;width:130px;height:280px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1";
    const attack = document.createElement("div");
    attack.id = "mxdrpg-dice-warm-attack";
    attack.style.cssText = "width:130px;height:130px";
    const damage = document.createElement("div");
    damage.id = "mxdrpg-dice-warm-damage";
    damage.style.cssText = "width:130px;height:130px";
    root.append(attack, damage);
    document.body.appendChild(root);
  }
  return { attackId: "mxdrpg-dice-warm-attack", damageId: "mxdrpg-dice-warm-damage" };
}

export async function warmCombatDiceBoxes(reducedMotion = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (warmPromise) return warmPromise;

  warmPromise = (async () => {
    const { attackId, damageId } = ensureWarmDom();
    const DiceBox = await loadVendorDiceBox();
    const opts = getDiceBoxRuntimeOptions(reducedMotion);

    const attack = new DiceBox({ ...opts, container: `#${attackId}` });
    await attack.init();
    attack.show?.();

    const damage = new DiceBox({ ...opts, container: `#${damageId}` });
    await damage.init();
    damage.show?.();
  })().catch((err) => {
    warmPromise = null;
    console.error("[dice-combat-box] warm failed", err);
    throw err;
  });

  return warmPromise;
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
