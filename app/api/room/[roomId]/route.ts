import { NextResponse } from "next/server";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { getRoom } from "@/lib/room/store";
import { resolveRoomSync } from "@/lib/room/sync-response";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { roomId } = await params;
  const invite = new URL(req.url).searchParams.get("invite");

  const auth = await requireRoomView(roomId, invite);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const room = (await getRoom(roomId, { skipAutoPass: true })) ?? auth.room;

  const sinceRev = Math.max(0, parseInt(new URL(req.url).searchParams.get("since") ?? "0", 10) || 0);
  const sync = resolveRoomSync(room, sinceRev, auth.user);

  if (sync.mode === "unchanged") {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "X-Room-Revision": String(sync.revision),
        "X-Sync-Mode": "unchanged",
        "Cache-Control": "private, no-cache",
      },
    });
  }

  if (sync.mode === "full") {
    return NextResponse.json(sync.snapshot, {
      headers: {
        "X-Room-Revision": String(sync.revision),
        "X-Sync-Mode": "full",
        "Cache-Control": "private, no-cache",
      },
    });
  }

  return NextResponse.json(sync.delta, {
    headers: {
      "X-Room-Revision": String(sync.revision),
      "X-Sync-Mode": "delta",
      "Cache-Control": "private, no-cache",
    },
  });
}
