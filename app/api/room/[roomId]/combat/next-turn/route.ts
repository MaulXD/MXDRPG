import { NextResponse } from "next/server";
import { canAdvanceCombatTurn } from "@/lib/auth/combat-turn-access";
import { isRoomMemberResolved } from "@/lib/auth/room-access-server";
import { getSession } from "@/lib/auth/session";
import { mutationDeltaResponse } from "@/lib/room/mutation-response";
import { toSnapshot } from "@/lib/room/internal/registry";
import { advanceRoomTurn, getRoom } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const body = (await req.json().catch(() => ({}))) as { force?: boolean };
  const force = Boolean(body.force);

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Faça login para passar o turno" }, { status: 401 });
  }
  if (!(await isRoomMemberResolved(room, session.user.id, session.user.clerkId))) {
    return NextResponse.json({ error: "Você não participa desta mesa" }, { status: 403 });
  }

  if (!canAdvanceCombatTurn(room, session?.user ?? null, room.combat)) {
    return NextResponse.json(
      { error: "Só o mestre ou quem está na vez pode passar o turno" },
      { status: 403 }
    );
  }

  try {
    const beforeSnap = toSnapshot(room);
    const snapshot = await advanceRoomTurn(roomId, { force, room });
    if (!snapshot) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      mutationDeltaResponse(beforeSnap, snapshot, room, session?.user ?? null)
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao avançar turno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
