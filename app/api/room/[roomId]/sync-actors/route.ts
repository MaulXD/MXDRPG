import { NextResponse } from "next/server";
import { isRoomMemberResolved } from "@/lib/auth/room-access-server";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

/** Sincroniza fichas da aventura em background (não bloqueia SSR da mesa). */
export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  if (roomId === "demo") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const invite = new URL(req.url).searchParams.get("invite");
  const auth = await requireRoomView(roomId, invite);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  if (!user || !(await isRoomMemberResolved(auth.room, user.id, user.clerkId))) {
    return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
  }

  try {
    const synced = await syncAdventureActorsForRoom(roomId);
    return NextResponse.json({ ok: true, revision: synced?.revision ?? auth.room.revision });
  } catch (err) {
    console.error("[sync-actors]", roomId, err);
    return NextResponse.json({ error: "Falha ao sincronizar fichas" }, { status: 500 });
  }
}
