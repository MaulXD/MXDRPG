import { NextResponse } from "next/server";
import { canTrackRoomPresence } from "@/lib/auth/presence-access";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { touchRoomPresence, listRoomPresence } from "@/lib/room/presence";
import { buildEnrichedRoomPresence } from "@/lib/room/presence-enrich";
import type { RoomPresenceMember } from "@/lib/room/presence-enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

function basicPresenceFallback(
  raw: { userId: string; displayName: string }[],
  roomOwnerId: string
): RoomPresenceMember[] {
  return raw.map((entry) => ({
    userId: entry.userId,
    displayName: entry.displayName,
    avatarUrl: null,
    avatarFocus: null,
    characterPortraitUrl: null,
    role: entry.userId === roomOwnerId ? "gm" : "player",
    characterName: null,
    isOwner: entry.userId === roomOwnerId,
  }));
}

async function presenceResponse(
  roomId: string,
  invite: string | null,
  touch?: { userId: string; label: string }
) {
  const auth = await requireRoomView(roomId, invite);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (touch) {
    const user = auth.user;
    if (!user || !(await canTrackRoomPresence(auth.room, user))) {
      return NextResponse.json({ error: "Participantes logados apenas" }, { status: 403 });
    }
    try {
      await touchRoomPresence(roomId, touch.userId, touch.label);
    } catch (err) {
      console.error("[presence] touch failed:", err);
    }
  }

  try {
    const online = await buildEnrichedRoomPresence(auth.room);
    return NextResponse.json({ online });
  } catch (err) {
    console.error("[presence] enrich failed:", err);
    const raw = await listRoomPresence(roomId);
    return NextResponse.json({ online: basicPresenceFallback(raw, auth.room.ownerId) });
  }
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const invite = new URL(req.url).searchParams.get("invite");

    const auth = await requireRoomView(roomId, invite);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let touch: { userId: string; label: string } | undefined;
    const user = auth.user;
    if (user && (await canTrackRoomPresence(auth.room, user))) {
      const label = user.nickname?.trim() || user.name?.trim() || "Jogador";
      touch = { userId: user.id, label };
    }

    return presenceResponse(roomId, invite, touch);
  } catch (err) {
    console.error("[presence] GET failed:", err);
    return NextResponse.json({ error: "Presença indisponível" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const invite = new URL(req.url).searchParams.get("invite");

    const auth = await requireRoomView(roomId, invite);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user;
    if (!user || !(await canTrackRoomPresence(auth.room, user))) {
      return NextResponse.json({ error: "Participantes logados apenas" }, { status: 403 });
    }

    const label = user.nickname?.trim() || user.name?.trim() || "Jogador";
    return presenceResponse(roomId, invite, { userId: user.id, label });
  } catch (err) {
    console.error("[presence] POST failed:", err);
    return NextResponse.json({ error: "Presença indisponível" }, { status: 500 });
  }
}
