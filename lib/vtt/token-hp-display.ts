import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { isMonsterToken } from "@/lib/room/settings";
import type { RoomActor } from "@/lib/room/types";
import { strokeEffectIcon } from "@/lib/vtt/token-effect-icons";
import type { BattleToken } from "@/lib/vtt/types";

export type TokenHpDisplay = {
  bar: boolean;
  numeric: boolean;
};

export const HP_SEGMENT_COUNT = 10;

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

const HP_COLOR_GREEN: [number, number, number] = [72, 168, 88];
const HP_COLOR_YELLOW: [number, number, number] = [228, 196, 48];
const HP_COLOR_ORANGE: [number, number, number] = [240, 140, 42];
const HP_COLOR_RED: [number, number, number] = [196, 48, 42];
const HP_COLOR_BLACK: [number, number, number] = [8, 8, 8];

/** Cheio verde → 50% amarelo → laranja → vermelho (low) → preto em 0. */
export function hpBarColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  if (t <= 0) return "rgb(8, 8, 8)";

  if (t >= 0.5) {
    const u = (t - 0.5) / 0.5;
    return lerpRgb(HP_COLOR_YELLOW, HP_COLOR_GREEN, u);
  }
  if (t >= 0.25) {
    const u = (t - 0.25) / 0.25;
    return lerpRgb(HP_COLOR_ORANGE, HP_COLOR_YELLOW, u);
  }
  if (t > 0.08) {
    const u = (t - 0.08) / 0.17;
    return lerpRgb(HP_COLOR_RED, HP_COLOR_ORANGE, u);
  }
  const u = t / 0.08;
  return lerpRgb(HP_COLOR_BLACK, HP_COLOR_RED, u);
}

export function hpRatio(token: BattleToken): number {
  if (token.vidaMax == null || token.vidaMax <= 0) return 1;
  const v = token.vida ?? token.vidaMax;
  return Math.max(0, Math.min(1, v / token.vidaMax));
}

export function isTokenDefeated(token: BattleToken): boolean {
  if (token.vidaMax == null) return false;
  return (token.vida ?? 0) <= 0;
}

const HP_BAR_GRAPHITE = "rgb(58, 58, 60)";

/** Barra fina colada na borda do token + raio do retrato interno. */
export function hpRingLayout(tokenR: number): {
  width: number;
  contentR: number;
  trackR: number;
  identityBase: number;
} {
  const width = Math.max(2.5, tokenR * 0.055);
  const trackR = tokenR - width / 2;
  const contentR = Math.max(tokenR * 0.82, trackR - width / 2 - 0.5);
  const identityBase = tokenR + 1.5;
  return { width, contentR, trackR, identityBase };
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
    if (opts.showMonsterHpToPlayers || isTokenDefeated(token)) {
      return { bar: true, numeric: opts.hovered || isTokenDefeated(token) };
    }
    return { bar: false, numeric: false };
  }

  if (isPlayerCharacterToken(token) && (opts.hovered || isTokenDefeated(token))) {
    return { bar: true, numeric: true };
  }

  return { bar: false, numeric: false };
}

/** Anel segmentado fino na borda externa do token (1px borda grafite). */
export function drawTokenHpSegments(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  layout: ReturnType<typeof hpRingLayout>,
  ratio: number,
  color: string
): void {
  const clamped = Math.max(0, Math.min(1, ratio));
  const defeated = clamped <= 0;
  const filled = defeated ? 0 : Math.round(clamped * HP_SEGMENT_COUNT);
  const segAngle = (Math.PI * 2) / HP_SEGMENT_COUNT;
  const gap = 0.07;
  const emptyColor = "rgba(32, 30, 28, 0.95)";
  const deadColor = "rgb(8, 8, 8)";
  const startBase = -Math.PI / 2;
  const outerR = layout.trackR + layout.width / 2;
  const innerR = layout.trackR - layout.width / 2;

  ctx.save();
  ctx.lineCap = "butt";

  for (let i = 0; i < HP_SEGMENT_COUNT; i++) {
    const a0 = startBase + i * segAngle + gap / 2;
    const a1 = a0 + segAngle - gap;
    const isFilled = !defeated && i < filled;

    ctx.beginPath();
    ctx.arc(x, y, layout.trackR, a0, a1);
    ctx.strokeStyle = defeated ? deadColor : isFilled ? color : emptyColor;
    ctx.lineWidth = layout.width;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x, y, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = HP_BAR_GRAPHITE;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = HP_BAR_GRAPHITE;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/** Escurece o retrato de token derrotado. */
export function drawTokenDefeatedOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  contentR: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, contentR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, contentR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(80, 72, 68, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/** Caveira ao lado do token — status Morto. */
export function drawTokenDefeatedSkull(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number
): void {
  const size = 22;
  const cx = x + tokenR + 12;
  const cy = y - tokenR * 0.15;
  const half = size / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = "rgba(18, 14, 12, 0.94)";
  ctx.strokeStyle = "rgba(196, 48, 42, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - half, cy - half, size, size, 5);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = "transparent";

  strokeEffectIcon(ctx, cx, cy, 14, "skull", "rgb(232, 210, 200)", 2);
  ctx.restore();
}

/** HP numérico acima do token — sem fundo, só texto com sombra. */
export function drawTokenHpLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  token: BattleToken,
  color: string
): void {
  if (token.vidaMax == null || token.vida == null) return;

  const defeated = isTokenDefeated(token);
  const hpText = defeated ? "Morto" : `${token.vida}/${token.vidaMax}`;
  const hpY = y - tokenR - 12;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = defeated
    ? "700 10px Source Sans 3, Segoe UI, sans-serif"
    : "700 11px Source Sans 3, Segoe UI, sans-serif";
  ctx.fillStyle = defeated ? "rgb(160, 160, 160)" : color;
  ctx.shadowColor = "rgba(0,0,0,0.88)";
  ctx.shadowBlur = 5;
  ctx.fillText(hpText, x, hpY);
  ctx.restore();
}

/** Nome abaixo do token. */
export function drawTokenNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  name: string
): void {
  if (!name.trim()) return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "600 11px Lora, Georgia, serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.shadowColor = "rgba(0,0,0,0.88)";
  ctx.shadowBlur = 5;
  ctx.fillText(name, x, y + tokenR + 6);
  ctx.restore();
}
