"use client";

import { useCallback, useRef, type RefObject } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexDirection, pixelToAxial } from "@/lib/vtt/hex-math";
import { areaNeedsDirection, canCastAreaAt } from "@/lib/combat/area-spell";
import type { CombatActionOption } from "@/lib/combat/types";
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
  tokenDrawRadius,
  tokenOccupiesAxial,
  tokenPixelCenter,
} from "@/lib/vtt/creature-size";
import type { DungeonEditorTool } from "@/components/vtt/DungeonEditorPanel";
import { dungeonObjectAt } from "@/lib/vtt/dungeon-layer";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

type TurnCtx = {
  activeTokenId: string | null;
  bypassTurn: boolean;
  combatRound?: number;
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
  onHoverTokenChange?: (tokenId: string | null) => void;
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
  /** Clique direito no token da vez → action ring */
  onActionRingRequest?: (token: BattleToken, clientX: number, clientY: number) => void;
  canOpenActionRing?: (token: BattleToken) => boolean;
  dungeonEditor?: {
    active: boolean;
    tool: DungeonEditorTool;
    selectedObjectId: string | null;
    onSelectObject: (id: string | null) => void;
    onHexEdit: (axial: Axial, dragObjectId?: string) => void;
  };
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
  onActionRingRequest,
  canOpenActionRing,
  onHoverTokenChange,
  dungeonEditor,
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
      for (const token of scene.tokens) {
        const pos = tokenDrawPosition?.(token) ?? token.axial;
        const size = creatureSizeOf(token);
        const r = tokenDrawRadius(scene.hexSize, size) + 4;
        const { x, y } = tokenPixelCenter(pos, size, scene.hexSize, c.ox, c.oy);
        if (Math.hypot(c.world.x - x, c.world.y - y) < r) return token;
      }
      return null;
    },
    [boardCoords, scene, tokenDrawPosition]
  );

  const tokenAtAxial = useCallback(
    (axial: Axial): BattleToken | null => {
      for (const token of scene.tokens) {
        const pos = tokenDrawPosition?.(token) ?? token.axial;
        if (tokenOccupiesAxial({ ...token, axial: pos }, axial)) return token;
      }
      return null;
    },
    [scene.tokens, tokenDrawPosition]
  );

  const tokenScreenCenter = useCallback(
    (token: BattleToken): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const c = boardCoords(0, 0);
      if (!c) return null;
      const pos = tokenDrawPosition?.(token) ?? token.axial;
      const size = creatureSizeOf(token);
      const { x, y } = tokenPixelCenter(pos, size, scene.hexSize, c.ox, c.oy);
      const screen = worldToScreen(x, y, c.w, c.h, viewRef.current);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + screen.x, y: rect.top + screen.y };
    },
    [canvasRef, boardCoords, tokenDrawPosition, scene.hexSize, viewRef]
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
          onGmReposition &&
          !dungeonEditor?.active
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

      if (dungeonEditor?.active && dungeonEditor.tool === "move") {
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
      dungeonEditor,
      scene,
    ]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { px, py } = pointerPos(e);
      const axial = axialAtScreen(px, py);
      if (!axial) return;

      const dng = dungeonDragRef.current;
      if (dng && dungeonEditor?.active) {
        if (!dng.dragging && Math.hypot(px - dng.startX, py - dng.startY) > 8) {
          dng.dragging = true;
        }
        if (dng.dragging) {
          setHoverAxial(axial);
          onHoverAxialChange?.(axial);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
      }

      const gm = gmDragRef.current;
      if (gm && canGmReposition && onGmReposition && !dungeonEditor?.active) {
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
      onHoverTokenChange?.(hoverToken?.id ?? null);

      const canvas = canvasRef.current;
      if (canvas) {
        if (
          isTargetMode(actionMode) &&
          hoverToken &&
          selectedId &&
          attackableIds.has(hoverToken.id)
        ) {
          canvas.style.cursor = "crosshair";
        } else if (dungeonEditor?.active) {
          canvas.style.cursor = dungeonEditor.tool === "erase" ? "not-allowed" : "crosshair";
        } else if (showMovement || areaMode) {
          canvas.style.cursor = "cell";
        } else if (hoverToken && canOpenActionRing?.(hoverToken)) {
          canvas.style.cursor = "pointer";
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
      onHoverTokenChange,
      selectedId,
      attackableIds,
      actionMode,
      showMovement,
      areaMode,
      canvasRef,
      canGmReposition,
      onGmReposition,
      onGmDragPreview,
      canOpenActionRing,
      dungeonEditor,
    ]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const dng = dungeonDragRef.current;
      dungeonDragRef.current = null;
      const gm = gmDragRef.current;
      gmDragRef.current = null;
      const { px, py } = pointerPos(e);
      const axial = axialAtScreen(px, py);
      if (!axial) return;

      if (dungeonEditor?.active) {
        const start = clickStartRef.current;
        clickStartRef.current = null;
        if (!start || Math.hypot(px - start.x, py - start.y) <= 8 || dng) {
          dungeonEditor.onHexEdit(axial, dng?.objectId);
        }
        return;
      }

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
          combatRound: turn.combatRound,
        };
        const shape = activeCombatAction.areaShape ?? "burst";

        if (areaNeedsDirection(shape)) {
          const dir = hexDirection(selected.axial, axial);
          if (dir == null) {
            onAreaSpellError("Clique num hex vizinho ao conjurador para definir a direção");
            return;
          }
          const check = canCastAreaAt(selected, selected.axial, activeCombatAction, turnCtx);
          if (check.ok) onAreaSpell(selected.axial, dir);
          else onAreaSpellError(check.reason ?? "Área inválida");
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
      dungeonEditor,
    ]
  );

  const onPointerLeave = useCallback(() => {
    gmDragRef.current = null;
    dungeonDragRef.current = null;
    setHoverAxial(null);
    onHoverAxialChange?.(null);
    onHoverTargetChange?.(null);
    onHoverTokenChange?.(null);
  }, [setHoverAxial, onHoverAxialChange, onHoverTargetChange, onHoverTokenChange]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      let hit = tokenAtPoint(px, py);
      if (!hit) {
        const axial = axialAtScreen(px, py);
        if (axial) hit = tokenAtAxial(axial);
      }
      if (!hit || !canOpenActionRing?.(hit)) return;
      e.preventDefault();
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
      canOpenActionRing,
      selectedId,
      setSelectedId,
      onActionRingRequest,
    ]
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onContextMenu };
}
