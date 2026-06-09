"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FriendSummary, MesaInviteSummary } from "@/lib/friends/types";
import "./friends.css";

function friendLabel(f: FriendSummary): string {
  return f.nickname ? `@${f.nickname}` : f.name;
}

function Avatar({ url, label }: { url: string | null; label: string }) {
  const initial = label.slice(0, 1).toUpperCase() || "?";
  if (url) {
    return (
      <span className="friends-hub__avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" />
      </span>
    );
  }
  return <span className="friends-hub__avatar">{initial}</span>;
}

export function FriendsHub() {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [invites, setInvites] = useState<MesaInviteSummary[]>([]);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(async () => {
    const [fRes, iRes] = await Promise.all([
      fetch("/api/friends", { cache: "no-store" }),
      fetch("/api/friends/invites", { cache: "no-store" }),
    ]);
    if (fRes.ok) {
      const data = (await fRes.json()) as { friends?: FriendSummary[] };
      setFriends(data.friends ?? []);
    }
    if (iRes.ok) {
      const data = (await iRes.json()) as { invites?: MesaInviteSummary[] };
      setInvites(data.invites ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível adicionar");
        return;
      }
      setNickname("");
      setOkMsg("Amigo adicionado.");
      await load();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function removeFriend(friendId: string) {
    setError("");
    const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Erro ao remover");
      return;
    }
    await load();
  }

  async function dismissInvite(inviteId: string) {
    await fetch(`/api/friends/invites/${inviteId}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="friends-hub">
      {invites.length > 0 ? (
        <section>
          <h2 className="friends-hub__section-title">Convites de mesa</h2>
          <ul className="friends-hub__invites">
            {invites.map((inv) => (
              <li key={inv.id} className="friends-hub__invite">
                <Avatar url={inv.fromAvatarUrl} label={inv.fromDisplayName} />
                <div className="friends-hub__meta">
                  <span className="friends-hub__name">{inv.roomName}</span>
                  <span className="friends-hub__sub">
                    de {inv.fromDisplayName}
                    {inv.message ? ` — “${inv.message}”` : ""}
                  </span>
                </div>
                <div className="friends-hub__actions">
                  <Link
                    href={`/mesa/${inv.roomId}?invite=${encodeURIComponent(inv.inviteCode)}`}
                    className="btn btn-sm"
                  >
                    Abrir mesa
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void dismissInvite(inv.id)}
                  >
                    Ignorar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="friends-hub__section-title">Amigos</h2>
        <p className="friends-hub__sub" style={{ margin: "0 0 0.65rem" }}>
          Adicione pelo apelido (ex.: <code>raulf</code>). Depois envie convites de mesa pelo painel
          Compartilhar na VTT.
        </p>
        <form className="friends-hub__add" onSubmit={addFriend}>
          <input
            className="input"
            placeholder="Apelido do amigo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="off"
            disabled={loading}
          />
          <button type="submit" className="btn btn-sm" disabled={loading || !nickname.trim()}>
            Adicionar
          </button>
        </form>
        {error ? <p className="friends-hub__err">{error}</p> : null}
        {okMsg ? <p className="friends-hub__ok">{okMsg}</p> : null}

        {friends.length === 0 ? (
          <p className="friends-hub__empty">Nenhum amigo ainda.</p>
        ) : (
          <ul className="friends-hub__list" style={{ marginTop: "0.75rem" }}>
            {friends.map((f) => (
              <li key={f.id} className="friends-hub__item">
                <Avatar url={f.avatarUrl} label={friendLabel(f)} />
                <div className="friends-hub__meta">
                  <span className="friends-hub__name">{friendLabel(f)}</span>
                  {f.nickname ? <span className="friends-hub__sub">{f.name}</span> : null}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void removeFriend(f.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
