import { NextResponse } from "next/server";
import { assertTokenControl, chatRoleForUser } from "@/lib/auth/authorize-room";
import { canBypassCombatTurn } from "@/lib/auth/room-access";
import { effectiveBypassTurn } from "@/lib/combat/turn-guard";
import { getSession } from "@/lib/auth/session";
import { mutationDeltaResponse } from "@/lib/room/mutation-response";
import { toSnapshot } from "@/lib/room/internal/registry";
import { executeRoomConsume, getRoom } from "@/lib/room/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  instanceId?: string;
  bypassTurn?: boolean;
};

function authorFromSession(
  session: Awaited<ReturnType<typeof getSession>>,
  room: Awaited<ReturnType<typeof getRoom>>
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
  const room = await getRoom(roomId, { skipAutoPass: true });
  const author = authorFromSession(session, room);
  const body = (await req.json()) as Body;

  const tokenId = body.tokenId?.trim();
  const instanceId = body.instanceId?.trim();
  if (!tokenId || !instanceId) {
    return NextResponse.json({ error: "Token ou item inválido" }, { status: 400 });
  }

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const token = room.scene.tokens.find((t) => t.id === tokenId);
  const ctrl = assertTokenControl(room, session?.user ?? null, token);
  if (ctrl) {
    return NextResponse.json({ error: ctrl.error }, { status: ctrl.status });
  }

  const canBypass = canBypassCombatTurn(room, session?.user ?? null);
  const bypassTurn = Boolean(body.bypassTurn && token && effectiveBypassTurn(token, canBypass));

  const beforeSnap = toSnapshot(room);
  const result = await executeRoomConsume(roomId, tokenId, instanceId, author, { bypassTurn });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    mutationDeltaResponse(beforeSnap, result.snapshot, room, session?.user ?? null)
  );
}
