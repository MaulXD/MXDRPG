"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { canvasCenter, screenToWorld, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import { pixelToAxial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import {
  clearActiveActorSpawnDragPayload,
  clearActiveGmCreationSpawnDragPayload,
  clearActiveSpawnDragPayload,
  isBoardSpawnDrag,
  readActorSpawnDrag,
  readGmCreationSpawnDrag,
  readMonsterSpawnDrag,
} from "@/lib/vtt/spawn-drag";
import { resolveMonsterSpawnPlacement } from "@/lib/vtt/spawn-placement";
import { placeRoomActorOnHex, spawnGmCreation, spawnRoomMonster } from "@/hooks/useRoomSync";
import type { BattleScene } from "@/lib/vtt/types";

type Params = {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scene: BattleScene;
  roomId: string;
  /** Aceita soltar monstros / criações GM no mapa */
  enabled: boolean;
  /** Permite soltar personagens da aventura no mapa (jogadores + mestre) */
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

  const dropZoneActive = enabled || allowActorDrop;

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!dropZoneActive || !isBoardSpawnDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current += 1;
      setSpawnDragActive(true);
    },
    [dropZoneActive]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!dropZoneActive || !spawnDragActive) return;
      const wrap = wrapRef.current;
      const next = e.relatedTarget;
      if (wrap && next instanceof Node && wrap.contains(next)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setSpawnDragActive(false);
        reportHover(null);
      }
    },
    [dropZoneActive, spawnDragActive, wrapRef, reportHover]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!dropZoneActive || !isBoardSpawnDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      const axial = axialFromEvent(e.clientX, e.clientY);
      if (axial) reportHover(axial);
    },
    [dropZoneActive, axialFromEvent, reportHover]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!dropZoneActive) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setSpawnDragActive(false);

      const gmPayload = enabled ? readGmCreationSpawnDrag(e.dataTransfer) : null;
      const monsterPayload =
        enabled && !gmPayload ? readMonsterSpawnDrag(e.dataTransfer) : null;
      const actorPayload =
        allowActorDrop && !gmPayload && !monsterPayload
          ? readActorSpawnDrag(e.dataTransfer)
          : null;

      clearActiveSpawnDragPayload();
      clearActiveActorSpawnDragPayload();
      clearActiveGmCreationSpawnDragPayload();

      const axial = axialFromEvent(e.clientX, e.clientY);
      reportHover(null);
      if ((!monsterPayload && !actorPayload && !gmPayload) || !axial) {
        if (!monsterPayload && !actorPayload && !gmPayload) {
          onError?.("Solte no mapa (arraste da lista Invocar, Personagens ou Minhas fichas).");
        } else {
          onError?.("Célula inválida — solte sobre o tabuleiro.");
        }
        return;
      }
      if (busyRef.current) return;

      busyRef.current = true;
      try {
        if (monsterPayload) {
          const placement = resolveMonsterSpawnPlacement(scene, axial, monsterPayload.entryId, {
            variant: monsterPayload.variant,
            groupLevelDelta: monsterPayload.groupLevelDelta || undefined,
          });
          if (!placement.ok) {
            onError?.(placement.reason);
            return;
          }
          const snapshot = await spawnRoomMonster(
            roomId,
            monsterPayload.entryId,
            placement.anchor.q,
            placement.anchor.r,
            {
              variant: monsterPayload.variant,
              groupLevelDelta: monsterPayload.groupLevelDelta || undefined,
            }
          );
          onSpawned(snapshot);
        } else {
          const snapshot = gmPayload
            ? await spawnGmCreation(roomId, gmPayload.creationId, axial.q, axial.r)
            : await placeRoomActorOnHex(roomId, actorPayload!.actorId, axial.q, axial.r);
          onSpawned(snapshot);
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Falha ao colocar no mapa");
      } finally {
        busyRef.current = false;
      }
    },
    [dropZoneActive, enabled, allowActorDrop, axialFromEvent, reportHover, roomId, scene, onSpawned, onError]
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
