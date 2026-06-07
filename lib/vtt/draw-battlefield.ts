import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexCorners, hexDrawRadius } from "@/lib/vtt/hex-math";
import { hexToMeters, walkRemaining, type MoveCheck } from "@/lib/vtt/movement";
import { readThemeColor } from "@/lib/theme";
import {
  resolveHexPalette,
  type HexHighlightPalette,
} from "@/lib/vtt/hex-highlight-palette";
import type { MapBackdropTone } from "@/lib/vtt/map-luminance";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import { DEFAULT_PORTRAIT_FOCUS } from "@/lib/media/portrait-focus";
import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";
import {
  creatureSizeOf,
  occupiedHexes,
  tokenDrawRadius,
  tokenPixelCenter,
} from "@/lib/vtt/creature-size";
import {
  drawCircularTokenImage,
  drawTokenDropShadow,
  drawTokenIdentityRings,
  drawTokenPlaceholder,
} from "@/lib/vtt/token-canvas";
import {
  drawAttackableHint,
  drawAttackTargetFocus,
  drawTurnActiveIndicator,
} from "@/lib/vtt/draw-token-animations";
import { drawTokenEffectBadges } from "@/lib/vtt/draw-token-effects";
import {
  drawTokenDefeatedOverlay,
  drawTokenDefeatedSkull,
  drawTokenNameLabel,
  shouldDrawTokenNameplate,
  drawTokenWalkRemainingBadge,
  drawTokenHpSegments,
  hpBarColor,
  hpRatio,
  hpRingLayout,
  isTokenDefeated,
  type TokenHpDisplay,
} from "@/lib/vtt/token-hp-display";
import {
  drawTokenCastFx,
  type ActiveTokenCastFx,
} from "@/lib/vtt/token-cast-fx";
import { isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
export type TokenFlashKind = "hit" | "miss" | "crit";

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
  ctx.imageSmoothingQuality = "high";

  return { w, h, ox: w / 2, oy: h / 2, dpr };
}

export function drawBattlefieldBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, readThemeColor("--vtt-canvas-bg-0", "#1a1610"));
  bg.addColorStop(1, readThemeColor("--vtt-canvas-bg-1", "#0f0d0a"));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

type GridDrawParams = {
  gridCells: Axial[];
  hexSize: number;
  layout: CanvasLayout;
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
  pathCells: Axial[];
  pathDashPhase: number;
  /** null = todos os hexes visíveis (mestre ou fog desligado) */
  visibleHexSet: Set<string> | null;
  mapBackdropTone?: MapBackdropTone;
  palette?: HexHighlightPalette;
};

export function drawHexGridLayer(ctx: CanvasRenderingContext2D, p: GridDrawParams): void {
  const { layout, hexSize } = p;
  const { ox, oy } = layout;
  const pal =
    p.palette ?? resolveHexPalette(p.mapBackdropTone ?? "none");

  for (const cell of p.gridCells) {
    const key = `${cell.q},${cell.r}`;
    if (p.visibleHexSet && !p.visibleHexSet.has(key)) continue;

    const { x, y } = axialToPixel(cell.q, cell.r, hexSize, ox, oy);
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
    const isHover =
      p.hoverAxial?.q === cell.q && p.hoverAxial?.r === cell.r;
    if (
      isHover &&
      p.showMovement &&
      p.hoverMovePreview &&
      !p.hoverMovePreview.ok
    ) {
      fill = pal.invalidFill;
      stroke = pal.invalidStroke;
      lineWidth = 2.5;
    } else if (isHover && p.spawnDropHover) {
      fill = pal.spawnFill;
      stroke = pal.spawnStroke;
      lineWidth = 2.5;
    } else if (isHover) {
      stroke = pal.hoverStroke;
      fill = pal.hoverFill;
    }

    ctx.beginPath();
    const corners = hexCorners(x, y, hexDrawRadius(hexSize));
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    const isMoveHighlight =
      p.showMovement &&
      (p.walkSet.has(key) || p.paidWalkSet.has(key) || p.rangeSet.has(key));

    ctx.fillStyle = fill;
    ctx.fill();

    if (isMoveHighlight && fill !== pal.fill) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
      ctx.lineWidth = lineWidth + 1.5;
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

  const { hexSize, layout, pathDashPhase } = p;
  const pal =
    p.palette ?? resolveHexPalette(p.mapBackdropTone ?? "none");
  const stroke = pal.pathStroke;
  const glow = pal.pathGlow;

  const points = p.pathCells.map((cell) => {
    const { x, y } = axialToPixel(cell.q, cell.r, hexSize, layout.ox, layout.oy);
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
  images: Map<string, HTMLImageElement>;
  focusByTokenId: Map<string, PortraitFocus>;
  selectedId: string | null;
  turnActiveId: string | null;
  attackableIds: Set<string>;
  spellPickedTargetIds?: Set<string>;
  hoverAttackTargetId: string | null;
  hoverTurnMoveTokenId: string | null;
  hoverTokenId: string | null;
  tokenAnimTimeSec: number;
  tokenFlash: { tokenId: string; kind: TokenFlashKind } | null;
  tokenCastFx?: ActiveTokenCastFx[];
  castFxNowMs?: number;
  /** Posição visual (pode ser fracionária durante animação) */
  tokenPositionOverride?: Map<string, { q: number; r: number }>;
  tokenHpDisplay?: Map<string, TokenHpDisplay>;
};

export function drawTokensLayer(ctx: CanvasRenderingContext2D, p: TokenDrawParams): void {
  const { scene, layout } = p;
  const playerActorIds = collectPlayerActorIds(scene.tokens);
  const size = scene.hexSize;

  for (const token of scene.tokens) {
    const pos = p.tokenPositionOverride?.get(token.id) ?? token.axial;
    const creatureSize = creatureSizeOf(token);
    const { x, y } = tokenPixelCenter(pos, creatureSize, size, layout.ox, layout.oy);
    const r = tokenDrawRadius(size, creatureSize);

    if (creatureSize !== "small" && creatureSize !== "medium") {
      ctx.save();
      const isLargeTriangle = creatureSize === "large";
      for (const hex of occupiedHexes(pos, creatureSize)) {
        const { x: hx, y: hy } = axialToPixel(hex.q, hex.r, size, layout.ox, layout.oy);
        const corners = hexCorners(hx, hy, size * 0.92);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath();
        ctx.fillStyle = isLargeTriangle ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)";
        ctx.fill();
        ctx.strokeStyle = isLargeTriangle ? "rgba(201,169,98,0.38)" : "rgba(201,169,98,0.22)";
        ctx.lineWidth = isLargeTriangle ? 1.35 : 1;
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
    const portraitR = hpLayout.contentRFull;
    const defeated = isTokenDefeated(token);

    if (token.id === p.turnActiveId) {
      drawTurnActiveIndicator(ctx, x, y, r, p.tokenAnimTimeSec);
    }

    drawTokenDropShadow(ctx, x, y, r);

    if (img?.complete && img.naturalWidth > 0) {
      drawCircularTokenImage(ctx, img, x, y, portraitR, focus);
    } else {
      drawTokenPlaceholder(ctx, x, y, portraitR, token.color, token.name);
    }

    if (defeated) {
      drawTokenDefeatedOverlay(ctx, x, y, portraitR);
    }

    if (showHpBar) {
      const ratio = hpRatio(token);
      drawTokenHpSegments(ctx, x, y, hpLayout, ratio, hpBarColor(ratio));
    }

    drawTokenIdentityRings(ctx, x, y, hpLayout.identityBase, ringStyle, {
      skipOutermostRing: showHpBar,
      outerRingOffset: hpLayout.outerRingOffset,
    });

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
      ctx.strokeStyle = "rgba(122, 163, 201, 0.92)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    if (p.attackableIds.has(token.id)) {
      if (token.id === p.hoverAttackTargetId) {
        drawAttackTargetFocus(ctx, x, y, r, p.tokenAnimTimeSec);
      } else {
        drawAttackableHint(ctx, x, y, r, p.tokenAnimTimeSec);
      }
    }

    if (token.id === p.hoverTurnMoveTokenId) {
      const walk = walkRemaining(token);
      drawTokenWalkRemainingBadge(ctx, x, y, r, walk, hexToMeters(walk) + " m");
    }

    if (shouldDrawTokenNameplate(token, p.hoverTokenId)) {
      drawTokenNameLabel(ctx, x, y, r, token.name);
    }

    drawTokenEffectBadges(ctx, x, y, r, token);
  }
}
