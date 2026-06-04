"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import { canEditRoomActor } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { clearActiveActorSpawnDragPayload, writeActorSpawnDrag } from "@/lib/vtt/spawn-drag";
import { placeRoomActorOnHex } from "@/hooks/useRoomSync";

type Props = {
  adventureId?: string;
  roomId: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  tokens: { actorId?: string; linked?: boolean; axial: Axial }[];
  spawnAxial: Axial | null;
  onPlaced: (snapshot: RoomSnapshot) => void;
  showCreateLink?: boolean;
};

export function PlayerSpawnPanel({
  adventureId: adventureIdProp,
  roomId,
  actors,
  session,
  tokens,
  spawnAxial,
  onPlaced,
  showCreateLink = false,
}: Props) {
  const dragGhostRef = useRef<HTMLElement | null>(null);

  const adventureId = adventureIdProp ?? roomId;

  const playable = useMemo(() => {
    return Object.values(actors).filter((a) =>
      canEditRoomActor({ roomId }, a, session)
    );
  }, [actors, roomId, session]);

  if (playable.length === 0) {
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <p className="vtt-combat-hint">Nenhum personagem seu nesta mesa.</p>
        {showCreateLink && roomId !== "demo" ? (
          <Link
            href={`/aventura/${adventureId}/personagem/novo`}
            className="btn btn-secondary"
            style={{ marginTop: "0.5rem", fontSize: "0.8rem", display: "inline-block" }}
          >
            Criar ficha para esta mesa
          </Link>
        ) : null}
      </div>
    );
  }

  function tokenOnBoard(actorId: string) {
    return tokens.find((t) => t.linked && t.actorId === actorId);
  }

  async function placeAt(actorId: string, axial: Axial) {
    const snapshot = await placeRoomActorOnHex(roomId, actorId, axial.q, axial.r);
    onPlaced(snapshot);
  }

  function onDragStart(actorId: string, name: string, e: React.DragEvent) {
    e.stopPropagation();
    writeActorSpawnDrag(e.dataTransfer, { actorId });
    dragGhostRef.current?.remove();
    const ghost = document.createElement("div");
    ghost.textContent = name;
    ghost.style.cssText =
      "position:fixed;top:-999px;padding:6px 10px;background:#1a2332;color:#e8ecf4;border-radius:6px;font-size:12px;pointer-events:none;";
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, 28, 18);
  }

  function onDragEnd() {
    clearActiveActorSpawnDragPayload();
    dragGhostRef.current?.remove();
    dragGhostRef.current = null;
  }

  return (
    <div className="vtt-spawn-panel vtt-spawn-panel--players">
      <h3 className="vtt-spawn-title">Personagens</h3>
      <p className="vtt-combat-hint">
        Arraste para um hex no mapa ou use o botão com o cursor sobre o tabuleiro.
      </p>
      <ul className="vtt-spawn-list">
        {playable.map((actor) => {
          const onBoard = tokenOnBoard(actor.id);
          return (
            <li key={actor.id}>
              <button
                type="button"
                className="vtt-spawn-row vtt-spawn-row--draggable"
                draggable
                onDragStart={(e) => onDragStart(actor.id, actor.name, e)}
                onDragEnd={onDragEnd}
                disabled={!spawnAxial}
                title="Arraste para o hex desejado"
                onClick={() => {
                  if (spawnAxial) void placeAt(actor.id, spawnAxial);
                }}
              >
                <span className="vtt-spawn-row-name">{actor.name}</span>
                <span className="vtt-spawn-row-meta">
                  Nv {actor.identity.nivel}
                  {onBoard
                    ? ` · no mapa (${onBoard.axial.q}, ${onBoard.axial.r})`
                    : " · fora do mapa"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
