"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { canvasCenter, screenToWorld, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import { resolveMapAlignedGridLayout, worldToMapFloorLocal } from "@/lib/vtt/grid-layout";
import { pixelToAxial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import {
  clearActiveActorSpawnDragPayload,
  clearActiveGmCreationSpawnDragPayload,
  clearActiveSpawnDragPayload,
  getActiveSpawnDragPayload,
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
  const spawnDragActiveRef = useRef(false);

  const axialFromEvent = useCallback(
    (clientX: number, clientY: number): Axial | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) return null;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const { ox, oy } = canvasCenter(w, h);
      const world = screenToWorld(px, py, w, h, viewRef.current);
      const grid = resolveMapAlignedGridLayout(scene, ox, oy);
      const local = grid.floorAnchor
        ? worldToMapFloorLocal(world.x, world.y, grid.floorAnchor)
        : world;
      return pixelToAxial(local.x, local.y, grid.hexSize, grid.ox, grid.oy);
    },
    [canvasRef, scene, viewRef]
  );

  const reportHover = useCallback(
    (axial: Axial | null) => {
      setHoverAxial(axial);
      onHoverAxialChange?.(axial);
    },
    [setHoverAxial, onHoverAxialChange]
  );

  const setSpawnActive = useCallback((active: boolean) => {
    spawnDragActiveRef.current = active;
    setSpawnDragActive(active);
  }, []);

  const dropZoneActive = enabled || allowActorDrop;

  const pointOnCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const rect = canvas.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    },
    [canvasRef]
  );

  const performDrop = useCallback(
    async (clientX: number, clientY: number, dataTransfer: DataTransfer | null) => {
      if (!dropZoneActive) return;

      const gmPayload = enabled && dataTransfer ? readGmCreationSpawnDrag(dataTransfer) : null;
      const monsterPayload =
        enabled && dataTransfer && !gmPayload ? readMonsterSpawnDrag(dataTransfer) : null;
      const actorPayload =
        allowActorDrop && dataTransfer && !gmPayload && !monsterPayload
          ? readActorSpawnDrag(dataTransfer)
          : null;

      clearActiveSpawnDragPayload();
      clearActiveActorSpawnDragPayload();
      clearActiveGmCreationSpawnDragPayload();

      const axial = axialFromEvent(clientX, clientY);
      reportHover(null);
      dragDepthRef.current = 0;
      setSpawnActive(false);

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
    [
      dropZoneActive,
      enabled,
      allowActorDrop,
      axialFromEvent,
      reportHover,
      setSpawnActive,
      roomId,
      scene,
      onSpawned,
      onError,
    ]
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!dropZoneActive || !isBoardSpawnDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current += 1;
      setSpawnActive(true);
    },
    [dropZoneActive, setSpawnActive]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!dropZoneActive) return;
      const wrap = wrapRef.current;
      const next = e.relatedTarget;
      if (wrap && next instanceof Node && wrap.contains(next)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setSpawnActive(false);
        reportHover(null);
      }
    },
    [dropZoneActive, wrapRef, reportHover, setSpawnActive]
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
    (e: React.DragEvent) => {
      if (!dropZoneActive) return;
      e.preventDefault();
      e.stopPropagation();
      void performDrop(e.clientX, e.clientY, e.dataTransfer);
    },
    [dropZoneActive, performDrop]
  );

  /** Fallback global — alguns navegadores não entregam drop ao wrapper do canvas. */
  useEffect(() => {
    if (!dropZoneActive) return;

    function onWindowDragOver(e: DragEvent) {
      const dt = e.dataTransfer;
      if (!dt || !isBoardSpawnDrag(dt)) return;
      if (!pointOnCanvas(e.clientX, e.clientY)) return;
      e.preventDefault();
      dt.dropEffect = "copy";
      dragDepthRef.current = Math.max(dragDepthRef.current, 1);
      setSpawnActive(true);
      const axial = axialFromEvent(e.clientX, e.clientY);
      if (axial) reportHover(axial);
    }

    function onWindowDrop(e: DragEvent) {
      const dt = e.dataTransfer;
      if (!dt || !isBoardSpawnDrag(dt)) return;
      if (!pointOnCanvas(e.clientX, e.clientY)) return;
      e.preventDefault();
      void performDrop(e.clientX, e.clientY, dt);
    }

    function onWindowDragEnd() {
      dragDepthRef.current = 0;
      setSpawnActive(false);
      reportHover(null);
      if (!getActiveSpawnDragPayload()) return;
      clearActiveSpawnDragPayload();
      clearActiveActorSpawnDragPayload();
      clearActiveGmCreationSpawnDragPayload();
    }

    window.addEventListener("dragover", onWindowDragOver);
    window.addEventListener("drop", onWindowDrop);
    window.addEventListener("dragend", onWindowDragEnd);
    return () => {
      window.removeEventListener("dragover", onWindowDragOver);
      window.removeEventListener("drop", onWindowDrop);
      window.removeEventListener("dragend", onWindowDragEnd);
    };
  }, [
    dropZoneActive,
    pointOnCanvas,
    axialFromEvent,
    reportHover,
    performDrop,
    setSpawnActive,
  ]);

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
