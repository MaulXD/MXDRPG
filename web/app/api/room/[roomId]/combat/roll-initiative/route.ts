import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rollRoomInitiative } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session || (session.user.role !== "admin" && session.user.role !== "mestre")) {
    return NextResponse.json({ error: "Só mestre/admin controla combate" }, { status: 403 });
  }

  const { roomId } = await params;
  const snapshot = rollRoomInitiative(roomId);
  if (!snapshot) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
