"use client";

import Link from "next/link";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomActor } from "@/lib/room/types";
import { canEditRoomActor } from "@/lib/auth/room-access";

type Props = {
  adventureId: string;
  roomId: string;
  roomOwnerId: string;
  memberIds: string[];
  roomName: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  isVisitor?: boolean;
};

export function RoomCharacterPrompt({
  adventureId,
  roomId,
  roomOwnerId,
  memberIds,
  roomName,
  actors,
  session,
  isVisitor = false,
}: Props) {
  if (roomId === "demo" || isVisitor || !session) return null;

  const mine = Object.values(actors).filter((a) =>
    canEditRoomActor({ roomId, adventureId, ownerId: roomOwnerId, memberIds }, a, session)
  );

  if (mine.length > 0) return null;

  return (
    <div
      className="glass-panel"
      style={{
        margin: "0.5rem 1rem",
        padding: "0.85rem 1rem",
        fontSize: "0.88rem",
        lineHeight: 1.5,
      }}
    >
      <strong>Personagem desta aventura</strong>
      <p style={{ margin: "0.35rem 0 0.65rem", color: "var(--text-muted)" }}>
        Crie uma ficha em <em>{roomName}</em>. Ela só existe nesta aventura — depois arraste o token na
        mesa.
      </p>
      <Link
        href={`/aventura/${adventureId}/personagem/novo`}
        className="btn"
        style={{ fontSize: "0.85rem" }}
      >
        Criar personagem
      </Link>
    </div>
  );
}
