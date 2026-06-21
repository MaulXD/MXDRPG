import { NextResponse } from "next/server";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { getRoomSnapshot } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { roomId } = await params;
  const invite = new URL(req.url).searchParams.get("invite");

  const auth = await requireRoomView(roomId, invite);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sinceRev = Math.max(0, parseInt(new URL(req.url).searchParams.get("since") ?? "0", 10) || 0);
  if (sinceRev > 0 && auth.room.revision <= sinceRev) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "X-Room-Revision": String(auth.room.revision),
        "Cache-Control": "private, no-cache",
      },
    });
  }

  const snapshot = await getRoomSnapshot(roomId);
  if (!snapshot) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  return NextResponse.json(snapshotForViewer(snapshot, auth.room, auth.user));
}
