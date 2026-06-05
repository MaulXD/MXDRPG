import type { CSSProperties } from "react";

export type PortraitFocus = {
  /** 0–1, ponto focal horizontal */
  x: number;
  /** 0–1, ponto focal vertical */
  y: number;
  /** Zoom no enquadramento (1 = padrão) */
  scale?: number;
};

export const PORTRAIT_FOCUS_SCALE_MIN = 0.75;
export const PORTRAIT_FOCUS_SCALE_MAX = 2.5;

/** Ponto focal padrão (rostos em retrato vertical) */
export const DEFAULT_PORTRAIT_FOCUS: PortraitFocus = { x: 0.5, y: 0.38, scale: 1 };

export function normalizePortraitFocus(focus: PortraitFocus): PortraitFocus {
  const scale =
    typeof focus.scale === "number" && Number.isFinite(focus.scale)
      ? Math.min(PORTRAIT_FOCUS_SCALE_MAX, Math.max(PORTRAIT_FOCUS_SCALE_MIN, focus.scale))
      : 1;
  return {
    x: Math.min(1, Math.max(0, focus.x)),
    y: Math.min(1, Math.max(0, focus.y)),
    scale,
  };
}

export function sanitizePortraitFocus(value: unknown): PortraitFocus | null {
  if (!value || typeof value !== "object") return null;
  const o = value as { x?: unknown; y?: unknown; scale?: unknown };
  const x = typeof o.x === "number" ? o.x : NaN;
  const y = typeof o.y === "number" ? o.y : NaN;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const scale = typeof o.scale === "number" && Number.isFinite(o.scale) ? o.scale : 1;
  return normalizePortraitFocus({ x, y, scale });
}

export function focusToObjectPosition(focus: PortraitFocus): string {
  const f = normalizePortraitFocus(focus);
  return `${Math.round(f.x * 100)}% ${Math.round(f.y * 100)}%`;
}

export function resolveCoverFocus(
  actor: { portraitFocus?: PortraitFocus | null; coverFocus?: PortraitFocus | null }
): PortraitFocus | null {
  return sanitizePortraitFocus(actor.coverFocus) ?? sanitizePortraitFocus(actor.portraitFocus);
}

export function resolveTokenFocus(
  actor: { portraitFocus?: PortraitFocus | null; tokenFocus?: PortraitFocus | null }
): PortraitFocus | null {
  return sanitizePortraitFocus(actor.tokenFocus) ?? sanitizePortraitFocus(actor.portraitFocus);
}

export function portraitFocusToImgStyle(focus: PortraitFocus): CSSProperties {
  const f = normalizePortraitFocus(focus);
  const scale = f.scale ?? 1;
  const origin = `${Math.round(f.x * 100)}% ${Math.round(f.y * 100)}%`;
  return {
    objectPosition: focusToObjectPosition(f),
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: origin,
  };
}
