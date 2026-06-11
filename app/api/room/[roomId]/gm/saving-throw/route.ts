import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { executeGmSavingThrows, getRoom, type GmSavingThrowRequest } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const body = (await req.json()) as GmSavingThrowRequest;
  const result = await executeGmSavingThrows(roomId, body, session?.user ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, room, session?.user ?? null));
}
