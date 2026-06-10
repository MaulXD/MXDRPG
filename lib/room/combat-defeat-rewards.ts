import { applyOnKillPaBonusInRoom } from "@/lib/combat/combat-token-pa";
import type { ChatMessage } from "@/lib/room/chat";
import type { RoomState } from "@/lib/room/types";
import { appendRoomChatMessage } from "@/lib/room/handlers/chat";
import { recordMonsterDefeat } from "@/lib/room/combat-xp";

type DefeatParams = {
  defenderTokenId: string;
  defenderName: string;
  attackerTokenId: string;
  hpBefore: number;
};

type Author = {
  authorId: string;
  authorName: string;
  authorRole: ChatMessage["authorRole"];
};

/** XP de derrota + bônus de PA on-kill (Carrasco, Cap. 2.6). */
export async function recordDefeatWithPaRewards(
  room: RoomState,
  author: Author,
  defeat: DefeatParams
): Promise<void> {
  await recordMonsterDefeat(room, author, defeat);
  const notice = applyOnKillPaBonusInRoom(room, defeat.attackerTokenId);
  if (notice) {
    appendRoomChatMessage(room, { ...author, kind: "system", text: notice });
  }
}
