import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { rollRoomInitiative } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { roomId } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const snapshot = await rollRoomInitiative(roomId);
  if (!snapshot) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }
  return NextResponse.json(snapshotForViewer(snapshot, auth.room, auth.user));
}
