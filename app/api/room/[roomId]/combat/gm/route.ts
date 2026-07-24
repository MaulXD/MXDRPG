import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { safeMutationDeltaResponse } from "@/lib/room/mutation-response";
import { toSnapshot } from "@/lib/room/internal/registry";
import { executeGmCombatAction, getRoom, type GmCombatAction } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    const room = await getRoom(roomId, { skipAutoPass: true });

    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const auth = await requireRoomManage(roomId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await req.json()) as GmCombatAction;
    const beforeSnap = toSnapshot(room);
    const result = await executeGmCombatAction(roomId, body, session?.user ?? null, { room });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      safeMutationDeltaResponse(beforeSnap, result.snapshot, room, session?.user ?? null)
    );
  } catch (e) {
    console.error("[combat/gm] erro interno:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
