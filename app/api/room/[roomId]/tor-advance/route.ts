import { NextResponse } from "next/server";
import { chatRoleForUser } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import { executeRoomTorAdvance, type TorAdvanceBuy } from "@/lib/room/handlers/tor-advance";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  characterId?: string;
  kind?: string;
  skillId?: string;
  proficiencyId?: string;
};

/**
 * Gasta Pontos de Perícia/Aventura para subir um grau.
 *
 * Sem `requireRoomManage`: avançar é escolha de quem joga o herói. Quem confere
 * dono da ficha, preço, moeda e limite da Fase é o handler.
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

  const characterId = body.characterId?.trim();
  if (!characterId) return NextResponse.json({ error: "Informe a ficha" }, { status: 400 });

  let buy: TorAdvanceBuy;
  if (body.kind === "skill") buy = { kind: "skill", skillId: String(body.skillId ?? "") };
  else if (body.kind === "proficiency") {
    buy = { kind: "proficiency", proficiencyId: String(body.proficiencyId ?? "") };
  } else if (body.kind === "valour") buy = { kind: "valour" };
  else if (body.kind === "wisdom") buy = { kind: "wisdom" };
  else return NextResponse.json({ error: "Tipo de avanço inválido" }, { status: 400 });

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const result = await executeRoomTorAdvance(
    roomId,
    characterId,
    buy,
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
