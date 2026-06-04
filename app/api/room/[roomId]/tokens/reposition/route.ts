import { NextResponse } from "next/server";
import { requireRoomSpawn } from "@/lib/auth/authorize-room";
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
  const auth = await requireRoomSpawn(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as Body;
  const tokenId = body.tokenId?.trim();
  if (!tokenId || body.q == null || body.r == null) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const result = await repositionRoomToken(roomId, tokenId, { q: body.q, r: body.r });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, auth.room, auth.user));
}
