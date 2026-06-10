import { NextResponse } from "next/server";
import { requireRoomMember } from "@/lib/auth/authorize-room";
import { canManageRoom } from "@/lib/auth/room-access";
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

  if (!canManageRoom(auth.room, auth.user)) {
    return NextResponse.json({ error: "Só o mestre pode reposicionar tokens" }, { status: 403 });
  }

  const token = auth.room.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  const result = await repositionRoomToken(roomId, tokenId, { q: body.q, r: body.r });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, auth.room, auth.user));
}
