import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorRecovery, type TorRecoveryAction } from "@/lib/room/handlers/tor-recovery";

type Params = { params: Promise<{ roomId: string }> };

const ACTIONS: TorRecoveryAction[] = [
  "spiritual",
  "rest",
  "madness",
  "heal-scar",
  "short-rest",
  "journey-end",
];

/**
 * Recuperação espiritual, Descanso Prolongado, Acesso de Loucura e curar
 * Cicatriz. Uma rota só porque as quatro leem e gravam o mesmo bloco espiritual
 * da ficha; quem confere dono, Yule e pontos é o handler.
 */
export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem permissão" }, { status: 401 });

  let body: {
    characterId?: string;
    action?: string;
    mountVigour?: number;
    travelRoll?: { passed?: boolean; successIcons?: number };
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const characterId = body.characterId?.trim();
  const action = body.action as TorRecoveryAction;
  if (!characterId || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Informe a ficha e a ação" }, { status: 400 });
  }

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorRecovery(
    roomId,
    characterId,
    action,
    session.user,
    {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: chatRoleForUser(room, session.user),
    },
    {
      room,
      // Recortados: o corpo da requisição não é confiável. Vigor de montaria
      // acima de 6 não existe em bloco nenhum do livro.
      mountVigour: Math.max(0, Math.min(6, Math.floor(Number(body.mountVigour ?? 0)))),
      travelRoll: body.travelRoll
        ? {
            passed: body.travelRoll.passed === true,
            successIcons: Math.max(0, Math.min(6, Math.floor(Number(body.travelRoll.successIcons ?? 0)))),
          }
        : undefined,
    }
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ snapshot: result.snapshot });
}
