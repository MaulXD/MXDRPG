"use client";

import { useCallback, useEffect, useState } from "react";
import type { FriendSummary } from "@/lib/friends/types";
import "./friends.css";

type Props = {
  adventureId: string;
};

export function SendMesaInvitePicker({ adventureId }: Props) {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendId, setFriendId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/friends", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { friends?: FriendSummary[] };
    setFriends(data.friends ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendInvite() {
    if (!friendId) return;
    setLoading(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, adventureId, message: message.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar");
        return;
      }
      setOkMsg("Convite enviado — seu amigo verá em Suas mesas.");
      setMessage("");
      setFriendId("");
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (friends.length === 0) {
    return (
      <div className="send-mesa-invite">
        <p className="room-invite-panel__hint" style={{ margin: 0 }}>
          Adicione amigos pelo apelido em{" "}
          <a href="/eldarin" className="text-link">
            Suas mesas
          </a>{" "}
          para enviar convites por aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="send-mesa-invite">
      <span className="room-invite-panel__label">Enviar para amigo</span>
      <div className="send-mesa-invite__row">
        <select
          className="input"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          aria-label="Amigo"
          disabled={loading}
        >
          <option value="">Escolha um amigo…</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nickname ? `@${f.nickname}` : f.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="vtt-btn vtt-btn--ghost vtt-btn--compact"
          disabled={loading || !friendId}
          onClick={() => void sendInvite()}
        >
          Enviar convite
        </button>
      </div>
      <input
        className="input send-mesa-invite__msg"
        placeholder="Mensagem opcional"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={280}
        disabled={loading}
      />
      {error ? <p className="friends-hub__err">{error}</p> : null}
      {okMsg ? <p className="friends-hub__ok">{okMsg}</p> : null}
    </div>
  );
}
