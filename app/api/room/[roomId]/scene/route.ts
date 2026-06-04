import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { getRoom, patchRoomScene, revealRoomHex } from "@/lib/room/store";
import type { ScenePatch } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

type Body = ScenePatch & {
  revealHex?: { q: number; r: number };
};

export async function PATCH(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const body = (await req.json()) as Body;

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  let snapshot = null;

  if (body.revealHex && body.revealHex.q != null && body.revealHex.r != null) {
    snapshot = await revealRoomHex(roomId, session?.user ?? null, body.revealHex.q, body.revealHex.r);
  } else {
    const { revealHex: _r, ...patch } = body;
    snapshot = await patchRoomScene(roomId, session?.user ?? null, patch);
  }

  if (!snapshot) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return NextResponse.json(snapshotForViewer(snapshot, room, session?.user ?? null));
}
