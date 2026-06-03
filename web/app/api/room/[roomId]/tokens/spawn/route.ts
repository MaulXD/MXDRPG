import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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
  const session = await getSession();

  if (!session || (session.user.role !== "mestre" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Apenas mestre pode invocar monstros" }, { status: 403 });
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
