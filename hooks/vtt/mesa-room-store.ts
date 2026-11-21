import type { ChatMessage } from "@/lib/room/chat";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomSyncStatus } from "@/hooks/useRoomSync";

const EMPTY_CHAT: ChatMessage[] = [];
const EMPTY_ACTORS: RoomSnapshot["actors"] = Object.freeze({}) as RoomSnapshot["actors"];

export type MesaRoomSlice = "chat" | "map" | "combat" | "actors" | "settings" | "meta" | "revision" | "data";

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
  /** BV-073/074: sem isto os painéis do Um Anel (Jornada, Conselho) nunca viam a sessão. */
  torSession?: RoomSnapshot["torSession"];
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
  private dataRevision = 0;
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
    return this.snapshot?.chat ?? EMPTY_CHAT;
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
      cached.gmCreations === s.gmCreations &&
      cached.torSession === s.torSession
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
      torSession: s.torSession,
    };
    return this.mapCache;
  }

  getCombat(): RoomSnapshot["combat"] | null {
    return this.snapshot?.combat ?? null;
  }

  getActors(): RoomSnapshot["actors"] {
    // Objeto vazio estável: useSyncExternalStore exige a mesma referência entre
    // chamadas, senão o React acusa loop enquanto a sala ainda não carregou.
    return this.snapshot?.actors ?? EMPTY_ACTORS;
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
      cached.gmCreations === map.gmCreations &&
      cached.torSession === map.torSession
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
      torSession: map.torSession,
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
      prev?.gmCreations !== nextSnap?.gmCreations ||
      prev?.torSession !== nextSnap?.torSession;

    if (mapDataChanged) {
      this.mapCache = null;
      this.mapSnapshotOut = null;
      this.emit("map");
    }
    if (prev?.chat !== nextSnap?.chat) this.emit("chat");
    if (prev?.combat !== nextSnap?.combat) this.emit("combat");
    if (prev?.actors !== nextSnap?.actors) this.emit("actors");
    if (prev?.settings !== nextSnap?.settings) this.emit("settings");
    // BV-048: mudança só de revisão (ex.: ficha do Um Anel gravada fora da cena) não
    // toca nenhuma fatia acima, mas painéis que recarregam pela revisão precisam saber.
    if (prev?.revision !== nextSnap?.revision) this.emit("revision");

    // P-16: revisão de dados. Sobe quando alguma fatia que não é chat mudou, ou quando a
    // revisão mudou sem chat novo (ex.: ficha do Um Anel gravada fora da sala). Gravação
    // só de chat não sobe, para os painéis de ficha não recarregarem a cada mensagem.
    const chatChanged = prev?.chat !== nextSnap?.chat;
    const revisionChanged = prev?.revision !== nextSnap?.revision;
    // Gravações de ficha (XP, avanço, recuperação, fadiga, Sombra, Olho) narram no chat no
    // MESMO sync, várias com kind "chat". Só o que veio da caixa do chat leva fromChatBox
    // (rota /chat); qualquer outra mensagem nova recarrega as fichas. Padrão seguro:
    // uma gravação nova que narre no chat recarrega sem precisar lembrar de marcar nada.
    const prevIds = new Set((prev?.chat ?? EMPTY_CHAT).map((m) => m.id));
    const novas = chatChanged
      ? (nextSnap?.chat ?? EMPTY_CHAT).filter((m) => !prevIds.has(m.id))
      : EMPTY_CHAT;
    const chatTrazGravacao = novas.some((m) => !m.fromChatBox);
    // Cada gravação sobe a revisão em 1. Se ela subiu mais do que as mensagens da caixa
    // que chegaram, houve outra gravação junto (ex.: reconexão do SSE juntou uma mensagem
    // e uma ficha gravada fora da sala): recarrega (Lupa, P-16 3a).
    const revDelta = (nextSnap?.revision ?? 0) - (prev?.revision ?? 0);
    const daCaixa = novas.filter((m) => m.fromChatBox).length;
    const revisaoAlemDaCaixa = revDelta > daCaixa;
    // Ping no mapa também recarrega (Lupa, P-16): a revisão de um ping é indistinguível
    // da de uma ficha gravada fora da sala no mesmo sync, e ping é raro.
    if (mapDataChanged || (revisionChanged && (chatTrazGravacao || revisaoAlemDaCaixa))) {
      this.dataRevision += 1;
      this.emit("data");
    }
  }

  getRevision(): number {
    return this.snapshot?.revision ?? 0;
  }

  getDataRevision(): number {
    return this.dataRevision;
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
