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
import { FriendsMessengerDock } from "@/components/friends/FriendsMessengerDock";
import type { FriendSummary } from "@/lib/friends/types";
import "./friends.css";

// P-01: um único pedido (/api/friends/pulse) a cada 15 s, só com a aba visível.
// Com a mesa parada antes eram 27 pedidos/min por jogador (4 s + 10 s + 10 s).
const PULSE_MS = 15_000;
const fetchOpts = { credentials: "same-origin" as const, cache: "no-store" as const };

type FriendsChatContextValue = {
  selfUserId: string | null;
  inviteCount: number;
  requestCount: number;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  ready: boolean;
  friends: FriendSummary[];
  refreshFriends: () => Promise<void>;
  messengerOpen: boolean;
  messengerMinimized: boolean;
  openChats: string[];
  activeChatId: string | null;
  toggleMessenger: () => void;
  openMessenger: () => void;
  closeMessenger: () => void;
  minimizeMessenger: () => void;
  restoreMessenger: () => void;
  openChat: (friendId: string) => void;
  closeChat: (friendId: string) => void;
  setActiveChatId: (friendId: string) => void;
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
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [messengerMinimized, setMessengerMinimized] = useState(false);
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/pulse", fetchOpts);
      if (!res.ok) return;
      const data = (await res.json()) as { unread?: number; invites?: number; requestsCount?: number };
      setUnreadCount(Math.max(0, data.unread ?? 0));
      setInviteCount(Math.max(0, data.invites ?? 0));
      setRequestCount(Math.max(0, data.requestsCount ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshFriends = useCallback(async () => {
    if (!selfUserId) return;
    try {
      const res = await fetch("/api/friends", fetchOpts);
      if (!res.ok) return;
      const data = (await res.json()) as { friends?: FriendSummary[] };
      setFriends(data.friends ?? []);
    } catch {
      /* ignore */
    }
  }, [selfUserId]);

  const openMessenger = useCallback(() => {
    setMessengerOpen(true);
    setMessengerMinimized(false);
    void refreshFriends();
  }, [refreshFriends]);

  const closeMessenger = useCallback(() => {
    setMessengerOpen(false);
    setMessengerMinimized(false);
  }, []);

  const minimizeMessenger = useCallback(() => {
    setMessengerOpen(true);
    setMessengerMinimized(true);
  }, []);

  const restoreMessenger = useCallback(() => {
    setMessengerOpen(true);
    setMessengerMinimized(false);
    void refreshFriends();
  }, [refreshFriends]);

  const toggleMessenger = useCallback(() => {
    if (!messengerOpen) {
      openMessenger();
      return;
    }
    if (messengerMinimized) {
      restoreMessenger();
      return;
    }
    closeMessenger();
  }, [messengerOpen, messengerMinimized, openMessenger, restoreMessenger, closeMessenger]);

  const openChat = useCallback((friendId: string) => {
    setOpenChats((prev) => (prev.includes(friendId) ? prev : [...prev, friendId]));
    setActiveChatId(friendId);
  }, []);

  const closeChat = useCallback((friendId: string) => {
    setOpenChats((prev) => {
      const next = prev.filter((id) => id !== friendId);
      setActiveChatId((cur) => {
        if (cur !== friendId) return cur;
        return next.length > 0 ? next[next.length - 1]! : null;
      });
      return next;
    });
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
    // Polling só com a aba visível: pausa ao esconder e faz uma leitura ao voltar ou ao focar a janela.
    let timer: number | null = null;
    const stop = () => {
      if (timer != null) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      if (timer == null) timer = window.setInterval(() => void refreshUnread(), PULSE_MS);
    };
    const onVisibleOrFocus = () => {
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }
      void refreshUnread();
      start();
    };
    onVisibleOrFocus();
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    window.addEventListener("focus", onVisibleOrFocus);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
      window.removeEventListener("focus", onVisibleOrFocus);
    };
  }, [refreshUnread]);

  useEffect(() => {
    if (!selfUserId) return;
    // Ao entrar na conta sem recarregar, os contadores não esperam o próximo pulso.
    void refreshUnread();
    void refreshFriends();
  }, [selfUserId, refreshUnread, refreshFriends]);

  const value = useMemo(
    () => ({
      selfUserId,
      inviteCount,
      requestCount,
      unreadCount,
      refreshUnread,
      ready,
      friends,
      refreshFriends,
      messengerOpen,
      messengerMinimized,
      openChats,
      activeChatId,
      toggleMessenger,
      openMessenger,
      closeMessenger,
      minimizeMessenger,
      restoreMessenger,
      openChat,
      closeChat,
      setActiveChatId,
    }),
    [
      selfUserId,
      inviteCount,
      requestCount,
      unreadCount,
      refreshUnread,
      ready,
      friends,
      refreshFriends,
      messengerOpen,
      messengerMinimized,
      openChats,
      activeChatId,
      toggleMessenger,
      openMessenger,
      closeMessenger,
      minimizeMessenger,
      restoreMessenger,
      openChat,
      closeChat,
    ]
  );

  return (
    <FriendsChatContext.Provider value={value}>
      {children}
      <FriendsMessengerDock />
    </FriendsChatContext.Provider>
  );
}

/** @deprecated unused — kept for type compatibility if imported elsewhere */
export type { FriendSummary };
