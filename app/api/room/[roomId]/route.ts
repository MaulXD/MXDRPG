import { NextResponse } from "next/server";
import { getRoomSnapshot } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { roomId } = await params;
  const snapshot = getRoomSnapshot(roomId);
  if (!snapshot) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
