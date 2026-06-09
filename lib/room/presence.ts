import "server-only";

import { dbEnabled } from "@/lib/db/enabled";
import {
  listRoomPresenceDb,
  pruneRoomPresenceDb,
  touchRoomPresenceDb,
} from "@/lib/db/room-presence";

/** Janela sem heartbeat antes de considerar offline (ms). */
export const PRESENCE_TTL_MS = 40_000;

const PRESENCE_EVENT_MAX_AGE_MS = 120_000;

export type RoomPresenceEvent = {
  type: "member_online";
  userId: string;
  displayName: string;
  at: number;
};

type QueuedPresenceEvent = RoomPresenceEvent & { id: number };

type PresenceEntry = {
  displayName: string;
  lastSeen: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRoomPresence: Map<string, Map<string, PresenceEntry>> | undefined;
  // eslint-disable-next-line no-var
  var __eldarinPresenceEvents: Map<string, QueuedPresenceEvent[]> | undefined;
  // eslint-disable-next-line no-var
  var __eldarinPresenceSeq: number | undefined;
}

function roomPresence(): Map<string, Map<string, PresenceEntry>> {
  if (!globalThis.__eldarinRoomPresence) {
    globalThis.__eldarinRoomPresence = new Map();
  }
  return globalThis.__eldarinRoomPresence;
}

function presenceEvents(): Map<string, QueuedPresenceEvent[]> {
  if (!globalThis.__eldarinPresenceEvents) {
    globalThis.__eldarinPresenceEvents = new Map();
  }
  return globalThis.__eldarinPresenceEvents;
}

function nextEventId(): number {
  const n = (globalThis.__eldarinPresenceSeq ?? 0) + 1;
  globalThis.__eldarinPresenceSeq = n;
  return n;
}

function enqueue(roomId: string, event: RoomPresenceEvent): QueuedPresenceEvent {
  const queued: QueuedPresenceEvent = { ...event, id: nextEventId() };
  const list = presenceEvents().get(roomId) ?? [];
  list.push(queued);
  presenceEvents().set(roomId, list);
  pruneOldEvents(roomId);
  return queued;
}

function pruneOldEvents(roomId: string): void {
  const now = Date.now();
  const list = presenceEvents().get(roomId);
  if (!list?.length) return;
  const fresh = list.filter((e) => now - e.at < PRESENCE_EVENT_MAX_AGE_MS);
  presenceEvents().set(roomId, fresh);
}

function displayName(name: string): string {
  const t = name.trim();
  return t || "Jogador";
}

function mergePresenceLists(
  ...lists: { userId: string; displayName: string }[][]
): { userId: string; displayName: string }[] {
  const map = new Map<string, string>();
  for (const list of lists) {
    for (const entry of list) {
      map.set(entry.userId, entry.displayName);
    }
  }
  return [...map.entries()].map(([userId, displayName]) => ({ userId, displayName }));
}

/** Marca jogador online; emite evento na primeira vez (ou após TTL). */
export async function touchRoomPresence(
  roomId: string,
  userId: string,
  name: string
): Promise<QueuedPresenceEvent | null> {
  if (!roomId || !userId) return null;

  const now = Date.now();
  const rooms = roomPresence();
  let map = rooms.get(roomId);
  if (!map) {
    map = new Map();
    rooms.set(roomId, map);
  }

  const prev = map.get(userId);
  const wasOnline = prev != null && now - prev.lastSeen < PRESENCE_TTL_MS;
  const label = displayName(name);
  map.set(userId, { displayName: label, lastSeen: now });

  if (dbEnabled()) {
    try {
      await touchRoomPresenceDb(roomId, userId, label);
      void pruneRoomPresenceDb(roomId);
    } catch (err) {
      console.error("[presence] touchRoomPresenceDb failed:", err);
    }
  }

  if (wasOnline) return null;

  return enqueue(roomId, {
    type: "member_online",
    userId,
    displayName: displayName(name),
    at: now,
  });
}

/** Eventos de presença ainda não enviados a este cliente SSE. */
export function presenceEventsAfter(
  roomId: string,
  afterId: number
): { events: QueuedPresenceEvent[]; lastId: number } {
  pruneOldEvents(roomId);
  const list = presenceEvents().get(roomId) ?? [];
  const events = list.filter((e) => e.id > afterId);
  const lastId = events.length
    ? events[events.length - 1]!.id
    : list.length
      ? list[list.length - 1]!.id
      : afterId;
  return { events, lastId };
}

function listRoomPresenceMemory(roomId: string): { userId: string; displayName: string }[] {
  const now = Date.now();
  const map = roomPresence().get(roomId);
  if (!map) return [];
  const out: { userId: string; displayName: string }[] = [];
  for (const [userId, entry] of map) {
    if (now - entry.lastSeen < PRESENCE_TTL_MS) {
      out.push({ userId, displayName: entry.displayName });
    }
  }
  return out;
}

/** Lista quem está online na mesa (união Postgres + memória da instância). */
export async function listRoomPresence(
  roomId: string
): Promise<{ userId: string; displayName: string }[]> {
  const memory = listRoomPresenceMemory(roomId);
  if (!dbEnabled()) return memory;

  try {
    const dbList = await listRoomPresenceDb(roomId);
    return mergePresenceLists(memory, dbList);
  } catch {
    return memory;
  }
}
