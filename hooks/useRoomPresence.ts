"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RoomMemberOnlineEvent } from "@/hooks/useRoomSync";

export type RoomPresenceMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  characterPortraitUrl: string | null;
  role: "gm" | "player";
  characterName: string | null;
  isOwner: boolean;
};

const PRESENCE_POLL_MS = 10_000;

type Opts = {
  roomId: string;
  inviteCode?: string | null;
  enabled?: boolean;
  /** Usuário logado na mesa — envia heartbeat e aparece na lista */
  presenceUser?: { id: string; name: string; avatarUrl?: string | null } | null;
  isRoomOwner?: boolean;
  onMemberOnline?: (event: RoomMemberOnlineEvent) => void;
};

export function useRoomPresence({
  roomId,
  inviteCode,
  enabled = true,
  presenceUser = null,
  isRoomOwner = false,
  onMemberOnline,
}: Opts) {
  const [online, setOnline] = useState<RoomPresenceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const onMemberOnlineRef = useRef(onMemberOnline);
  onMemberOnlineRef.current = onMemberOnline;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (inviteCode?.trim()) q.set("invite", inviteCode.trim());
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [inviteCode]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(`/api/room/${roomId}/presence${query}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { online?: RoomPresenceMember[] };
      setOnline(
        Array.isArray(data.online)
          ? data.online.map((m) => ({
              ...m,
              characterPortraitUrl: m.characterPortraitUrl ?? null,
            }))
          : []
      );
    } catch {
      /* rede instável */
    } finally {
      setLoading(false);
    }
  }, [enabled, roomId, query]);

  const heartbeat = useCallback(async () => {
    if (!enabled || !presenceUser?.id) return;
    try {
      await fetch(`/api/room/${roomId}/presence${query}`, {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* rede instável */
    }
    await refresh();
  }, [enabled, presenceUser?.id, roomId, query, refresh]);

  useEffect(() => {
    if (!enabled) {
      setOnline([]);
      setLoading(false);
      return;
    }
    void refresh();
    const id = setInterval(() => void refresh(), PRESENCE_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !presenceUser?.id) return;
    void heartbeat();
    const id = setInterval(() => void heartbeat(), PRESENCE_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, heartbeat, presenceUser?.id]);

  const handleMemberOnline = useCallback(
    (event: RoomMemberOnlineEvent) => {
      onMemberOnlineRef.current?.(event);
      void refresh();
    },
    [refresh]
  );

  const displayOnline = useMemo(() => {
    if (!presenceUser?.id) return online;
    if (online.some((m) => m.userId === presenceUser.id)) return online;
    return [
      {
        userId: presenceUser.id,
        displayName: presenceUser.name.trim() || "Jogador",
        avatarUrl: presenceUser.avatarUrl ?? null,
        characterPortraitUrl: null,
        role: isRoomOwner ? ("gm" as const) : ("player" as const),
        characterName: null,
        isOwner: isRoomOwner,
      },
      ...online,
    ];
  }, [online, presenceUser, isRoomOwner]);

  const ownerDisplayNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of displayOnline) {
      map.set(member.userId, member.displayName);
    }
    return map;
  }, [displayOnline]);

  return {
    online: displayOnline,
    loading,
    refresh,
    handleMemberOnline,
    ownerDisplayNames,
  };
}
