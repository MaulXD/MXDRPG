"use client";

import { useSyncExternalStore } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import type { RoomSnapshot } from "@/lib/room/types";
import {
  getMesaRoomStore,
  type MesaMapSlice,
  type MesaMetaSlice,
  type MesaRoomStore,
} from "@/hooks/vtt/mesa-room-store";

export function useMesaRoomStore(roomId: string): MesaRoomStore {
  return getMesaRoomStore(roomId);
}

export function useMesaChat(roomId: string): ChatMessage[] {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("chat", cb),
    () => store.getChat(),
    () => store.getChat()
  );
}

export function useMesaMapSlice(roomId: string): MesaMapSlice | null {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("map", cb),
    () => store.getMapSlice(),
    () => store.getMapSlice()
  );
}

export function useMesaMapSnapshot(roomId: string): RoomSnapshot | null {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("map", cb),
    () => store.toRoomSnapshotFromMap(store.getMapSlice()),
    () => store.toRoomSnapshotFromMap(store.getMapSlice())
  );
}

export function useMesaCombat(roomId: string): RoomSnapshot["combat"] | null {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("combat", cb),
    () => store.getCombat(),
    () => store.getCombat()
  );
}

export function useMesaActors(roomId: string): RoomSnapshot["actors"] {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("actors", cb),
    () => store.getActors(),
    () => store.getActors()
  );
}

export function useMesaSettings(roomId: string): RoomSnapshot["settings"] | undefined {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("settings", cb),
    () => store.getSettings(),
    () => store.getSettings()
  );
}

export function useMesaMeta(roomId: string): MesaMetaSlice {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => store.subscribe("meta", cb),
    () => store.getMeta(),
    () => store.getMeta()
  );
}

/** Snapshot completo — usar só onde inevitável (GM panels). */
export function useMesaSnapshotFull(roomId: string): RoomSnapshot | null {
  const store = getMesaRoomStore(roomId);
  return useSyncExternalStore(
    (cb) => {
      const offChat = store.subscribe("chat", cb);
      const offMap = store.subscribe("map", cb);
      return () => {
        offChat();
        offMap();
      };
    },
    () => store.getSnapshotFull(),
    () => store.getSnapshotFull()
  );
}
