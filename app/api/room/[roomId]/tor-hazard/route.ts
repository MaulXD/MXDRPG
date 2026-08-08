import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorHazard, type TorHazardAction } from "@/lib/room/handlers/tor-hazard";
import { isTorHazardLevel, isTorHazardSource } from "@/lib/combat/um-anel/hazards";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  action?: "apply" | "cure-poison";
  source?: string;
  level?: string;
  healerRank?: number;
};

/**
 * Fontes de Dano fora do combate (capítulo 8) e a rolagem de CURA que tira o
 * veneno. Quem barra por permissão é o handler.
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

  let action: TorHazardAction;
  if (body.action === "cure-poison") {
    action = { kind: "cure-poison", healerRank: Number(body.healerRank ?? 0) };
  } else {
    if (!isTorHazardSource(body.source)) {
      return NextResponse.json({ error: "Fonte de dano inválida" }, { status: 400 });
    }
    if (!isTorHazardLevel(body.level)) {
      return NextResponse.json({ error: "Nível de perda inválido" }, { status: 400 });
    }
    action = { kind: "apply", source: body.source, level: body.level };
  }

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorHazard(roomId, tokenId, action, session.user, {
    authorId: session.user.id,
    authorName: session.user.nickname?.trim() || "Jogador",
    authorRole: chatRoleForUser(room, session.user),
  }, { room });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ snapshot: result.snapshot });
}
