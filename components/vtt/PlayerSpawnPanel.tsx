"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import { canEditRoomActor, canPlaceRoomActorOnBoard } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { isActorDowned, isTokenDowned } from "@/lib/vtt/player-tokens";
import { collectPlayerActorIds, playerColorForActor } from "@/lib/vtt/token-colors";
import { clearActiveActorSpawnDragPayload, writeActorSpawnDrag } from "@/lib/vtt/spawn-drag";
import { SpawnCardStatsRow } from "@/components/vtt/SpawnCardStats";
import { deleteRoomToken, placeRoomActorOnHex } from "@/hooks/useRoomSync";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  adventureId?: string;
  roomId: string;
  roomOwnerId?: string;
  memberIds?: string[];
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  tokens: BattleToken[];
  spawnAxial: Axial | null;
  onPlaced: (snapshot: RoomSnapshot) => void;
  showCreateLink?: boolean;
  onCreateCharacter?: () => void;
  canPullBack?: boolean;
  /** Dono da ficha pode retirar o próprio token (além do mestre). */
  allowOwnerPullBack?: boolean;
  /** Mestre vê todos os personagens da aventura */
  showAllActors?: boolean;
};

function buildDragGhost(label: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "vtt-spawn-drag-ghost";
  el.textContent = label;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  return el;
}

function ActorSpawnAvatar({
  actor,
  ringColor,
}: {
  actor: RoomActor;
  ringColor: string;
}) {
  const img = actor.tokenImageUrl ?? actor.portraitUrl;
  return (
    <span className="vtt-spawn-drag-avatar" style={{ borderColor: ringColor }}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" />
      ) : (
        <span className="vtt-spawn-drag-initial" style={{ background: `${ringColor}33`, color: ringColor }}>
          {actor.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function PlayerSpawnPanel({
  adventureId: adventureIdProp,
  roomId,
  roomOwnerId = "",
  memberIds = [],
  actors,
  session,
  tokens,
  spawnAxial,
  onPlaced,
  showCreateLink = false,
  onCreateCharacter,
  canPullBack = false,
  allowOwnerPullBack = true,
  showAllActors = false,
}: Props) {
  const dragGhostRef = useRef<HTMLElement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const adventureId = adventureIdProp ?? roomId;
  const roomCtx = useMemo(
    () => ({ roomId, adventureId, ownerId: roomOwnerId, memberIds }),
    [roomId, adventureId, roomOwnerId, memberIds]
  );

  const playerActorIds = useMemo(
    () => collectPlayerActorIds(tokens.filter((t) => t.linked && t.actorId)),
    [tokens]
  );

  const roster = useMemo(() => {
    const all = Object.values(actors);
    if (showAllActors) return all.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    return all
      .filter((a) => canPlaceRoomActorOnBoard(roomCtx, a, session))
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [actors, showAllActors, roomCtx, session]);

  function canDragToMap(actor: RoomActor): boolean {
    const onBoard = tokenOnBoard(actor.id);
    if (onBoard && isTokenDowned(onBoard)) return false;
    return !isActorDowned(actor);
  }

  function tokenOnBoard(actorId: string) {
    return tokens.find((t) => t.linked && t.actorId === actorId);
  }

  function mayPullBack(actor: RoomActor): boolean {
    if (!tokenOnBoard(actor.id)) return false;
    if (canPullBack) return true;
    if (!allowOwnerPullBack || !session) return false;
    return canEditRoomActor(roomCtx, actor, session);
  }

  async function placeAt(actorId: string, axial: Axial) {
    setBusyId(actorId);
    setMsg(null);
    try {
      const snapshot = await placeRoomActorOnHex(roomId, actorId, axial.q, axial.r);
      const actor = actors[actorId];
      setMsg(`${actor?.name ?? "Personagem"} colocado no mapa.`);
      onPlaced(snapshot);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao colocar personagem");
    } finally {
      setBusyId(null);
    }
  }

  async function pullBack(actorId: string, tokenId: string) {
    setBusyId(actorId);
    setMsg(null);
    try {
      const snapshot = await deleteRoomToken(roomId, tokenId);
      const actor = actors[actorId];
      setMsg(`${actor?.name ?? "Personagem"} retirado do mapa.`);
      onPlaced(snapshot);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao retirar do mapa");
    } finally {
      setBusyId(null);
    }
  }

  function onDragStart(actorId: string, name: string, e: React.DragEvent) {
    e.stopPropagation();
    writeActorSpawnDrag(e.dataTransfer, { actorId });
    dragGhostRef.current?.remove();
    const ghost = buildDragGhost(name);
    dragGhostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, 28, 18);
  }

  function onDragEnd() {
    clearActiveActorSpawnDragPayload();
    dragGhostRef.current?.remove();
    dragGhostRef.current = null;
  }

  const createHref = `/aventura/${adventureId}/personagem/novo`;

  const createButton =
    showCreateLink && onCreateCharacter ? (
      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
        onClick={onCreateCharacter}
      >
        Criar personagem
      </button>
    ) : showCreateLink ? (
      <Link
        href={createHref}
        className="btn btn-secondary"
        style={{ marginTop: "0.5rem", fontSize: "0.8rem", display: "inline-block" }}
      >
        Criar personagem
      </Link>
    ) : null;

  if (roster.length === 0) {
    return (
      <div className="vtt-spawn-panel vtt-spawn-panel--players">
        <p className="vtt-eyebrow">Personagens</p>
        <p className="vtt-combat-hint">Nenhum personagem nesta mesa ainda.</p>
        {createButton}
      </div>
    );
  }

  return (
    <div className="vtt-spawn-panel vtt-spawn-panel--players">
      <p className="vtt-eyebrow">Personagens</p>
      <p className="vtt-combat-hint vtt-spawn-drag-hint">
        Arraste a ficha para o mapa ou clique com uma célula selecionada.
      </p>

      <ul className="vtt-spawn-drag-list" role="list">
        {roster.map((actor) => {
          const onBoard = tokenOnBoard(actor.id);
          const ringColor = playerColorForActor(actor.id, [
            ...new Set([...playerActorIds, actor.id]),
          ]);
          const busy = busyId === actor.id;
          const placeable = canDragToMap(actor);

          return (
            <li key={actor.id} className="vtt-spawn-drag-row">
              <div
                role="button"
                tabIndex={placeable ? 0 : -1}
                draggable={!busy && placeable}
                className={`vtt-spawn-drag-card vtt-spawn-drag-card--actor${placeable ? "" : " vtt-spawn-drag-card--disabled"}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (spawnAxial && !busy && placeable) void placeAt(actor.id, spawnAxial);
                  }
                }}
                onDragStart={(e) => {
                  if (!placeable) {
                    e.preventDefault();
                    return;
                  }
                  onDragStart(actor.id, actor.name, e);
                }}
                onDragEnd={onDragEnd}
                onClick={() => {
                  if (spawnAxial && !busy && placeable) void placeAt(actor.id, spawnAxial);
                  else if (!placeable) setMsg(`${actor.name} está inconsciente — cure antes de entrar no mapa.`);
                }}
                title={
                  placeable
                    ? `Arrastar ${actor.name} para o mapa`
                    : `${actor.name} inconsciente — não pode entrar no mapa`
                }
              >
                <ActorSpawnAvatar actor={actor} ringColor={ringColor} />
                <span className="vtt-spawn-drag-card-body">
                  <span className="vtt-spawn-drag-card-head">
                    <strong>{actor.name}</strong>
                    <span
                      className={`vtt-spawn-map-dot${onBoard ? " vtt-spawn-map-dot--on" : ""}`}
                      title={
                        onBoard
                          ? `No mapa (q${onBoard.axial.q}, r${onBoard.axial.r})`
                          : "Fora do mapa"
                      }
                    />
                  </span>
                  <span className="vtt-playable-card__meta">
                    Nv {actor.identity.nivel} · {actor.identity.raca} · {actor.identity.classe}
                  </span>
                  <SpawnCardStatsRow
                    hp={`${actor.resources.vida.value}/${actor.resources.vida.max}`}
                    def={actor.tactical.defesa}
                    pa={`${actor.resources.pontosAcao.value}/${actor.resources.pontosAcao.max}`}
                  />
                  {!placeable ? (
                    <span className="vtt-spawn-drag-card-warn">Inconsciente</span>
                  ) : null}
                </span>
              </div>
              {mayPullBack(actor) && onBoard ? (
                <button
                  type="button"
                  className="vtt-spawn-pull-back"
                  disabled={busy}
                  onClick={() => void pullBack(actor.id, onBoard.id)}
                  title="Retirar do mapa (ficha permanece na aventura)"
                  aria-label={`Retirar ${actor.name} do mapa`}
                >
                  ↩
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="vtt-combat-hint">
        {spawnAxial
          ? `Célula alvo: q${spawnAxial.q}, r${spawnAxial.r}`
          : "Passe o mouse no mapa ou solte o personagem em uma célula."}
      </p>

      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}

      {showCreateLink && onCreateCharacter ? (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: "0.5rem", fontSize: "0.8rem", width: "100%" }}
          onClick={onCreateCharacter}
        >
          Criar personagem
        </button>
      ) : showCreateLink ? (
        <Link
          href={createHref}
          className="btn btn-secondary"
          style={{ marginTop: "0.5rem", fontSize: "0.8rem", display: "inline-block", width: "100%" }}
        >
          Criar personagem
        </Link>
      ) : null}
    </div>
  );
}
