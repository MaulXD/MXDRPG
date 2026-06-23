"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import {
  applyBattlefieldViewTransform,
  type BattlefieldView,
} from "@/lib/vtt/battlefield-view";
import type { Axial } from "@/lib/vtt/grid-math";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import {
  drawBattlefieldBackground,
  drawCellGridLayer,
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
import type { TokenHpDisplay } from "@/lib/vtt/token-hp-display";
import type { ActiveTokenCastFx } from "@/lib/vtt/token-cast-fx";
import { buildCellGrid, displayGridRadius } from "@/lib/vtt/grid-cells";
import {
  resolveMapAlignedGridLayout,
} from "@/lib/vtt/grid-layout";
import { resolveGridPalette } from "@/lib/vtt/grid-highlight-palette";
import type { MapBackdropTone } from "@/lib/vtt/map-luminance";
import type { BattleScene } from "@/lib/vtt/types";

export type GridCanvasDrawState = {
  scene: BattleScene;
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
  spawnDropFootprintKeys?: Set<string> | null;
  spawnDropInvalid?: boolean;
  moveHoverFootprintKeys?: Set<string> | null;
  pathCells: Axial[];
  focusByTokenId: Map<string, PortraitFocus>;
  selectedId: string | null;
  turnActiveId: string | null;
  attackableIds: Set<string>;
  rangeTargetIds?: Set<string>;
  spellPickedTargetIds?: Set<string>;
  hoverAttackTargetId: string | null;
  hoverTokenId: string | null;
  tokenFlash: { tokenId: string; kind: TokenFlashKind } | null;
  tokenCastFx?: ActiveTokenCastFx[];
  castFxNowMs?: number;
  visibleCellSet: Set<string> | null;
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
  roomSettings?: Pick<import("@/lib/room/settings").RoomSettings, "showUsernameOnTokenNameplate">;
  roomActors?: Record<string, import("@/lib/room/types").RoomActor>;
  ownerDisplayNames?: Map<string, string>;
};

export type TokenMoveAnimRef = RefObject<{
  tokenId: string;
  q: number;
  r: number;
} | null>;

export function useGridCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  wrapRef: RefObject<HTMLDivElement | null>,
  imagesRef: RefObject<Map<string, HTMLImageElement>>,
  state: GridCanvasDrawState,
  imgTick: number,
  moveAnimRef?: TokenMoveAnimRef,
  viewRef?: RefObject<BattlefieldView>,
  subscribeViewDraw?: (fn: () => void) => () => void
) {
  const stateRef = useRef(state);
  stateRef.current = state;

  const pathDashPhaseRef = useRef(0);
  const tokenAnimTimeSecRef = useRef(0);
  const tokenHoverScaleRef = useRef(1);
  const lastAnimFrameMsRef = useRef(0);
  const lastDrawFrameMsRef = useRef(0);
  const frameAnimRef = useRef<number | null>(null);

  const TOKEN_HOVER_SCALE = 1.1;
  /** ~30 fps — anéis de turno/alvo não precisam de 60 fps e aliviam CPU/GPU. */
  const ANIM_FRAME_MIN_MS = 33;

  const needsCanvasAnimation = useCallback((s: GridCanvasDrawState) => {
    const hoverTarget = s.hoverTokenId ? TOKEN_HOVER_SCALE : 1;
    if (Math.abs(tokenHoverScaleRef.current - hoverTarget) > 0.004) return true;
    return (
      Boolean(s.hoverTokenId) ||
      Boolean(s.turnActiveId) ||
      s.attackableIds.size > 0 ||
      (s.rangeTargetIds?.size ?? 0) > 0 ||
      Boolean(s.hoverAttackTargetId) ||
      s.turnMovePreview ||
      (s.pathCells?.length ?? 0) >= 2 ||
      (s.pings?.length ?? 0) > 0 ||
      (pruneMapMarkups(s.mapMarkups ?? []).length ?? 0) > 0 ||
      Boolean(s.markupPreview) ||
      Boolean(s.measurePreview) ||
      (s.tokenCastFx?.length ?? 0) > 0
    );
  }, [moveAnimRef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const layout = prepareBattlefieldCanvas(canvas, wrapRef.current);
    if (!layout) return false;

    const s = stateRef.current;
    drawBattlefieldBackground(ctx, layout.w, layout.h);

    const view = viewRef?.current ?? { scale: 1, panX: 0, panY: 0 };

    ctx.save();
    applyBattlefieldViewTransform(ctx, layout.w, layout.h, view);

    const grid = resolveMapAlignedGridLayout(s.scene, layout.ox, layout.oy);

    const mapImg = s.mapImage;
    if (mapImg?.complete && mapImg.naturalWidth > 0) {
      drawMapImageLayer(ctx, mapImg, s.scene, layout);
      if (s.floorEditActive) {
        drawFloorEditOverlay(ctx, mapImg, s.scene, layout, view.scale);
      }
    }

    const gridPalette = resolveGridPalette(s.mapBackdropTone ?? "none");
    const gridCells = buildCellGrid(
      displayGridRadius(s.scene.gridRadius, layout.w, layout.h, grid.cellSize, view)
    );
    drawCellGridLayer(ctx, {
      gridCells,
      cellSize: grid.cellSize,
      gridOx: grid.ox,
      gridOy: grid.oy,
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
      spawnDropFootprintKeys: s.spawnDropFootprintKeys,
      spawnDropInvalid: s.spawnDropInvalid,
      moveHoverFootprintKeys: s.moveHoverFootprintKeys,
      pathCells: s.pathCells,
      pathDashPhase: pathDashPhaseRef.current,
      visibleCellSet: s.visibleCellSet,
      mapBackdropTone: s.mapBackdropTone,
      palette: gridPalette,
      viewScale: view.scale,
    });

    drawDungeonLayer(ctx, s.scene, grid.cellSize, layout, {
      hoverAxial: s.dungeonEditorActive ? s.hoverAxial : null,
      editorPreviewKind:
        s.dungeonEditorActive && (s.dungeonEditorTool === "wall" || s.dungeonEditorTool === "object")
          ? s.dungeonEditorTool
          : null,
      selectedObjectId: s.selectedDungeonObjectId ?? null,
      visibleCellSet: s.visibleCellSet,
      gridOx: grid.ox,
      gridOy: grid.oy,
    });

    drawFogLayer(
      ctx,
      gridCells,
      s.scene,
      grid.cellSize,
      layout,
      s.visibleCellSet,
      view.scale,
      grid.ox,
      grid.oy
    );

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
      gridOx: grid.ox,
      gridOy: grid.oy,
      gridCellSize: grid.cellSize,
      images: imagesRef.current,
      focusByTokenId: s.focusByTokenId,
      selectedId: s.selectedId,
      turnActiveId: s.turnActiveId,
      attackableIds: s.attackableIds,
      rangeTargetIds: s.rangeTargetIds,
      spellPickedTargetIds: s.spellPickedTargetIds,
      hoverAttackTargetId: s.hoverAttackTargetId,
      hoverTokenId: s.hoverTokenId,
      tokenHoverScale: tokenHoverScaleRef.current,
      tokenAnimTimeSec: tokenAnimTimeSecRef.current,
      tokenFlash: s.tokenFlash,
      tokenCastFx: s.tokenCastFx,
      castFxNowMs: s.castFxNowMs,
      tokenPositionOverride,
      tokenHpDisplay: s.tokenHpDisplay ?? new Map(),
      roomSettings: s.roomSettings,
      roomActors: s.roomActors,
      ownerDisplayNames: s.ownerDisplayNames,
    });

    if (s.pings.length > 0) {
      drawPingLayer(ctx, s.pings, grid.cellSize, layout, grid.ox, grid.oy);
    }

    ctx.restore();
    return true;
  }, [canvasRef, wrapRef, imagesRef, imgTick, moveAnimRef, viewRef]);

  const drawRef = useRef(draw);
  drawRef.current = draw;

  const viewDrawRafRef = useRef<number | null>(null);
  const scheduleViewDraw = useCallback(() => {
    if (viewDrawRafRef.current != null) return;
    viewDrawRafRef.current = requestAnimationFrame(() => {
      viewDrawRafRef.current = null;
      drawRef.current();
    });
  }, []);

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
      if (t - lastDrawFrameMsRef.current < ANIM_FRAME_MIN_MS) {
        frameAnimRef.current = requestAnimationFrame(loop);
        return;
      }
      lastDrawFrameMsRef.current = t;

      const sec = t / 1000;
      const prev = lastAnimFrameMsRef.current || t;
      const dt = Math.min(0.05, (t - prev) / 1000);
      lastAnimFrameMsRef.current = t;
      pathDashPhaseRef.current = sec % 1;
      tokenAnimTimeSecRef.current = sec;
      const hoverTarget = stateRef.current.hoverTokenId ? TOKEN_HOVER_SCALE : 1;
      tokenHoverScaleRef.current +=
        (hoverTarget - tokenHoverScaleRef.current) * Math.min(1, dt * 14);
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
    state.hoverTokenId,
    state.turnMovePreview,
    state.attackableIds,
    state.rangeTargetIds,
    state.pathCells,
    state.pings,
    state.mapMarkups,
    state.markupPreview,
    state.selectedMarkupId,
    state.tokenCastFx,
    needsCanvasAnimation,
  ]);

  useEffect(() => {
    if (!subscribeViewDraw) return;
    return subscribeViewDraw(scheduleViewDraw);
  }, [subscribeViewDraw, scheduleViewDraw]);

  useEffect(
    () => () => {
      if (viewDrawRafRef.current != null) {
        cancelAnimationFrame(viewDrawRafRef.current);
      }
    },
    []
  );

  useLayoutEffect(() => {
    let cancelled = false;
    let layoutRetries = 0;

    const scheduleLayoutDraw = () => {
      if (cancelled) return;
      const ok = drawRef.current();
      if (!ok && layoutRetries < 90) {
        layoutRetries += 1;
        requestAnimationFrame(scheduleLayoutDraw);
      }
    };

    scheduleLayoutDraw();

    const ro = new ResizeObserver(() => {
      layoutRetries = 0;
      drawRef.current();
    });
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (wrap) ro.observe(wrap);
    if (canvas) ro.observe(canvas);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [draw, wrapRef, canvasRef]);

  return { draw, redraw: () => drawRef.current() };
}
