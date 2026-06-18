import type { Axial } from "@/lib/vtt/grid-math";
import { axialToPixel, cellCorners, cellDrawRadius } from "@/lib/vtt/grid-math";
import type { MoveCheck } from "@/lib/vtt/movement";
import { readThemeColor } from "@/lib/theme";
import {
  resolveGridPalette,
  type GridHighlightPalette,
} from "@/lib/vtt/grid-highlight-palette";
import type { MapBackdropTone } from "@/lib/vtt/map-luminance";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import { DEFAULT_PORTRAIT_FOCUS } from "@/lib/media/portrait-focus";
import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";
import {
  creatureSizeOf,
  occupiedCells,
  tokenDrawRadius,
  tokenPixelCenter,
} from "@/lib/vtt/creature-size";
import {
  drawCircularTokenImage,
  drawTokenIdentityRings,
  drawTokenPlaceholder,
} from "@/lib/vtt/token-canvas";
import {
  drawAttackableHint,
  drawAttackTargetFocus,
  drawRangeTargetHint,
  drawTurnActiveIndicator,
} from "@/lib/vtt/draw-token-animations";
import { drawTokenEffectBadges } from "@/lib/vtt/draw-token-effects";
import {
  drawTokenDefeatedOverlay,
  drawTokenDefeatedSkull,
  drawDualTokenNameLabel,
  drawTokenNameLabel,
  shouldDrawTokenNameplate,
  drawTokenHpSegments,
  hpBarColor,
  hpRatio,
  hpRingLayout,
  isTokenDefeated,
  type TokenHpDisplay,
} from "@/lib/vtt/token-hp-display";
import type { RoomSettings } from "@/lib/room/settings";
import type { RoomActor } from "@/lib/room/types";
import {
  drawTokenCastFx,
  type ActiveTokenCastFx,
} from "@/lib/vtt/token-cast-fx";
import { isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import { gridLodLevel, type GridLod } from "@/lib/vtt/canvas-lod";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
export type TokenFlashKind = "hit" | "miss" | "crit" | "heal";

export type CanvasLayout = {
  w: number;
  h: number;
  ox: number;
  oy: number;
  dpr: number;
};

export function prepareBattlefieldCanvas(
  canvas: HTMLCanvasElement,
  wrapEl: HTMLElement | null
): CanvasLayout | null {
  let w = canvas.clientWidth;
  let h = canvas.clientHeight;
  if (w < 10 || h < 10) {
    w = wrapEl?.clientWidth ?? 800;
    h = wrapEl?.clientHeight ?? 640;
  }
  if (w < 10 || h < 10) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.floor(w * dpr);
  const bh = Math.floor(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";

  return { w, h, ox: w / 2, oy: h / 2, dpr };
}

export function drawBattlefieldBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = readThemeColor("--vtt-canvas-bg-0", "#7a7a78");
  ctx.fillRect(0, 0, w, h);
}

/** Grade base em linhas (1 traço por eixo) — leve como Roll20/Foundry. */
function drawSquareGridLines(
  ctx: CanvasRenderingContext2D,
  p: GridDrawParams,
  stroke: string,
  lod: GridLod
): void {
  const { cellSize, layout, gridCells, visibleCellSet, gridOx, gridOy } = p;
  const ox = gridOx ?? layout.ox;
  const oy = gridOy ?? layout.oy;

  let minQ = Infinity;
  let maxQ = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;
  let any = false;

  for (const cell of gridCells) {
    const key = `${cell.q},${cell.r}`;
    if (visibleCellSet && !visibleCellSet.has(key)) continue;
    any = true;
    minQ = Math.min(minQ, cell.q);
    maxQ = Math.max(maxQ, cell.q);
    minR = Math.min(minR, cell.r);
    maxR = Math.max(maxR, cell.r);
  }
  if (!any) return;

  const step = lod === "deep" ? 2 : 1;
  const alpha = lod === "full" ? 0.92 : lod === "light" ? 0.82 : 0.72;
  const lineWidth = (lod === "deep" ? 1 : 1.25) / Math.max(p.viewScale ?? 1, 0.25);

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = alpha;

  const snap = (v: number) => Math.round(v) + 0.5;
  for (let q = minQ; q <= maxQ + 1; q += step) {
    const x = snap(ox + q * cellSize);
    const y0 = snap(oy + minR * cellSize);
    const y1 = snap(oy + (maxR + 1) * cellSize);
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
  }
  for (let r = minR; r <= maxR + 1; r += step) {
    const y = snap(oy + r * cellSize);
    const x0 = snap(ox + minQ * cellSize);
    const x1 = snap(ox + (maxQ + 1) * cellSize);
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.restore();
}

type GridDrawParams = {
  gridCells: Axial[];
  cellSize: number;
  layout: CanvasLayout;
  /** Origem do grid (alinhada ao mapa quando há piso). */
  gridOx?: number;
  gridOy?: number;
  showMovement: boolean;
  turnMovePreview?: boolean;
  walkSet: Set<string>;
  paidWalkSet: Set<string>;
  rangeSet: Set<string>;
  actionMode: TokenActionMode;
  attackRangeSet: Set<string>;
  isAreaSpellMode: boolean;
  areaPreviewSet: Set<string>;
  areaDirectionSet: Set<string>;
  hoverAxial: Axial | null;
  hoverMovePreview: MoveCheck | null;
  spawnDropHover: boolean;
  /** Células do footprint ao arrastar spawn multi-célula (null = só célula sob cursor). */
  spawnDropFootprintKeys?: Set<string> | null;
  /** Footprint de destino ao mover monstro/criatura multi-célula. */
  moveHoverFootprintKeys?: Set<string> | null;
  spawnDropInvalid?: boolean;
  pathCells: Axial[];
  pathDashPhase: number;
  /** null = todos os células visíveis (mestre ou fog desligado) */
  visibleCellSet: Set<string> | null;
  mapBackdropTone?: MapBackdropTone;
  palette?: GridHighlightPalette;
  viewScale?: number;
};

/** Traço da grade base — preto forte para leitura tática. */
function baseGridStroke(_tone: MapBackdropTone, _fallback: string): string {
  return "rgba(0, 0, 0, 0.9)";
}

export function drawCellGridLayer(ctx: CanvasRenderingContext2D, p: GridDrawParams): void {
  const { layout, cellSize, gridOx, gridOy } = p;
  const ox = gridOx ?? layout.ox;
  const oy = gridOy ?? layout.oy;
  const pal =
    p.palette ?? resolveGridPalette(p.mapBackdropTone ?? "none");
  const lod: GridLod = gridLodLevel(p.viewScale ?? 1);
  const tone = p.mapBackdropTone ?? "none";

  drawSquareGridLines(ctx, p, baseGridStroke(tone, pal.stroke), lod);

  for (const cell of p.gridCells) {
    const key = `${cell.q},${cell.r}`;
    if (p.visibleCellSet && !p.visibleCellSet.has(key)) continue;

    const { x, y } = axialToPixel(cell.q, cell.r, cellSize, ox, oy);
    let fill = pal.fill;
    let stroke = pal.stroke;
    let lineWidth = 1;

    if (p.showMovement && p.walkSet.has(key) && !p.paidWalkSet.has(key)) {
      if (p.turnMovePreview) {
        fill = pal.turnWalkFill;
        stroke = pal.turnWalkStroke;
      } else {
        fill = pal.walkFill;
        stroke = pal.walkStroke;
      }
    }
    if (p.showMovement && p.paidWalkSet.has(key)) {
      fill = pal.walkPaidFill;
      stroke = pal.walkPaidStroke;
    }
    if (p.showMovement && p.rangeSet.has(key) && !p.walkSet.has(key)) {
      fill = pal.runFill;
      stroke = pal.runStroke;
    }
    if (isTargetMode(p.actionMode) && p.attackRangeSet.has(key)) {
      fill = pal.attackFill;
      stroke = pal.attackStroke;
    }
    if (p.isAreaSpellMode && p.areaDirectionSet.has(key)) {
      fill = pal.dirFill;
      stroke = pal.dirStroke;
      lineWidth = 2;
    }
    if (p.isAreaSpellMode && p.areaPreviewSet.has(key)) {
      fill = pal.areaFill;
      stroke = pal.areaStroke;
    }
    if (
      p.isAreaSpellMode &&
      p.hoverAxial?.q === cell.q &&
      p.hoverAxial?.r === cell.r &&
      p.areaPreviewSet.has(key)
    ) {
      fill = pal.areaCenterFill;
      stroke = pal.areaCenterStroke;
      lineWidth = 2.5;
    }
    const isHoverCell = p.hoverAxial?.q === cell.q && p.hoverAxial?.r === cell.r;
    const isSpawnHover =
      p.spawnDropHover &&
      !p.spawnDropInvalid &&
      (p.spawnDropFootprintKeys != null
        ? p.spawnDropFootprintKeys.has(key)
        : isHoverCell);
    const isSpawnInvalidHover =
      p.spawnDropHover && p.spawnDropInvalid && isHoverCell;
    const isMoveFootprintHover =
      p.showMovement &&
      p.moveHoverFootprintKeys != null &&
      p.moveHoverFootprintKeys.has(key);
    if (
      isHoverCell &&
      p.showMovement &&
      p.hoverMovePreview &&
      !p.hoverMovePreview.ok
    ) {
      fill = pal.invalidFill;
      stroke = pal.invalidStroke;
      lineWidth = 2.5;
    } else if (isSpawnInvalidHover) {
      fill = pal.invalidFill;
      stroke = pal.invalidStroke;
      lineWidth = 2.5;
    } else if (
      isHoverCell &&
      p.showMovement &&
      p.hoverMovePreview?.ok &&
      p.hoverMovePreview.dist > 0
    ) {
      if (p.paidWalkSet.has(key)) {
        fill = pal.walkPaidFill;
        stroke = pal.walkPaidStroke;
        lineWidth = 2.5;
      } else if (p.rangeSet.has(key) && !p.walkSet.has(key)) {
        fill = pal.runFill;
        stroke = pal.runStroke;
        lineWidth = 2.5;
      } else if (p.walkSet.has(key)) {
        fill = pal.walkFill;
        stroke = pal.walkStroke;
        lineWidth = 2.5;
      }
    } else if (isMoveFootprintHover) {
      fill = pal.walkFill;
      stroke = pal.walkStroke;
      lineWidth = 2.5;
    } else if (isSpawnHover) {
      fill = pal.spawnFill;
      stroke = pal.spawnStroke;
      lineWidth = 2.5;
    }

    const isMoveHighlight =
      p.showMovement &&
      (p.walkSet.has(key) || p.paidWalkSet.has(key) || p.rangeSet.has(key));
    const isBaseCell = fill === pal.fill && stroke === pal.stroke && lineWidth === 1;

    if (isBaseCell) continue;

    ctx.beginPath();
    const corners = cellCorners(x, y, cellDrawRadius(cellSize));
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();

    if (fill !== "transparent" && fill !== "rgba(0,0,0,0)") {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (isMoveHighlight && fill !== pal.fill) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = lineWidth + 1;
      ctx.stroke();
    }

    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  drawMovementPathLayer(ctx, p);
}

export function drawMovementPathLayer(ctx: CanvasRenderingContext2D, p: GridDrawParams): void {
  if (!p.showMovement || p.pathCells.length < 2) return;

  const { cellSize, layout, pathDashPhase } = p;
  const ox = p.gridOx ?? layout.ox;
  const oy = p.gridOy ?? layout.oy;
  const pal =
    p.palette ?? resolveGridPalette(p.mapBackdropTone ?? "none");
  const stroke = pal.pathStroke;
  const glow = pal.pathGlow;

  const points = p.pathCells.map((cell) => {
    const { x, y } = axialToPixel(cell.q, cell.r, cellSize, ox, oy);
    return { x, y };
  });

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = glow;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  const dashLen = 10;
  const gapLen = 7;
  ctx.setLineDash([dashLen, gapLen]);
  ctx.lineDashOffset = -pathDashPhase * (dashLen + gapLen);

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

type TokenDrawParams = {
  scene: BattleScene;
  layout: CanvasLayout;
  gridOx?: number;
  gridOy?: number;
  gridCellSize?: number;
  images: Map<string, HTMLImageElement>;
  focusByTokenId: Map<string, PortraitFocus>;
  selectedId: string | null;
  turnActiveId: string | null;
  attackableIds: Set<string>;
  rangeTargetIds?: Set<string>;
  spellPickedTargetIds?: Set<string>;
  hoverAttackTargetId: string | null;
  hoverTokenId: string | null;
  /** 1 → 1.1 animado no token sob o cursor */
  tokenHoverScale?: number;
  tokenAnimTimeSec: number;
  tokenFlash: { tokenId: string; kind: TokenFlashKind } | null;
  tokenCastFx?: ActiveTokenCastFx[];
  castFxNowMs?: number;
  /** Posição visual (pode ser fracionária durante animação) */
  tokenPositionOverride?: Map<string, { q: number; r: number }>;
  tokenHpDisplay?: Map<string, TokenHpDisplay>;
  roomSettings?: Pick<RoomSettings, "showUsernameOnTokenNameplate">;
  roomActors?: Record<string, RoomActor>;
  ownerDisplayNames?: Map<string, string>;
};

function drawSingleToken(
  ctx: CanvasRenderingContext2D,
  p: TokenDrawParams,
  token: BattleScene["tokens"][number],
  playerActorIds: string[],
  size: number,
  ox: number,
  oy: number,
  hoverScale: number
): void {
  const { layout } = p;
  const rawPos = p.tokenPositionOverride?.get(token.id) ?? token.axial;
  const q = Number(rawPos.q);
  const rCoord = Number(rawPos.r);
  if (!Number.isFinite(q) || !Number.isFinite(rCoord)) return;
  const pos = { q, r: rCoord };
  const creatureSize = creatureSizeOf(token);
  const { x, y } = tokenPixelCenter(pos, creatureSize, size, ox, oy);
  const r = tokenDrawRadius(size, creatureSize);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(r) || r <= 0) return;

  ctx.save();
  if (hoverScale !== 1) {
    ctx.translate(x, y);
    ctx.scale(hoverScale, hoverScale);
    ctx.translate(-x, -y);
  }

  if (creatureSize !== "small" && creatureSize !== "medium") {
      ctx.save();
      const isLargeFootprint = creatureSize === "large";
      for (const cell of occupiedCells(pos, creatureSize)) {
        const { x: hx, y: hy } = axialToPixel(cell.q, cell.r, size, ox, oy);
        const corners = cellCorners(hx, hy, size * 0.92);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath();
        ctx.fillStyle = isLargeFootprint ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)";
        ctx.fill();
        ctx.strokeStyle = isLargeFootprint ? "rgba(201,169,98,0.38)" : "rgba(201,169,98,0.22)";
        ctx.lineWidth = isLargeFootprint ? 1.35 : 1;
        ctx.stroke();
      }
      ctx.restore();
    }
    const img = p.images.get(token.id);
    const focus = p.focusByTokenId.get(token.id) ?? DEFAULT_PORTRAIT_FOCUS;
    const ringStyle = resolveTokenRing(token, playerActorIds);
    const hpLayout = hpRingLayout(r, ringStyle);
    const hpVis = p.tokenHpDisplay?.get(token.id);
    const showHpBar = Boolean(hpVis?.bar && token.vidaMax != null && token.vida != null);
    const portraitR = showHpBar ? hpLayout.contentRFull : r;
    const defeated = isTokenDefeated(token);

    if (token.id === p.turnActiveId) {
      drawTurnActiveIndicator(ctx, x, y, r, p.tokenAnimTimeSec);
    }

    if (img?.complete && img.naturalWidth > 0) {
      drawCircularTokenImage(ctx, img, x, y, portraitR, focus);
    } else {
      drawTokenPlaceholder(ctx, x, y, portraitR, token.color, token.name);
    }

    if (defeated) {
      drawTokenDefeatedOverlay(ctx, x, y, portraitR);
    }

    drawTokenIdentityRings(ctx, x, y, portraitR, ringStyle);

    if (showHpBar) {
      const ratio = hpRatio(token);
      drawTokenHpSegments(ctx, x, y, hpLayout, ratio, hpBarColor(ratio));
    }

    if (defeated) {
      drawTokenDefeatedSkull(ctx, x, y, r);
    }

    const castFxList = p.tokenCastFx?.filter((fx) => fx.tokenId === token.id) ?? [];
    const nowMs = p.castFxNowMs ?? Date.now();
    for (const fx of castFxList) {
      drawTokenCastFx(ctx, x, y, r, fx.kind, nowMs - fx.startedAt, fx.durationMs);
    }

    if (p.tokenFlash?.tokenId === token.id) {
      const flashColor =
        p.tokenFlash.kind === "crit"
          ? "rgba(232,160,32,0.95)"
          : p.tokenFlash.kind === "heal"
            ? "rgba(80,220,140,0.92)"
            : p.tokenFlash.kind === "hit"
              ? "rgba(200,80,60,0.9)"
              : "rgba(140,140,160,0.85)";
      ctx.beginPath();
      ctx.arc(x, y, r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = p.tokenFlash.kind === "crit" ? 4 : 3;
      ctx.stroke();
    }

    if (token.id === p.selectedId) {
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = readThemeColor("--vtt-token-ring-selected", "#c9a962");
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (p.spellPickedTargetIds?.has(token.id)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(184, 146, 46, 0.92)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    const inRange =
      p.attackableIds.has(token.id) ||
      (p.rangeTargetIds?.has(token.id) ?? false);
    if (inRange) {
      if (token.id === p.hoverAttackTargetId && p.attackableIds.has(token.id)) {
        drawAttackTargetFocus(ctx, x, y, r, p.tokenAnimTimeSec);
      } else if (p.attackableIds.has(token.id)) {
        drawAttackableHint(ctx, x, y, r, p.tokenAnimTimeSec);
      } else {
        drawRangeTargetHint(ctx, x, y, r, p.tokenAnimTimeSec);
      }
    }

    const showUsernamePlate = p.roomSettings?.showUsernameOnTokenNameplate ?? false;
    const isHovered = p.hoverTokenId === token.id;
    if (
      shouldDrawTokenNameplate(token, {
        showUsernameOnTokenNameplate: showUsernamePlate,
        hovered: isHovered,
      })
    ) {
      const useDual =
        showUsernamePlate &&
        token.linked &&
        !token.monsterEntryId &&
        token.actorId &&
        p.roomActors &&
        p.ownerDisplayNames;
      if (useDual) {
        const ownerId = p.roomActors![token.actorId!]?.ownerId;
        const username = ownerId ? p.ownerDisplayNames!.get(ownerId) : null;
        if (username) {
          drawDualTokenNameLabel(ctx, x, y, r, username, token.name);
        } else {
          drawTokenNameLabel(ctx, x, y, r, token.name);
        }
      } else {
        drawTokenNameLabel(ctx, x, y, r, token.name);
      }
    }

  drawTokenEffectBadges(ctx, x, y, r, token);
  ctx.restore();
}

export function drawTokensLayer(ctx: CanvasRenderingContext2D, p: TokenDrawParams): void {
  const { scene, layout } = p;
  const playerActorIds = collectPlayerActorIds(scene.tokens);
  const size =
    p.gridCellSize ??
    (Number.isFinite(scene.cellSize) && scene.cellSize > 0 ? scene.cellSize : 36);
  const ox = p.gridOx ?? layout.ox;
  const oy = p.gridOy ?? layout.oy;
  const hoverId = p.hoverTokenId;
  const hoverScale = p.tokenHoverScale ?? 1;

  for (const token of scene.tokens) {
    if (token.id === hoverId) continue;
    drawSingleToken(ctx, p, token, playerActorIds, size, ox, oy, 1);
  }

  if (hoverId) {
    const hovered = scene.tokens.find((t) => t.id === hoverId);
    if (hovered) {
      drawSingleToken(ctx, p, hovered, playerActorIds, size, ox, oy, hoverScale);
    }
  }
}
