"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FriendsChat } from "@/components/friends/FriendsChat";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { FriendRequestSummary, FriendSummary, MesaInviteSummary } from "@/lib/friends/types";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import "./friends.css";

function friendLabel(f: FriendSummary): string {
  return f.nickname ? `@${f.nickname}` : f.name;
}

type Props = {
  selfUserId: string;
};

export function FriendsHub({ selfUserId }: Props) {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestSummary[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestSummary[]>([]);
  const [invites, setInvites] = useState<MesaInviteSummary[]>([]);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(async () => {
    const [fRes, rRes, iRes] = await Promise.all([
      fetch("/api/friends", { cache: "no-store" }),
      fetch("/api/friends/requests", { cache: "no-store" }),
      fetch("/api/friends/invites", { cache: "no-store" }),
    ]);
    if (fRes.ok) {
      const data = (await fRes.json()) as { friends?: FriendSummary[] };
      setFriends(data.friends ?? []);
    }
    if (rRes.ok) {
      const data = (await rRes.json()) as {
        incoming?: FriendRequestSummary[];
        outgoing?: FriendRequestSummary[];
      };
      setIncomingRequests(data.incoming ?? []);
      setOutgoingRequests(data.outgoing ?? []);
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
      const data = (await res.json().catch(() => ({}))) as { error?: string; kind?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o pedido");
        return;
      }
      setNickname("");
      if (data.kind === "friend") {
        setOkMsg("Pedido aceito — vocês já são amigos.");
      } else {
        setOkMsg("Pedido de amizade enviado.");
      }
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

  async function acceptRequest(requestId: string) {
    setError("");
    const res = await fetch(`/api/friends/requests/${requestId}/accept`, { method: "POST" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Erro ao aceitar");
      return;
    }
    setOkMsg("Amizade aceita.");
    await load();
  }

  async function dismissRequest(requestId: string) {
    setError("");
    await fetch(`/api/friends/requests/${requestId}`, { method: "DELETE" });
    await load();
  }

  function requestLabel(req: FriendRequestSummary): string {
    if (req.fromNickname) return `@${req.fromNickname}`;
    return req.fromDisplayName;
  }

  function outgoingLabel(req: FriendRequestSummary): string {
    if (req.toNickname) return `@${req.toNickname}`;
    return req.toDisplayName;
  }

  return (
    <div className="friends-hub" id="amigos">
      {incomingRequests.length > 0 ? (
        <section>
          <h2 className="friends-hub__section-title">Pedidos de amizade</h2>
          <ul className="friends-hub__invites">
            {incomingRequests.map((req) => (
              <li key={req.id} className="friends-hub__invite friends-hub__invite--request">
                <UserAvatar
                  url={req.fromAvatarUrl}
                  label={requestLabel(req)}
                  className="friends-hub__avatar"
                />
                <div className="friends-hub__meta">
                  <span className="friends-hub__name">{requestLabel(req)}</span>
                  <span className="friends-hub__sub">quer ser seu amigo</span>
                </div>
                <div className="friends-hub__actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void acceptRequest(req.id)}
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void dismissRequest(req.id)}
                  >
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {outgoingRequests.length > 0 ? (
        <section>
          <h2 className="friends-hub__section-title">Aguardando resposta</h2>
          <ul className="friends-hub__list">
            {outgoingRequests.map((req) => (
              <li key={req.id} className="friends-hub__item friends-hub__item--pending">
                <UserAvatar
                  url={req.toAvatarUrl}
                  label={outgoingLabel(req)}
                  className="friends-hub__avatar"
                />
                <div className="friends-hub__meta">
                  <span className="friends-hub__name">{outgoingLabel(req)}</span>
                  <span className="friends-hub__sub">pedido enviado</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void dismissRequest(req.id)}
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {invites.length > 0 ? (
        <section>
          <h2 className="friends-hub__section-title">Convites de mesa</h2>
          <ul className="friends-hub__invites">
            {invites.map((inv) => (
              <li key={inv.id} className="friends-hub__invite">
                <UserAvatar url={inv.fromAvatarUrl} label={inv.fromDisplayName} className="friends-hub__avatar" />
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
          Envie um pedido pelo apelido (ex.: <code>raulf</code>). A outra pessoa precisa aceitar
          antes de aparecer na lista. Depois, use Compartilhar na VTT para convites de mesa.
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
            Enviar pedido
          </button>
        </form>
        {error ? <p className="friends-hub__err">{error}</p> : null}
        {okMsg ? <p className="friends-hub__ok">{okMsg}</p> : null}

        {friends.length > 0 ? (
          <ul className="friends-hub__list" style={{ marginTop: "0.75rem" }}>
            {friends.map((f) => (
              <li key={f.id} className="friends-hub__item">
                <UserAvatar
                  url={f.avatarUrl}
                  focus={f.avatarFocus as PortraitFocus | null}
                  label={friendLabel(f)}
                  className="friends-hub__avatar"
                />
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
        ) : (
          <p className="friends-hub__empty">Nenhum amigo ainda.</p>
        )}
      </section>

      <section className="friends-hub__chat-section">
        <h2 className="friends-hub__section-title">Mensagens</h2>
        <FriendsChat friends={friends} selfUserId={selfUserId} onFriendsChange={load} />
      </section>
    </div>
  );
}
