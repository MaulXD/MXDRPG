"use client";

import Link from "next/link";
import { DismissibleMesaBanner } from "@/components/vtt/DismissibleMesaBanner";
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
    <DismissibleMesaBanner
      bannerId={`char-prompt:${adventureId}:${session.id}`}
      className="glass-panel mesa-dismissible-banner--inline"
      aria-label="Criar personagem nesta aventura"
    >
      <strong>Personagem desta aventura</strong>
      <p className="mesa-dismissible-banner__text">
        Crie uma ficha em <em>{roomName}</em>. Ela só existe nesta aventura — depois arraste o token na
        mesa.
      </p>
      <Link
        href={`/aventura/${adventureId}/personagem/novo`}
        className="btn mesa-dismissible-banner__cta"
      >
        Criar personagem
      </Link>
    </DismissibleMesaBanner>
  );
}
