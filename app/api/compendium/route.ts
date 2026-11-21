import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageRoom } from "@/lib/auth/room-access";
import { getRoom } from "@/lib/room/store";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";

/** Compêndio Eldarin pra dentro da mesa (painel do rail) — mesma visibilidade
 * por papel da página /compendios, mas "monstros" também depende de ser
 * mestre DESTA sala específica (roomId), não só do papel global.
 *
 * ?pack=<id>  devolve só os dados daquele pack (403 se o pack não está visível).
 * sem ?pack   devolve a lista de packs visíveis e os dados só do primeiro. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId")?.trim();
  const packPedido = searchParams.get("pack")?.trim() || null;
  const session = await getSession();
  const role = session?.user.role ?? null;

  let isRoomGm = false;
  if (roomId) {
    const room = await getRoom(roomId);
    if (room) isRoomGm = canManageRoom(room, session?.user ?? null);
  }

  const packs = getVisiblePacks(role, { isRoomGm });

  let alvo: CompendiumPackMeta | undefined = packs[0];
  if (packPedido !== null) {
    alvo = packs.find((p) => p.id === packPedido);
    if (!alvo) {
      return NextResponse.json({ error: "pack_indisponivel" }, { status: 403 });
    }
  }

  const data: Partial<Record<CompendiumPackId, CompendiumEntry[]>> = alvo
    ? { [alvo.id]: getPackEntries(alvo.id, { role, isRoomGm }) }
    : {};

  return NextResponse.json({ packs, data, role });
}
