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

/** Verde claro → amarelo → vermelho → preto conforme a vida cai. */
export function hpBarColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  if (t <= 0) return "#0a0a0a";
  if (t <= 0.2) return lerpRgb([10, 8, 8], [120, 24, 24], t / 0.2);
  if (t <= 0.45) return lerpRgb([120, 24, 24], [210, 72, 32], (t - 0.2) / 0.25);
  if (t <= 0.65) return lerpRgb([210, 72, 32], [200, 168, 48], (t - 0.45) / 0.2);
  if (t <= 0.85) return lerpRgb([200, 168, 48], [120, 200, 96], (t - 0.65) / 0.2);
  return lerpRgb([120, 200, 96], [168, 240, 152], (t - 0.85) / 0.15);
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

/** Arco semicircular ao redor do token (parte superior). */
export function drawTokenHpArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  ratio: number,
  color: string
): void {
  const ringR = tokenR + 5;
  const lineWidth = 4.5;
  const startA = Math.PI * 1.12;
  const endA = Math.PI * 1.88;
  const sweep = endA - startA;
  const clamped = Math.max(0, Math.min(1, ratio));
  const fillEnd = startA + sweep * clamped;

  ctx.save();
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(x, y, ringR, startA, endA);
  ctx.strokeStyle = "rgba(0,0,0,0.65)";
  ctx.lineWidth = lineWidth + 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, ringR, startA, endA);
  ctx.strokeStyle = "rgba(22,22,22,0.9)";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  if (clamped > 0.001) {
    ctx.beginPath();
    ctx.arc(x, y, ringR, startA, fillEnd);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.stroke();
  }

  ctx.restore();
}

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
  const by = y - tokenR - 18;

  ctx.save();
  ctx.font = "700 10px Lora, Georgia, serif";
  ctx.textAlign = "center";
  const tw = ctx.measureText(label).width + 12;
  ctx.fillStyle = "rgba(6, 8, 6, 0.88)";
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - tw / 2, by - 9, tw, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 4;
  ctx.fillText(label, x, by + 1);
  ctx.restore();
}
