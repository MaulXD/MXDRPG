"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomApiPayload, RoomMemberOnlineEvent } from "@/hooks/useRoomSync";
import { useRoomSync } from "@/hooks/useRoomSync";
import { getMesaRoomStore, resetMesaRoomStore } from "@/hooks/vtt/mesa-room-store";

export type MesaSyncActions = {
  refresh: () => Promise<void>;
  applySnapshot: (
    data: RoomSnapshot,
    opts?: { force?: boolean; immediate?: boolean }
  ) => void;
  applyRoomResponse: (
    payload: RoomApiPayload,
    opts?: { force?: boolean; immediate?: boolean }
  ) => void;
};

type MesaSyncContextValue = {
  roomId: string;
  actions: MesaSyncActions;
};

const MesaSyncContext = createContext<MesaSyncContextValue | null>(null);

type Props = {
  roomId: string;
  inviteCode?: string | null;
  initialSnapshot?: RoomSnapshot | null;
  presenceUser?: { id: string; name: string } | null;
  onMemberOnline?: (event: RoomMemberOnlineEvent) => void;
  disabled?: boolean;
  pollIntervalMs?: number;
  children: ReactNode;
};

type EngineProps = {
  roomId: string;
  inviteCode?: string | null;
  initialSnapshot?: RoomSnapshot | null;
  presenceUser?: { id: string; name: string } | null;
  onMemberOnline?: (event: RoomMemberOnlineEvent) => void;
  disabled?: boolean;
  pollIntervalMs?: number;
  actionsRef: React.MutableRefObject<MesaSyncActions>;
};

/** Roda useRoomSync sem re-renderizar filhos — só alimenta mesa-room-store. */
function MesaSyncEngine({
  roomId,
  inviteCode = null,
  initialSnapshot = null,
  presenceUser = null,
  onMemberOnline,
  disabled = false,
  pollIntervalMs,
  actionsRef,
}: EngineProps) {
  const store = useMemo(() => getMesaRoomStore(roomId), [roomId]);

  useEffect(() => {
    if (initialSnapshot) {
      store.patchSync({
        snapshot: initialSnapshot,
        loading: false,
        syncStatus: "live",
      });
    }
    return () => resetMesaRoomStore(roomId);
  }, [roomId, initialSnapshot, store]);

  const sync = useRoomSync(roomId, {
    inviteCode,
    initialSnapshot,
    presenceUser,
    onMemberOnline,
    disabled,
    pollIntervalMs,
  });

  actionsRef.current = {
    refresh: sync.refresh,
    applySnapshot: sync.applySnapshot,
    applyRoomResponse: sync.applyRoomResponse,
  };

  useEffect(() => {
    store.patchSync({
      snapshot: sync.snapshot,
      loading: sync.loading,
      syncError: sync.syncError,
      syncStatus: sync.syncStatus,
    });
  }, [store, sync.snapshot, sync.loading, sync.syncError, sync.syncStatus]);

  return null;
}

/** Ponte useRoomSync → mesa-room-store (slices) + actions estáveis. */
export function MesaSyncProvider({
  roomId,
  inviteCode = null,
  initialSnapshot = null,
  presenceUser = null,
  onMemberOnline,
  disabled = false,
  pollIntervalMs,
  children,
}: Props) {
  const actionsRef = useRef<MesaSyncActions>({
    refresh: async () => {},
    applySnapshot: () => {},
    applyRoomResponse: () => {},
  });

  const actions = useMemo<MesaSyncActions>(
    () => ({
      refresh: () => actionsRef.current.refresh(),
      applySnapshot: (data, opts) => actionsRef.current.applySnapshot(data, opts),
      applyRoomResponse: (payload, opts) => actionsRef.current.applyRoomResponse(payload, opts),
    }),
    []
  );

  const value = useMemo(() => ({ roomId, actions }), [roomId, actions]);

  return (
    <MesaSyncContext.Provider value={value}>
      <MesaSyncEngine
        roomId={roomId}
        inviteCode={inviteCode}
        initialSnapshot={initialSnapshot}
        presenceUser={presenceUser}
        onMemberOnline={onMemberOnline}
        disabled={disabled}
        pollIntervalMs={pollIntervalMs}
        actionsRef={actionsRef}
      />
      {children}
    </MesaSyncContext.Provider>
  );
}

export function useMesaSyncActions(): MesaSyncActions {
  const ctx = useContext(MesaSyncContext);
  if (!ctx) throw new Error("useMesaSyncActions requires MesaSyncProvider");
  return ctx.actions;
}

export function useMesaSyncRoomId(): string {
  const ctx = useContext(MesaSyncContext);
  if (!ctx) throw new Error("useMesaSyncRoomId requires MesaSyncProvider");
  return ctx.roomId;
}
