/** Ícones 16×16 (stroke) para chips de condição/buff — UI e canvas. */

export type TokenEffectIconId =
  | "fear"
  | "blind"
  | "daze"
  | "poison"
  | "prone"
  | "restraint"
  | "charm"
  | "shield"
  | "charge"
  | "move"
  | "atk-up"
  | "inspire"
  | "aim"
  | "react"
  | "flame"
  | "feint"
  | "mark";

/** Paths em viewBox 0 0 16 16 — traço arredondado. */
export const EFFECT_ICON_PATHS: Record<TokenEffectIconId, string> = {
  fear: "M8 2.5a4 4 0 0 0-4 4c0 1.2.5 2.3 1.2 3.1L4 13h8l-1.2-3.4A4 4 0 0 0 12 6.5a4 4 0 0 0-4-4z M6 6.5h.01 M10 6.5h.01 M6.2 9.2c.6.8 1.5 1.3 2.5 1.3s1.9-.5 2.5-1.3",
  blind:
    "M8 4.5c2.2 0 4 1.2 5 3-1 1.8-2.8 3-5 3s-4-1.2-5-3c1-1.8 2.8-3 5-3z M3 3l10 10",
  daze: "M8 2.5l.6 1.8 1.9.1-1.5 1.1.5 1.8-1.5-1-1.5 1 .5-1.8-1.5-1.1 1.9-.1z M3.5 11.5l.4 1.2 1.3.1-1 0.8.3 1.1-1-.7-1 .7.3-1.1-1-.8 1.3-.1z M12 11l.35 1 1.1.1-.85.65.25.95-.85-.6-.85.6.25-.95-.85-.65 1.1-.1z",
  poison:
    "M8 2v2.5M7 4.5h2M6.5 5.5c-1.2.8-2 2.2-2 3.8a3.5 3.5 0 0 0 7 0c0-1.6-.8-3-2-3.8M8 9.2v3.3M7 12.5h2",
  prone: "M3 10.5h10M5 8.5l2-2 2 2 2-1.5M5 10.5v1.5M11 10.5v1.5",
  restraint:
    "M5.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M10.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M7 6h2M5.5 9.5a1.5 1.5 0 1 0 0-3M10.5 9.5a1.5 1.5 0 1 0 0-3M7 9.5h2",
  charm:
    "M8 13.5c-2.5-1.8-4-3.6-4-5.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0c0 1.9-1.5 3.7-4 5.5l-.5.4-.5-.4z",
  shield: "M8 2.5L4 4.5v3.5c0 2.2 1.7 4.2 4 5.5 2.3-1.3 4-3.3 4-5.5V4.5L8 2.5z",
  charge: "M3 8h7l-2-2.5M10 8h3l-2.5 2.5M10 8v3",
  move: "M8 3v7M5.5 7.5L8 10l2.5-2.5M4 12.5h8",
  "atk-up": "M8 3v6M5.5 6.5L8 9l2.5-2.5M5 11.5h6l-1-2M11 11.5l1 2",
  inspire: "M8 3v5M5.5 5.5L8 8l2.5-2.5M4.5 11h7M6 13.5h4",
  aim: "M8 3v10M3 8h10M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  react: "M8 2.5v3M5.5 6.5h5M8 6.5v7M6 13.5h4",
  flame:
    "M8 2.5c0 2-2 2.5-2 4.5a2 2 0 0 0 4 0c0-1.2-1-1.8-1-3.5 1 .8 2 2.2 2 4 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.5 1-2.8 2-3.5",
  feint: "M5 4.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3-.9-3-2z M3 12c1.5-2 3.5-3 5-3s3.5 1 5 3M6 7h.01M10 7h.01",
  mark: "M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z M8 6v4M6 8h4",
};

export const CONDITION_ICON: Record<string, TokenEffectIconId> = {
  amedrontado: "fear",
  cego: "blind",
  atordoado: "daze",
  envenenado: "poison",
  prostrado: "prone",
  restringido: "restraint",
  encantado: "charm",
};

export const CHIP_ICON_BY_ID: Record<string, TokenEffectIconId> = {
  "def-buff": "shield",
  charge: "charge",
  "charge-note": "move",
  "next-atk": "atk-up",
  "ally-adv": "inspire",
  "ranged-adv": "aim",
  react: "react",
  "bonus-dmg": "flame",
  finta: "feint",
  mark: "mark",
};

export function strokeEffectIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  iconId: TokenEffectIconId,
  color: string,
  lineWidth = 1.85
): void {
  const d = EFFECT_ICON_PATHS[iconId];
  if (!d) return;
  const scale = size / 16;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-8, -8);
  const path = new Path2D(d);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.65)";
  ctx.lineWidth = lineWidth + 1.1;
  ctx.stroke(path);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke(path);
  ctx.restore();
}
