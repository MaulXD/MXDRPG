"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CharacterManageDialog } from "@/components/character/CharacterManageDialog";
import { deleteRoomToken, placeRoomActorOnHex } from "@/hooks/useRoomSync";
import { canEditRoomActor } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import {
  canDragActorToMap,
  mayPullActorFromBoard,
  tokenOnBoardForActor,
} from "@/lib/vtt/actor-board-spawn";
import { endActorSpawnDrag, startActorSpawnDrag } from "@/lib/vtt/actor-spawn-drag-ui";
import {
  isActorOwnedByUser,
  listPlayablePlayerActors,
} from "@/lib/vtt/playable-actors";
import { playerColorForActor } from "@/lib/vtt/token-colors";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  roomId: string;
  adventureId: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  selectedActorId?: string | null;
  canCreateCharacter?: boolean;
  isRoomGm?: boolean;
  roomOwnerId?: string;
  memberIds?: string[];
  tokens?: BattleToken[];
  spawnAxial?: Axial | null;
  onOpenSheet: (actorId: string) => void;
  onCharactersChanged?: () => void;
  onCreateCharacter?: () => void;
  onPlaced?: (snapshot: RoomSnapshot) => void;
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
  roomOwnerId = "",
  memberIds = [],
  tokens = [],
  spawnAxial = null,
  onOpenSheet,
  onCharactersChanged,
  onCreateCharacter,
  onPlaced,
}: Props) {
  const roomAuth = useMemo(
    () => ({ roomId, adventureId, ownerId: roomOwnerId, memberIds: memberIds ?? [] }),
    [roomId, adventureId, roomOwnerId, memberIds]
  );
  const roster = listPlayablePlayerActors(actors, adventureId);
  const colorIds = roster.map((a) => a.id);
  const [manage, setManage] = useState<ManageState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [spawnMsg, setSpawnMsg] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLElement | null>(null);

  async function placeAt(actorId: string, axial: Axial) {
    setBusyId(actorId);
    setSpawnMsg(null);
    try {
      const snapshot = await placeRoomActorOnHex(roomId, actorId, axial.q, axial.r);
      const actor = actors[actorId];
      setSpawnMsg(`${actor?.name ?? "Personagem"} colocado no mapa.`);
      onPlaced?.(snapshot);
    } catch (e) {
      setSpawnMsg(e instanceof Error ? e.message : "Falha ao colocar personagem");
    } finally {
      setBusyId(null);
    }
  }

  async function pullBack(actorId: string, tokenId: string) {
    setBusyId(actorId);
    setSpawnMsg(null);
    try {
      const snapshot = await deleteRoomToken(roomId, tokenId);
      const actor = actors[actorId];
      setSpawnMsg(`${actor?.name ?? "Personagem"} retirado do mapa.`);
      onPlaced?.(snapshot);
    } catch (e) {
      setSpawnMsg(e instanceof Error ? e.message : "Falha ao retirar do mapa");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="vtt-playable-panel">
      <p className="vtt-eyebrow">Personagens jogáveis</p>
      <p className="vtt-combat-hint vtt-playable-panel__lead">
        Arraste o retrato para o mapa ou abra a ficha para consultar. Só o dono edita inventário e
        nível.
        {isRoomGm ? " Como mestre, você pode colocar qualquer ficha viva e transferir ou excluir." : ""}
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
            const onBoard = tokenOnBoardForActor(tokens, actor.id);
            const placeable = canDragActorToMap(actor, tokens, roomAuth, session, isRoomGm);
            const canPullBack = mayPullActorFromBoard(actor, tokens, roomAuth, session, isRoomGm);
            const busy = busyId === actor.id;

            return (
              <li key={actor.id}>
                <div className={`vtt-playable-card${active ? " vtt-playable-card--active" : ""}`}>
                  <div
                    className={`vtt-playable-card__drag${placeable ? "" : " vtt-playable-card__drag--disabled"}`}
                    role="button"
                    tabIndex={placeable && !busy ? 0 : -1}
                    draggable={placeable && !busy}
                    title={
                      placeable
                        ? `Arrastar ${actor.name} para o mapa`
                        : `${actor.name} inconsciente — cure antes de entrar no mapa`
                    }
                    onDragStart={(e) => {
                      if (!placeable || busy) {
                        e.preventDefault();
                        return;
                      }
                      startActorSpawnDrag(e, actor.id, actor.name, dragGhostRef);
                    }}
                    onDragEnd={() => endActorSpawnDrag(dragGhostRef)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (spawnAxial && placeable && !busy) void placeAt(actor.id, spawnAxial);
                      }
                    }}
                    onClick={() => {
                      if (spawnAxial && placeable && !busy) void placeAt(actor.id, spawnAxial);
                      else if (!placeable) {
                        setSpawnMsg(`${actor.name} está inconsciente — cure antes de entrar no mapa.`);
                      }
                    }}
                  >
                    <span className="vtt-playable-card__grip" aria-hidden>
                      ⠿
                    </span>
                    <ActorAvatar actor={actor} ringColor={ringColor} />
                  </div>
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
                      {onBoard
                        ? ` · no mapa q${onBoard.axial.q}r${onBoard.axial.r}`
                        : " · fora do mapa"}
                    </span>
                    <span className="vtt-playable-card__stats">
                      Vida {actor.resources.vida.value}/{actor.resources.vida.max} · Defesa{" "}
                      {actor.tactical.defesa} · PA {actor.resources.pontosAcao.value}/
                      {actor.resources.pontosAcao.max}
                    </span>
                  </div>
                  <div className="vtt-playable-card__actions">
                    {canPullBack && onBoard ? (
                      <button
                        type="button"
                        className="btn btn-ghost vtt-playable-card__manage"
                        disabled={busy}
                        onClick={() => void pullBack(actor.id, onBoard.id)}
                        title="Retirar do mapa"
                      >
                        ↩ Mapa
                      </button>
                    ) : null}
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

      {spawnAxial ? (
        <p className="vtt-combat-hint">
          Célula alvo no mapa: q{spawnAxial.q}, r{spawnAxial.r} — clique no retrato ou arraste.
        </p>
      ) : (
        <p className="vtt-combat-hint">
          Passe o mouse no mapa e solte o personagem em uma célula, ou clique no retrato com uma
          célula selecionada.
        </p>
      )}
      {spawnMsg ? <p className="sheet-inline-msg">{spawnMsg}</p> : null}

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
