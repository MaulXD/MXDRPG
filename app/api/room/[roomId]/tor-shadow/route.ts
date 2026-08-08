import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorShadow } from "@/lib/room/handlers/tor-shadow";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  action?: "gain" | "harden";
  source?: string;
  points?: number;
  scars?: number;
};

/**
 * Sombra na mesa: ganho por fonte, e Endurecer a Vontade.
 *
 * Sem `requireRoomManage` na rota porque as duas ações têm donos diferentes —
 * ganhar Sombra é do Mestre, endurecer a vontade é de quem joga o herói. Quem
 * separa isso é o handler, que conhece a ficha.
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
  if (!tokenId) return NextResponse.json({ error: "Informe o token" }, { status: 400 });

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const action =
    body.action === "harden"
      ? ({ kind: "harden" } as const)
      : ({
          kind: "gain" as const,
          source: String(body.source ?? ""),
          points: Number(body.points ?? 0),
          scars: Number(body.scars ?? 0),
        });

  const result = await executeRoomTorShadow(
    roomId,
    tokenId,
    action,
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
