import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { addRoomPing, getRoom } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

type Body = { q?: number; r?: number; color?: string };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const body = (await req.json()) as Body;

  if (body.q == null || body.r == null) {
    return NextResponse.json({ error: "Célula inválida" }, { status: 400 });
  }

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const color =
    typeof body.color === "string" && body.color.trim() ? body.color.trim() : "#c9a962";

  const snapshot = await addRoomPing(roomId, session?.user ?? null, body.q, body.r, color);
  if (!snapshot) {
    return NextResponse.json({ error: "Sem permissão ou célula inválida" }, { status: 403 });
  }

  return NextResponse.json(snapshotForViewer(snapshot, room, session?.user ?? null));
}
