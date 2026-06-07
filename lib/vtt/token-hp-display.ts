import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { isMonsterToken } from "@/lib/room/settings";
import type { RoomActor } from "@/lib/room/types";
import { hexCorners } from "@/lib/vtt/hex-math";
import type { TokenRingStyle } from "@/lib/vtt/token-colors";
import { strokeEffectIcon } from "@/lib/vtt/token-effect-icons";
import type { BattleToken } from "@/lib/vtt/types";

/** `bar` = anel de vida no hex do token; valores numéricos ficam no mini-HUD / painéis. */
export type TokenHpDisplay = {
  bar: boolean;
  /** @deprecated Não desenhar HP numérico no canvas — use mini-HUD. */
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

/** Raio do anel externo de identidade (centro do traço da borda). */
export function tokenOuterBorderHexR(tokenR: number, ringStyle: TokenRingStyle): number {
  const identityBase = tokenR + 0.5;
  const maxOffset = Math.max(0, ...ringStyle.rings.map((ring) => ring.radiusOffset));
  return identityBase + maxOffset;
}

/** Barra de vida na borda hexagonal do token (anel externo); retrato circular no interior. */
export function hpRingLayout(tokenR: number, ringStyle: TokenRingStyle): {
  width: number;
  contentR: number;
  contentRFull: number;
  borderHexR: number;
  identityBase: number;
  outerRingOffset: number;
} {
  const width = Math.max(3, tokenR * 0.058);
  const identityBase = tokenR + 0.5;
  const outerRingOffset = Math.max(0, ...ringStyle.rings.map((ring) => ring.radiusOffset));
  const borderHexR = identityBase + outerRingOffset;
  const contentRFull = Math.max(4, tokenR - 0.35);
  const contentR = Math.max(4, identityBase - width * 0.45);
  return { width, contentR, contentRFull, borderHexR, identityBase, outerRingOffset };
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

  if (!opts.hovered) {
    return { bar: false, numeric: false };
  }

  if (isGm) {
    return { bar: true, numeric: false };
  }

  if (isMonsterToken(token)) {
    if (opts.showMonsterHpToPlayers) {
      return { bar: true, numeric: false };
    }
    return { bar: false, numeric: false };
  }

  if (isPlayerCharacterToken(token)) {
    return { bar: true, numeric: false };
  }

  return { bar: false, numeric: false };
}

type HexPoint = { x: number; y: number };

/** Vértice superior do hex (pointy-top), depois sentido horário. */
function hexEdgesClockwiseFromTop(cx: number, cy: number, hexR: number): Array<{ from: HexPoint; to: HexPoint }> {
  const corners = hexCorners(cx, cy, hexR);
  const order = [5, 0, 1, 2, 3, 4];
  const edges: Array<{ from: HexPoint; to: HexPoint }> = [];
  for (let i = 0; i < order.length; i++) {
    const from = corners[order[i]!]!;
    const to = corners[order[(i + 1) % order.length]!]!;
    edges.push({ from, to });
  }
  return edges;
}

function edgeLength(a: HexPoint, b: HexPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function traceHexEdges(ctx: CanvasRenderingContext2D, edges: Array<{ from: HexPoint; to: HexPoint }>): void {
  const first = edges[0]?.from;
  if (!first) return;
  ctx.moveTo(first.x, first.y);
  for (const edge of edges) {
    ctx.lineTo(edge.to.x, edge.to.y);
  }
  ctx.closePath();
}

function traceHexEdgesPartial(
  ctx: CanvasRenderingContext2D,
  edges: Array<{ from: HexPoint; to: HexPoint }>,
  distance: number
): void {
  const first = edges[0]?.from;
  if (!first || distance <= 0) return;

  let remaining = distance;
  ctx.moveTo(first.x, first.y);
  for (const edge of edges) {
    const len = edgeLength(edge.from, edge.to);
    if (remaining >= len) {
      ctx.lineTo(edge.to.x, edge.to.y);
      remaining -= len;
    } else {
      const t = remaining / len;
      ctx.lineTo(edge.from.x + (edge.to.x - edge.from.x) * t, edge.from.y + (edge.to.y - edge.from.y) * t);
      return;
    }
  }
}

/** Borda hex do token como barra de vida (preenchimento horário a partir do topo). */
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
  const emptyColor = "rgba(32, 30, 28, 0.95)";
  const deadColor = "rgb(8, 8, 8)";
  const edges = hexEdgesClockwiseFromTop(x, y, layout.borderHexR);
  const edgeLen = edges[0] ? edgeLength(edges[0].from, edges[0].to) : 0;
  const perimeter = edgeLen * 6;
  const fillDist = defeated ? 0 : perimeter * clamped;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";

  ctx.beginPath();
  traceHexEdges(ctx, edges);
  ctx.strokeStyle = defeated ? deadColor : emptyColor;
  ctx.lineWidth = layout.width;
  ctx.stroke();

  ctx.beginPath();
  traceHexEdges(ctx, edges);
  ctx.strokeStyle = HP_BAR_GRAPHITE;
  ctx.lineWidth = 0.75;
  ctx.stroke();

  if (fillDist > 0.5) {
    ctx.beginPath();
    traceHexEdgesPartial(ctx, edges, fillDist);
    ctx.strokeStyle = color;
    ctx.lineWidth = layout.width;
    ctx.stroke();
  }

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

/** HP numérico em negrito, acima do token. */
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
  const fontSize = Math.max(9, Math.round(tokenR * 0.28));
  const hpY = y - tokenR - fontSize * 0.85;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = `700 ${fontSize}px Cinzel, Times New Roman, serif`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3.5, fontSize * 0.28);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillStyle = defeated ? "rgb(190, 190, 190)" : color;
  ctx.strokeText(hpText, x, hpY);
  ctx.fillText(hpText, x, hpY);
  ctx.restore();
}

/** Movimento restante — badge à esquerda do token, separado do HP acima. */
export function drawTokenWalkRemainingBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  walkHex: number,
  metersLabel: string
): void {
  const label = `${walkHex} hex`;
  const padX = 8;
  const boxH = 26;
  const gap = 10;

  ctx.save();
  ctx.font = "600 10px Source Sans 3, Segoe UI, sans-serif";
  const tw = Math.max(ctx.measureText(label).width, ctx.measureText(metersLabel).width) + padX * 2;
  const rx = x - tokenR - gap - tw;
  const ry = y - boxH / 2;

  ctx.fillStyle = "rgba(8, 10, 8, 0.88)";
  ctx.strokeStyle = "rgba(120, 150, 95, 0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(rx, ry, tw, boxH, 5);
  ctx.fill();
  ctx.stroke();

  const bx = rx + tw / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(168, 210, 148, 0.98)";
  ctx.fillText(label, bx, ry + 9);
  ctx.font = "500 8px Source Sans 3, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(232, 226, 214, 0.72)";
  ctx.fillText(metersLabel, bx, ry + 19);
  ctx.restore();
}

export function shouldDrawTokenNameplate(
  token: BattleToken,
  hoverTokenId: string | null
): boolean {
  if (token.nameplateMode === "always") return true;
  return token.id === hoverTokenId;
}

/** Nome abaixo do token — negrito com contorno preto. */
export function drawTokenNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  name: string
): void {
  if (!name.trim()) return;

  const fontSize = Math.max(11, Math.round(tokenR * 0.34));
  const nameY = y + tokenR + 6;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `700 ${fontSize}px Lora, Georgia, serif`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2.5, fontSize * 0.22);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.strokeText(name, x, nameY);
  ctx.fillText(name, x, nameY);
  ctx.restore();
}
