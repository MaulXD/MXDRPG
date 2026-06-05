import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { isMonsterToken } from "@/lib/room/settings";
import type { RoomActor } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export type TokenHpDisplay = {
  bar: boolean;
  numeric: boolean;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): string {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

/** Verde musgo → amarelo-oliva → vermelho → preto (sem neon). */
export function hpBarColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  if (t <= 0) return "#141210";
  if (t <= 0.2) return lerpRgb([20, 16, 14], [110, 38, 32], t / 0.2);
  if (t <= 0.45) return lerpRgb([110, 38, 32], [168, 88, 36], (t - 0.2) / 0.25);
  if (t <= 0.65) return lerpRgb([168, 88, 36], [156, 132, 48], (t - 0.45) / 0.2);
  if (t <= 0.85) return lerpRgb([156, 132, 48], [72, 108, 62], (t - 0.65) / 0.2);
  return lerpRgb([72, 108, 62], [88, 124, 76], (t - 0.85) / 0.15);
}

export function hpRatio(token: BattleToken): number {
  if (token.vidaMax == null || token.vidaMax <= 0) return 1;
  const v = token.vida ?? token.vidaMax;
  return Math.max(0, Math.min(1, v / token.vidaMax));
}

function isPlayerCharacterToken(token: BattleToken): boolean {
  return Boolean(token.linked && !token.monsterEntryId);
}

/** Quem pode ver barra / valores de HP no mapa. */
export function resolveTokenHpDisplay(
  token: BattleToken,
  opts: {
    isRoomGm: boolean;
    showMonsterHpToPlayers: boolean;
    hovered: boolean;
    session: SessionUser | null;
    roomActors: Record<string, RoomActor>;
    roomOwnerId: string;
  }
): TokenHpDisplay {
  if (token.vidaMax == null || token.vida == null) {
    return { bar: false, numeric: false };
  }

  const isGm =
    opts.isRoomGm ||
    (opts.session
      ? canManageRoom({ ownerId: opts.roomOwnerId }, opts.session)
      : false);

  if (isGm) {
    return { bar: true, numeric: true };
  }

  if (isMonsterToken(token)) {
    if (opts.showMonsterHpToPlayers) {
      return { bar: true, numeric: opts.hovered };
    }
    return { bar: false, numeric: false };
  }

  if (isPlayerCharacterToken(token) && opts.hovered) {
    return { bar: true, numeric: true };
  }

  return { bar: false, numeric: false };
}

/** Anel interno completo ao redor do token (vida preenche no sentido horário a partir da base). */
export function drawTokenHpArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  ratio: number,
  color: string
): void {
  const lineWidth = 4;
  const ringR = Math.max(tokenR * 0.78, tokenR - 7);
  const clamped = Math.max(0, Math.min(1, ratio));
  const startA = Math.PI / 2;
  const sweep = Math.PI * 2 * clamped;
  const fillEnd = startA + sweep;

  ctx.save();
  ctx.lineCap = "butt";

  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.92)";
  ctx.lineWidth = lineWidth + 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(28,24,20,0.96)";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  if (clamped > 0.002) {
    ctx.beginPath();
    ctx.arc(x, y, ringR, startA, fillEnd);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, ringR, startA, fillEnd);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = lineWidth - 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/** Valores de HP abaixo do token, com moldura sólida. */
export function drawTokenHpLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  token: BattleToken,
  color: string
): void {
  if (token.vidaMax == null || token.vida == null) return;

  const label = `${token.vida}/${token.vidaMax}`;
  const by = y + tokenR + 14;

  ctx.save();
  ctx.font = "700 10px Source Sans 3, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(label).width + 14;
  const bh = 15;
  const bx = x - tw / 2;
  const byBox = by - bh / 2;

  ctx.fillStyle = "rgba(10, 10, 8, 0.94)";
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, byBox, tw, bh, 3);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(48,44,38,0.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx + 0.5, byBox + 0.5, tw - 1, bh - 1, 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillText(label, x, by + 0.5);
  ctx.restore();
}
