import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { deleteRoomGmCreation, updateRoomGmCreation } from "@/lib/room/store";
import type { GmCreatureStats } from "@/lib/room/gm-creations";
import type { CharacterSheet } from "@/lib/character/types";

type Params = { params: Promise<{ roomId: string; id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { roomId, id } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    name?: string;
    creature?: Partial<GmCreatureStats>;
    npc?: Partial<CharacterSheet>;
  };

  const result = await updateRoomGmCreation(
    roomId,
    id,
    auth.user.id,
    auth.user.role,
    body
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    creation: result.creation,
    snapshot: snapshotForViewer(result.snapshot, auth.room, auth.user),
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { roomId, id } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await deleteRoomGmCreation(roomId, id, auth.user.id, auth.user.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    snapshot: snapshotForViewer(result.snapshot, auth.room, auth.user),
  });
}
