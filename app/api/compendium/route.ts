import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageRoom } from "@/lib/auth/room-access";
import { getRoom } from "@/lib/room/store";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";

/** Compêndio Eldarin pra dentro da mesa (painel do rail) — mesma visibilidade
 * por papel da página /compendios, mas "monstros" também depende de ser
 * mestre DESTA sala especificamente (roomId), não só do papel global. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId")?.trim();
  const session = await getSession();
  const role = session?.user.role ?? null;

  let isRoomGm = false;
  if (roomId) {
    const room = await getRoom(roomId);
    if (room) isRoomGm = canManageRoom(room, session?.user ?? null);
  }

  const packs = getVisiblePacks(role, { isRoomGm });
  const data = Object.fromEntries(
    packs.map((p) => [p.id, getPackEntries(p.id, { role, isRoomGm })])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  return NextResponse.json({ packs, data, role });
}
