import { NextResponse } from "next/server";
import { rollDice, formatRollMessage } from "@/lib/dice/roll";
import { canChatInRoomSession } from "@/lib/auth/mesa-watch-session";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { addRoomChatMessage } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  text?: string;
  kind?: "chat" | "roll";
  formula?: string;
  /** Ícone de d12 (Dado de Proeza) do Um Anel — anexado como kind:"chat" (o texto já traz
   * o resultado completo calculado no cliente; o servidor só repassa, não re-rola). */
  torFeatDie?: { sides: 12; value: number };
};

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login para enviar mensagens" }, { status: 401 });
  }

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }
  if (!(await canChatInRoomSession(room, session.user))) {
    return NextResponse.json(
      { error: "Modo só assistir — sem enviar mensagens ou rolar dados" },
      { status: 403 }
    );
  }

  const author = {
    authorId: session.user.id,
    authorName: session.user.nickname?.trim() || "Jogador",
    authorRole: session.user.role as ChatMessage["authorRole"],
  };
  const body = (await req.json()) as Body;

  if (body.kind === "roll" || body.formula) {
    const formula = (body.formula ?? body.text ?? "").trim();
    if (!formula) {
      return NextResponse.json({ error: "Fórmula vazia" }, { status: 400 });
    }
    try {
      const result = rollDice(formula);
      const snapshot = await addRoomChatMessage(roomId, {
        ...author,
        kind: "roll",
        text: formatRollMessage(result),
        roll: {
          formula: result.formula,
          rolls: result.rolls,
          total: result.total,
          // Marca o sistema pra que o dado 3D desenhe as faces especiais do Um
          // Anel (Olho de Sauron no 11, tengwa no 6) em vez do número.
          system: room.rpgSystemId,
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

  const featDieValue =
    body.torFeatDie && Number.isFinite(body.torFeatDie.value)
      ? Math.min(12, Math.max(1, Math.round(body.torFeatDie.value)))
      : null;

  const snapshot = await addRoomChatMessage(roomId, {
    ...author,
    kind: "chat",
    text,
    ...(featDieValue != null
      ? { roll: { formula: "1d12", rolls: [featDieValue], total: featDieValue, system: room.rpgSystemId } }
      : {}),
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
