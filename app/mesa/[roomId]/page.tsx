import Link from "next/link";
import { redirect } from "next/navigation";
import { MesaWorkspace } from "@/components/vtt/MesaWorkspace";
import { RoomCharacterPrompt } from "@/components/vtt/RoomCharacterPrompt";
import {
  canManageRoom,
  canParticipateInRoom,
  canViewRoom,
  inviteMatches,
  isRoomMember,
  isRoomVisitor,
} from "@/lib/auth/room-access";
import { entrarPath, mesaRoomPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { bindPlayerToAdventure } from "@/lib/adventure/store";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import { joinRoomByInvite, getRoom } from "@/lib/room/store";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ invite?: string }>;
};

export default async function MesaRoomPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { invite: inviteParam } = await searchParams;
  const inviteCode = inviteParam?.trim() || null;

  const session = await getSession();
  let room = await getRoom(roomId);

  if (!room) {
    return (
      <div className="page-wrap">
        <p>
          Sala <code>{roomId}</code> não existe.
        </p>
        <Link href="/painel">Voltar ao painel</Link>
      </div>
    );
  }

  if (
    session?.user &&
    inviteCode &&
    inviteMatches(room, inviteCode) &&
    !isRoomMember(room, session.user.id) &&
    session.user.role !== "admin"
  ) {
    const joined = await joinRoomByInvite(inviteCode, session.user.id);
    if (joined) {
      redirect(`/mesa/${roomId}`);
    }
  }

  if (
    session?.user &&
    roomId !== "demo" &&
    (room.ownerId === session.user.id || room.memberIds.includes(session.user.id))
  ) {
    const advId = room.adventureId ?? roomId;
    if (room.ownerId !== session.user.id) {
      await bindPlayerToAdventure(advId, session.user.id);
    }
    const synced = await syncAdventureActorsForRoom(roomId);
    if (synced) room = synced;
  }

  if (!canViewRoom(room, session?.user ?? null, inviteCode)) {
    return (
      <div className="page-wrap">
        <p>Esta mesa é privada. Peça o código ou link de convite ao mestre.</p>
        {!session ? (
          <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="btn" style={{ marginTop: "1rem" }}>
            Entrar para participar
          </Link>
        ) : (
          <Link href="/painel" className="btn" style={{ marginTop: "1rem" }}>
            Inserir código no painel
          </Link>
        )}
      </div>
    );
  }

  const visitor = isRoomVisitor(room, session?.user ?? null, inviteCode);
  const isRoomGm = canManageRoom(room, session?.user ?? null);
  const canParticipate = canParticipateInRoom(room, session?.user ?? null);
  const role = session?.user.role ?? null;
  const packs = getVisiblePacks(role, { isRoomGm });
  const compendium = Object.fromEntries(
    packs.map((p) => [
      p.id,
      getPackEntries(p.id, { role, isRoomGm }),
    ])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  const canEdit = canParticipate;
  const isDemoRoom = roomId === "demo";
  const canControlCombat = isRoomGm;
  const defaultActorId =
    session?.user &&
    (Object.values(room.actors).find((a) => a.ownerId === session.user.id)?.id ??
      Object.keys(room.actors)[0]);

  return (
    <div className="vtt-page vtt-page--mesa">
      {visitor ? (
        <div
          className="glass-panel"
          style={{
            margin: "0.5rem 1rem",
            padding: "0.6rem 0.85rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          Modo <strong>visitante</strong> na demo — pode jogar o Aventureiro; sem chat.{" "}
          <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="text-link">
            Entrar na conta
          </Link>{" "}
          para jogar.
        </div>
      ) : null}

      <RoomCharacterPrompt
        adventureId={room.adventureId ?? roomId}
        roomId={roomId}
        roomName={room.name}
        actors={room.actors}
        session={session?.user ?? null}
        isVisitor={visitor}
      />

      <MesaWorkspace
        roomId={roomId}
        adventureId={room.adventureId ?? roomId}
        roomOwnerId={room.ownerId}
        memberIds={room.memberIds}
        scene={room.scene}
        canEdit={canEdit}
        canControlCombat={canControlCombat}
        canChat={canParticipate}
        inviteCode={inviteCode}
        roomInviteCode={canParticipate ? room.inviteCode : null}
        roomName={room.name}
        isRoomOwner={isRoomGm}
        session={session?.user ?? null}
        compendium={compendium}
        packs={packs}
        defaultActorId={defaultActorId}
      />
    </div>
  );
}
