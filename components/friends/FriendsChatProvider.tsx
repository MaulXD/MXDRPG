"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FriendSummary } from "@/lib/friends/types";
import "./friends.css";

const INVITE_POLL_MS = 30_000;
const UNREAD_POLL_MS = 4_000;
const fetchOpts = { credentials: "same-origin" as const, cache: "no-store" as const };

type FriendsChatContextValue = {
  selfUserId: string | null;
  inviteCount: number;
  requestCount: number;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  ready: boolean;
};

const FriendsChatContext = createContext<FriendsChatContextValue | null>(null);

export function useFriendsChat(): FriendsChatContextValue | null {
  return useContext(FriendsChatContext);
}

type ProviderProps = {
  children: ReactNode;
  initialUserId?: string | null;
};

export function FriendsChatProvider({ children, initialUserId = null }: ProviderProps) {
  const [ready, setReady] = useState(initialUserId != null);
  const [selfUserId, setSelfUserId] = useState<string | null>(initialUserId);
  const [inviteCount, setInviteCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/messages/unread", fetchOpts);
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount?: number };
      setUnreadCount(Math.max(0, data.unreadCount ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/invites", fetchOpts);
      if (!res.ok) return;
      const data = (await res.json()) as { invites?: unknown[] };
      setInviteCount(Array.isArray(data.invites) ? data.invites.length : 0);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshFriendRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/requests?countOnly=1", fetchOpts);
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      setRequestCount(Math.max(0, data.count ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", fetchOpts);
        if (res.ok) {
          const data = (await res.json()) as { user?: { id: string } };
          setSelfUserId(data.user?.id ?? null);
        }
      } finally {
        setReady(true);
      }
    })();
    void refreshInvites();
    void refreshFriendRequests();
    void refreshUnread();
    const inviteId = window.setInterval(() => {
      void refreshInvites();
      void refreshFriendRequests();
    }, INVITE_POLL_MS);
    const unreadId = window.setInterval(() => void refreshUnread(), UNREAD_POLL_MS);
    return () => {
      window.clearInterval(inviteId);
      window.clearInterval(unreadId);
    };
  }, [refreshInvites, refreshFriendRequests, refreshUnread]);

  useEffect(() => {
    if (!selfUserId) return;
    void refreshUnread();
  }, [selfUserId, refreshUnread]);

  const value = useMemo(
    () => ({
      selfUserId,
      inviteCount,
      requestCount,
      unreadCount,
      refreshUnread,
      ready,
    }),
    [selfUserId, inviteCount, requestCount, unreadCount, refreshUnread, ready]
  );

  return <FriendsChatContext.Provider value={value}>{children}</FriendsChatContext.Provider>;
}

/** @deprecated unused — kept for type compatibility if imported elsewhere */
export type { FriendSummary };
