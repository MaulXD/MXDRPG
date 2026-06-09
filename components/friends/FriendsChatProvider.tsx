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
import { createPortal } from "react-dom";
import Link from "next/link";
import { FriendsChat } from "@/components/friends/FriendsChat";
import { IconClose } from "@/components/ui/EldarinIcons";
import type { FriendSummary } from "@/lib/friends/types";
import "./friends.css";

const INVITE_POLL_MS = 30_000;
const UNREAD_POLL_MS = 4_000;

type FriendsChatContextValue = {
  open: boolean;
  toggle: () => void;
  openChat: () => void;
  closeChat: () => void;
  selfUserId: string | null;
  inviteCount: number;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  ready: boolean;
};

const FriendsChatContext = createContext<FriendsChatContextValue | null>(null);

export function useFriendsChat(): FriendsChatContextValue | null {
  return useContext(FriendsChatContext);
}

function FriendsChatFloatingWindow({
  friends,
  selfUserId,
  inviteCount,
  loading,
  onClose,
}: {
  friends: FriendSummary[];
  selfUserId: string;
  inviteCount: number;
  loading: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="friends-chat-float" role="dialog" aria-label="Mensagens com amigos">
      <header className="friends-chat-float__head">
        <h2 className="friends-chat-float__title">Mensagens</h2>
        <div className="friends-chat-float__actions">
          <Link href="/eldarin#amigos" className="friends-chat-float__hub" onClick={onClose}>
            Gerenciar amigos
            {inviteCount > 0 ? ` (${inviteCount})` : ""}
          </Link>
          <button
            type="button"
            className="friends-chat-float__close"
            aria-label="Fechar mensagens"
            onClick={onClose}
          >
            <IconClose size={18} />
          </button>
        </div>
      </header>

      <div className="friends-chat-float__body">
        {loading && friends.length === 0 ? (
          <p className="friends-chat-float__hint">Carregando…</p>
        ) : (
          <FriendsChat
            friends={friends}
            selfUserId={selfUserId}
            variant="float"
            onMessagesRead={refreshUnread}
          />
        )}
      </div>
    </div>
  );
}

export function FriendsChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [inviteCount, setInviteCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/messages/unread", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount?: number };
      setUnreadCount(Math.max(0, data.unreadCount ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/invites", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { invites?: unknown[] };
      setInviteCount(Array.isArray(data.invites) ? data.invites.length : 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadSessionAndFriends = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, friendsRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/friends", { cache: "no-store" }),
      ]);
      if (meRes.ok) {
        const me = (await meRes.json()) as { user?: { id: string } };
        setSelfUserId(me.user?.id ?? null);
      } else {
        setSelfUserId(null);
      }
      if (friendsRes.ok) {
        const data = (await friendsRes.json()) as { friends?: FriendSummary[] };
        setFriends(data.friends ?? []);
      }
      await refreshInvites();
    } finally {
      setLoading(false);
    }
  }, [refreshInvites]);

  useEffect(() => {
    setMounted(true);
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { user?: { id: string } };
          setSelfUserId(data.user?.id ?? null);
        }
      } finally {
        setReady(true);
      }
    })();
    void refreshInvites();
    void refreshUnread();
    const inviteId = window.setInterval(() => void refreshInvites(), INVITE_POLL_MS);
    const unreadId = window.setInterval(() => void refreshUnread(), UNREAD_POLL_MS);
    return () => {
      window.clearInterval(inviteId);
      window.clearInterval(unreadId);
    };
  }, [refreshInvites, refreshUnread]);

  useEffect(() => {
    if (!selfUserId) return;
    void refreshUnread();
  }, [selfUserId, refreshUnread]);

  useEffect(() => {
    if (!open) return;
    void loadSessionAndFriends();
    void refreshUnread();
    const id = window.setInterval(() => {
      void loadSessionAndFriends();
      void refreshUnread();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [open, loadSessionAndFriends, refreshUnread]);

  const closeChat = useCallback(() => setOpen(false), []);
  const openChat = useCallback(() => setOpen(true), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      open,
      toggle,
      openChat,
      closeChat,
      selfUserId,
      inviteCount,
      unreadCount,
      refreshUnread,
      ready,
    }),
    [open, toggle, openChat, closeChat, selfUserId, inviteCount, unreadCount, refreshUnread, ready]
  );

  return (
    <FriendsChatContext.Provider value={value}>
      {children}
      {mounted && open && selfUserId
        ? createPortal(
            <FriendsChatFloatingWindow
              friends={friends}
              selfUserId={selfUserId}
              inviteCount={inviteCount}
              loading={loading}
              onClose={closeChat}
            />,
            document.body
          )
        : null}
    </FriendsChatContext.Provider>
  );
}
