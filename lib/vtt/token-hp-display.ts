import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { isMonsterToken } from "@/lib/room/settings";
import type { RoomActor } from "@/lib/room/types";
import type { TokenRingStyle } from "@/lib/vtt/token-colors";
import { strokeEffectIcon } from "@/lib/vtt/token-effect-icons";
import type { BattleToken } from "@/lib/vtt/types";

/** `bar` = anel de vida circular no token; valores numéricos ficam no mini-HUD / painéis. */
export type TokenHpDisplay = {
  bar: boolean;
  /** @deprecated Não desenhar HP numérico no canvas — use mini-HUD. */
  numeric: boolean;
};

/** HP sempre verde (v4) — sem variação por threshold. */
const HP_COLOR_V4: [number, number, number] = [107, 158, 90];

export function hpBarColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  if (t <= 0) return "rgb(8, 8, 8)";
  const [r, g, b] = HP_COLOR_V4;
  return `rgb(${r},${g},${b})`;
}

export function formatTokenHpLine(token: BattleToken): string {
  if (token.vidaMax == null) return "—";
  const cur = token.vida ?? 0;
  const max = token.vidaMax;
  const temp = token.vidaTemp ?? 0;
  return temp > 0 ? `${cur}/${max} +${temp} temp` : `${cur}/${max}`;
}

export function hpRatio(token: BattleToken): number {
  if (isTokenDefeated(token)) return 0;
  if (token.vidaMax == null || token.vidaMax <= 0) return 1;
  const v = token.vida ?? token.vidaMax;
  return Math.max(0, Math.min(1, v / token.vidaMax));
}

export function isTokenDefeated(token: BattleToken): boolean {
  if (token.defeated) return true;
  if (token.vidaMax == null) return false;
  return (token.vida ?? 0) <= 0;
}

/** Aplica vida/temp e sincroniza `defeated` quando há vidaMax. */
export function patchTokenVitals(
  token: BattleToken,
  patch: Partial<Pick<BattleToken, "vida" | "vidaMax" | "vidaTemp">>
): BattleToken {
  const next = { ...token, ...patch };
  if (next.vidaMax == null) return next;
  const defeated = (next.vida ?? 0) <= 0;
  return { ...next, defeated: defeated ? true : undefined };
}

const HP_BAR_GRAPHITE = "rgb(58, 58, 60)";

/** Raio do anel de HP na borda do retrato (inset mínimo). */
export function tokenOuterBorderR(tokenR: number, ringStyle: TokenRingStyle): number {
  void ringStyle;
  return tokenR - 0.35;
}

/** @deprecated Use tokenOuterBorderR */
export const tokenOuterBorderHexR = tokenOuterBorderR;

/** Anel de vida no limite inscrito; retrato ocupa o interior com o máximo de área possível. */
export function hpRingLayout(tokenR: number, ringStyle: TokenRingStyle): {
  width: number;
  contentR: number;
  contentRFull: number;
  borderR: number;
  identityBase: number;
  outerRingOffset: number;
} {
  const width = Math.max(2, tokenR * 0.055);
  const outerRingOffset = Math.min(...ringStyle.rings.map((ring) => ring.radiusOffset));
  const borderR = tokenR - width * 0.5;
  const contentRFull = Math.max(4, borderR - width * 0.5 - 0.25);
  const identityBase = contentRFull;
  return { width, contentR: contentRFull, contentRFull, borderR, identityBase, outerRingOffset };
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

const HP_RING_START = -Math.PI / 2;

/** Anel circular como barra de vida (preenchimento horário a partir do topo). */
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
  const r = layout.borderR;

  ctx.save();
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = defeated ? deadColor : emptyColor;
  ctx.lineWidth = layout.width;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = HP_BAR_GRAPHITE;
  ctx.lineWidth = 0.75;
  ctx.stroke();

  if (!defeated && clamped > 0.001) {
    ctx.beginPath();
    ctx.arc(x, y, r, HP_RING_START, HP_RING_START + Math.PI * 2 * clamped);
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
  opts: {
    showUsernameOnTokenNameplate: boolean;
    hovered: boolean;
  }
): boolean {
  if (token.nameplateMode === "always") return true;
  if (
    opts.showUsernameOnTokenNameplate &&
    token.linked &&
    !token.monsterEntryId &&
    opts.hovered
  ) {
    return true;
  }
  return false;
}

/** Duas linhas: username (negrito) + nome da ficha (menor), sem parênteses. */
export function drawDualTokenNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenR: number,
  username: string,
  characterName: string
): void {
  const userLine = username.trim();
  const charLine = characterName.trim();
  if (!userLine && !charLine) return;

  const userSize = Math.max(10, Math.round(tokenR * 0.32));
  const charSize = Math.max(8, Math.round(tokenR * 0.26));
  const lineGap = 2;
  const nameY = y + tokenR + 6;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";

  const drawLine = (text: string, fontSize: number, yOffset: number, bold: boolean) => {
    if (!text) return;
    ctx.font = `${bold ? "700" : "600"} ${fontSize}px Lora, Georgia, serif`;
    ctx.lineWidth = Math.max(2, fontSize * 0.2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
    ctx.fillStyle = bold ? "rgba(255, 255, 255, 0.98)" : "rgba(232, 226, 214, 0.92)";
    ctx.strokeText(text, x, yOffset);
    ctx.fillText(text, x, yOffset);
  };

  drawLine(userLine, userSize, nameY, true);
  if (charLine) {
    drawLine(charLine, charSize, nameY + userSize + lineGap, false);
  }
  ctx.restore();
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
