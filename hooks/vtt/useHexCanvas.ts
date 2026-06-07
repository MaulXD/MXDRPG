"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  applyBattlefieldViewTransform,
  type BattlefieldView,
} from "@/lib/vtt/battlefield-view";
import type { Axial } from "@/lib/vtt/hex-math";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import {
  drawBattlefieldBackground,
  drawHexGridLayer,
  drawTokensLayer,
  prepareBattlefieldCanvas,
} from "@/lib/vtt/draw-battlefield";
import { drawDungeonLayer } from "@/lib/vtt/draw-dungeon-layer";
import { drawMapMarkupLayer } from "@/lib/vtt/draw-map-markup";
import { drawFloorEditOverlay } from "@/lib/vtt/floor-edit";
import { drawMeasureLayer } from "@/lib/vtt/draw-measure";
import { drawFogLayer, drawMapImageLayer, drawPingLayer } from "@/lib/vtt/draw-map-overlay";
import type { MeasurePreview } from "@/lib/vtt/map-toolbar";
import { pruneMapMarkups } from "@/lib/vtt/map-markup";
import type { MapMarkup } from "@/lib/vtt/types";
import type { BattlePing } from "@/lib/vtt/types";
import type { TokenFlashKind } from "@/lib/vtt/draw-battlefield";
import { isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import type { MoveCheck } from "@/lib/vtt/movement";
import type { TargetCombatPreview } from "@/lib/combat/hit-chance";
import type { TokenHpDisplay } from "@/lib/vtt/token-hp-display";
import type { ActiveTokenCastFx } from "@/lib/vtt/token-cast-fx";
import { resolveHexPalette } from "@/lib/vtt/hex-highlight-palette";
import type { MapBackdropTone } from "@/lib/vtt/map-luminance";
import type { BattleScene } from "@/lib/vtt/types";

export type HexCanvasDrawState = {
  scene: BattleScene;
  gridCells: Axial[];
  showMovement: boolean;
  turnMovePreview: boolean;
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
  focusByTokenId: Map<string, PortraitFocus>;
  selectedId: string | null;
  turnActiveId: string | null;
  attackableIds: Set<string>;
  spellPickedTargetIds?: Set<string>;
  hoverAttackTargetId: string | null;
  attackTargetPreview: TargetCombatPreview | null;
  hoverTurnMoveTokenId: string | null;
  tokenFlash: { tokenId: string; kind: TokenFlashKind } | null;
  tokenCastFx?: ActiveTokenCastFx[];
  castFxNowMs?: number;
  visibleHexSet: Set<string> | null;
  pings: BattlePing[];
  mapImage: HTMLImageElement | null;
  mapBackdropTone?: MapBackdropTone;
  tokenHpDisplay: Map<string, TokenHpDisplay>;
  dungeonEditorActive?: boolean;
  floorEditActive?: boolean;
  dungeonEditorTool?: "wall" | "object" | null;
  selectedDungeonObjectId?: string | null;
  mapMarkups?: MapMarkup[];
  markupPreview?: MapMarkup | null;
  selectedMarkupId?: string | null;
  measurePreview?: MeasurePreview | null;
};

export type TokenMoveAnimRef = RefObject<{
  tokenId: string;
  q: number;
  r: number;
} | null>;

export function useHexCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  wrapRef: RefObject<HTMLDivElement | null>,
  imagesRef: RefObject<Map<string, HTMLImageElement>>,
  state: HexCanvasDrawState,
  imgTick: number,
  moveAnimRef?: TokenMoveAnimRef,
  view: BattlefieldView = { scale: 1, panX: 0, panY: 0 }
) {
  const stateRef = useRef(state);
  stateRef.current = state;

  const [themeTick, setThemeTick] = useState(0);
  const pathDashPhaseRef = useRef(0);
  const tokenAnimTimeSecRef = useRef(0);
  const frameAnimRef = useRef<number | null>(null);

  const needsCanvasAnimation = useCallback((s: HexCanvasDrawState) => {
    return (
      Boolean(s.turnActiveId) ||
      s.attackableIds.size > 0 ||
      Boolean(s.hoverAttackTargetId) ||
      Boolean(s.hoverTurnMoveTokenId) ||
      s.turnMovePreview ||
      (s.pathCells?.length ?? 0) >= 2 ||
      (s.pings?.length ?? 0) > 0 ||
      (pruneMapMarkups(s.mapMarkups ?? []).length ?? 0) > 0 ||
      Boolean(s.markupPreview) ||
      Boolean(s.measurePreview) ||
      (s.tokenCastFx?.length ?? 0) > 0 ||
      Boolean(moveAnimRef?.current)
    );
  }, [moveAnimRef]);

  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("eldarin-theme-change", onTheme);
    return () => window.removeEventListener("eldarin-theme-change", onTheme);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const layout = prepareBattlefieldCanvas(canvas, wrapRef.current);
    if (!layout) return false;

    const s = stateRef.current;
    drawBattlefieldBackground(ctx, layout.w, layout.h);

    ctx.save();
    applyBattlefieldViewTransform(ctx, layout.w, layout.h, view);

    const mapImg = s.mapImage;
    if (mapImg?.complete && mapImg.naturalWidth > 0) {
      drawMapImageLayer(ctx, mapImg, s.scene, layout);
      if (s.floorEditActive) {
        drawFloorEditOverlay(ctx, mapImg, s.scene, layout, view.scale);
      }
    }

    const hexPalette = resolveHexPalette(s.mapBackdropTone ?? "none");
    drawHexGridLayer(ctx, {
      gridCells: s.gridCells,
      hexSize: s.scene.hexSize,
      layout,
      showMovement: s.showMovement,
      turnMovePreview: s.turnMovePreview,
      walkSet: s.walkSet,
      paidWalkSet: s.paidWalkSet,
      rangeSet: s.rangeSet,
      actionMode: s.actionMode,
      attackRangeSet: s.attackRangeSet,
      isAreaSpellMode: s.isAreaSpellMode,
      areaPreviewSet: s.areaPreviewSet,
      areaDirectionSet: s.areaDirectionSet,
      hoverAxial: s.hoverAxial,
      hoverMovePreview: s.hoverMovePreview,
      spawnDropHover: s.spawnDropHover,
      pathCells: s.pathCells,
      pathDashPhase: pathDashPhaseRef.current,
      visibleHexSet: s.visibleHexSet,
      mapBackdropTone: s.mapBackdropTone,
      palette: hexPalette,
    });

    drawDungeonLayer(ctx, s.scene, s.scene.hexSize, layout, {
      hoverAxial: s.dungeonEditorActive ? s.hoverAxial : null,
      editorPreviewKind:
        s.dungeonEditorActive && (s.dungeonEditorTool === "wall" || s.dungeonEditorTool === "object")
          ? s.dungeonEditorTool
          : null,
      selectedObjectId: s.selectedDungeonObjectId ?? null,
      visibleHexSet: s.visibleHexSet,
    });

    drawFogLayer(ctx, s.gridCells, s.scene, s.scene.hexSize, layout, s.visibleHexSet);

    const markups = pruneMapMarkups(s.mapMarkups ?? s.scene.mapMarkups ?? []);
    if (markups.length > 0 || s.markupPreview) {
      drawMapMarkupLayer(ctx, markups, {
        preview: s.markupPreview ?? null,
        selectedId: s.selectedMarkupId ?? null,
      });
    }

    if (s.measurePreview) {
      drawMeasureLayer(ctx, s.measurePreview);
    }

    const moveAnim = moveAnimRef?.current;
    const tokenPositionOverride = moveAnim
      ? new Map([[moveAnim.tokenId, { q: moveAnim.q, r: moveAnim.r }]])
      : undefined;

    drawTokensLayer(ctx, {
      scene: s.scene,
      layout,
      images: imagesRef.current,
      focusByTokenId: s.focusByTokenId,
      selectedId: s.selectedId,
      turnActiveId: s.turnActiveId,
      attackableIds: s.attackableIds,
      spellPickedTargetIds: s.spellPickedTargetIds,
      hoverAttackTargetId: s.hoverAttackTargetId,
      attackTargetPreview: s.attackTargetPreview,
      hoverTurnMoveTokenId: s.hoverTurnMoveTokenId,
      tokenAnimTimeSec: tokenAnimTimeSecRef.current,
      tokenFlash: s.tokenFlash,
      tokenCastFx: s.tokenCastFx,
      castFxNowMs: s.castFxNowMs,
      tokenPositionOverride,
      tokenHpDisplay: s.tokenHpDisplay ?? new Map(),
    });

    if (s.pings.length > 0) {
      drawPingLayer(ctx, s.pings, s.scene.hexSize, layout);
    }

    ctx.restore();
    return true;
  }, [canvasRef, wrapRef, imagesRef, imgTick, themeTick, moveAnimRef, view]);

  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const stopLoop = () => {
      if (frameAnimRef.current != null) {
        cancelAnimationFrame(frameAnimRef.current);
        frameAnimRef.current = null;
      }
    };

    if (!needsCanvasAnimation(state)) {
      stopLoop();
      drawRef.current();
      return stopLoop;
    }

    const loop = (t: number) => {
      const sec = t / 1000;
      pathDashPhaseRef.current = sec % 1;
      tokenAnimTimeSecRef.current = sec;
      drawRef.current();
      if (needsCanvasAnimation(stateRef.current)) {
        frameAnimRef.current = requestAnimationFrame(loop);
      } else {
        frameAnimRef.current = null;
        drawRef.current();
      }
    };
    frameAnimRef.current = requestAnimationFrame(loop);
    return stopLoop;
  }, [
    state.turnActiveId,
    state.hoverAttackTargetId,
    state.hoverTurnMoveTokenId,
    state.turnMovePreview,
    state.attackableIds,
    state.pathCells,
    state.pings,
    state.mapMarkups,
    state.markupPreview,
    state.selectedMarkupId,
    state.tokenCastFx,
    needsCanvasAnimation,
  ]);

  useLayoutEffect(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw, wrapRef, view.scale, view.panX, view.panY]);

  useEffect(() => {
    const t1 = requestAnimationFrame(() => draw());
    const t2 = setTimeout(() => draw(), 50);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
    };
  }, [draw]);

  return { draw, redraw: () => drawRef.current() };
}
