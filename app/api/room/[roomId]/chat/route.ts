import { NextResponse } from "next/server";
import { rollDice, formatRollMessage } from "@/lib/dice/roll";
import { getSession } from "@/lib/auth/session";
import { addRoomChatMessage } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  text?: string;
  kind?: "chat" | "roll";
  formula?: string;
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

  if (body.kind === "roll" || body.formula) {
    const formula = (body.formula ?? body.text ?? "").trim();
    if (!formula) {
      return NextResponse.json({ error: "Fórmula vazia" }, { status: 400 });
    }
    try {
      const result = rollDice(formula);
      const snapshot = addRoomChatMessage(roomId, {
        ...author,
        kind: "roll",
        text: formatRollMessage(result),
        roll: {
          formula: result.formula,
          rolls: result.rolls,
          total: result.total,
        },
      });
      if (!snapshot) {
        return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
      }
      return NextResponse.json(snapshot);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Rolagem inválida" },
        { status: 400 }
      );
    }
  }

  const text = (body.text ?? "").trim();
  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Mensagem inválida (máx 500)" }, { status: 400 });
  }

  const snapshot = addRoomChatMessage(roomId, {
    ...author,
    kind: "chat",
    text,
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
