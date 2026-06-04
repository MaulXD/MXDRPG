import { createChatId, type ChatMessage } from "../chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot, RoomState } from "../types";

export function appendRoomChatMessage(
  room: RoomState,
  message: Omit<ChatMessage, "id" | "at"> & { id?: string; at?: number }
): ChatMessage {
  const msg: ChatMessage = {
    id: message.id ?? createChatId(),
    at: message.at ?? Date.now(),
    authorId: message.authorId,
    authorName: message.authorName,
    authorRole: message.authorRole,
    kind: message.kind,
    text: message.text,
    roll: message.roll,
    combat: message.combat,
  };

  room.chat = [...(room.chat ?? []), msg].slice(-200);
  return msg;
}

export async function addRoomChatMessage(
  roomId: string,
  message: Omit<ChatMessage, "id" | "at"> & { id?: string; at?: number }
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  appendRoomChatMessage(room, message);
  return toSnapshot(await persistRoom(roomId, room));
}
