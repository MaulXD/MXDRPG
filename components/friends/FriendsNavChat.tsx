"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FriendsChat } from "@/components/friends/FriendsChat";
import { IconChat, IconClose } from "@/components/ui/EldarinIcons";
import type { FriendSummary } from "@/lib/friends/types";
import "./friends.css";

const INVITE_POLL_MS = 30_000;

export function FriendsNavChat() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
      setReady(true);
    }
  }, [refreshInvites]);

  useEffect(() => {
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
    const id = window.setInterval(() => void refreshInvites(), INVITE_POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshInvites]);

  useEffect(() => {
    if (!open) return;
    void loadSessionAndFriends();
  }, [open, loadSessionAndFriends]);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      const root = rootRef.current;
      if (!root?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready || !selfUserId) return null;

  return (
    <div className="friends-nav-chat" ref={rootRef}>
      <button
        type="button"
        className={`nav-link friends-nav-chat__toggle${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <IconChat size={16} className="friends-nav-chat__icon" />
        Mensagens
        {inviteCount > 0 ? (
          <span className="friends-nav-badge__count" aria-label={`${inviteCount} convites pendentes`}>
            {inviteCount > 9 ? "9+" : inviteCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="friends-nav-chat__panel glass" role="dialog" aria-label="Mensagens com amigos">
          <header className="friends-nav-chat__head">
            <h2 className="friends-nav-chat__title">Mensagens</h2>
            <div className="friends-nav-chat__head-actions">
              <Link
                href="/eldarin#amigos"
                className="friends-nav-chat__hub-link"
                onClick={() => setOpen(false)}
              >
                Amigos
                {inviteCount > 0 ? ` (${inviteCount})` : ""}
              </Link>
              <button
                type="button"
                className="friends-nav-chat__close"
                aria-label="Fechar mensagens"
                onClick={() => setOpen(false)}
              >
                <IconClose size={18} />
              </button>
            </div>
          </header>

          {loading && friends.length === 0 ? (
            <p className="friends-nav-chat__hint">Carregando…</p>
          ) : (
            <FriendsChat friends={friends} selfUserId={selfUserId!} variant="nav" />
          )}
        </div>
      ) : null}
    </div>
  );
}
