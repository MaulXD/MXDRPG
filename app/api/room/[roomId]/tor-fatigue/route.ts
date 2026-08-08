import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorFatigue, type TorFatigueScope } from "@/lib/room/handlers/tor-fatigue";
import { isTorFatigueSource } from "@/lib/combat/um-anel/fatigue";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  scope?: "company" | "token";
  tokenId?: string;
  points?: number;
  source?: string;
};

/**
 * Fadiga de Viagem: Evento de Jornada (Companhia inteira), marcha forçada, ou um
 * herói só. Quem barra por permissão é o handler, que sabe se quem pediu manda na
 * mesa.
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

  const source = body.source;
  if (!isTorFatigueSource(source)) {
    return NextResponse.json({ error: "Fonte de Fadiga inválida" }, { status: 400 });
  }

  let scope: TorFatigueScope;
  if (body.scope === "token") {
    const tokenId = body.tokenId?.trim();
    if (!tokenId) return NextResponse.json({ error: "Informe o token" }, { status: 400 });
    scope = { kind: "token", tokenId };
  } else {
    scope = { kind: "company" };
  }

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorFatigue(
    roomId,
    scope,
    { points: Number(body.points ?? 0), source },
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
