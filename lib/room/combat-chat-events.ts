import type { ChatMessage } from "./chat";
import { appendRoomChatMessage } from "./handlers/chat";
import type { RoomState } from "./types";

type Author = Pick<ChatMessage, "authorId" | "authorName" | "authorRole">;

/** Mensagem destacada quando um token chega a 0 HP (append no estado da sala). */
export function appendDefeatChatMessage(
  room: RoomState,
  author: Author,
  opts: {
    defenderTokenId: string;
    defenderName: string;
    attackerTokenId?: string;
    hpBefore: number;
  }
): ChatMessage {
  return appendRoomChatMessage(room, {
    ...author,
    kind: "combat",
    text: `${opts.defenderName} foi derrotado.`,
    combat: {
      attackerTokenId: opts.attackerTokenId ?? opts.defenderTokenId,
      defenderTokenId: opts.defenderTokenId,
      actionKind: "ability",
      weaponName: "",
      resolution: "defeat",
      damageTotal: null,
      defenderHpBefore: opts.hpBefore,
      defenderHpAfter: 0,
      detail: `HP ${opts.hpBefore} → 0`,
    },
  });
}

export function shouldAnnounceDefeat(hpBefore: number, hpAfter: number): boolean {
  return hpBefore > 0 && hpAfter <= 0;
}

/** @deprecated Prefer appendDefeatChatMessage + single persistRoom no handler de combate. */
export async function addDefeatChatMessage(
  roomId: string,
  author: Author,
  opts: Parameters<typeof appendDefeatChatMessage>[2]
): Promise<void> {
  const { getRoom, persistRoom } = await import("./internal/registry");
  const room = await getRoom(roomId);
  if (!room) return;
  appendDefeatChatMessage(room, author, opts);
  await persistRoom(roomId, room);
}
