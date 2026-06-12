import { NextResponse } from "next/server";
import { canAdvanceCombatTurn } from "@/lib/auth/combat-turn-access";
import { canParticipateInRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { advanceRoomTurn, getRoom } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  const body = (await req.json().catch(() => ({}))) as { force?: boolean };
  const force = Boolean(body.force);

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (room.roomId !== "demo") {
    if (!session?.user) {
      return NextResponse.json({ error: "Faça login para passar o turno" }, { status: 401 });
    }
    if (!canParticipateInRoom(room, session.user)) {
      return NextResponse.json({ error: "Você não participa desta mesa" }, { status: 403 });
    }
  }

  if (!canAdvanceCombatTurn(room, session?.user ?? null, room.combat)) {
    return NextResponse.json(
      { error: "Só o mestre ou quem está na vez pode passar o turno" },
      { status: 403 }
    );
  }

  try {
    const snapshot = await advanceRoomTurn(roomId, { force });
    if (!snapshot) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }
    return NextResponse.json(snapshotForViewer(snapshot, room, session?.user ?? null));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao avançar turno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
