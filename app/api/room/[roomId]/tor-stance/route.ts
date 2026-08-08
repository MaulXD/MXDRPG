import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { setRoomTorStance } from "@/lib/room/handlers/tor-stance";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  stance?: string;
  /** "O Mestre pode liberar por terreno" — só honrado para quem gerencia a mesa. */
  override?: boolean;
};

/**
 * Troca a Postura de Combate de um herói do Um Anel.
 *
 * Sem `requireRoomManage`: a postura é escolha do jogador, não do Mestre. Quem
 * decide se este usuário pode mexer neste token é o handler, que confere o dono
 * da ficha — a rota só entrega a sessão e o autor da mensagem de chat.
 *
 * O apelido vai como autor (nunca o nome real da conta), igual às outras rotas
 * de mesa.
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
  const stance = body.stance?.trim();
  if (!tokenId || !stance) {
    return NextResponse.json({ error: "Informe o token e a postura" }, { status: 400 });
  }

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await setRoomTorStance(
    roomId,
    tokenId,
    stance,
    session.user,
    {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: chatRoleForUser(room, session.user),
    },
    { override: body.override === true, room }
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ snapshot: result.snapshot });
}
