"use client";

import Link from "next/link";
import type { AdventureListItem } from "@/lib/adventure/types";
import "@/components/rpg/mesas-hub.css";

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
  const members = adventure.members ?? [];
  const onlineCount = adventure.onlineCount ?? members.filter((m) => m.online).length;
  const cover = adventure.coverUrl ?? "/brand/rpg/eldarin-cover.svg";
  const mesaHref = `/mesa/${adventure.primaryRoomId}`;
  const hubHref = `/aventura/${adventure.adventureId}`;

  return (
    <article className="adventure-table-card">
      <Link href={hubHref} className="adventure-table-card__cover-link" aria-hidden tabIndex={-1}>
        <div
          className="adventure-table-card__cover"
          style={{ backgroundImage: `url(${cover})` }}
          role="img"
          aria-label={`Capa da mesa ${adventure.name}`}
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
            <span className="adventure-table-card__vtt-tag">VTT · miniaturas</span>
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

        {adventure.isOwner && onDelete ? (
          <footer className="adventure-table-card__footer">
            <span className="adventure-table-card__invite">
              Convite <code>{adventure.inviteCode}</code>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm adventure-table-card__delete"
              disabled={deleteBusy}
              onClick={onDelete}
            >
              Excluir mesa
            </button>
          </footer>
        ) : null}
      </div>
    </article>
  );
}
