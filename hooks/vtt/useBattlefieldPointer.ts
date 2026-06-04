"use client";

import { useCallback, useRef, type RefObject } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexDirection, pixelToAxial } from "@/lib/vtt/hex-math";
import { areaNeedsDirection, canCastAreaAt } from "@/lib/combat/area-spell";
import type { CombatActionOption } from "@/lib/combat/types";
import { isMoveMode, isTargetMode } from "@/lib/vtt/action-mode";
import type { TokenActionMode } from "@/lib/vtt/action-mode";
import { canvasCenter, screenToWorld, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import { tokenRadius } from "@/lib/vtt/token-canvas";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

type TurnCtx = {
  activeTokenId: string | null;
  bypassTurn: boolean;
};

type Params = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scene: BattleScene;
  tokenDrawPosition?: (token: BattleToken) => { q: number; r: number };
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  actionMode: TokenActionMode;
  activeCombatAction: CombatActionOption | null;
  attackableIds: Set<string>;
  hoverAxial: Axial | null;
  setHoverAxial: (a: Axial | null) => void;
  onHoverAxialChange?: (a: Axial | null) => void;
  onHoverTargetChange?: (tokenId: string | null) => void;
  showMovement: boolean;
  isAreaSpellMode: boolean;
  needsAreaDirection: boolean;
  areaCenter: Axial | null;
  setAreaCenter: (a: Axial | null) => void;
  selected: BattleToken | null;
  turn: TurnCtx;
  canControlCombat: boolean;
  canGmReposition?: boolean;
  onGmReposition?: (tokenId: string, axial: Axial) => void;
  onGmDragPreview?: (tokenId: string, axial: Axial | null) => void;
  onAttack: (defenderId: string) => void;
  onMove: (axial: Axial) => void;
  onAreaSpell: (center: Axial, direction?: number) => void;
  onAreaSpellError: (msg: string) => void;
  onPing?: (axial: Axial) => void;
  onRevealHex?: (axial: Axial) => void;
  fogEnabled?: boolean;
  viewRef: RefObject<BattlefieldView>;
};

export function useBattlefieldPointer({
  canvasRef,
  scene,
  tokenDrawPosition,
  selectedId,
  setSelectedId,
  actionMode,
  activeCombatAction,
  attackableIds,
  setHoverAxial,
  onHoverAxialChange,
  onHoverTargetChange,
  showMovement,
  isAreaSpellMode: areaMode,
  needsAreaDirection,
  areaCenter,
  setAreaCenter,
  selected,
  turn,
  canControlCombat,
  canGmReposition = false,
  onGmReposition,
  onGmDragPreview,
  onAttack,
  onMove,
  onAreaSpell,
  onAreaSpellError,
  onPing,
  onRevealHex,
  fogEnabled = false,
  viewRef,
}: Params) {
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);
  const gmDragRef = useRef<{
    tokenId: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

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

  const axialAtScreen = useCallback(
    (px: number, py: number): Axial | null => {
      const c = boardCoords(px, py);
      if (!c) return null;
      return pixelToAxial(c.world.x, c.world.y, scene.hexSize, c.ox, c.oy);
    },
    [boardCoords, scene.hexSize]
  );

  const tokenAtPoint = useCallback(
    (px: number, py: number): BattleToken | null => {
      const c = boardCoords(px, py);
      if (!c) return null;
      const hitR = tokenRadius(scene.hexSize) + 4;
      for (const token of scene.tokens) {
        const pos = tokenDrawPosition?.(token) ?? token.axial;
        const { x, y } = axialToPixel(pos.q, pos.r, scene.hexSize, c.ox, c.oy);
        if (Math.hypot(c.world.x - x, c.world.y - y) < hitR) return token;
      }
      return null;
    },
    [boardCoords, scene, tokenDrawPosition]
  );

  const pointerPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { px: e.clientX - rect.left, py: e.clientY - rect.top };
    },
    [canvasRef]
  );

  const reportHoverTarget = useCallback(
    (px: number, py: number) => {
      const hoverToken = tokenAtPoint(px, py);
      const id =
        hoverToken && selectedId && attackableIds.has(hoverToken.id) ? hoverToken.id : null;
      onHoverTargetChange?.(id);
    },
    [tokenAtPoint, selectedId, attackableIds, onHoverTargetChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { px, py } = pointerPos(e);
      clickStartRef.current = { x: px, y: py };
      const hit = tokenAtPoint(px, py);

      if (hit) {
        if (
          canGmReposition &&
          actionMode === "idle" &&
          onGmReposition
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
        if (hit.id !== selectedId) {
          if (selectedId && attackableIds.has(hit.id)) return;
          setSelectedId(hit.id);
        }
        return;
      }

      const axial = axialAtScreen(px, py);
      if (!axial) return;
      if (canControlCombat && actionMode === "idle" && !selectedId) {
        setHoverAxial(axial);
        onHoverAxialChange?.(axial);
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
      canGmReposition,
      onGmReposition,
      actionMode,
      setHoverAxial,
      onHoverAxialChange,
      setSelectedId,
    ]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { px, py } = pointerPos(e);
      const axial = axialAtScreen(px, py);
      if (!axial) return;

      const gm = gmDragRef.current;
      if (gm && canGmReposition && onGmReposition) {
        if (!gm.dragging && Math.hypot(px - gm.startX, py - gm.startY) > 8) {
          gm.dragging = true;
        }
        if (gm.dragging) {
          setHoverAxial(axial);
          onHoverAxialChange?.(axial);
          onGmDragPreview?.(gm.tokenId, axial);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
      }

      setHoverAxial(axial);
      onHoverAxialChange?.(axial);
      reportHoverTarget(px, py);

      const hoverToken = tokenAtPoint(px, py);
      const canvas = canvasRef.current;
      if (canvas) {
        if (
          isTargetMode(actionMode) &&
          hoverToken &&
          selectedId &&
          attackableIds.has(hoverToken.id)
        ) {
          canvas.style.cursor = "crosshair";
        } else if (showMovement || areaMode) {
          canvas.style.cursor = "cell";
        } else {
          canvas.style.cursor = "default";
        }
      }
    },
    [
      pointerPos,
      axialAtScreen,
      setHoverAxial,
      onHoverAxialChange,
      reportHoverTarget,
      tokenAtPoint,
      selectedId,
      attackableIds,
      actionMode,
      showMovement,
      areaMode,
      canvasRef,
      canGmReposition,
      onGmReposition,
      onGmDragPreview,
    ]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const gm = gmDragRef.current;
      gmDragRef.current = null;
      const { px, py } = pointerPos(e);
      const axial = axialAtScreen(px, py);
      if (!axial) return;

      if (gm?.dragging && canGmReposition && onGmReposition) {
        onGmDragPreview?.(gm.tokenId, null);
        onGmReposition(gm.tokenId, axial);
        return;
      }

      const start = clickStartRef.current;
      clickStartRef.current = null;
      if (!start) return;

      if (Math.hypot(px - start.x, py - start.y) > 8) return;

      const hit = tokenAtPoint(px, py);

      if (hit) {
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

      if (e.altKey && actionMode === "idle" && onPing) {
        onPing(axial);
        return;
      }

      if (e.ctrlKey && fogEnabled && onRevealHex) {
        onRevealHex(axial);
        return;
      }

      if (selectedId && isMoveMode(actionMode)) {
        onMove(axial);
        return;
      }

      if (selectedId && areaMode && activeCombatAction && selected) {
        const turnCtx = {
          activeTokenId: turn.activeTokenId,
          bypassTurn: turn.bypassTurn,
        };
        const shape = activeCombatAction.areaShape ?? "burst";

        if (needsAreaDirection && areaCenter) {
          const dir = hexDirection(areaCenter, axial);
          if (dir == null) {
            onAreaSpellError("Clique num hex vizinho ao centro para definir a direção");
            return;
          }
          const check = canCastAreaAt(selected, areaCenter, activeCombatAction, turnCtx);
          if (check.ok) onAreaSpell(areaCenter, dir);
          else onAreaSpellError(check.reason ?? "Área inválida");
          return;
        }

        if (areaNeedsDirection(shape)) {
          const check = canCastAreaAt(selected, axial, activeCombatAction, turnCtx);
          if (check.ok) setAreaCenter(axial);
          else onAreaSpellError(check.reason ?? "Centro de área inválido");
          return;
        }

        const check = canCastAreaAt(selected, axial, activeCombatAction, turnCtx);
        if (check.ok) onAreaSpell(axial);
        else onAreaSpellError(check.reason ?? "Centro de área inválido");
      }
    },
    [
      pointerPos,
      tokenAtPoint,
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
      canGmReposition,
      onGmReposition,
      onGmDragPreview,
    ]
  );

  const onPointerLeave = useCallback(() => {
    gmDragRef.current = null;
    setHoverAxial(null);
    onHoverAxialChange?.(null);
    onHoverTargetChange?.(null);
  }, [setHoverAxial, onHoverAxialChange, onHoverTargetChange]);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerLeave };
}
