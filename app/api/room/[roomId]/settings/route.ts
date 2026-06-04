import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { getRoom, patchRoomSettings } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { roomId } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const patch: import("@/lib/room/handlers/settings").RoomSettingsPatch = {};

  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.showMonsterHpToPlayers === "boolean") {
    patch.showMonsterHpToPlayers = body.showMonsterHpToPlayers;
  }
  if (typeof body.showMonsterHpInChat === "boolean") {
    patch.showMonsterHpInChat = body.showMonsterHpInChat;
  }
  if (typeof body.allowPlayerPing === "boolean") {
    patch.allowPlayerPing = body.allowPlayerPing;
  }

  const snapshot = await patchRoomSettings(roomId, auth.user, patch);
  if (!snapshot) {
    return NextResponse.json({ error: "Não foi possível salvar" }, { status: 400 });
  }

  const room = await getRoom(roomId);
  return NextResponse.json({
    snapshot,
    inviteCode: room?.inviteCode ?? null,
    name: room?.name ?? null,
  });
}
