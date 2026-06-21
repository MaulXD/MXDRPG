import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import type { ChatMessage } from "@/lib/room/chat";

/** Máximo de mensagens no sync GET/SSE (Fase 2). */
export const SYNC_CHAT_LIMIT = 100;

export function trimChatForSync(chat: ChatMessage[], limit = SYNC_CHAT_LIMIT): ChatMessage[] {
  if (chat.length <= limit) return chat;
  return chat.slice(-limit);
}

/** Ficha mínima de colegas — mantém identidade/HP/PA; remove inventário pesado. */
export function trimPeerActor(actor: RoomActor): RoomActor {
  return {
    ...actor,
    biography: "",
    inventory: [],
    preparedSpellIds: [],
    lootEconomy: undefined,
    culinaryProgress: undefined,
  };
}

export type TrimSnapshotOpts = {
  user?: SessionUser | null;
  room: Pick<import("@/lib/room/types").RoomState, "roomId" | "ownerId" | "memberIds">;
  chatLimit?: number;
};

/** Payload enxuto para sync — chat 100, fichas alheias mínimas (Fase 2). */
export function trimSnapshotForSync(
  snapshot: RoomSnapshot,
  opts: TrimSnapshotOpts
): RoomSnapshot {
  const isGm = canManageRoom(opts.room, opts.user);
  if (isGm) {
    return {
      ...snapshot,
      chat: trimChatForSync(snapshot.chat, opts.chatLimit ?? SYNC_CHAT_LIMIT),
    };
  }

  const userId = opts.user?.id;
  const actors: Record<string, RoomActor> = {};
  for (const [id, actor] of Object.entries(snapshot.actors)) {
    actors[id] = actor.ownerId === userId ? actor : trimPeerActor(actor);
  }

  return {
    ...snapshot,
    chat: trimChatForSync(snapshot.chat, opts.chatLimit ?? SYNC_CHAT_LIMIT),
    actors,
    combatLog: undefined,
    combatUndo: undefined,
    gmCreations: undefined,
  };
}
