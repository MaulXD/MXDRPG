import { NextResponse } from "next/server";
import { assertTokenControl, chatRoleForUser } from "@/lib/auth/authorize-room";
import { canBypassCombatTurn } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { executeRoomAttack, getRoom } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  attackerTokenId?: string;
  defenderTokenId?: string;
  defenderTokenIds?: string[];
  actionPack?: "armas" | "magias" | "habilidades";
  actionEntryId?: string;
  bypassTurn?: boolean;
  channelExtraPa?: number;
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
  const room = await getRoom(roomId);
  const author = authorFromSession(session, room);
  const body = (await req.json()) as Body;

  const attackerTokenId = body.attackerTokenId?.trim();
  const defenderTokenIds = body.defenderTokenIds?.map((id) => id.trim()).filter(Boolean);
  const defenderTokenId = body.defenderTokenId?.trim();

  if (!attackerTokenId) {
    return NextResponse.json({ error: "Conjurador inválido" }, { status: 400 });
  }
  if (!defenderTokenIds?.length && !defenderTokenId) {
    return NextResponse.json({ error: "Alvo inválido" }, { status: 400 });
  }

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  const ctrl = assertTokenControl(room, session?.user ?? null, attacker);
  if (ctrl) {
    return NextResponse.json({ error: ctrl.error }, { status: ctrl.status });
  }

  const canBypass = canBypassCombatTurn(room, session?.user ?? null);
  const bypassTurn = Boolean(body.bypassTurn && canBypass);

  const result = await executeRoomAttack(
    roomId,
    attackerTokenId,
    defenderTokenId ?? defenderTokenIds![0]!,
    author,
    {
      packId: body.actionPack,
      entryId: body.actionEntryId?.trim(),
      bypassTurn,
      channelExtraPa: body.channelExtraPa,
      defenderTokenIds: defenderTokenIds?.length ? defenderTokenIds : undefined,
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    snapshotForViewer(result.snapshot, room, session?.user ?? null)
  );
}
