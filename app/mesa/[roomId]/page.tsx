import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MesaWorkspace } from "@/components/vtt/MesaWorkspace";
import { MesaVisitorNotice } from "@/components/vtt/MesaVisitorNotice";
import {
  canManageRoom,
  parseWatchOnly,
  resolveRoomAccess,
} from "@/lib/auth/room-access";
import {
  canViewRoomServer,
  inviteMatchesRoom,
  isRoomMemberResolved,
} from "@/lib/auth/room-access-server";
import { entrarPath, mesaRoomPath } from "@/lib/auth/post-auth-redirect";
import { canonicalInviteForRoom } from "@/lib/auth/mesa-invite";
import { safeMaterializeSessionUser } from "@/lib/auth/session-user";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { getAdventure, bindPlayerToAdventure } from "@/lib/adventure/store";
import { isAdventureClosed } from "@/lib/adventure/access";
import { shouldAutoJoinRoom } from "@/lib/auth/adventure-room-access";
import {
  listCharactersForSessionUserSafe,
  listCharactersForSessionUserInAdventureSafe,
  MAX_CHARACTERS_PER_USER,
} from "@/lib/character/characters";
import { MesaClosedGate } from "@/components/vtt/MesaClosedGate";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import { joinRoomMembers } from "@/lib/room/adventure-room";
import { getRoom, joinRoomByInvite } from "@/lib/room/store";
import { pageMetadata } from "@/lib/site-metadata";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ invite?: string; joined?: string; criar?: string; watch?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  return pageMetadata(room?.name?.trim() || (roomId === "demo" ? "Mesa demo" : "Mesa"));
}

export default async function MesaRoomPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { invite: inviteParam, criar: criarParam, watch: watchParam } = await searchParams;
  const inviteCode = inviteParam?.trim() || null;
  const watchOnly = parseWatchOnly(watchParam);

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
          Tente abrir de novo em <Link href="/rpg/eldarin">Suas mesas</Link> ou recrie a mesa na aventura.
        </p>
        <Link href="/rpg/eldarin" className="btn" style={{ marginTop: "1rem" }}>
          Ir para Suas mesas
        </Link>
      </div>
    );
  }

  const accountUser = session?.user ? await safeMaterializeSessionUser(session.user) : null;

  if (accountUser && roomId !== "demo" && !watchOnly) {
    try {
      const isMember = await isRoomMemberResolved(room, accountUser.id, accountUser.clerkId);
      if (!room.memberIds.includes(accountUser.id) && isMember) {
        await joinRoomMembers(roomId, accountUser.id);
        room = (await getRoom(roomId)) ?? room;
      } else if (!isMember && (await shouldAutoJoinRoom(room, accountUser))) {
        await joinRoomMembers(roomId, accountUser.id);
        room = (await getRoom(roomId)) ?? room;
      }
    } catch (err) {
      console.error("[mesa] auto-join membro:", err);
    }
  }

  if (accountUser && inviteCode && !watchOnly && accountUser.role !== "admin") {
    try {
      const alreadyMember = await isRoomMemberResolved(room, accountUser.id, accountUser.clerkId);
      if (!alreadyMember && (await inviteMatchesRoom(room, inviteCode))) {
        const joined = await joinRoomByInvite(inviteCode, accountUser.id, roomId);
        const canonical = await canonicalInviteForRoom(room);
        const targetRoomId = joined?.roomId ?? canonical.roomId;
        const fresh = (await getRoom(targetRoomId)) ?? joined ?? room;
        room = fresh;

        if (await isRoomMemberResolved(room, accountUser.id, accountUser.clerkId)) {
          if (targetRoomId !== roomId) {
            redirect(mesaRoomPath(targetRoomId, inviteCode));
          }
          redirect(`/mesa/${roomId}?joined=1`);
        }
        joinError =
          "Não foi possível entrar na mesa com este convite. Tente novamente ou peça um novo link ao mestre.";
      }
    } catch (err) {
      console.error("[mesa] join por convite:", err);
      joinError =
        "Não foi possível entrar na mesa com este convite. Tente novamente ou peça um novo link ao mestre.";
    }
  }

  if (
    accountUser &&
    roomId !== "demo" &&
    !watchOnly &&
    (await isRoomMemberResolved(room, accountUser.id, accountUser.clerkId))
  ) {
    const advId = room.adventureId ?? roomId;
    if (room.ownerId !== accountUser.id) {
      try {
        await bindPlayerToAdventure(advId, accountUser.id);
      } catch (err) {
        console.error("[mesa] bindPlayerToAdventure:", err);
      }
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
          <Link href="/rpg/eldarin" className="btn btn--ghost" style={{ marginTop: "0.75rem", marginLeft: "0.5rem" }}>
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
          <Link href="/rpg/eldarin" className="btn" style={{ marginTop: "1rem" }}>
            Inserir código em Suas mesas
          </Link>
        )}
      </div>
    );
  }

  const access = resolveRoomAccess(room, session?.user ?? null, inviteCode, { watchOnly });
  const visitor = access.isVisitor;
  const isRoomGm = canManageRoom(room, session?.user ?? null);
  const canParticipate = access.canParticipate;
  const canChat = access.canChat;
  const role = session?.user.role ?? null;
  const packs = getVisiblePacks(role, { isRoomGm });
  const compendium = Object.fromEntries(
    packs.map((p) => [
      p.id,
      getPackEntries(p.id, { role, isRoomGm }),
    ])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  const isDemoRoom = roomId === "demo";
  const canControlCombat = isRoomGm;
  const defaultActorId =
    session?.user &&
    (Object.values(room.actors).find((a) => a.ownerId === session.user.id)?.id ??
      Object.keys(room.actors)[0]);

  const advId = room.adventureId ?? roomId;
  const adventure = await getAdventure(advId);
  const adventureName = adventure?.name ?? room.name;
  const mesaInvite = await canonicalInviteForRoom(room);

  let characterSlotsLeft = 0;
  let charactersInAdventure = 0;
  if (session?.user && canParticipate && roomId !== "demo") {
    const accountUser = await safeMaterializeSessionUser(session.user);
    const myChars = await listCharactersForSessionUserSafe(accountUser);
    const inAdv = await listCharactersForSessionUserInAdventureSafe(accountUser, advId);
    characterSlotsLeft = Math.max(0, MAX_CHARACTERS_PER_USER - myChars.length);
    charactersInAdventure = inAdv.length;
  }

  const canEdit = canParticipate;

  return (
    <div className="vtt-page vtt-page--mesa">
      {visitor ? (
        <MesaVisitorNotice
          roomId={roomId}
          inviteCode={inviteCode}
          watchOnly={access.watchOnly}
          isDemo={isDemoRoom}
        />
      ) : null}

      <MesaWorkspace
        roomId={roomId}
        adventureId={room.adventureId ?? roomId}
        roomOwnerId={room.ownerId}
        memberIds={room.memberIds}
        scene={room.scene}
        canEdit={canEdit}
        canControlCombat={canControlCombat}
        canChat={canChat}
        watchOnly={access.watchOnly}
        inviteCode={inviteCode}
        roomInviteCode={canParticipate ? mesaInvite.inviteCode : null}
        roomInviteRoomId={canParticipate ? mesaInvite.roomId : null}
        roomName={room.name}
        isRoomOwner={isRoomGm}
        session={session?.user ?? null}
        compendium={compendium}
        packs={packs}
        defaultActorId={defaultActorId}
        adventureName={adventureName}
        characterSlotsLeft={characterSlotsLeft}
        charactersInAdventure={charactersInAdventure}
        openCharacterWizardOnLoad={criarParam === "personagem"}
      />
    </div>
  );
}
