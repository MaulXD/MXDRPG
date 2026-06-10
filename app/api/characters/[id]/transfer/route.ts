import { NextResponse } from "next/server";
import { transferCharacterSheet } from "@/lib/character/lifecycle";
import { getSession } from "@/lib/auth/session";
import { canManageRoom } from "@/lib/auth/room-access";
import { getRoom } from "@/lib/room/internal/registry";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    confirmName?: string;
    targetUserId?: string;
    targetNickname?: string;
    roomId?: string;
    asGm?: boolean;
  };

  let asGm = Boolean(body.asGm);
  if (body.roomId) {
    const room = await getRoom(body.roomId);
    if (room && canManageRoom(room, session.user)) {
      asGm = true;
    }
  }

  const result = await transferCharacterSheet(id, session.user, {
    confirmName: body.confirmName,
    targetUserId: body.targetUserId,
    targetNickname: body.targetNickname,
    roomId: body.roomId,
    asGm,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ ok: true, character: result.character, roomId: result.roomId });
}
