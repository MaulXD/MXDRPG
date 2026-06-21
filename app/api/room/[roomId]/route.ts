import { NextResponse } from "next/server";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { tickRoomAutoPassThrottled } from "@/lib/room/auto-pass-tick";
import { toSnapshot } from "@/lib/room/internal/registry";
import { trimSnapshotForSync } from "@/lib/room/snapshot-trim";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { getRoom } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { roomId } = await params;
  const invite = new URL(req.url).searchParams.get("invite");

  const auth = await requireRoomView(roomId, invite);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await tickRoomAutoPassThrottled(roomId);

  const room = (await getRoom(roomId, { skipAutoPass: true })) ?? auth.room;

  const sinceRev = Math.max(0, parseInt(new URL(req.url).searchParams.get("since") ?? "0", 10) || 0);
  if (sinceRev > 0 && room.revision <= sinceRev) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "X-Room-Revision": String(room.revision),
        "Cache-Control": "private, no-cache",
      },
    });
  }

  const viewed = snapshotForViewer(toSnapshot(room), room, auth.user);
  return NextResponse.json(trimSnapshotForSync(viewed, { user: auth.user, room }));
}
