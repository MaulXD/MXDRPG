"use client";

import { useCallback, useEffect, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { profileLabel } from "@/components/friends/friend-label";
import type { PublicUserProfile } from "@/lib/friends/types";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import "./friends.css";

type Props = {
  userId: string;
  selfUserId?: string;
  /** Dados já carregados — evita fetch */
  initialProfile?: PublicUserProfile | null;
  /** Contexto opcional (ex.: mesa online) */
  contextRole?: string | null;
  contextSheet?: string | null;
  onAddFriend?: (userId: string) => Promise<void>;
  onAcceptRequest?: (requestId: string) => Promise<void>;
  onMessage?: (userId: string) => void;
  className?: string;
  compact?: boolean;
};

function relationshipLabel(profile: PublicUserProfile): string {
  switch (profile.relationship) {
    case "self":
      return "Você";
    case "friend":
      return "Amigo";
    case "incoming":
      return "Pediu amizade";
    case "outgoing":
      return "Pedido enviado";
    default:
      return "Jogador";
  }
}

export function PlayerProfileCard({
  userId,
  selfUserId,
  initialProfile = null,
  contextRole,
  contextSheet,
  onAddFriend,
  onAcceptRequest,
  onMessage,
  className = "",
  compact = false,
}: Props) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        profile?: PublicUserProfile;
      };
      if (!res.ok) {
        setError(data.error ?? "Perfil indisponível");
        setProfile(null);
        return;
      }
      setProfile(data.profile ?? null);
    } catch {
      setError("Falha de conexão.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setLoading(false);
      return;
    }
    void load();
  }, [initialProfile, load]);

  useEffect(() => {
    if (initialProfile && initialProfile.id === userId) {
      setProfile(initialProfile);
    }
  }, [initialProfile, userId]);

  if (loading) {
    return (
      <div className={`player-profile-card player-profile-card--loading${className ? ` ${className}` : ""}`}>
        <p className="friends-hub__sub">Carregando perfil…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`player-profile-card player-profile-card--error${className ? ` ${className}` : ""}`}>
        <p className="friends-hub__err">{error || "Perfil não encontrado"}</p>
      </div>
    );
  }

  const isSelf = profile.relationship === "self" || profile.id === selfUserId;
  const label = profileLabel(profile);

  return (
    <article
      className={`player-profile-card${compact ? " player-profile-card--compact" : ""}${className ? ` ${className}` : ""}`}
    >
      <div className="player-profile-card__hero">
        <UserAvatar
          url={profile.avatarUrl}
          focus={profile.avatarFocus as PortraitFocus | null}
          label={label}
          className="player-profile-card__avatar"
        />
        <div className="player-profile-card__head">
          <h3 className="player-profile-card__name">{label}</h3>
          {isSelf && profile.nickname && profile.name ? (
            <p className="player-profile-card__sub">{profile.name}</p>
          ) : null}
          <span className="player-profile-card__badge">{relationshipLabel(profile)}</span>
        </div>
      </div>

      <dl className="player-profile-card__meta">
        {contextRole ? (
          <div className="player-profile-card__row">
            <dt>Papel na mesa</dt>
            <dd>{contextRole}</dd>
          </div>
        ) : null}
        {contextSheet ? (
          <div className="player-profile-card__row">
            <dt>Ficha</dt>
            <dd>{contextSheet}</dd>
          </div>
        ) : null}
        {profile.friendSince ? (
          <div className="player-profile-card__row">
            <dt>Amigos desde</dt>
            <dd>
              {new Date(profile.friendSince).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </dd>
          </div>
        ) : null}
      </dl>

      {!isSelf ? (
        <div className="player-profile-card__actions">
          {profile.relationship === "friend" && onMessage ? (
            <button type="button" className="btn btn-sm" onClick={() => onMessage(profile.id)}>
              Mensagem
            </button>
          ) : null}
          {profile.relationship === "none" && onAddFriend ? (
            <button
              type="button"
              className="btn btn-sm"
              disabled={actionLoading}
              onClick={() => {
                setActionLoading(true);
                void onAddFriend(profile.id).finally(() => {
                  setActionLoading(false);
                  void load();
                });
              }}
            >
              {actionLoading ? "Enviando…" : "Adicionar amigo"}
            </button>
          ) : null}
          {profile.relationship === "incoming" && onAcceptRequest && profile.pendingRequestId ? (
            <button
              type="button"
              className="btn btn-sm"
              disabled={actionLoading}
              onClick={() => {
                setActionLoading(true);
                void onAcceptRequest(profile.pendingRequestId!).finally(() => {
                  setActionLoading(false);
                  void load();
                });
              }}
            >
              {actionLoading ? "…" : "Aceitar pedido"}
            </button>
          ) : null}
          {profile.relationship === "outgoing" ? (
            <span className="player-profile-card__hint">Aguardando resposta do pedido</span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
