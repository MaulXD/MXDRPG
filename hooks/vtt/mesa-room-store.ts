import type { ChatMessage } from "@/lib/room/chat";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomSyncStatus } from "@/hooks/useRoomSync";

export type MesaRoomSlice = "chat" | "map" | "combat" | "actors" | "settings" | "meta";

export type MesaMapSlice = {
  revision: number;
  roomId: string;
  scene: RoomSnapshot["scene"];
  combat: RoomSnapshot["combat"];
  settings: RoomSnapshot["settings"];
  pings: RoomSnapshot["pings"];
  actors: RoomSnapshot["actors"];
  combatUndo?: RoomSnapshot["combatUndo"];
  combatLog?: RoomSnapshot["combatLog"];
  gmCreations?: RoomSnapshot["gmCreations"];
};

export type MesaMetaSlice = {
  loading: boolean;
  syncError: string | null;
  syncStatus: RoomSyncStatus;
};

type SliceListener = () => void;

export class MesaRoomStore {
  private snapshot: RoomSnapshot | null = null;
  private meta: MesaMetaSlice = {
    loading: true,
    syncError: null,
    syncStatus: "loading",
  };
  private mapCache: MesaMapSlice | null = null;
  private mapSnapshotOut: RoomSnapshot | null = null;
  private listeners = new Map<MesaRoomSlice, Set<SliceListener>>();

  subscribe(slice: MesaRoomSlice, onStoreChange: SliceListener): () => void {
    let set = this.listeners.get(slice);
    if (!set) {
      set = new Set();
      this.listeners.set(slice, set);
    }
    set.add(onStoreChange);
    return () => set!.delete(onStoreChange);
  }

  getSnapshotFull(): RoomSnapshot | null {
    return this.snapshot;
  }

  getChat(): ChatMessage[] {
    return this.snapshot?.chat ?? [];
  }

  getMapSlice(): MesaMapSlice | null {
    const s = this.snapshot;
    if (!s) {
      this.mapCache = null;
      return null;
    }
    const cached = this.mapCache;
    if (
      cached &&
      cached.revision === s.revision &&
      cached.scene === s.scene &&
      cached.combat === s.combat &&
      cached.settings === s.settings &&
      cached.actors === s.actors &&
      cached.pings === s.pings &&
      cached.combatUndo === s.combatUndo &&
      cached.combatLog === s.combatLog &&
      cached.gmCreations === s.gmCreations
    ) {
      return cached;
    }
    this.mapCache = {
      revision: s.revision,
      roomId: s.roomId,
      scene: s.scene,
      combat: s.combat,
      settings: s.settings,
      pings: s.pings,
      actors: s.actors,
      combatUndo: s.combatUndo,
      combatLog: s.combatLog,
      gmCreations: s.gmCreations,
    };
    return this.mapCache;
  }

  getCombat(): RoomSnapshot["combat"] | null {
    return this.snapshot?.combat ?? null;
  }

  getActors(): RoomSnapshot["actors"] {
    return this.snapshot?.actors ?? {};
  }

  getSettings(): RoomSnapshot["settings"] | undefined {
    return this.snapshot?.settings;
  }

  getMeta(): MesaMetaSlice {
    return this.meta;
  }

  /** Monta RoomSnapshot mínimo para APIs que ainda esperam snapshot completo. */
  toRoomSnapshotFromMap(map: MesaMapSlice | null): RoomSnapshot | null {
    if (!map) {
      this.mapSnapshotOut = null;
      return this.snapshot;
    }
    const cached = this.mapSnapshotOut;
    if (
      cached &&
      cached.revision === map.revision &&
      cached.scene === map.scene &&
      cached.combat === map.combat &&
      cached.settings === map.settings &&
      cached.actors === map.actors &&
      cached.pings === map.pings &&
      cached.combatUndo === map.combatUndo &&
      cached.combatLog === map.combatLog &&
      cached.gmCreations === map.gmCreations
    ) {
      return cached;
    }
    this.mapSnapshotOut = {
      roomId: map.roomId,
      revision: map.revision,
      settings: map.settings,
      scene: map.scene,
      actors: map.actors,
      combat: map.combat,
      chat: this.snapshot?.chat ?? [],
      pings: map.pings,
      combatUndo: map.combatUndo,
      combatLog: map.combatLog,
      gmCreations: map.gmCreations,
    };
    return this.mapSnapshotOut;
  }

  patchSync(next: {
    snapshot?: RoomSnapshot | null;
    loading?: boolean;
    syncError?: string | null;
    syncStatus?: RoomSyncStatus;
  }): void {
    const prev = this.snapshot;
    const nextSnap = next.snapshot !== undefined ? next.snapshot : prev;

    if (next.loading !== undefined || next.syncError !== undefined || next.syncStatus !== undefined) {
      const nextMeta: MesaMetaSlice = {
        loading: next.loading ?? this.meta.loading,
        syncError: next.syncError !== undefined ? next.syncError : this.meta.syncError,
        syncStatus: next.syncStatus ?? this.meta.syncStatus,
      };
      if (
        nextMeta.loading !== this.meta.loading ||
        nextMeta.syncError !== this.meta.syncError ||
        nextMeta.syncStatus !== this.meta.syncStatus
      ) {
        this.meta = nextMeta;
        this.emit("meta");
      }
    }

    if (nextSnap === prev) return;

    this.snapshot = nextSnap;

    const mapDataChanged =
      prev?.scene !== nextSnap?.scene ||
      prev?.combat !== nextSnap?.combat ||
      prev?.settings !== nextSnap?.settings ||
      prev?.actors !== nextSnap?.actors ||
      prev?.pings !== nextSnap?.pings ||
      prev?.combatUndo !== nextSnap?.combatUndo ||
      prev?.combatLog !== nextSnap?.combatLog ||
      prev?.gmCreations !== nextSnap?.gmCreations;

    if (mapDataChanged) {
      this.mapCache = null;
      this.mapSnapshotOut = null;
      this.emit("map");
    }
    if (prev?.chat !== nextSnap?.chat) this.emit("chat");
    if (prev?.combat !== nextSnap?.combat) this.emit("combat");
    if (prev?.actors !== nextSnap?.actors) this.emit("actors");
    if (prev?.settings !== nextSnap?.settings) this.emit("settings");
  }

  reset(): void {
    this.snapshot = null;
    this.mapCache = null;
    this.mapSnapshotOut = null;
    this.meta = { loading: true, syncError: null, syncStatus: "loading" };
    for (const slice of this.listeners.keys()) this.emit(slice);
  }

  private emit(slice: MesaRoomSlice): void {
    this.listeners.get(slice)?.forEach((cb) => cb());
  }
}

const stores = new Map<string, MesaRoomStore>();

export function getMesaRoomStore(roomId: string): MesaRoomStore {
  let store = stores.get(roomId);
  if (!store) {
    store = new MesaRoomStore();
    stores.set(roomId, store);
  }
  return store;
}

export function resetMesaRoomStore(roomId: string): void {
  stores.get(roomId)?.reset();
}
