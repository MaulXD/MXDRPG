import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { spawnRoomMonster } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  monsterEntryId?: string;
  q?: number;
  r?: number;
  variant?: "normal" | "elite" | "colossal";
  groupLevelDelta?: number;
};

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as Body;
  const monsterEntryId = body.monsterEntryId?.trim();
  if (!monsterEntryId || body.q == null || body.r == null) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const result = spawnRoomMonster(
    roomId,
    monsterEntryId,
    { q: body.q, r: body.r },
    {
      variant: body.variant ?? "normal",
      groupLevelDelta: body.groupLevelDelta,
    }
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.snapshot);
}
