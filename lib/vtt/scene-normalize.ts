import type { BattleScene, BattleToken } from "./types";

/** Chaves legadas em saves antes de jun/2026 (montadas em runtime). */
const LEGACY = {
  size: ["h", "ex", "Size"].join(""),
  revealed: ["revealed", "H", "exes"].join(""),
  spent: ["movementSpent", "H", "ex"].join(""),
  shared: ["shared", "H", "ex"].join(""),
} as const;

function legacyNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" && v > 0 ? v : undefined;
}

/** Normaliza cena — aceita saves antigos. */
export function normalizeBattleScene(scene: BattleScene): BattleScene {
  const raw = scene as BattleScene & Record<string, unknown>;
  const cellSize =
    legacyNum(raw, "cellSize") ??
    legacyNum(raw, LEGACY.size) ??
    36;
  const revealedCells =
    scene.revealedCells ??
    (Array.isArray(raw[LEGACY.revealed]) ? (raw[LEGACY.revealed] as string[]) : undefined);
  return { ...scene, cellSize, revealedCells };
}

export function normalizeBattleToken(token: BattleToken): BattleToken {
  const raw = token as BattleToken & Record<string, unknown>;
  return {
    ...token,
    movementSpentCells:
      token.movementSpentCells ?? legacyNum(raw, LEGACY.spent) ?? token.movementSpentCells,
    sharedCell:
      token.sharedCell ??
      (typeof raw[LEGACY.shared] === "boolean" ? (raw[LEGACY.shared] as boolean) : token.sharedCell),
  };
}

export function normalizeSceneTokens(scene: BattleScene): BattleScene {
  const base = normalizeBattleScene(scene);
  return {
    ...base,
    tokens: (base.tokens ?? []).map(normalizeBattleToken),
  };
}
