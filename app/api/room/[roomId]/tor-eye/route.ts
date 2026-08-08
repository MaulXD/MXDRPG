import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorEye, type TorEyeAction } from "@/lib/room/handlers/tor-eye";
import { isTorEyeSource } from "@/lib/combat/um-anel/eye";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  action?: "gain" | "reveal";
  source?: string;
  points?: number;
};

/**
 * Atenção do Olho subindo e o episódio de Revelação. Ligar a regra, escolher a
 * região e os modificadores do limiar vão pela rota de sessão — são ajuste de
 * mesa, não acontecimento a narrar.
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

  let action: TorEyeAction;
  if (body.action === "reveal") {
    action = { kind: "reveal" };
  } else {
    if (!isTorEyeSource(body.source)) {
      return NextResponse.json({ error: "Fonte de Atenção do Olho inválida" }, { status: 400 });
    }
    action = { kind: "gain", source: body.source, points: Number(body.points ?? 1) };
  }

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorEye(roomId, action, session.user, {
    authorId: session.user.id,
    authorName: session.user.nickname?.trim() || "Jogador",
    authorRole: chatRoleForUser(room, session.user),
  }, { room });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ snapshot: result.snapshot });
}
