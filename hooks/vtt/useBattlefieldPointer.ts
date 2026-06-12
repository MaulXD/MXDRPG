"use client";

import { useCallback, useRef, type RefObject } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexDirection, pixelToAxial } from "@/lib/vtt/hex-math";
import { areaNeedsDirection, areaUsesCasterOrigin, canCastAreaAt } from "@/lib/combat/area-spell";
import type { CombatActionOption } from "@/lib/combat/types";
import type { CharacterSheet } from "@/lib/character/types";
import { isMoveMode, isTargetMode } from "@/lib/vtt/action-mode";
import type { TokenActionMode } from "@/lib/vtt/action-mode";
import {
  canvasCenter,
  screenToWorld,
  worldToScreen,
  type BattlefieldView,
} from "@/lib/vtt/battlefield-view";
import {
  creatureSizeOf,
  isMultiHexCreatureSize,
  tokenHitRadius,
  tokenOccupiesAxial,
  tokenPixelCenter,
} from "@/lib/vtt/creature-size";
import type { DungeonEditLayer, DungeonEditorTool } from "@/components/vtt/DungeonEditorPanel";
import { dungeonObjectAt } from "@/lib/vtt/dungeon-layer";
import {
  floorOffsetForAnchoredScale,
  floorScaleFromHandleDrag,
  hitTestFloorHandle,
  pointInFloorRect,
  type FloorResizeHandle,
} from "@/lib/vtt/floor-edit";
import { computeMapImageRect } from "@/lib/vtt/draw-map-overlay";
import type { CanvasLayout } from "@/lib/vtt/draw-battlefield";
import type { WhiteboardTool } from "@/lib/vtt/map-markup";
import type { MapToolMode, MeasurePreview } from "@/lib/vtt/map-toolbar";
import { isMonsterToken } from "@/lib/room/settings";
import type { BattleScene, BattleToken, MapMarkup } from "@/lib/vtt/types";
import { effectiveBypassTurn } from "@/lib/combat/turn-guard";

type TurnCtx = {
  activeTokenId: string | null;
  bypassTurn: boolean;
  combatRound?: number;
  combatHasOrder?: boolean;
};

type Params = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scene: BattleScene;
  actorRacas?: Record<string, string | undefined>;
  tokenDrawPosition?: (token: BattleToken) => { q: number; r: number };
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  actionMode: TokenActionMode;
  activeCombatAction: CombatActionOption | null;
  attackableIds: Set<string>;
  rangeTargetIds?: Set<string>;
  hoverAxial: Axial | null;
  setHoverAxial: (a: Axial | null) => void;
  onHoverAxialChange?: (a: Axial | null) => void;
  onHoverTargetChange?: (tokenId: string | null) => void;
  onHoverTokenChange?: (tokenId: string | null) => void;
  /** Posição do ponteiro no canvas (px, py) — para mini HUD seguir o mouse. */
  onHoverPointerChange?: (pos: { x: number; y: number } | null) => void;
  /** Só atualiza célula sob o cursor quando o mapa precisa de preview (movimento, magia, etc.). */
  trackGridHover?: boolean;
  showMovement: boolean;
  isAreaSpellMode: boolean;
  needsAreaDirection: boolean;
  areaCenter: Axial | null;
  setAreaCenter: (a: Axial | null) => void;
  selected: BattleToken | null;
  selectedActor?: CharacterSheet | null;
  channelExtraPa?: number;
  turn: TurnCtx;
  canControlCombat: boolean;
  canRepositionToken?: (token: BattleToken) => boolean;
  onRepositionToken?: (tokenId: string, axial: Axial) => void;
  onGmDragPreview?: (tokenId: string, axial: Axial | null) => void;
  onAttack: (defenderId: string) => void;
  onMove: (axial: Axial) => void;
  onAreaSpell: (center: Axial, direction?: number) => void;
  onAreaSpellError: (msg: string) => void;
  onPing?: (axial: Axial) => void;
  onRevealHex?: (axial: Axial) => void;
  fogEnabled?: boolean;
  viewRef: RefObject<BattlefieldView>;
  /** Clique direito no token da vez → action ring */
  onActionRingRequest?: (token: BattleToken, clientX: number, clientY: number) => void;
  canOpenActionRing?: (token: BattleToken) => boolean;
  /** Clique direito num token que não pode abrir o anel (ex.: fora do turno). */
  onActionRingBlocked?: (token: BattleToken) => void;
  /** Jogador: abrir registro de combate do monstro. */
  onOpenMonsterKnowledge?: (token: BattleToken) => void;
  /** Mestre: abrir bestiário do dono do token de jogador. */
  onOpenPlayerBestiary?: (token: BattleToken) => void;
  canOpenPlayerBestiary?: (token: BattleToken) => boolean;
  dungeonEditor?: {
    layer: DungeonEditLayer;
    active: boolean;
    tool: DungeonEditorTool;
    selectedObjectId: string | null;
    onSelectObject: (id: string | null) => void;
    onHexEdit: (axial: Axial, dragObjectId?: string) => void;
    floorOffsetX?: number;
    floorOffsetY?: number;
    floorScale?: number;
    mapImage?: HTMLImageElement | null;
    onFloorDrag?: (offsetX: number, offsetY: number) => void;
    onFloorResize?: (scale: number, offsetX: number, offsetY: number) => void;
    onFloorDragEnd?: () => void;
  };
  whiteboard?: {
    active: boolean;
    tool: WhiteboardTool;
    markups: MapMarkup[];
    selectedId: string | null;
    hitTest: (wx: number, wy: number) => MapMarkup | null;
    onSelect: (id: string | null) => void;
    onPreview: (markup: MapMarkup | null) => void;
    onCommit: (markup: MapMarkup) => void;
    onMoveCommit: (id: string, dx: number, dy: number) => void;
    onErase: (id: string) => void;
    createMarkup: (
      kind: MapMarkup["kind"],
      points: { x: number; y: number }[],
      text?: string
    ) => MapMarkup;
    onTextRequest: (wx: number, wy: number) => void;
  };
  mapTools?: {
    mode: MapToolMode;
    onMeasurePreview: (preview: MeasurePreview | null) => void;
  };
};

export function useBattlefieldPointer({
  canvasRef,
  scene,
  actorRacas,
  tokenDrawPosition,
  selectedId,
  setSelectedId,
  actionMode,
  activeCombatAction,
  attackableIds,
  rangeTargetIds,
  setHoverAxial,
  onHoverAxialChange,
  onHoverTargetChange,
  showMovement,
  isAreaSpellMode: areaMode,
  needsAreaDirection,
  areaCenter,
  setAreaCenter,
  selected,
  selectedActor = null,
  channelExtraPa = 0,
  turn,
  canControlCombat,
  canRepositionToken,
  onRepositionToken,
  onGmDragPreview,
  onAttack,
  onMove,
  onAreaSpell,
  onAreaSpellError,
  onPing,
  onRevealHex,
  fogEnabled = false,
  viewRef,
  onActionRingRequest,
  canOpenActionRing,
  onActionRingBlocked,
  onOpenMonsterKnowledge,
  onOpenPlayerBestiary,
  canOpenPlayerBestiary,
  onHoverTokenChange,
  onHoverPointerChange,
  trackGridHover = false,
  dungeonEditor,
  whiteboard,
  mapTools,
}: Params) {
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);
  const gmDragRef = useRef<{
    tokenId: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const dungeonDragRef = useRef<{
    objectId: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const floorDragRef = useRef<{
    pointerId: number;
    startPx: number;
    startPy: number;
    baseOffX: number;
    baseOffY: number;
    dragging: boolean;
  } | null>(null);
  const floorResizeRef = useRef<{
    pointerId: number;
    startPx: number;
    startPy: number;
    handle: FloorResizeHandle;
    startRect: { x: number; y: number; w: number; h: number };
    startScale: number;
    startOffX: number;
    startOffY: number;
    dragging: boolean;
  } | null>(null);
  const lastHoverAxialKeyRef = useRef<string | null>(null);
  const lastHoverPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastHoverTokenIdRef = useRef<string | null>(null);

  const publishHoverAxial = useCallback(
    (axial: Axial | null) => {
      const key = axial ? `${axial.q},${axial.r}` : null;
      if (key === lastHoverAxialKeyRef.current) return;
      lastHoverAxialKeyRef.current = key;
      setHoverAxial(axial);
      onHoverAxialChange?.(axial);
    },
    [setHoverAxial, onHoverAxialChange]
  );

  const publishHoverPointer = useCallback(
    (pos: { x: number; y: number } | null) => {
      if (!onHoverPointerChange) return;
      if (!pos) {
        if (lastHoverPointerRef.current === null) return;
        lastHoverPointerRef.current = null;
        onHoverPointerChange(null);
        return;
      }
      const prev = lastHoverPointerRef.current;
      if (prev && Math.hypot(pos.x - prev.x, pos.y - prev.y) < 6) return;
      lastHoverPointerRef.current = pos;
      onHoverPointerChange(pos);
    },
    [onHoverPointerChange]
  );

  const wbDrawRef = useRef<{
    mode: "draw" | "move";
    startWx: number;
    startWy: number;
    startPx: number;
    startPy: number;
    points: { x: number; y: number }[];
    markupId?: string;
    originPoints?: { x: number; y: number }[];
    dragging: boolean;
    shapeCircle?: boolean;
  } | null>(null);
  const measureDragRef = useRef<{
    startWx: number;
    startWy: number;
    startPx: number;
    startPy: number;
    startAxial: Axial;
    dragging: boolean;
  } | null>(null);

  const canvasLayout = useCallback((canvas: HTMLCanvasElement): CanvasLayout => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { w, h, ox: w / 2, oy: h / 2, dpr };
  }, []);

  const boardCoords = useCallback(
    (px: number, py: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const world = screenToWorld(px, py, w, h, viewRef.current);
      const { ox, oy } = canvasCenter(w, h);
      return { world, ox, oy, w, h };
    },
    [canvasRef, viewRef]
  );

  const worldAtScreen = useCallback(
    (px: number, py: number): { x: number; y: number } | null => {
      const c = boardCoords(px, py);
      return c ? { x: c.world.x, y: c.world.y } : null;
    },
    [boardCoords]
  );

  const axialAtScreen = useCallback(
    (px: number, py: number): Axial | null => {
      const c = boardCoords(px, py);
      if (!c) return null;
      return pixelToAxial(c.world.x, c.world.y, scene.hexSize, c.ox, c.oy);
    },
    [boardCoords, scene.hexSize]
  );

  const tokenSizeOf = useCallback(
    (token: BattleToken) =>
      creatureSizeOf(token, token.actorId ? actorRacas?.[token.actorId] : undefined),
    [actorRacas]
  );

  const tokenAtPoint = useCallback(
    (px: number, py: number): BattleToken | null => {
      const c = boardCoords(px, py);
      if (!c) return null;
      let best: { token: BattleToken; dist: number } | null = null;
      for (const token of scene.tokens) {
        const pos = tokenDrawPosition?.(token) ?? token.axial;
        const size = tokenSizeOf(token);
        const r = tokenHitRadius(scene.hexSize, size);
        const { x, y } = tokenPixelCenter(pos, size, scene.hexSize, c.ox, c.oy);
        const dist = Math.hypot(c.world.x - x, c.world.y - y);
        if (dist < r && (!best || dist < best.dist)) {
          best = { token, dist };
        }
      }
      return best?.token ?? null;
    },
    [boardCoords, scene.hexSize, scene.tokens, tokenDrawPosition, tokenSizeOf]
  );

  const tokenAtAxial = useCallback(
    (axial: Axial): BattleToken | null => {
      let best: { token: BattleToken; dist: number } | null = null;
      for (const token of scene.tokens) {
        const pos = tokenDrawPosition?.(token) ?? token.axial;
        const size = tokenSizeOf(token);
        const matches = isMultiHexCreatureSize(size)
          ? pos.q === axial.q && pos.r === axial.r
          : tokenOccupiesAxial(
              { ...token, axial: pos },
              axial,
              token.actorId ? actorRacas?.[token.actorId] : undefined
            );
        if (!matches) continue;
        const dist = Math.abs(axial.q - pos.q) + Math.abs(axial.r - pos.r);
        if (!best || dist < best.dist) best = { token, dist };
      }
      return best?.token ?? null;
    },
    [scene.tokens, tokenDrawPosition, tokenSizeOf, actorRacas]
  );

  const tokenScreenCenter = useCallback(
    (token: BattleToken): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const c = boardCoords(0, 0);
      if (!c) return null;
      const pos = tokenDrawPosition?.(token) ?? token.axial;
      const size = tokenSizeOf(token);
      const { x, y } = tokenPixelCenter(pos, size, scene.hexSize, c.ox, c.oy);
      const screen = worldToScreen(x, y, c.w, c.h, viewRef.current);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + screen.x, y: rect.top + screen.y };
    },
    [canvasRef, boardCoords, tokenDrawPosition, scene.hexSize, viewRef, tokenSizeOf]
  );

  const pointerPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { px: 0, py: 0 };
      const rect = canvas.getBoundingClientRect();
      return { px: e.clientX - rect.left, py: e.clientY - rect.top };
    },
    [canvasRef]
  );

  const reportHoverTarget = useCallback(
    (px: number, py: number) => {
      const hoverToken = tokenAtPoint(px, py);
      const inRange =
        hoverToken &&
        selectedId &&
        (attackableIds.has(hoverToken.id) || rangeTargetIds?.has(hoverToken.id));
      const id = inRange ? hoverToken!.id : null;
      onHoverTargetChange?.(id);
    },
    [tokenAtPoint, selectedId, attackableIds, rangeTargetIds, onHoverTargetChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { px, py } = pointerPos(e);
      clickStartRef.current = { x: px, y: py };

      if (whiteboard?.active) {
        const world = worldAtScreen(px, py);
        if (!world) return;

        if (whiteboard.tool === "select") {
          const hit = whiteboard.hitTest(world.x, world.y);
          if (hit) {
            whiteboard.onSelect(hit.id);
            wbDrawRef.current = {
              mode: "move",
              startWx: world.x,
              startWy: world.y,
              startPx: px,
              startPy: py,
              points: [],
              markupId: hit.id,
              originPoints: hit.points.map((p) => ({ ...p })),
              dragging: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          whiteboard.onSelect(null);
          return;
        }

        if (
          whiteboard.tool === "pen" ||
          whiteboard.tool === "line" ||
          whiteboard.tool === "arrow" ||
          whiteboard.tool === "shape" ||
          whiteboard.tool === "circle"
        ) {
          const shapeCircle =
            whiteboard.tool === "circle" || (whiteboard.tool === "shape" && e.altKey);
          wbDrawRef.current = {
            mode: "draw",
            startWx: world.x,
            startWy: world.y,
            startPx: px,
            startPy: py,
            points: [{ x: world.x, y: world.y }],
            dragging: false,
            shapeCircle,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          const kind =
            whiteboard.tool === "pen"
              ? "freehand"
              : whiteboard.tool === "arrow"
                ? "arrow"
                : whiteboard.tool === "line"
                  ? "line"
                  : shapeCircle
                    ? "circle"
                    : "rect";
          whiteboard.onPreview(
            whiteboard.createMarkup(kind, [{ x: world.x, y: world.y }, { x: world.x, y: world.y }])
          );
          return;
        }

        if (whiteboard.tool === "text") {
          whiteboard.onTextRequest(world.x, world.y);
          return;
        }
        return;
      }

      const worldEarly = worldAtScreen(px, py);
      const axialEarly = axialAtScreen(px, py);

      if (
        (mapTools?.mode === "ping" || mapTools?.mode === "fog") &&
        !whiteboard?.active &&
        !dungeonEditor?.active
      ) {
        return;
      }

      if (mapTools?.mode === "measure" && worldEarly && axialEarly && !whiteboard?.active) {
        measureDragRef.current = {
          startWx: worldEarly.x,
          startWy: worldEarly.y,
          startPx: px,
          startPy: py,
          startAxial: axialEarly,
          dragging: false,
        };
        clickStartRef.current = { x: px, y: py };
        mapTools.onMeasurePreview({
          start: { x: worldEarly.x, y: worldEarly.y },
          end: { x: worldEarly.x, y: worldEarly.y },
          startAxial: axialEarly,
          endAxial: axialEarly,
        });
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      if (
        dungeonEditor?.active &&
        dungeonEditor.layer === "floor" &&
        dungeonEditor.mapImage?.complete &&
        dungeonEditor.mapImage.naturalWidth > 0
      ) {
        const canvas = canvasRef.current;
        if (canvas) {
          const layout = canvasLayout(canvas);
          const floorScene = {
            ...scene,
            mapImageScale: dungeonEditor.floorScale ?? scene.mapImageScale ?? 1,
            mapImageOffsetX: dungeonEditor.floorOffsetX ?? scene.mapImageOffsetX ?? 0,
            mapImageOffsetY: dungeonEditor.floorOffsetY ?? scene.mapImageOffsetY ?? 0,
          };
          const handle = hitTestFloorHandle(
            px,
            py,
            dungeonEditor.mapImage,
            floorScene,
            layout,
            viewRef.current
          );
          if (handle && dungeonEditor.onFloorResize) {
            const startRect = computeMapImageRect(dungeonEditor.mapImage, floorScene, layout);
            floorResizeRef.current = {
              pointerId: e.pointerId,
              startPx: px,
              startPy: py,
              handle,
              startRect,
              startScale: floorScene.mapImageScale ?? 1,
              startOffX: floorScene.mapImageOffsetX ?? 0,
              startOffY: floorScene.mapImageOffsetY ?? 0,
              dragging: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          const world = worldAtScreen(px, py);
          const onHandle = hitTestFloorHandle(
            px,
            py,
            dungeonEditor.mapImage,
            floorScene,
            layout,
            viewRef.current
          );
          if (
            world &&
            !onHandle &&
            dungeonEditor.onFloorDrag &&
            pointInFloorRect(world.x, world.y, dungeonEditor.mapImage, floorScene, layout)
          ) {
            floorDragRef.current = {
              pointerId: e.pointerId,
              startPx: px,
              startPy: py,
              baseOffX: floorScene.mapImageOffsetX ?? 0,
              baseOffY: floorScene.mapImageOffsetY ?? 0,
              dragging: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
        }
      }

      const hit = tokenAtPoint(px, py);

      if (hit) {
        if (
          mapTools?.mode === "ping" ||
          mapTools?.mode === "fog" ||
          mapTools?.mode === "measure"
        ) {
          return;
        }
        if (
          canRepositionToken?.(hit) &&
          actionMode === "idle" &&
          onRepositionToken &&
          !dungeonEditor?.active &&
          !whiteboard?.active
        ) {
          gmDragRef.current = {
            tokenId: hit.id,
            startX: px,
            startY: py,
            dragging: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          if (hit.id !== selectedId) setSelectedId(hit.id);
          return;
        }
        if (
          !canControlCombat &&
          isMonsterToken(hit) &&
          actionMode === "idle" &&
          onOpenMonsterKnowledge &&
          !dungeonEditor?.active &&
          !whiteboard?.active
        ) {
          onOpenMonsterKnowledge(hit);
          return;
        }

        if (hit.id !== selectedId) {
          if (
            selectedId &&
            isTargetMode(actionMode) &&
            activeCombatAction &&
            !attackableIds.has(hit.id)
          ) {
            onAreaSpellError?.("Alvo inválido para esta ação");
            return;
          }
          if (selectedId && attackableIds.has(hit.id)) return;
          setSelectedId(hit.id);
        }
        return;
      }

      const axial = axialAtScreen(px, py);
      if (!axial) return;

      if (
        dungeonEditor?.active &&
        dungeonEditor.layer === "objects" &&
        dungeonEditor.tool === "move"
      ) {
        const obj = dungeonObjectAt(scene, axial);
        if (obj) {
          dungeonEditor.onSelectObject(obj.id);
          dungeonDragRef.current = {
            objectId: obj.id,
            startX: px,
            startY: py,
            dragging: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          return;
        }
      }

      if (canControlCombat && actionMode === "idle" && !selectedId) {
        publishHoverAxial(axial);
      }
    },
    [
      pointerPos,
      tokenAtPoint,
      selectedId,
      attackableIds,
      setSelectedId,
      axialAtScreen,
      canControlCombat,
      canRepositionToken,
      onRepositionToken,
      onGmDragPreview,
      actionMode,
      publishHoverAxial,
      dungeonEditor,
      whiteboard,
      worldAtScreen,
      scene,
      canControlCombat,
      actionMode,
      activeCombatAction,
      onAreaSpellError,
      onOpenMonsterKnowledge,
      onOpenPlayerBestiary,
      canOpenPlayerBestiary,
    ]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { px, py } = pointerPos(e);
      publishHoverPointer({ x: px, y: py });
      const axial = axialAtScreen(px, py);
      const world = worldAtScreen(px, py);

      const md = measureDragRef.current;
      if (md && mapTools?.mode === "measure" && world && axial) {
        const dist = Math.hypot(px - md.startPx, py - md.startPy);
        if (dist > 4) md.dragging = true;
        mapTools.onMeasurePreview({
          start: { x: md.startWx, y: md.startWy },
          end: { x: world.x, y: world.y },
          startAxial: md.startAxial,
          endAxial: axial,
        });
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = "crosshair";
        return;
      }

      const wb = wbDrawRef.current;
      if (wb && whiteboard?.active && world) {
        if (!wb.dragging && Math.hypot(px - wb.startPx, py - wb.startPy) > 6) {
          wb.dragging = true;
        }
        if (wb.mode === "move" && wb.markupId && wb.originPoints) {
          const dx = world.x - wb.startWx;
          const dy = world.y - wb.startWy;
          const moved = wb.originPoints.map((p) => ({ x: p.x + dx, y: p.y + dy }));
          const src = whiteboard.markups.find((m) => m.id === wb.markupId);
          if (src) {
            whiteboard.onPreview({ ...src, points: moved });
          }
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
        if (wb.mode === "draw") {
          const shapeCircle =
            whiteboard.tool === "circle" ||
            (whiteboard.tool === "shape" && (e.altKey || wb.shapeCircle));
          wb.shapeCircle = shapeCircle;
          const kind =
            whiteboard.tool === "pen"
              ? "freehand"
              : whiteboard.tool === "arrow"
                ? "arrow"
                : whiteboard.tool === "line"
                  ? "line"
                  : shapeCircle
                    ? "circle"
                    : "rect";
          let points: { x: number; y: number }[];
          if (whiteboard.tool === "pen") {
            const last = wb.points[wb.points.length - 1];
            if (last && Math.hypot(world.x - last.x, world.y - last.y) < 3) return;
            wb.points.push({ x: world.x, y: world.y });
            points = wb.points;
          } else {
            points = [{ x: wb.startWx, y: wb.startWy }, { x: world.x, y: world.y }];
          }
          whiteboard.onPreview(whiteboard.createMarkup(kind, points));
          if (canvasRef.current) canvasRef.current.style.cursor = "crosshair";
          return;
        }
      }

      const gmEarly = gmDragRef.current;
      if (gmEarly && onRepositionToken && !dungeonEditor?.active && !whiteboard?.active) {
        if (!gmEarly.dragging && Math.hypot(px - gmEarly.startX, py - gmEarly.startY) > 8) {
          gmEarly.dragging = true;
        }
        if (gmEarly.dragging) {
          if (axial) {
            publishHoverAxial(axial);
            onGmDragPreview?.(gmEarly.tokenId, axial);
          }
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
      }

      if (!axial) return;

      const floorResize = floorResizeRef.current;
      if (
        floorResize &&
        floorResize.pointerId === e.pointerId &&
        dungeonEditor?.active &&
        dungeonEditor.layer === "floor" &&
        dungeonEditor.onFloorResize &&
        dungeonEditor.mapImage?.complete
      ) {
        const world = worldAtScreen(px, py);
        const canvas = canvasRef.current;
        if (world && canvas) {
          if (!floorResize.dragging && Math.hypot(px - floorResize.startPx, py - floorResize.startPy) > 2) {
            floorResize.dragging = true;
          }
          const layout = canvasLayout(canvas);
          const nextScale = floorScaleFromHandleDrag(
            floorResize.handle,
            world.x,
            world.y,
            floorResize.startRect,
            floorResize.startScale
          );
          const { offsetX, offsetY } = floorOffsetForAnchoredScale(
            floorResize.handle,
            floorResize.startRect,
            nextScale,
            dungeonEditor.mapImage,
            layout,
            floorResize.startOffX,
            floorResize.startOffY,
            floorResize.startScale
          );
          floorResize.dragging = true;
          dungeonEditor.onFloorResize(nextScale, offsetX, offsetY);
          const cursor =
            floorResize.handle === "nw" || floorResize.handle === "se"
              ? "nwse-resize"
              : "nesw-resize";
          canvas.style.cursor = cursor;
          return;
        }
      }

      const floor = floorDragRef.current;
      if (
        floor &&
        floor.pointerId === e.pointerId &&
        dungeonEditor?.active &&
        dungeonEditor.layer === "floor" &&
        dungeonEditor.onFloorDrag
      ) {
        const scale = viewRef.current.scale;
        const dx = (px - floor.startPx) / scale;
        const dy = (py - floor.startPy) / scale;
        if (!floor.dragging && Math.hypot(px - floor.startPx, py - floor.startPy) > 4) {
          floor.dragging = true;
        }
        if (floor.dragging) {
          dungeonEditor.onFloorDrag(floor.baseOffX + dx, floor.baseOffY + dy);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
      }

      const dng = dungeonDragRef.current;
      if (dng && dungeonEditor?.active && dungeonEditor.layer === "objects") {
        if (!dng.dragging && Math.hypot(px - dng.startX, py - dng.startY) > 8) {
          dng.dragging = true;
        }
        if (dng.dragging) {
          publishHoverAxial(axial);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
      }

      publishHoverAxial(trackGridHover ? axial : null);
      reportHoverTarget(px, py);

      const hoverToken = tokenAtPoint(px, py);
      const hoverTokenId = hoverToken?.id ?? null;
      if (hoverTokenId !== lastHoverTokenIdRef.current) {
        lastHoverTokenIdRef.current = hoverTokenId;
        onHoverTokenChange?.(hoverTokenId);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        if (
          isTargetMode(actionMode) &&
          !areaMode &&
          hoverToken &&
          selectedId &&
          attackableIds.has(hoverToken.id)
        ) {
          canvas.style.cursor = "crosshair";
        } else if (whiteboard?.active) {
          canvas.style.cursor = "crosshair";
        } else if (dungeonEditor?.active && dungeonEditor.layer === "objects") {
          canvas.style.cursor = dungeonEditor.tool === "erase" ? "not-allowed" : "crosshair";
        } else if (dungeonEditor?.active && dungeonEditor.layer === "floor") {
          if (floorResizeRef.current?.dragging || floorDragRef.current?.dragging) {
            canvas.style.cursor = "grabbing";
          } else if (
            dungeonEditor.mapImage?.complete &&
            dungeonEditor.mapImage.naturalWidth > 0
          ) {
            const layout = canvasLayout(canvas);
            const floorScene = {
              ...scene,
              mapImageScale: dungeonEditor.floorScale ?? scene.mapImageScale ?? 1,
              mapImageOffsetX: dungeonEditor.floorOffsetX ?? scene.mapImageOffsetX ?? 0,
              mapImageOffsetY: dungeonEditor.floorOffsetY ?? scene.mapImageOffsetY ?? 0,
            };
            const handle = hitTestFloorHandle(
              px,
              py,
              dungeonEditor.mapImage,
              floorScene,
              layout,
              viewRef.current
            );
            if (handle) {
              canvas.style.cursor =
                handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
            } else {
              const world = worldAtScreen(px, py);
              const onImage =
                world &&
                pointInFloorRect(world.x, world.y, dungeonEditor.mapImage, floorScene, layout);
              canvas.style.cursor = onImage ? "grab" : "default";
            }
          } else {
            canvas.style.cursor = "default";
          }
        } else if (mapTools?.mode === "ping") {
          canvas.style.cursor = "pointer";
        } else if (mapTools?.mode === "measure") {
          canvas.style.cursor = "crosshair";
        } else if (mapTools?.mode === "fog") {
          canvas.style.cursor = "cell";
        } else if (showMovement || areaMode) {
          canvas.style.cursor = "cell";
        } else if (
          hoverToken &&
          actionMode === "idle" &&
          canRepositionToken?.(hoverToken) &&
          !dungeonEditor?.active &&
          !whiteboard?.active
        ) {
          canvas.style.cursor = "grab";
        } else if (hoverToken && canOpenActionRing?.(hoverToken)) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "default";
        }
      }
    },
    [
      pointerPos,
      publishHoverPointer,
      publishHoverAxial,
      axialAtScreen,
      trackGridHover,
      reportHoverTarget,
      tokenAtPoint,
      onHoverTokenChange,
      selectedId,
      attackableIds,
      actionMode,
      showMovement,
      areaMode,
      canvasRef,
      canRepositionToken,
      onRepositionToken,
      onGmDragPreview,
      canOpenActionRing,
      canRepositionToken,
      dungeonEditor,
      whiteboard,
      worldAtScreen,
      mapTools,
    ]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const floor = floorDragRef.current;
      floorDragRef.current = null;
      const floorResize = floorResizeRef.current;
      floorResizeRef.current = null;
      const dng = dungeonDragRef.current;
      dungeonDragRef.current = null;
      const wb = wbDrawRef.current;
      wbDrawRef.current = null;
      const md = measureDragRef.current;
      if (md && mapTools?.mode === "measure") {
        measureDragRef.current = null;
        clickStartRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        return;
      }
      const gm = gmDragRef.current;
      gmDragRef.current = null;
      const { px, py } = pointerPos(e);
      const axial = axialAtScreen(px, py);
      const world = worldAtScreen(px, py);

      if (whiteboard?.active) {
        if (!world) return;
        const start = clickStartRef.current;
        clickStartRef.current = null;
        if (wb?.mode === "move" && wb.markupId && wb.originPoints) {
          const dx = world.x - wb.startWx;
          const dy = world.y - wb.startWy;
          whiteboard.onPreview(null);
          if (wb.dragging && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
            whiteboard.onMoveCommit(wb.markupId, dx, dy);
          }
          return;
        }
        if (wb?.mode === "draw") {
          const shapeCircle =
            whiteboard.tool === "circle" ||
            (whiteboard.tool === "shape" && (e.altKey || wb.shapeCircle));
          const kind =
            whiteboard.tool === "pen"
              ? "freehand"
              : whiteboard.tool === "arrow"
                ? "arrow"
                : whiteboard.tool === "line"
                  ? "line"
                  : shapeCircle
                    ? "circle"
                    : "rect";
          let points = wb.points;
          if (whiteboard.tool !== "pen") {
            points = [{ x: wb.startWx, y: wb.startWy }, { x: world.x, y: world.y }];
          }
          whiteboard.onPreview(null);
          const dragged = wb.dragging || Math.hypot(px - wb.startPx, py - wb.startPy) > 6;
          if (dragged && points.length >= 2) {
            const a = points[0]!;
            const b = points[points.length - 1]!;
            if (Math.hypot(b.x - a.x, b.y - a.y) >= 4 || whiteboard.tool === "pen") {
              whiteboard.onCommit(whiteboard.createMarkup(kind, points));
            }
          }
          return;
        }
        return;
      }

      if (
        (floor?.dragging || floorResize?.dragging) &&
        dungeonEditor?.active &&
        dungeonEditor.layer === "floor"
      ) {
        dungeonEditor.onFloorDragEnd?.();
        return;
      }

      if (gm?.dragging && onRepositionToken) {
        if (axial) onRepositionToken(gm.tokenId, axial);
        else onGmDragPreview?.(gm.tokenId, null);
        return;
      }
      if (gm) {
        onGmDragPreview?.(gm.tokenId, null);
      }

      if (!axial) return;

      if (dungeonEditor?.active && dungeonEditor.layer === "objects") {
        const start = clickStartRef.current;
        clickStartRef.current = null;
        if (!start || Math.hypot(px - start.x, py - start.y) <= 8 || dng) {
          dungeonEditor.onHexEdit(axial, dng?.objectId);
        }
        return;
      }

      const start = clickStartRef.current;
      clickStartRef.current = null;
      if (!start) return;

      if (Math.hypot(px - start.x, py - start.y) > 8) return;

      let hit = tokenAtPoint(px, py);
      if (!hit) {
        const clickAxial = axialAtScreen(px, py);
        if (clickAxial) hit = tokenAtAxial(clickAxial);
      }

      const castAreaAtHex = (targetAxial: Axial): boolean => {
        if (!selectedId || !areaMode || !activeCombatAction || !selected) return false;
        const turnCtx = {
          activeTokenId: turn.activeTokenId,
          bypassTurn: effectiveBypassTurn(selected, turn.bypassTurn),
          combatRound: turn.combatRound,
          combatHasOrder: turn.combatHasOrder,
        };
        const shape = activeCombatAction.areaShape ?? "burst";

        if (shape === "wall") {
          if (!areaCenter) {
            const check = canCastAreaAt(
              selected,
              targetAxial,
              activeCombatAction,
              turnCtx,
              selectedActor,
              channelExtraPa
            );
            if (check.ok) setAreaCenter(targetAxial);
            else onAreaSpellError(check.reason ?? "Centro de área inválido");
            return true;
          }
          const dir = hexDirection(areaCenter, targetAxial);
          if (dir == null) {
            onAreaSpellError("Clique numa célula vizinha ao centro da muralha para definir a direção");
            return true;
          }
          const check = canCastAreaAt(
            selected,
            areaCenter,
            activeCombatAction,
            turnCtx,
            selectedActor,
            channelExtraPa
          );
          if (check.ok) {
            onAreaSpell(areaCenter, dir);
            setAreaCenter(null);
          } else onAreaSpellError(check.reason ?? "Área inválida");
          return true;
        }

        if (areaNeedsDirection(shape) && areaUsesCasterOrigin(shape)) {
          const dir = hexDirection(selected.axial, targetAxial);
          if (dir == null) {
            onAreaSpellError("Clique numa célula vizinha ao conjurador para definir a direção");
            return true;
          }
          const check = canCastAreaAt(
            selected,
            selected.axial,
            activeCombatAction,
            turnCtx,
            selectedActor,
            channelExtraPa
          );
          if (check.ok) onAreaSpell(selected.axial, dir);
          else onAreaSpellError(check.reason ?? "Área inválida");
          return true;
        }

        const check = canCastAreaAt(
          selected,
          targetAxial,
          activeCombatAction,
          turnCtx,
          selectedActor,
          channelExtraPa
        );
        if (check.ok) onAreaSpell(targetAxial);
        else onAreaSpellError(check.reason ?? "Centro de área inválido");
        return true;
      };

      if (hit) {
        if (castAreaAtHex(axial)) return;
        if (
          isTargetMode(actionMode) &&
          selectedId &&
          attackableIds.has(hit.id) &&
          hit.id !== selectedId
        ) {
          onAttack(hit.id);
          return;
        }
        if (hit.id !== selectedId) setSelectedId(hit.id);
        return;
      }

      if (mapTools?.mode === "ping" && onPing && !whiteboard?.active) {
        onPing(axial);
        return;
      }

      if (mapTools?.mode === "fog" && onRevealHex && !whiteboard?.active) {
        onRevealHex(axial);
        return;
      }

      if (e.altKey && actionMode === "idle" && onPing && mapTools?.mode !== "measure") {
        onPing(axial);
        return;
      }

      if (e.ctrlKey && fogEnabled && onRevealHex && mapTools?.mode !== "measure") {
        onRevealHex(axial);
        return;
      }

      if (selectedId && isMoveMode(actionMode)) {
        onMove(axial);
        return;
      }

      castAreaAtHex(axial);
    },
    [
      pointerPos,
      tokenAtPoint,
      tokenAtAxial,
      axialAtScreen,
      selectedId,
      attackableIds,
      actionMode,
      setSelectedId,
      onAttack,
      onMove,
      areaMode,
      activeCombatAction,
      selected,
      turn,
      onAreaSpell,
      onAreaSpellError,
      onPing,
      onRevealHex,
      fogEnabled,
      needsAreaDirection,
      areaCenter,
      setAreaCenter,
      canRepositionToken,
      onRepositionToken,
      onGmDragPreview,
      dungeonEditor,
      whiteboard,
      worldAtScreen,
      mapTools,
    ]
  );

  const onPointerLeave = useCallback(() => {
    const gm = gmDragRef.current;
    gmDragRef.current = null;
    if (gm) onGmDragPreview?.(gm.tokenId, null);
    dungeonDragRef.current = null;
    wbDrawRef.current = null;
    measureDragRef.current = null;
    lastHoverAxialKeyRef.current = null;
    lastHoverPointerRef.current = null;
    lastHoverTokenIdRef.current = null;
    publishHoverAxial(null);
    onHoverTargetChange?.(null);
    onHoverTokenChange?.(null);
    publishHoverPointer(null);
  }, [
    publishHoverAxial,
    publishHoverPointer,
    onHoverTargetChange,
    onHoverTokenChange,
    onGmDragPreview,
  ]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      let hit = tokenAtPoint(px, py);
      if (!hit) {
        const axial = axialAtScreen(px, py);
        if (axial) hit = tokenAtAxial(axial);
      }
      if (!hit) return;

      if (
        !canControlCombat &&
        isMonsterToken(hit) &&
        onOpenMonsterKnowledge &&
        !whiteboard?.active
      ) {
        onOpenMonsterKnowledge(hit);
        return;
      }

      if (!canOpenActionRing?.(hit)) {
        onActionRingBlocked?.(hit);
        return;
      }
      if (hit.id !== selectedId) setSelectedId(hit.id);
      const center = tokenScreenCenter(hit);
      onActionRingRequest?.(hit, center?.x ?? e.clientX, center?.y ?? e.clientY);
    },
    [
      canvasRef,
      tokenAtPoint,
      axialAtScreen,
      tokenAtAxial,
      tokenScreenCenter,
      canControlCombat,
      onOpenMonsterKnowledge,
      canOpenActionRing,
      canOpenPlayerBestiary,
      onActionRingBlocked,
      selectedId,
      setSelectedId,
      onActionRingRequest,
      onOpenPlayerBestiary,
      whiteboard,
    ]
  );

  const cancelWhiteboardDraft = useCallback(() => {
    wbDrawRef.current = null;
    clickStartRef.current = null;
    whiteboard?.onPreview(null);
  }, [whiteboard]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onContextMenu,
    cancelWhiteboardDraft,
  };
}
