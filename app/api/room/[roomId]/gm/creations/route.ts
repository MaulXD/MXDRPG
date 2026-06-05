import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { createRoomGmCreation } from "@/lib/room/store";
import type { CreateGmCreationInput } from "@/lib/room/gm-creations";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    mode?: "blank" | "monster" | "actor";
    name?: string;
    creationKind?: "creature" | "npc";
    monsterEntryId?: string;
    actorId?: string;
  };

  let input: CreateGmCreationInput;
  if (body.mode === "monster" && body.monsterEntryId?.trim()) {
    input = { kind: "monster", monsterEntryId: body.monsterEntryId.trim() };
  } else if (body.mode === "actor" && body.actorId?.trim()) {
    input = { kind: "actor", actorId: body.actorId.trim() };
  } else {
    const kind = body.creationKind === "npc" ? "npc" : "creature";
    input = { kind: "blank", name: body.name?.trim() || "Novo", creationKind: kind };
  }

  const result = await createRoomGmCreation(roomId, auth.user.id, input);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    creation: result.creation,
    snapshot: snapshotForViewer(result.snapshot, auth.room, auth.user),
  });
}
