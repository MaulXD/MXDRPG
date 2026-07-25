import { NextResponse } from "next/server";
import { requireRoomSpawn } from "@/lib/auth/authorize-room";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { spawnRoomTorAdversary } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  adversaryId?: string;
  q?: number;
  r?: number;
};

export async function POST(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const auth = await requireRoomSpawn(roomId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await req.json()) as Body;
    const adversaryId = body.adversaryId?.trim();
    if (!adversaryId || body.q == null || body.r == null) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const result = await spawnRoomTorAdversary(roomId, adversaryId, { q: body.q, r: body.r }, { room: auth.room });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(snapshotForViewer(result.snapshot, auth.room, auth.user));
  } catch (e) {
    console.error("[tokens/spawn-tor-adversary] erro interno:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro interno ao invocar adversário" },
      { status: 500 }
    );
  }
}
