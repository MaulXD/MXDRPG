"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { canvasCenter, screenToWorld, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import { pixelToAxial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import {
  clearActiveActorSpawnDragPayload,
  clearActiveSpawnDragPayload,
  isBoardSpawnDrag,
  readActorSpawnDrag,
  readMonsterSpawnDrag,
} from "@/lib/vtt/spawn-drag";
import { placeRoomActorOnHex, spawnRoomMonster } from "@/hooks/useRoomSync";
import type { BattleScene } from "@/lib/vtt/types";

type Params = {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scene: BattleScene;
  roomId: string;
  enabled: boolean;
  /** Permite soltar personagens da aventura no mapa */
  allowActorDrop?: boolean;
  onSpawned: (snapshot: RoomSnapshot) => void;
  setHoverAxial: (a: Axial | null) => void;
  onHoverAxialChange?: (a: Axial | null) => void;
  onError?: (msg: string) => void;
  viewRef: RefObject<BattlefieldView>;
};

export function useMonsterSpawnDrop({
  wrapRef,
  canvasRef,
  scene,
  roomId,
  enabled,
  allowActorDrop = true,
  onSpawned,
  setHoverAxial,
  onHoverAxialChange,
  onError,
  viewRef,
}: Params) {
  const [spawnDragActive, setSpawnDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const busyRef = useRef(false);

  const axialFromEvent = useCallback(
    (clientX: number, clientY: number): Axial | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const { ox, oy } = canvasCenter(w, h);
      const world = screenToWorld(px, py, w, h, viewRef.current);
      return pixelToAxial(world.x, world.y, scene.hexSize, ox, oy);
    },
    [canvasRef, scene.hexSize, viewRef]
  );

  const reportHover = useCallback(
    (axial: Axial | null) => {
      setHoverAxial(axial);
      onHoverAxialChange?.(axial);
    },
    [setHoverAxial, onHoverAxialChange]
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !isBoardSpawnDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current += 1;
      setSpawnDragActive(true);
    },
    [enabled]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !spawnDragActive) return;
      const wrap = wrapRef.current;
      const next = e.relatedTarget;
      if (wrap && next instanceof Node && wrap.contains(next)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setSpawnDragActive(false);
        reportHover(null);
      }
    },
    [enabled, spawnDragActive, wrapRef, reportHover]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !isBoardSpawnDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      const axial = axialFromEvent(e.clientX, e.clientY);
      if (axial) reportHover(axial);
    },
    [enabled, axialFromEvent, reportHover]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setSpawnDragActive(false);
      clearActiveSpawnDragPayload();
      clearActiveActorSpawnDragPayload();
      const monsterPayload = readMonsterSpawnDrag(e.dataTransfer);
      const actorPayload = allowActorDrop ? readActorSpawnDrag(e.dataTransfer) : null;
      const axial = axialFromEvent(e.clientX, e.clientY);
      reportHover(null);
      if ((!monsterPayload && !actorPayload) || !axial) {
        if (!monsterPayload && !actorPayload) {
          onError?.("Solte no mapa (arraste da lista Invocar ou Personagens).");
        } else {
          onError?.("Hex inválido — solte sobre o tabuleiro.");
        }
        return;
      }
      if (busyRef.current) return;

      busyRef.current = true;
      try {
        const snapshot = actorPayload
          ? await placeRoomActorOnHex(roomId, actorPayload.actorId, axial.q, axial.r)
          : await spawnRoomMonster(roomId, monsterPayload!.entryId, axial.q, axial.r, {
              variant: monsterPayload!.variant,
              groupLevelDelta: monsterPayload!.groupLevelDelta || undefined,
            });
        onSpawned(snapshot);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Falha ao colocar no mapa");
      } finally {
        busyRef.current = false;
      }
    },
    [enabled, allowActorDrop, axialFromEvent, reportHover, roomId, onSpawned, onError]
  );

  return {
    spawnDragActive,
    spawnDropHandlers: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    },
  };
}
