import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { validateDisplayName } from "@/lib/moderation/display-name";
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

  if (typeof body.name === "string") {
    const checked = validateDisplayName(body.name);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    patch.name = checked.name;
  }
  if (typeof body.showMonsterHpToPlayers === "boolean") {
    patch.showMonsterHpToPlayers = body.showMonsterHpToPlayers;
  }
  if (typeof body.showMonsterHpInChat === "boolean") {
    patch.showMonsterHpInChat = body.showMonsterHpInChat;
  }
  if (typeof body.allowPlayerPing === "boolean") {
    patch.allowPlayerPing = body.allowPlayerPing;
  }
  if (typeof body.showUsernameOnTokenNameplate === "boolean") {
    patch.showUsernameOnTokenNameplate = body.showUsernameOnTokenNameplate;
  }
  if (typeof body.combatActive === "boolean") {
    patch.combatActive = body.combatActive;
  }
  if (typeof body.autoPassDelayMs === "number" && Number.isFinite(body.autoPassDelayMs)) {
    patch.autoPassDelayMs = body.autoPassDelayMs;
  }
  if (typeof body.xpFromMonstersEnabled === "boolean") {
    patch.xpFromMonstersEnabled = body.xpFromMonstersEnabled;
  }
  if (body.coverUrl === null) {
    patch.coverUrl = null;
    patch.coverFocus = null;
  } else if (typeof body.coverUrl === "string") {
    patch.coverUrl = body.coverUrl;
  }
  if (body.coverFocus === null) {
    patch.coverFocus = null;
  } else if (body.coverFocus && typeof body.coverFocus === "object") {
    patch.coverFocus = body.coverFocus as import("@/lib/media/portrait-focus").PortraitFocus;
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
