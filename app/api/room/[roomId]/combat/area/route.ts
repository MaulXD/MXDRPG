import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { canManageRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { executeRoomAreaSpell, getRoom } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  casterTokenId?: string;
  centerQ?: number;
  centerR?: number;
  actionPack?: "magias";
  actionEntryId?: string;
  bypassTurn?: boolean;
};

function authorFromSession(
  session: Awaited<ReturnType<typeof getSession>>,
  room: ReturnType<typeof getRoom>
) {
  if (session && room) {
    return {
      authorId: session.user.id,
      authorName: session.user.name,
      authorRole: chatRoleForUser(room, session.user),
    };
  }
  if (session) {
    return {
      authorId: session.user.id,
      authorName: session.user.name,
      authorRole: "jogador" as const,
    };
  }
  return {
    authorId: "guest",
    authorName: "Visitante",
    authorRole: "guest" as const,
  };
}

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const room = getRoom(roomId);
  const author = authorFromSession(session, room);
  const body = (await req.json()) as Body;

  const casterTokenId = body.casterTokenId?.trim();
  if (!casterTokenId || body.centerQ == null || body.centerR == null) {
    return NextResponse.json({ error: "Centro de área inválido" }, { status: 400 });
  }

  const canBypass = room && session ? canManageRoom(room, session.user) : false;
  const bypassTurn = Boolean(body.bypassTurn && canBypass);

  const result = executeRoomAreaSpell(
    roomId,
    casterTokenId,
    { q: body.centerQ, r: body.centerR },
    author,
    {
      packId: "magias",
      entryId: body.actionEntryId?.trim(),
      bypassTurn,
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.snapshot);
}
