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

const PRESENCE_POLL_MS = 20_000;

type Opts = {
  roomId: string;
  inviteCode?: string | null;
  enabled?: boolean;
  onMemberOnline?: (event: RoomMemberOnlineEvent) => void;
};

export function useRoomPresence({
  roomId,
  inviteCode,
  enabled = true,
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

  const handleMemberOnline = useCallback(
    (event: RoomMemberOnlineEvent) => {
      onMemberOnlineRef.current?.(event);
      void refresh();
    },
    [refresh]
  );

  const ownerDisplayNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of online) {
      map.set(member.userId, member.displayName);
    }
    return map;
  }, [online]);

  return { online, loading, refresh, handleMemberOnline, ownerDisplayNames };
}
