import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexCorners } from "@/lib/vtt/hex-math";
import { hexToMeters, walkRemaining, type MoveCheck } from "@/lib/vtt/movement";
import { readThemeColor } from "@/lib/theme";
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
import type { TargetCombatPreview } from "@/lib/combat/hit-chance";
import {
  drawAttackableHint,
  drawAttackTargetFocus,
  drawTargetCombatPreviewLabel,
  drawTurnActiveIndicator,
} from "@/lib/vtt/draw-token-animations";
import { drawTokenEffectBadges } from "@/lib/vtt/draw-token-effects";
import {
  drawTokenDefeatedOverlay,
  drawTokenDefeatedSkull,
  drawTokenHpLabel,
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
};

export function drawHexGridLayer(ctx: CanvasRenderingContext2D, p: GridDrawParams): void {
  const { layout, hexSize } = p;
  const { ox, oy } = layout;

  for (const cell of p.gridCells) {
    const key = `${cell.q},${cell.r}`;
    if (p.visibleHexSet && !p.visibleHexSet.has(key)) continue;

    const { x, y } = axialToPixel(cell.q, cell.r, hexSize, ox, oy);
    let fill = readThemeColor("--vtt-hex-fill", "rgba(180,155,110,0.07)");
    let stroke = readThemeColor("--vtt-hex-stroke", "rgba(180,155,110,0.28)");
    let lineWidth = 1.5;

    if (p.showMovement && p.walkSet.has(key) && !p.paidWalkSet.has(key)) {
      if (p.turnMovePreview) {
        fill = readThemeColor("--vtt-hex-turn-walk-fill", "rgba(90,115,82,0.18)");
        stroke = readThemeColor("--vtt-hex-turn-walk-stroke", "rgba(120,150,95,0.5)");
      } else {
        fill = readThemeColor("--vtt-hex-walk-fill", "rgba(90,115,82,0.28)");
        stroke = readThemeColor("--vtt-hex-walk-stroke", "rgba(120,150,95,0.75)");
      }
    }
    if (p.showMovement && p.paidWalkSet.has(key)) {
      fill = readThemeColor("--vtt-hex-walk-paid-fill", "rgba(70,130,120,0.32)");
      stroke = readThemeColor("--vtt-hex-walk-paid-stroke", "rgba(100,180,165,0.85)");
    }
    if (p.showMovement && p.rangeSet.has(key) && !p.walkSet.has(key)) {
      fill = readThemeColor("--vtt-hex-run-fill", "rgba(184,134,11,0.22)");
      stroke = readThemeColor("--vtt-hex-run-stroke", "rgba(201,169,98,0.65)");
    }
    if (isTargetMode(p.actionMode) && p.attackRangeSet.has(key)) {
      fill = readThemeColor("--vtt-hex-attack-fill", "rgba(139,69,19,0.2)");
      stroke = readThemeColor("--vtt-hex-attack-stroke", "rgba(180,80,60,0.7)");
    }
    if (p.isAreaSpellMode && p.areaDirectionSet.has(key)) {
      fill = readThemeColor("--vtt-hex-dir-fill", "rgba(80,140,200,0.3)");
      stroke = readThemeColor("--vtt-hex-dir-stroke", "rgba(120,180,255,0.9)");
      lineWidth = 2;
    }
    if (p.isAreaSpellMode && p.areaPreviewSet.has(key)) {
      fill = readThemeColor("--vtt-hex-area-fill", "rgba(120,60,180,0.35)");
      stroke = readThemeColor("--vtt-hex-area-stroke", "rgba(180,120,255,0.85)");
    }
    if (
      p.isAreaSpellMode &&
      p.hoverAxial?.q === cell.q &&
      p.hoverAxial?.r === cell.r &&
      p.areaPreviewSet.has(key)
    ) {
      fill = readThemeColor("--vtt-hex-area-center-fill", "rgba(200,100,255,0.45)");
      stroke = readThemeColor("--vtt-hex-area-center-stroke", "#e8c4ff");
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
      fill = readThemeColor("--vtt-hex-invalid-fill", "rgba(160,50,50,0.35)");
      stroke = readThemeColor("--vtt-hex-invalid-stroke", "rgba(220,80,70,0.95)");
      lineWidth = 2.5;
    } else if (isHover && p.spawnDropHover) {
      fill = readThemeColor("--vtt-hex-spawn-fill", "rgba(90, 115, 82, 0.38)");
      stroke = readThemeColor("--vtt-hex-spawn-stroke", "rgba(184, 255, 60, 0.9)");
      lineWidth = 2.5;
    } else if (isHover) {
      stroke = readThemeColor("--vtt-hex-hover-stroke", "#c9a962");
      fill = readThemeColor("--vtt-hex-hover-fill", "rgba(201,169,98,0.18)");
    }

    ctx.beginPath();
    const corners = hexCorners(x, y, hexSize - 2);
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (isHover && p.showMovement && p.hoverMovePreview) {
      ctx.fillStyle = readThemeColor("--vtt-token-text", "#e8e0d4");
      ctx.font = "600 9px Lora, Georgia, serif";
      ctx.textAlign = "center";
      if (p.hoverMovePreview.ok && p.hoverMovePreview.dist > 0) {
        const pa =
          p.hoverMovePreview.paCost > 0
            ? `PA +${p.hoverMovePreview.paCost}`
            : "PA +0";
        ctx.fillText(`${p.hoverMovePreview.dist} hex · ${hexToMeters(p.hoverMovePreview.dist)} m`, x, y - 8);
        ctx.fillStyle = readThemeColor("--vtt-hex-walk-paid-stroke", "rgba(100,180,165,0.95)");
        ctx.fillText(pa, x, y + 4);
      } else if (!p.hoverMovePreview.ok) {
        ctx.fillStyle = readThemeColor("--vtt-hex-invalid-stroke", "rgba(220,80,70,0.95)");
        ctx.fillText(p.hoverMovePreview.reason ?? "Inválido", x, y + 4);
      }
    }
  }

  drawMovementPathLayer(ctx, p);
}

export function drawMovementPathLayer(ctx: CanvasRenderingContext2D, p: GridDrawParams): void {
  if (!p.showMovement || p.pathCells.length < 2) return;

  const { hexSize, layout, pathDashPhase } = p;
  const stroke = readThemeColor("--vtt-path-stroke", "rgba(201,169,98,0.92)");
  const glow = readThemeColor("--vtt-path-glow", "rgba(120,180,95,0.35)");

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
  hoverAttackTargetId: string | null;
  attackTargetPreview: TargetCombatPreview | null;
  hoverTurnMoveTokenId: string | null;
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
    const hpLayout = hpRingLayout(r);
    const defeated = isTokenDefeated(token);

    if (token.id === p.turnActiveId) {
      drawTurnActiveIndicator(ctx, x, y, r, p.tokenAnimTimeSec);
    }

    drawTokenDropShadow(ctx, x, y, r);

    if (img?.complete && img.naturalWidth > 0) {
      drawCircularTokenImage(ctx, img, x, y, hpLayout.contentR, focus);
    } else {
      drawTokenPlaceholder(ctx, x, y, hpLayout.contentR, token.color, token.name);
    }

    if (defeated) {
      drawTokenDefeatedOverlay(ctx, x, y, hpLayout.contentR);
    }

    const hpVis = p.tokenHpDisplay?.get(token.id);
    if (hpVis?.bar && token.vidaMax != null && token.vida != null) {
      const ratio = hpRatio(token);
      const color = hpBarColor(ratio);
      drawTokenHpSegments(ctx, x, y, hpLayout, ratio, color);
      if (hpVis.numeric) {
        drawTokenHpLabel(ctx, x, y, hpLayout.contentR, token, color);
      }
    }

    drawTokenIdentityRings(ctx, x, y, hpLayout.identityBase, ringStyle);

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
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = readThemeColor("--vtt-token-ring-selected", "#c9a962");
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    if (p.attackableIds.has(token.id)) {
      if (token.id === p.hoverAttackTargetId) {
        drawAttackTargetFocus(ctx, x, y, r, p.tokenAnimTimeSec);
        if (p.attackTargetPreview) {
          drawTargetCombatPreviewLabel(ctx, x, y, r, p.attackTargetPreview);
        }
      } else {
        drawAttackableHint(ctx, x, y, r, p.tokenAnimTimeSec);
      }
    }

    if (token.id === p.hoverTurnMoveTokenId) {
      const walk = walkRemaining(token);
      const label = `${walk} hex`;
      const sub = hexToMeters(walk) + " m";
      const bx = x;
      const by = y - r - 28;
      ctx.save();
      ctx.font = "600 10px Lora, Georgia, serif";
      ctx.textAlign = "center";
      const tw = Math.max(ctx.measureText(label).width, ctx.measureText(sub).width) + 14;
      ctx.fillStyle = "rgba(8, 10, 8, 0.82)";
      ctx.strokeStyle = "rgba(120, 150, 95, 0.75)";
      ctx.lineWidth = 1;
      const rx = bx - tw / 2;
      const ry = by - 10;
      const rh = 22;
      ctx.beginPath();
      ctx.roundRect(rx, ry, tw, rh, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = readThemeColor("--vtt-hex-walk-stroke", "rgba(160,200,140,0.95)");
      ctx.fillText(label, bx, ry + 9);
      ctx.font = "500 8px Lora, Georgia, serif";
      ctx.fillStyle = "rgba(232, 226, 214, 0.65)";
      ctx.fillText(sub, bx, ry + 18);
      ctx.restore();
    }

    const hpVisName = p.tokenHpDisplay?.get(token.id);
    const hpOnToken = hpVisName?.numeric && token.vidaMax != null && token.vida != null;
    if (!hpOnToken) {
      ctx.save();
      ctx.fillStyle = readThemeColor("--vtt-token-text", "#e8e0d4");
      ctx.font = "600 12px Lora, Georgia, serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 5;
      ctx.fillText(token.name, x, y + r + 14);
      ctx.restore();
    }

    drawTokenEffectBadges(ctx, x, y, r, token);
  }
}
