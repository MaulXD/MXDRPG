"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { FriendSummary } from "@/lib/friends/types";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import "./friends.css";

type FriendMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
};

const POLL_MS = 4_000;

function friendLabel(f: FriendSummary): string {
  return f.nickname ? `@${f.nickname}` : f.name;
}

type Props = {
  friends: FriendSummary[];
  selfUserId: string;
  onFriendsChange?: () => void;
};

export function FriendsChat({ friends, selfUserId, onFriendsChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const lastTsRef = useRef(0);

  const selected = friends.find((f) => f.id === selectedId) ?? null;

  const scrollToBottom = useCallback(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const loadMessages = useCallback(
    async (friendId: string, initial = false) => {
      const after = initial ? 0 : lastTsRef.current;
      const q = after > 0 ? `?after=${after}` : "";
      const res = await fetch(`/api/friends/${friendId}/messages${q}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: FriendMessage[] };
      const batch = data.messages ?? [];
      if (!batch.length) return;
      setMessages((prev) => {
        if (initial) return batch;
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        for (const m of batch) {
          if (!ids.has(m.id)) merged.push(m);
        }
        return merged.sort((a, b) => a.createdAt - b.createdAt);
      });
      lastTsRef.current = Math.max(lastTsRef.current, ...batch.map((m) => m.createdAt));
    },
    []
  );

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      lastTsRef.current = 0;
      return;
    }
    setLoading(true);
    setError("");
    void loadMessages(selectedId, true)
      .catch(() => setError("Não foi possível carregar mensagens."))
      .finally(() => {
        setLoading(false);
        scrollToBottom();
      });
  }, [selectedId, loadMessages, scrollToBottom]);

  useEffect(() => {
    if (!selectedId) return;
    const id = window.setInterval(() => {
      void loadMessages(selectedId).then(scrollToBottom);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [selectedId, loadMessages, scrollToBottom]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || sending) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/friends/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: FriendMessage };
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar");
        return;
      }
      if (data.message) {
        setMessages((prev) => [...prev, data.message!]);
        lastTsRef.current = Math.max(lastTsRef.current, data.message.createdAt);
      }
      setDraft("");
      scrollToBottom();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSending(false);
    }
  }

  function pickFriend(id: string) {
    setSelectedId(id);
    setDraft("");
    setMessages([]);
    lastTsRef.current = 0;
  }

  return (
    <div className="friends-chat">
      <aside className="friends-chat__list">
        <h3 className="friends-chat__list-title">Conversas</h3>
        {friends.length === 0 ? (
          <p className="friends-hub__empty">Adicione amigos para conversar.</p>
        ) : (
          <ul className="friends-chat__friends">
            {friends.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={`friends-chat__friend${selectedId === f.id ? " is-active" : ""}`}
                  onClick={() => pickFriend(f.id)}
                >
                  <UserAvatar
                    url={f.avatarUrl}
                    focus={f.avatarFocus as PortraitFocus | null}
                    label={friendLabel(f)}
                    className="friends-hub__avatar"
                  />
                  <span className="friends-chat__friend-name">{friendLabel(f)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="friends-chat__thread">
        {!selected ? (
          <p className="friends-chat__placeholder">Selecione um amigo para abrir a conversa.</p>
        ) : (
          <>
            <header className="friends-chat__header">
              <UserAvatar
                url={selected.avatarUrl}
                focus={selected.avatarFocus as PortraitFocus | null}
                label={friendLabel(selected)}
                className="friends-hub__avatar"
              />
              <span className="friends-chat__header-name">{friendLabel(selected)}</span>
            </header>

            <div className="friends-chat__messages" ref={threadRef}>
              {loading && messages.length === 0 ? (
                <p className="friends-hub__sub">Carregando…</p>
              ) : null}
              {messages.map((m) => {
                const mine = m.fromUserId === selfUserId;
                return (
                  <div
                    key={m.id}
                    className={`friends-chat__bubble${mine ? " friends-chat__bubble--mine" : ""}`}
                  >
                    <p className="friends-chat__bubble-body">{m.body}</p>
                    <time className="friends-chat__bubble-time" dateTime={String(m.createdAt)}>
                      {new Date(m.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                );
              })}
            </div>

            <form className="friends-chat__composer" onSubmit={sendMessage}>
              <textarea
                className="input friends-chat__input"
                rows={2}
                maxLength={2000}
                placeholder="Escreva uma mensagem…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn btn-sm" disabled={sending || !draft.trim()}>
                Enviar
              </button>
            </form>
            {error ? <p className="friends-hub__err">{error}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
