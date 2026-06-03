export type PortraitFocus = {
  /** 0–1, ponto focal horizontal */
  x: number;
  /** 0–1, ponto focal vertical */
  y: number;
};

export const DEFAULT_PORTRAIT_FOCUS: PortraitFocus = { x: 0.5, y: 0.5 };

export function sanitizePortraitFocus(value: unknown): PortraitFocus | null {
  if (!value || typeof value !== "object") return null;
  const o = value as { x?: unknown; y?: unknown };
  const x = typeof o.x === "number" ? o.x : NaN;
  const y = typeof o.y === "number" ? o.y : NaN;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

export function focusToObjectPosition(focus: PortraitFocus): string {
  return `${Math.round(focus.x * 100)}% ${Math.round(focus.y * 100)}%`;
}
