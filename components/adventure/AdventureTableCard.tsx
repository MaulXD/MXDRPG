"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { AdventureListItem } from "@/lib/adventure/types";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
} from "@/lib/media/portrait-focus";
import { DEFAULT_RPG_SYSTEM_ID, normalizeRpgSystemId, resolveMesaCoverSrc } from "@/lib/rpg/systems";
import { roomInviteUrl } from "@/lib/auth/room-access";
import "@/components/rpg/mesas-hub.css";

const DEFAULT_COVER = resolveMesaCoverSrc(null, DEFAULT_RPG_SYSTEM_ID);

type Props = {
  adventure: AdventureListItem;
  onDelete?: () => void;
  deleteBusy?: boolean;
};

function formatLastSession(updatedAt: number): string {
  return new Date(updatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function MemberAvatar({
  name,
  avatarUrl,
  online,
}: {
  name: string;
  avatarUrl: string | null;
  online: boolean;
}) {
  const initials = name.trim().slice(0, 2).toUpperCase() || "?";
  return (
    <span
      className={`adventure-table-card__avatar${online ? " adventure-table-card__avatar--online" : ""}`}
      title={name}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" />
      ) : (
        <span className="adventure-table-card__avatar-initials">{initials}</span>
      )}
    </span>
  );
}

export function AdventureTableCard({ adventure, onDelete, deleteBusy }: Props) {
  const [inviteCopied, setInviteCopied] = useState(false);
  const members = adventure.members ?? [];
  const onlineCount = adventure.onlineCount ?? members.filter((m) => m.online).length;

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}${roomInviteUrl(adventure.primaryRoomId, adventure.inviteCode)}`
      : roomInviteUrl(adventure.primaryRoomId, adventure.inviteCode);

  const copyInviteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [inviteLink]);
  const coverSrc = resolveMesaCoverSrc(
    adventure.coverUrl,
    normalizeRpgSystemId(adventure.rpgSystemId)
  );
  const coverFocus =
    sanitizePortraitFocus(adventure.coverFocus) ?? DEFAULT_PORTRAIT_FOCUS;
  const mesaHref = `/mesa/${adventure.primaryRoomId}`;
  const hubHref = `/aventura/${adventure.adventureId}`;

  return (
    <article className="adventure-table-card">
      <Link href={hubHref} className="adventure-table-card__cover-link" aria-hidden tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          className="adventure-table-card__cover"
          style={portraitFocusToImgStyle(coverFocus)}
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_COVER) {
              e.currentTarget.src = DEFAULT_COVER;
            }
          }}
        />
      </Link>

      <div className="adventure-table-card__body">
        <header className="adventure-table-card__head">
          <div className="adventure-table-card__title-row">
            <Link href={hubHref} className="adventure-table-card__title">
              {adventure.name}
            </Link>
            <span
              className={`adventure-table-card__role${adventure.isOwner ? " adventure-table-card__role--gm" : ""}`}
            >
              {adventure.isOwner ? "Mestre" : "Jogador"}
            </span>
          </div>
          <div className="adventure-table-card__actions">
            <Link href={mesaHref} className="adventure-table-card__play">
              <span className="adventure-table-card__play-icon" aria-hidden>
                ▶
              </span>
              Abrir mesa
            </Link>
          </div>
        </header>

        <div className="adventure-table-card__divider" aria-hidden />

        <div className="adventure-table-card__players">
          <div className="adventure-table-card__avatar-row" aria-label="Jogadores da mesa">
            {members.length === 0 ? (
              <span className="adventure-table-card__empty-players">Nenhum jogador vinculado</span>
            ) : (
              members.slice(0, 10).map((m) => (
                <MemberAvatar
                  key={m.userId}
                  name={m.displayName}
                  avatarUrl={m.avatarUrl}
                  online={m.online}
                />
              ))
            )}
            {members.length > 10 ? (
              <span className="adventure-table-card__avatar-more">+{members.length - 10}</span>
            ) : null}
          </div>
          <p className="adventure-table-card__meta">
            {onlineCount > 0 ? (
              <>
                <strong>{onlineCount}</strong>{" "}
                {onlineCount === 1 ? "jogador online" : "jogadores online"}
                <span className="adventure-table-card__meta-sep"> · </span>
              </>
            ) : null}
            Última atividade em {formatLastSession(adventure.updatedAt)}
          </p>
        </div>

        {adventure.isOwner ? (
          <footer className="adventure-table-card__footer">
            <div className="adventure-table-card__invite-row">
              <span className="adventure-table-card__invite">
                Convite <code>{adventure.inviteCode}</code>
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm adventure-table-card__copy"
                onClick={() => void copyInviteLink()}
              >
                {inviteCopied ? "Copiado" : "Copiar link"}
              </button>
            </div>
            {onDelete ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm adventure-table-card__delete"
                disabled={deleteBusy}
                onClick={onDelete}
              >
                Excluir mesa
              </button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </article>
  );
}
