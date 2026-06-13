"use client";

import Link from "next/link";
import { useState } from "react";
import { CharacterManageDialog } from "@/components/character/CharacterManageDialog";
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
  isRoomGm?: boolean;
  onOpenSheet: (actorId: string) => void;
  onCharactersChanged?: () => void;
  onCreateCharacter?: () => void;
};

type ManageState = {
  actorId: string;
  actorName: string;
  mode: "delete" | "transfer";
  asGm: boolean;
  excludeUserId?: string | null;
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
  isRoomGm = false,
  onOpenSheet,
  onCharactersChanged,
  onCreateCharacter,
}: Props) {
  const roomAuth = { roomId, adventureId };
  const roster = listPlayablePlayerActors(actors, adventureId);
  const colorIds = roster.map((a) => a.id);
  const [manage, setManage] = useState<ManageState | null>(null);

  return (
    <div className="vtt-playable-panel">
      <p className="vtt-eyebrow">Personagens jogáveis</p>
      <p className="vtt-combat-hint vtt-playable-panel__lead">
        Veja as fichas de todos na mesa. Só o dono pode editar inventário, identidade e nível.
        {isRoomGm ? " Como mestre, você pode transferir ou excluir fichas de jogadores." : ""}
      </p>

      {roster.length === 0 ? (
        <p className="vtt-combat-hint">Nenhum personagem de jogador nesta aventura ainda.</p>
      ) : (
        <ul className="vtt-playable-list" role="list">
          {roster.map((actor) => {
            const mine = isActorOwnedByUser(actor, session);
            const canEdit = canEditRoomActor(roomAuth, actor, session);
            const ringColor = playerColorForActor(actor.id, colorIds);
            const active = selectedActorId === actor.id;
            const canManageMine = mine && session;
            const canManageAsGm = isRoomGm && session && !actor.gmAuthored;

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
                  <div className="vtt-playable-card__actions">
                    <button
                      type="button"
                      className="btn btn-ghost vtt-playable-card__open"
                      onClick={() => onOpenSheet(actor.id)}
                    >
                      {canEdit ? "Abrir ficha" : "Ver ficha"}
                    </button>
                    {canManageMine ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost vtt-playable-card__manage"
                          onClick={() =>
                            setManage({
                              actorId: actor.id,
                              actorName: actor.name,
                              mode: "transfer",
                              asGm: false,
                              excludeUserId: actor.ownerId,
                            })
                          }
                        >
                          Transferir
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost vtt-playable-card__manage vtt-playable-card__manage--danger"
                          onClick={() =>
                            setManage({
                              actorId: actor.id,
                              actorName: actor.name,
                              mode: "delete",
                              asGm: false,
                            })
                          }
                        >
                          Excluir
                        </button>
                      </>
                    ) : null}
                    {canManageAsGm && !mine ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost vtt-playable-card__manage"
                          onClick={() =>
                            setManage({
                              actorId: actor.id,
                              actorName: actor.name,
                              mode: "transfer",
                              asGm: true,
                              excludeUserId: actor.ownerId,
                            })
                          }
                        >
                          Atribuir a…
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost vtt-playable-card__manage vtt-playable-card__manage--danger"
                          onClick={() =>
                            setManage({
                              actorId: actor.id,
                              actorName: actor.name,
                              mode: "delete",
                              asGm: true,
                            })
                          }
                        >
                          Excluir
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canCreateCharacter ? (
        onCreateCharacter ? (
          <button
            type="button"
            className="btn btn-secondary vtt-playable-create"
            onClick={onCreateCharacter}
          >
            + Criar novo personagem
          </button>
        ) : (
          <Link href={`/aventura/${adventureId}/personagem/novo`} className="btn btn-secondary vtt-playable-create">
            + Criar novo personagem
          </Link>
        )
      ) : null}

      {manage ? (
        <CharacterManageDialog
          open
          mode={manage.mode}
          characterId={manage.actorId}
          characterName={manage.actorName}
          adventureId={adventureId}
          roomId={roomId}
          asGm={manage.asGm}
          excludeUserId={manage.excludeUserId}
          onClose={() => setManage(null)}
          onSuccess={() => onCharactersChanged?.()}
        />
      ) : null}
    </div>
  );
}
