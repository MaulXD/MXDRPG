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
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/friends", { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) return;
    const data = (await res.json()) as { friends?: FriendSummary[] };
    setFriends(data.friends ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendInvite(payload: { friendId?: string; nickname?: string }) {
    setLoading(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          adventureId,
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar");
        return;
      }
      setOkMsg("Convite enviado — aparecerá em Suas mesas do jogador.");
      setMessage("");
      setFriendId("");
      setNickname("");
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="send-mesa-invite">
      <span className="room-invite-panel__label">Enviar convite in-app</span>

      {friends.length > 0 ? (
        <div className="send-mesa-invite__row">
          <select
            className="input"
            value={friendId}
            onChange={(e) => {
              setFriendId(e.target.value);
              if (e.target.value) setNickname("");
            }}
            aria-label="Amigo"
            disabled={loading}
          >
            <option value="">Amigo da lista…</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nickname ? `@${f.nickname}` : f.displayName}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="vtt-btn vtt-btn--ghost vtt-btn--compact"
            disabled={loading || !friendId}
            onClick={() => void sendInvite({ friendId })}
          >
            Enviar
          </button>
        </div>
      ) : null}

      <div className="send-mesa-invite__row send-mesa-invite__row--nickname">
        <input
          className="input"
          placeholder="Ou apelido @usuario"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            if (e.target.value) setFriendId("");
          }}
          disabled={loading}
          aria-label="Apelido do jogador"
        />
        <button
          type="button"
          className="vtt-btn vtt-btn--ghost vtt-btn--compact"
          disabled={loading || !nickname.trim()}
          onClick={() => void sendInvite({ nickname: nickname.trim() })}
        >
          Enviar
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
