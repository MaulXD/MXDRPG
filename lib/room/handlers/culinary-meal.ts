import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveStructuredMeal } from "@/lib/culinary/apply-meal";
import type { StructuredMealInput } from "@/lib/culinary/types";
import { persistActorToAdventureSheet } from "../adventure-actors";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import { syncLinkedTokens } from "../sync";
import type { RoomActor, RoomSnapshot } from "../types";

export async function executeStructuredMeal(
  roomId: string,
  input: StructuredMealInput,
  user: SessionUser | null | undefined
): Promise<{ ok: true; snapshot: RoomSnapshot } | { ok: false; error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  if (roomId !== "demo") {
    if (!user) return { ok: false, error: "Faça login" };
    if (!canManageRoom(room, user)) return { ok: false, error: "Só o mestre pode preparar refeições" };
  }

  const actorSheets = Object.fromEntries(
    Object.entries(room.actors).map(([id, a]) => [id, a as import("@/lib/character/types").CharacterSheet])
  );

  const resolved = resolveStructuredMeal(input, actorSheets);
  if (!resolved.ok) return resolved;

  for (const actorId of input.participantActorIds) {
    const prev = room.actors[actorId];
    if (!prev) continue;
    const sheet = resolved.updatedActors[actorId];
    const next: RoomActor = {
      ...sheet,
      revision: prev.revision + 1,
      ownerId: prev.ownerId,
      gmAuthored: prev.gmAuthored,
      gmTemplateId: prev.gmTemplateId,
    };
    room.actors[actorId] = next;
    await persistActorToAdventureSheet(next);
  }

  room.scene = syncLinkedTokens(room.scene, room.actors, { preserveCombatPa: Boolean(room.combat?.order?.length) });

  appendRoomChatMessage(room, {
    authorId: user?.id ?? "gm",
    authorName: user?.name ?? "Mestre",
    authorRole: "mestre",
    kind: "chat",
    text: resolved.result.chatLines.join("\n"),
  });

  const saved = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(saved) };
}
