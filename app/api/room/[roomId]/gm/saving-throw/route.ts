import { NextResponse } from "next/server";
import { canManageRoom } from "@/lib/auth/room-access";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { executeGmSavingThrows, getRoom, type GmSavingThrowRequest } from "@/lib/room/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const invite = new URL(req.url).searchParams.get("invite");
  const auth = await requireRoomView(roomId, invite);

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.room.roomId !== "demo" && !canManageRoom(auth.room, auth.user)) {
    return NextResponse.json({ error: "Só o mestre pode rolar salvaguardas" }, { status: 403 });
  }

  const body = (await req.json()) as GmSavingThrowRequest;
  const result = await executeGmSavingThrows(roomId, body, auth.user ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const room = (await getRoom(roomId)) ?? auth.room;
  return NextResponse.json(snapshotForViewer(result.snapshot, room, auth.user ?? null));
}
