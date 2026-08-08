import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorPush } from "@/lib/room/handlers/tor-push";

type Params = { params: Promise<{ roomId: string }> };

/**
 * O herói escolhe ser empurrado e amortece metade do golpe.
 *
 * Rota separada do ataque porque a decisão é de quem LEVOU o golpe — e a
 * requisição de ataque é mandada por quem atacou. Quem valida dono da ficha e
 * "uma vez por rodada" é o handler.
 */
export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem permissão" }, { status: 401 });

  let body: { tokenId?: string };
  try {
    body = (await req.json()) as { tokenId?: string };
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const tokenId = body.tokenId?.trim();
  if (!tokenId) return NextResponse.json({ error: "Informe o token" }, { status: 400 });

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorPush(
    roomId,
    tokenId,
    session.user,
    {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: chatRoleForUser(room, session.user),
    },
    { room }
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ snapshot: result.snapshot });
}
