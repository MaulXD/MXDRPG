import { NextResponse } from "next/server";
import { assertTokenControl, chatRoleForUser } from "@/lib/auth/authorize-room";
import { canBypassCombatTurn } from "@/lib/auth/room-access";
import { effectiveBypassTurn } from "@/lib/combat/turn-guard";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { executeRoomAbility, getRoom } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  attackerTokenId?: string;
  defenderTokenId?: string | null;
  actionPack?: "habilidades";
  actionEntryId?: string;
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
  try {
    const { roomId } = await params;
    const session = await getSession();
    const room = await getRoom(roomId);
    const author = authorFromSession(session, room);
    const body = (await req.json()) as Body;

    const attackerTokenId = body.attackerTokenId?.trim();
    if (!attackerTokenId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
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
    const bypassTurn = Boolean(body.bypassTurn && attacker && effectiveBypassTurn(attacker, canBypass));

    const result = await executeRoomAbility(
      roomId,
      attackerTokenId,
      body.defenderTokenId?.trim() ?? null,
      author,
      {
        packId: "habilidades",
        entryId: body.actionEntryId?.trim(),
        bypassTurn,
      }
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      snapshotForViewer(result.snapshot, room, session?.user ?? null)
    );
  } catch (e) {
    console.error("[ability] erro interno:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro interno na habilidade" },
      { status: 500 }
    );
  }
}
