"use client";

import Link from "next/link";
import { canEditRoomActor } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomActor } from "@/lib/room/types";
import {
  isActorOwnedByUser,
  listPlayablePlayerActors,
} from "@/lib/vtt/playable-actors";
import { playerColorForActor } from "@/lib/vtt/token-colors";

type Props = {
  roomId: string;
  adventureId: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  selectedActorId?: string | null;
  canCreateCharacter?: boolean;
  onOpenSheet: (actorId: string) => void;
};

function ActorAvatar({ actor, ringColor }: { actor: RoomActor; ringColor: string }) {
  const img = actor.tokenImageUrl ?? actor.portraitUrl;
  return (
    <span className="vtt-playable-avatar" style={{ borderColor: ringColor }}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" />
      ) : (
        <span className="vtt-playable-avatar__initial" style={{ background: `${ringColor}33`, color: ringColor }}>
          {actor.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function PlayableCharactersPanel({
  roomId,
  adventureId,
  actors,
  session,
  selectedActorId,
  canCreateCharacter = false,
  onOpenSheet,
}: Props) {
  const roomAuth = { roomId, adventureId };
  const roster = listPlayablePlayerActors(actors, adventureId);
  const createHref = `/aventura/${adventureId}/personagem/novo`;
  const colorIds = roster.map((a) => a.id);

  return (
    <div className="vtt-playable-panel">
      <p className="vtt-eyebrow">Personagens jogáveis</p>
      <p className="vtt-combat-hint vtt-playable-panel__lead">
        Veja as fichas de todos na mesa. Só o dono pode editar inventário, identidade e nível.
      </p>

      {roster.length === 0 ? (
        <p className="vtt-combat-hint">Nenhum personagem de jogador nesta aventura ainda.</p>
      ) : (
        <ul className="vtt-playable-list" role="list">
          {roster.map((actor) => {
            const mine = isActorOwnedByUser(actor, session?.id);
            const canEdit = canEditRoomActor(roomAuth, actor, session);
            const ringColor = playerColorForActor(actor.id, colorIds);
            const active = selectedActorId === actor.id;

            return (
              <li key={actor.id}>
                <div className={`vtt-playable-card${active ? " vtt-playable-card--active" : ""}`}>
                  <ActorAvatar actor={actor} ringColor={ringColor} />
                  <div className="vtt-playable-card__body">
                    <div className="vtt-playable-card__head">
                      <strong>{actor.name}</strong>
                      <span
                        className={`vtt-playable-badge${mine ? " vtt-playable-badge--mine" : ""}`}
                      >
                        {mine ? "Seu personagem" : "Somente leitura"}
                      </span>
                    </div>
                    <span className="vtt-playable-card__meta">
                      Nv {actor.identity.nivel} · {actor.identity.raca} · {actor.identity.classe}
                      {actor.identity.subclasse ? ` · ${actor.identity.subclasse}` : ""}
                    </span>
                    <span className="vtt-playable-card__stats">
                      Vida {actor.resources.vida.value}/{actor.resources.vida.max} · Defesa{" "}
                      {actor.tactical.defesa} · PA {actor.resources.pontosAcao.value}/
                      {actor.resources.pontosAcao.max}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost vtt-playable-card__open"
                    onClick={() => onOpenSheet(actor.id)}
                  >
                    {canEdit ? "Abrir ficha" : "Ver ficha"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canCreateCharacter ? (
        <Link href={createHref} className="btn btn-secondary vtt-playable-create">
          + Criar novo personagem
        </Link>
      ) : null}
    </div>
  );
}
