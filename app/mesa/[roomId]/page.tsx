import Link from "next/link";
import { redirect } from "next/navigation";
import { MesaWorkspace } from "@/components/vtt/MesaWorkspace";
import { MesaVisitorNotice } from "@/components/vtt/MesaVisitorNotice";
import {
  canManageRoom,
  canParticipateInRoom,
  isRoomVisitor,
} from "@/lib/auth/room-access";
import {
  canViewRoomServer,
  inviteMatchesRoom,
  isRoomMemberResolved,
} from "@/lib/auth/room-access-server";
import { entrarPath, mesaRoomPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { getAdventure, bindPlayerToAdventure } from "@/lib/adventure/store";
import { isAdventureClosed } from "@/lib/adventure/access";
import { shouldAutoJoinRoom } from "@/lib/auth/adventure-room-access";
import { MesaClosedGate } from "@/components/vtt/MesaClosedGate";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import { joinRoomMembers } from "@/lib/room/adventure-room";
import { getRoom, joinRoomByInvite } from "@/lib/room/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ invite?: string; joined?: string }>;
};

export default async function MesaRoomPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { invite: inviteParam } = await searchParams;
  const inviteCode = inviteParam?.trim() || null;

  const session = await getSession();
  let room = await getRoom(roomId);
  let joinError: string | null = null;

  if (!room) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <p>
          Sala <code>{roomId}</code> não foi encontrada. Pode ter sido criada em outro ambiente ou a
          gravação falhou ao criar a aventura.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Tente abrir de novo em <Link href="/eldarin">Suas mesas</Link> ou recrie a mesa na aventura.
        </p>
        <Link href="/eldarin" className="btn" style={{ marginTop: "1rem" }}>
          Ir para Suas mesas
        </Link>
      </div>
    );
  }

  if (session?.user && roomId !== "demo") {
    const isMember = await isRoomMemberResolved(room, session.user.id, session.user.clerkId);
    if (!room.memberIds.includes(session.user.id) && isMember) {
      await joinRoomMembers(roomId, session.user.id);
      room = (await getRoom(roomId)) ?? room;
    } else if (
      !isMember &&
      (await shouldAutoJoinRoom(room, session.user))
    ) {
      await joinRoomMembers(roomId, session.user.id);
      room = (await getRoom(roomId)) ?? room;
    }
  }

  if (session?.user && inviteCode && session.user.role !== "admin") {
    const alreadyMember = await isRoomMemberResolved(room, session.user.id, session.user.clerkId);
    if (!alreadyMember && (await inviteMatchesRoom(room, inviteCode))) {
      const joined = await joinRoomByInvite(inviteCode, session.user.id);
      const fresh =
        joined?.roomId === roomId ? joined : ((await getRoom(roomId)) ?? room);
      room = fresh;

      if (await isRoomMemberResolved(room, session.user.id, session.user.clerkId)) {
        redirect(`/mesa/${roomId}?joined=1`);
      }
      joinError =
        "Não foi possível entrar na mesa com este convite. Tente novamente ou peça um novo link ao mestre.";
    }
  }

  if (
    session?.user &&
    roomId !== "demo" &&
    (await isRoomMemberResolved(room, session.user.id, session.user.clerkId))
  ) {
    const advId = room.adventureId ?? roomId;
    if (room.ownerId !== session.user.id) {
      await bindPlayerToAdventure(advId, session.user.id);
    }
    try {
      const synced = await syncAdventureActorsForRoom(roomId);
      if (synced) room = synced;
    } catch (e) {
      console.error("[mesa] sync fichas da aventura:", e);
    }
  }

  if (!(await canViewRoomServer(room, session?.user ?? null, inviteCode))) {
    if (joinError) {
      return (
        <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
          <p>{joinError}</p>
          <Link href={mesaRoomPath(roomId, inviteCode)} className="btn" style={{ marginTop: "1rem" }}>
            Tentar de novo
          </Link>
          <Link href="/eldarin" className="btn btn--ghost" style={{ marginTop: "0.75rem", marginLeft: "0.5rem" }}>
            Inserir código em Suas mesas
          </Link>
        </div>
      );
    }
    const advId = room.adventureId ?? roomId;
    const adventure = await getAdventure(advId);
    const closed = adventure ? isAdventureClosed(adventure) : false;

    if (closed && session?.user) {
      return (
        <MesaClosedGate
          roomId={roomId}
          adventureId={advId}
          roomName={adventure?.name ?? room.name}
        />
      );
    }

    return (
      <div className="page-wrap">
        <p>Esta mesa é privada. Peça o código ou link de convite ao mestre.</p>
        {!session ? (
          <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="btn" style={{ marginTop: "1rem" }}>
            Entrar para participar
          </Link>
        ) : (
          <Link href="/eldarin" className="btn" style={{ marginTop: "1rem" }}>
            Inserir código em Suas mesas
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
      {visitor ? <MesaVisitorNotice roomId={roomId} inviteCode={inviteCode} /> : null}

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
