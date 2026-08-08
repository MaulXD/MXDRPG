import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorTask } from "@/lib/room/handlers/tor-combat-task";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  taskId?: string;
  /** Só Proteger Companheiro — o herói protegido. */
  allyTokenId?: string;
};

/**
 * Executa uma Tarefa de Combate do Um Anel.
 *
 * Sem `requireRoomManage`, pelo mesmo motivo da postura: a tarefa é ação do
 * jogador. Quem valida dono da ficha, postura exigida e "uma vez por rodada" é o
 * handler. Apelido como autor, nunca o nome real da conta.
 */
export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem permissão" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const tokenId = body.tokenId?.trim();
  const taskId = body.taskId?.trim();
  if (!tokenId || !taskId) {
    return NextResponse.json({ error: "Informe o token e a tarefa" }, { status: 400 });
  }

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorTask(
    roomId,
    tokenId,
    taskId,
    session.user,
    {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: chatRoleForUser(room, session.user),
    },
    { allyTokenId: body.allyTokenId?.trim(), room }
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ snapshot: result.snapshot });
}
