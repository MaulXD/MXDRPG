import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { getRoom, placeRoomTorCharacterOnCell, canPlaceTorCharacterOnBoard } from "@/lib/room/store";
import { resolveTorCharacter } from "@/lib/character/um-anel/characters";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  torCharacterId?: string;
  q?: number;
  r?: number;
};

export async function POST(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const body = (await req.json()) as Body;
    const torCharacterId = body.torCharacterId?.trim();
    if (!torCharacterId || body.q == null || body.r == null) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const sheet = await resolveTorCharacter(torCharacterId);
    if (!sheet) {
      return NextResponse.json({ error: "Personagem não encontrado" }, { status: 404 });
    }

    const user = session?.user ?? null;
    if (!(await canPlaceTorCharacterOnBoard(room, sheet, user))) {
      return NextResponse.json({ error: "Sem permissão para posicionar este personagem" }, { status: 403 });
    }

    const result = await placeRoomTorCharacterOnCell(roomId, torCharacterId, { q: body.q, r: body.r }, { room });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(snapshotForViewer(result.snapshot, room, user));
  } catch (e) {
    console.error("[tokens/place-tor-character] erro interno:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro interno ao posicionar personagem" },
      { status: 500 }
    );
  }
}
