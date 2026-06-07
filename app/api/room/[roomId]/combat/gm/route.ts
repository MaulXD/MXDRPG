import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { executeGmCombatAction, getRoom, type GmCombatAction } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (room.roomId !== "demo") {
    const auth = await requireRoomManage(roomId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  const body = (await req.json()) as GmCombatAction;
  const result = await executeGmCombatAction(roomId, body, session?.user ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, room, session?.user ?? null));
}
