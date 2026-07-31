import { NextResponse } from "next/server";
import { assertTokenControl, chatRoleForUser } from "@/lib/auth/authorize-room";
import { canBypassCombatTurn } from "@/lib/auth/room-access";
import { effectiveBypassTurn } from "@/lib/combat/turn-guard";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
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
  areaDirection?: number;
  channelExtraPa?: number;
};

function authorFromSession(
  session: Awaited<ReturnType<typeof getSession>>,
  room: Awaited<ReturnType<typeof getRoom>>
) {
  if (session && room) {
    return {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: chatRoleForUser(room, session.user),
    };
  }
  if (session) {
    return {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
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
  const room = await getRoom(roomId);
  const author = authorFromSession(session, room);
  const body = (await req.json()) as Body;

  const casterTokenId = body.casterTokenId?.trim();
  if (!casterTokenId || body.centerQ == null || body.centerR == null) {
    return NextResponse.json({ error: "Centro de área inválido" }, { status: 400 });
  }

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const caster = room.scene.tokens.find((t) => t.id === casterTokenId);
  const ctrl = assertTokenControl(room, session?.user ?? null, caster);
  if (ctrl) {
    return NextResponse.json({ error: ctrl.error }, { status: ctrl.status });
  }

  const canBypass = canBypassCombatTurn(room, session?.user ?? null);
  const bypassTurn = Boolean(body.bypassTurn && caster && effectiveBypassTurn(caster, canBypass));

  const result = await executeRoomAreaSpell(
    roomId,
    casterTokenId,
    { q: body.centerQ, r: body.centerR },
    author,
    {
      packId: "magias",
      entryId: body.actionEntryId?.trim(),
      bypassTurn,
      areaDirection:
        typeof body.areaDirection === "number" &&
        body.areaDirection >= 0 &&
        body.areaDirection < 8
          ? body.areaDirection
          : undefined,
      channelExtraPa: body.channelExtraPa,
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    snapshotForViewer(result.snapshot, room, session?.user ?? null)
  );
}
