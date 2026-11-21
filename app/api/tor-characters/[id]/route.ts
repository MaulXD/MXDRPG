import { NextResponse } from "next/server";
import {
  patchTorCharacterResources,
  resolveTorCharacter,
  type TorResourcePatch,
} from "@/lib/character/um-anel/characters";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { getSession } from "@/lib/auth/session";
import { getAdventure } from "@/lib/adventure/store";
import { getRoom, persistRoom } from "@/lib/room/internal/registry";

type Props = { params: Promise<{ id: string }> };

/** Sobe a revisão da sala da aventura da ficha, para o card do dono
 * (TorPlayableCharactersPanel) recarregar. Sem aventura ou sem sala, não faz nada. */
async function bumpAdventureRoomRevision(adventureId: string | null | undefined): Promise<void> {
  if (!adventureId) return;
  const adventure = await getAdventure(adventureId);
  if (!adventure) return;
  const room = await getRoom(adventure.primaryRoomId);
  if (!room) return;
  await persistRoom(room.roomId, room);
}

export async function GET(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login" }, { status: 401 });

  const { id } = await params;
  const character = await resolveTorCharacter(id);
  if (!character) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  return NextResponse.json({ character });
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as TorResourcePatch;
  try {
    const user = await materializeSessionUser(session.user);
    const character = await patchTorCharacterResources(id, body, user.id, {
      clerkId: user.clerkId ?? session.user.clerkId,
    });
    try {
      await bumpAdventureRoomRevision(character.adventureId);
    } catch (e) {
      // A ficha já foi gravada; a falha aqui só deixa o card da mesa atrasado.
      console.error("[tor-characters] falha ao subir a revisão da sala:", e);
    }
    return NextResponse.json({ ok: true, character });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao atualizar ficha" },
      { status: 400 }
    );
  }
}
