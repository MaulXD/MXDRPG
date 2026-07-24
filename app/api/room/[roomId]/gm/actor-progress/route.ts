import { NextResponse } from "next/server";
import { canParticipateInRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import {
  executeGmActorProgress,
  getRoom,
  type GmActorProgressAction,
} from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  if (!canParticipateInRoom(room, session.user)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = (await req.json()) as GmActorProgressAction;
  const result = await executeGmActorProgress(roomId, body, session?.user ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, room, session?.user ?? null));
}
