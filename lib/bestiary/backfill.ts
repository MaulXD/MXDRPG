import { recordPlayerBestiaryFromCombat } from "@/lib/bestiary/record";
import type { ChatMessage } from "@/lib/room/chat";
import type { RoomState } from "@/lib/room/types";

/** Reconstrói memória a partir do chat da sala (sessão atual / histórico recente). */
export async function backfillPlayerBestiaryFromRoomChat(room: RoomState): Promise<void> {
  const chat = room.chat ?? [];
  for (const msg of chat) {
    if (msg.kind !== "combat" || !msg.combat) continue;
    await recordPlayerBestiaryFromCombat(room, msg as ChatMessage);
  }
}
