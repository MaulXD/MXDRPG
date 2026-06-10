"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import { canEditRoomActor } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { collectPlayerActorIds, playerColorForActor } from "@/lib/vtt/token-colors";
import { clearActiveActorSpawnDragPayload, writeActorSpawnDrag } from "@/lib/vtt/spawn-drag";
import { deleteRoomToken, placeRoomActorOnHex } from "@/hooks/useRoomSync";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  adventureId?: string;
  roomId: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  tokens: BattleToken[];
  spawnAxial: Axial | null;
  onPlaced: (snapshot: RoomSnapshot) => void;
  showCreateLink?: boolean;
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
  actors,
  session,
  tokens,
  spawnAxial,
  onPlaced,
  showCreateLink = false,
  canPullBack = false,
  allowOwnerPullBack = true,
  showAllActors = false,
}: Props) {
  const dragGhostRef = useRef<HTMLElement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const adventureId = adventureIdProp ?? roomId;

  const playerActorIds = useMemo(
    () => collectPlayerActorIds(tokens.filter((t) => t.linked && t.actorId)),
    [tokens]
  );

  const roster = useMemo(() => {
    const all = Object.values(actors);
    if (showAllActors) return all.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    return all
      .filter((a) => canEditRoomActor({ roomId, adventureId }, a, session))
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [actors, showAllActors, roomId, adventureId, session]);

  function tokenOnBoard(actorId: string) {
    return tokens.find((t) => t.linked && t.actorId === actorId);
  }

  function mayPullBack(actor: RoomActor): boolean {
    if (!tokenOnBoard(actor.id)) return false;
    if (canPullBack) return true;
    if (!allowOwnerPullBack || !session) return false;
    return canEditRoomActor({ roomId, adventureId }, actor, session);
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

  if (roster.length === 0) {
    return (
      <div className="vtt-spawn-panel vtt-spawn-panel--players">
        <p className="vtt-eyebrow">Personagens</p>
        <p className="vtt-combat-hint">Nenhum personagem nesta mesa ainda.</p>
        {showCreateLink ? (
          <Link
            href={createHref}
            className="btn btn-secondary"
            style={{ marginTop: "0.5rem", fontSize: "0.8rem", display: "inline-block" }}
          >
            Criar personagem
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="vtt-spawn-panel vtt-spawn-panel--players">
      <p className="vtt-eyebrow">Personagens</p>
      <p className="vtt-combat-hint vtt-spawn-drag-hint">
        Exiba os existentes abaixo ou crie um novo. Arraste para o mapa para colocar ou
        reposicionar.
      </p>

      <ul className="vtt-spawn-drag-list" role="list">
        {roster.map((actor) => {
          const onBoard = tokenOnBoard(actor.id);
          const ringColor = playerColorForActor(actor.id, [
            ...new Set([...playerActorIds, actor.id]),
          ]);
          const busy = busyId === actor.id;

          return (
            <li key={actor.id} className="vtt-spawn-drag-row">
              <div
                role="button"
                tabIndex={0}
                draggable={!busy}
                className="vtt-spawn-drag-card vtt-spawn-drag-card--actor"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (spawnAxial && !busy) void placeAt(actor.id, spawnAxial);
                  }
                }}
                onDragStart={(e) => onDragStart(actor.id, actor.name, e)}
                onDragEnd={onDragEnd}
                onClick={() => {
                  if (spawnAxial && !busy) void placeAt(actor.id, spawnAxial);
                }}
                title={`Arrastar ${actor.name} para o mapa`}
              >
                <span className="vtt-spawn-drag-grip" aria-hidden>
                  ⠿
                </span>
                <ActorSpawnAvatar actor={actor} ringColor={ringColor} />
                <span className="vtt-spawn-drag-card-body">
                  <strong>{actor.name}</strong>
                  <span>
                    Nv{actor.identity.nivel} {actor.identity.classe}
                    {onBoard ? ` · q${onBoard.axial.q}r${onBoard.axial.r}` : " · fora"}
                  </span>
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
          ? `Hex alvo: q${spawnAxial.q}, r${spawnAxial.r}`
          : "Passe o mouse no mapa ou solte o personagem em um hex."}
      </p>

      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}

      {showCreateLink ? (
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
