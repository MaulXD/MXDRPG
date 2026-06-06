import { NextResponse } from "next/server";
import { assertTokenControl, requireRoomMember } from "@/lib/auth/authorize-room";
import { canManageRoom } from "@/lib/auth/room-access";
import { isMonsterToken } from "@/lib/room/settings";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { repositionRoomToken } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  q?: number;
  r?: number;
};

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const auth = await requireRoomMember(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as Body;
  const tokenId = body.tokenId?.trim();
  if (!tokenId || body.q == null || body.r == null) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const token = auth.room.scene.tokens.find((t) => t.id === tokenId);
  const controlErr = assertTokenControl(auth.room, auth.user, token);
  if (controlErr) {
    return NextResponse.json({ error: controlErr.error }, { status: controlErr.status });
  }
  if (token && isMonsterToken(token) && !canManageRoom(auth.room, auth.user)) {
    return NextResponse.json({ error: "Só o mestre pode mover monstros" }, { status: 403 });
  }

  const result = await repositionRoomToken(roomId, tokenId, { q: body.q, r: body.r });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, auth.room, auth.user));
}
