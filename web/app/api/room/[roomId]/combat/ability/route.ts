import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { executeRoomAbility } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  attackerTokenId?: string;
  defenderTokenId?: string | null;
  actionPack?: "habilidades";
  actionEntryId?: string;
  bypassTurn?: boolean;
};

function authorFromSession(session: Awaited<ReturnType<typeof getSession>>) {
  if (session) {
    return {
      authorId: session.user.id,
      authorName: session.user.name,
      authorRole: session.user.role as ChatMessage["authorRole"],
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
  const author = authorFromSession(session);
  const body = (await req.json()) as Body;

  const attackerTokenId = body.attackerTokenId?.trim();
  if (!attackerTokenId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const canBypass = session?.user.role === "mestre" || session?.user.role === "admin";
  const bypassTurn = Boolean(body.bypassTurn && canBypass);

  const result = executeRoomAbility(
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

  return NextResponse.json(result.snapshot);
}
