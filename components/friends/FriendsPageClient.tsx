"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FriendsChat } from "@/components/friends/FriendsChat";
import { friendLabel } from "@/components/friends/friend-label";
import { PlayerProfileCard } from "@/components/friends/PlayerProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import type { FriendRequestSummary, FriendSummary, MesaInviteSummary } from "@/lib/friends/types";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import "./friends.css";

const fetchOpts = { credentials: "same-origin" as const, cache: "no-store" as const };

type Props = {
  selfUserId: string;
};

type SidebarTab = "friends" | "incoming" | "outgoing";

export function FriendsPageClient({ selfUserId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notify = useFriendsChat();

  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestSummary[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestSummary[]>([]);
  const [invites, setInvites] = useState<MesaInviteSummary[]>([]);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("friends");

  const load = useCallback(async () => {
    const [fRes, rRes, iRes] = await Promise.all([
      fetch("/api/friends", fetchOpts),
      fetch("/api/friends/requests", fetchOpts),
      fetch("/api/friends/invites", fetchOpts),
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
    void notify?.refreshUnread();
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const com = searchParams.get("com");
    if (com && friends.some((f) => f.id === com)) {
      setChatUserId(com);
      setPreviewUserId(com);
    }
  }, [searchParams, friends]);

  function openChat(friendId: string) {
    setChatUserId(friendId);
    setPreviewUserId(friendId);
    router.replace(`/amigos?com=${encodeURIComponent(friendId)}`, { scroll: false });
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; kind?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o pedido");
        return;
      }
      setNickname("");
      setOkMsg(data.kind === "friend" ? "Amizade aceita!" : "Pedido de amizade enviado.");
      if (data.kind !== "friend") setSidebarTab("outgoing");
      await load();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function addFriendByUserId(userId: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Erro ao adicionar");
      throw new Error(data.error ?? "Erro");
    }
    setOkMsg("Pedido enviado.");
    await load();
  }

  async function acceptRequest(requestId: string) {
    setError("");
    const res = await fetch(`/api/friends/requests/${requestId}/accept`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Erro ao aceitar");
      return;
    }
    setOkMsg("Amizade aceita.");
    await load();
  }

  async function dismissRequest(requestId: string) {
    await fetch(`/api/friends/requests/${requestId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    await load();
  }

  async function removeFriend(friendId: string) {
    setError("");
    const res = await fetch(`/api/friends/${friendId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Erro ao remover");
      return;
    }
    if (chatUserId === friendId) setChatUserId(null);
    if (previewUserId === friendId) setPreviewUserId(null);
    await load();
  }

  async function dismissInvite(inviteId: string) {
    await fetch(`/api/friends/invites/${inviteId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
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

  function renderRequestRow(
    req: FriendRequestSummary,
    mode: "incoming" | "outgoing"
  ) {
    const isIncoming = mode === "incoming";
    const avatarUrl = isIncoming ? req.fromAvatarUrl : req.toAvatarUrl;
    const label = isIncoming ? requestLabel(req) : outgoingLabel(req);
    const sub = isIncoming ? "quer ser seu amigo" : "aguardando resposta";

    return (
      <li key={req.id} className="friends-page__request">
        <button
          type="button"
          className="friends-page__request-main"
          onClick={() => setPreviewUserId(isIncoming ? req.fromUserId : req.toUserId)}
        >
          <UserAvatar url={avatarUrl} label={label} className="friends-hub__avatar" />
          <div className="friends-hub__meta">
            <span className="friends-hub__name">{label}</span>
            <span className="friends-hub__sub">{sub}</span>
          </div>
        </button>
        <div className="friends-hub__actions">
          {isIncoming ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => void acceptRequest(req.id)}>
                Aceitar
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void dismissRequest(req.id)}>
                Recusar
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void dismissRequest(req.id)}>
              Cancelar
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="friends-page">
      {invites.length > 0 ? (
        <section className="friends-page__alerts">
          {invites.map((inv) => (
            <div key={inv.id} className="friends-page__alert">
              <UserAvatar url={inv.fromAvatarUrl} label={inv.fromDisplayName} className="friends-hub__avatar" />
              <div className="friends-hub__meta">
                <span className="friends-hub__name">{inv.roomName}</span>
                <span className="friends-hub__sub">convite de {inv.fromDisplayName}</span>
              </div>
              <div className="friends-hub__actions">
                <Link
                  href={inv.inviteUrl}
                  className="btn btn-sm"
                >
                  Abrir mesa
                </Link>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void dismissInvite(inv.id)}>
                  Ignorar
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <div className="friends-page__grid">
        <aside className="friends-page__sidebar">
          <nav className="friends-page__tabs" aria-label="Listas de amigos">
            <button
              type="button"
              className={`friends-page__tab${sidebarTab === "friends" ? " is-active" : ""}`}
              onClick={() => setSidebarTab("friends")}
            >
              Amigos
            </button>
            <button
              type="button"
              className={`friends-page__tab${sidebarTab === "incoming" ? " is-active" : ""}`}
              onClick={() => setSidebarTab("incoming")}
            >
              Recebidos
              {incomingRequests.length > 0 ? (
                <span className="friends-page__tab-badge">{incomingRequests.length}</span>
              ) : null}
            </button>
            <button
              type="button"
              className={`friends-page__tab${sidebarTab === "outgoing" ? " is-active" : ""}`}
              onClick={() => setSidebarTab("outgoing")}
            >
              Enviados
              {outgoingRequests.length > 0 ? (
                <span className="friends-page__tab-badge">{outgoingRequests.length}</span>
              ) : null}
            </button>
          </nav>

          {sidebarTab === "friends" ? (
            <>
              <form className="friends-hub__add" onSubmit={addFriend}>
                <input
                  className="input"
                  placeholder="Apelido @usuario"
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

              {friends.length > 0 ? (
                <ul className="friends-page__friend-list">
                  {friends.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className={`friends-page__friend${chatUserId === f.id ? " is-active" : ""}`}
                        onClick={() => openChat(f.id)}
                      >
                        <UserAvatar
                          url={f.avatarUrl}
                          focus={f.avatarFocus as PortraitFocus | null}
                          label={friendLabel(f)}
                          className="friends-hub__avatar"
                        />
                        <span className="friends-page__friend-name">{friendLabel(f)}</span>
                      </button>
                      <button
                        type="button"
                        className="friends-page__friend-preview"
                        aria-label={`Ver perfil de ${friendLabel(f)}`}
                        onClick={() => setPreviewUserId(f.id)}
                      >
                        ⋯
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="friends-hub__empty">Nenhum amigo ainda — adicione pelo apelido.</p>
              )}
            </>
          ) : null}

          {sidebarTab === "incoming" ? (
            incomingRequests.length > 0 ? (
              <ul className="friends-page__request-list">
                {incomingRequests.map((req) => renderRequestRow(req, "incoming"))}
              </ul>
            ) : (
              <p className="friends-hub__empty">Nenhum pedido recebido.</p>
            )
          ) : null}

          {sidebarTab === "outgoing" ? (
            outgoingRequests.length > 0 ? (
              <ul className="friends-page__request-list">
                {outgoingRequests.map((req) => renderRequestRow(req, "outgoing"))}
              </ul>
            ) : (
              <p className="friends-hub__empty">Nenhum pedido enviado.</p>
            )
          ) : null}
        </aside>

        <div className="friends-page__main">
          <FriendsChat
            friends={friends}
            selfUserId={selfUserId}
            initialSelectedId={chatUserId}
            hideList
            onSelectFriend={setPreviewUserId}
            onMessagesRead={() => void notify?.refreshUnread()}
          />
        </div>

        <aside className="friends-page__profile">
          <h2 className="friends-hub__section-title">Perfil</h2>
          {previewUserId ? (
            <>
              <PlayerProfileCard
                userId={previewUserId}
                selfUserId={selfUserId}
                onAddFriend={addFriendByUserId}
                onAcceptRequest={acceptRequest}
                onMessage={(id) => openChat(id)}
              />
              {friends.some((f) => f.id === previewUserId) ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm friends-page__remove"
                  onClick={() => void removeFriend(previewUserId)}
                >
                  Remover amigo
                </button>
              ) : null}
            </>
          ) : (
            <p className="friends-hub__sub">
              Selecione um amigo na lista ou na conversa para ver o perfil.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
