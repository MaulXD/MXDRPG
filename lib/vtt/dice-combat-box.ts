import { parsePrimaryDie } from "@/lib/room/chat-events";
import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";

export type DiceSides = 4 | 6 | 8 | 10 | 12 | 20;

export type DiceBoxInstance = {
  init(): Promise<boolean | void>;
  roll(notation: unknown): Promise<unknown>;
  clear(): unknown;
  show?(): DiceBoxInstance;
  resizeWorld?(): void;
};

export type DiceBoxCtor = new (config: Record<string, unknown>) => DiceBoxInstance;

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

/** Cor neutra para rolagens livres (chat / roladores). */
export const DICE_ROLLER_COLOR = "#6b9e8c";

export const DICE_HOST_HEIGHT = {
  sm: 64,
  md: 88,
  lg: 120,
} as const;

export type DiceHostSize = keyof typeof DICE_HOST_HEIGHT;

/** Assets exigidos em produção (P1). */
export const DICE_BOX_REQUIRED_ASSETS = [
  "/vendor/dice-box/dice-box.es.min.js",
  "/vendor/dice-box/style.css",
  "/assets/dice-box/ammo/ammo.wasm.wasm",
  "/assets/dice-box/themes/default/theme.config.json",
] as const;

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

const STANDARD_SIDES: DiceSides[] = [4, 6, 8, 10, 12, 20];

let combatDicePreloadStarted = false;
let vendorCtor: DiceBoxCtor | null = null;
let vendorLoad: Promise<DiceBoxCtor> | null = null;
let warmPromise: Promise<void> | null = null;

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

export function diceBoxScaleForHost(hostPx: number, reducedMotion: boolean): number {
  const ref = 130;
  const base = reducedMotion ? 15 : 18;
  return Math.max(6, Math.round(base * (hostPx / ref)));
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

export function getDiceBoxOptionsForHost(hostPx: number, reducedMotion: boolean) {
  return {
    ...getDiceBoxBaseOptions(reducedMotion),
    scale: diceBoxScaleForHost(hostPx, reducedMotion),
  };
}

/** Valor exibido na face quando o dado é um único dN (dano total pode exceder N). */
export function dieFaceValue(total: number | null | undefined, sides: DiceSides): number | undefined {
  if (total == null || !Number.isFinite(total)) return undefined;
  const n = Math.round(total);
  if (n < 1) return undefined;
  return Math.min(n, sides);
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

/** Pré-inicializa WASM + física (P2) — 1º ataque no combate fica instantâneo. */
export async function warmCombatDiceBoxes(reducedMotion = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (warmPromise) return warmPromise;

  warmPromise = (async () => {
    const { attackId, damageId } = ensureWarmDom();
    const DiceBox = await loadVendorDiceBox();
    const opts = getDiceBoxBaseOptions(reducedMotion);

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

/** HEAD-check dos assets estáticos (P1) — só em dev/diagnóstico. */
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
