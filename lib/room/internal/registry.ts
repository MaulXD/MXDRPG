import * as dbAdventures from "@/lib/db/adventures";
import * as dbRooms from "@/lib/db/rooms";
import { normalizeSceneTokens } from "@/lib/vtt/scene-normalize";
import { welcomeChat } from "../chat";
import { normalizeCombatTrack } from "../combat";
import { executePendingAutoPassIfDue } from "../handlers/combat-turn";
import { scheduleAutoPassIfNeeded, repairStaleCombatPa } from "@/lib/combat/combat-pa-engine";
import { requiresCombatPaEconomy, requiresCombatTurnEconomy } from "@/lib/combat/mesa-mode";
import { readCachedRevision, writeCachedRevision } from "../revision-cache";
import { pruneMapMarkups } from "@/lib/vtt/map-markup";
import { prunePings } from "@/lib/vtt/ping";
import { getRoomGmCreations } from "../gm-creations";
import { normalizeRoomSettings } from "../settings";
import { backfillActorPortraitsFromTokens } from "../portrait-sync";
import { migrateLegacyDisplayName } from "@/lib/moderation/display-name";
import { ensureJournalBaseline, recordRevisionEntry } from "../revision-journal";
import { buildRoomDelta } from "../room-delta";
import { notifyRoomUpdated } from "../notifier";
import { scheduleSave } from "./periodic-save";
import { syncLinkedTokens } from "../sync";
import type { RoomSnapshot, RoomState } from "../types";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRooms: Map<string, RoomState> | undefined;
}

export function rooms(): Map<string, RoomState> {
  if (!globalThis.__eldarinRooms) {
    globalThis.__eldarinRooms = new Map();
  }
  return globalThis.__eldarinRooms;
}

export function toSnapshot(state: RoomState): RoomSnapshot {
  const tokens = Array.isArray(state.scene.tokens) ? state.scene.tokens : [];
  return {
    roomId: state.roomId,
    settings: normalizeRoomSettings(state.settings),
    scene: {
      ...state.scene,
      tokens,
      mapMarkups: pruneMapMarkups(state.scene.mapMarkups ?? []),
    },
    actors: state.actors,
    combat: normalizeCombatTrack(state.combat, tokens),
    combatUndo: state.combatUndo,
    combatLog: state.combatLog,
    gmCreations: getRoomGmCreations(state),
    chat: state.chat,
    pings: prunePings(state.pings ?? []),
    revision: state.revision,
  };
}

function mirrorCombatTokenPaToActors(state: RoomState): RoomState {
  let actors = state.actors;
  let changed = false;
  for (const token of state.scene.tokens) {
    if (!token.linked || !token.actorId || typeof token.pa !== "number") continue;
    const actor = actors[token.actorId];
    if (!actor || actor.resources.pontosAcao.value === token.pa) continue;
    if (!changed) actors = { ...actors };
    changed = true;
    actors[token.actorId] = {
      ...actor,
      resources: {
        ...actor.resources,
        pontosAcao: { ...actor.resources.pontosAcao, value: token.pa },
      },
    };
  }
  return changed ? { ...state, actors } : state;
}

export function bumpRoom(state: RoomState): RoomState {
  const inCombatEconomy = requiresCombatPaEconomy(state.settings, state.combat);
  const backfill = backfillActorPortraitsFromTokens(state.actors, state.scene.tokens);
  const base = backfill.changed ? { ...state, actors: backfill.actors } : state;
  const scene = syncLinkedTokens(base.scene, base.actors, {
    preserveCombatPa: inCombatEconomy,
    explorationDisplay: !inCombatEconomy,
  });
  const merged = {
    ...base,
    scene,
    revision: state.revision + 1,
    updatedAt: Date.now(),
  };
  return inCombatEconomy ? mirrorCombatTokenPaToActors(merged) : merged;
}

function shouldPersistToDb(): boolean {
  return dbRooms.dbEnabled();
}

export type PersistRoomOpts = {
  /** Evita reagendar auto-passe logo após avançar turno manualmente/automático. */
  skipAutoPassSchedule?: boolean;
  /** Não executa nem agenda auto-passe (entrada em combate, reparo de PA no poll). */
  skipAutoPass?: boolean;
};

export async function persistRoom(
  roomId: string,
  state: RoomState,
  opts?: PersistRoomOpts
): Promise<RoomState> {
  if (state.combat?.order?.length) {
    if (requiresCombatTurnEconomy(state.settings, state.combat) && !opts?.skipAutoPass) {
      if (executePendingAutoPassIfDue(state)) {
        // Turno avançou — PA do novo ativo já veio de applyTurnPaTransition
      } else if (!opts?.skipAutoPassSchedule) {
        scheduleAutoPassIfNeeded(state);
      }
    } else if (state.combat.pendingAutoPass) {
      state.combat = { ...state.combat, pendingAutoPass: undefined };
    }
  }
  const beforeSnap = toSnapshot(state);
  const updated = bumpRoom(state);
  const afterSnap = toSnapshot(updated);
  rooms().set(roomId, updated);
  writeCachedRevision(roomId, updated.revision);
  recordRevisionEntry(roomId, afterSnap, buildRoomDelta(beforeSnap, afterSnap));
  notifyRoomUpdated(roomId, updated.revision);
  if (shouldPersistToDb()) {
    scheduleSave(roomId, updated);
  }
  return updated;
}

async function backfillRoomFromAdventure(roomId: string): Promise<RoomState | null> {
  if (!shouldPersistToDb()) return null;
  let adventure = await dbAdventures.fetchAdventure(roomId);
  if (!adventure) adventure = await dbAdventures.fetchAdventureByPrimaryRoom(roomId);
  if (!adventure || adventure.deletedAt) return null;
  try {
    const { createRoomForAdventure } = await import("../adventure-room");
    await createRoomForAdventure(adventure);
    return dbRooms.fetchRoom(adventure.primaryRoomId);
  } catch (e) {
    console.error("[getRoom] backfill da mesa falhou:", roomId, e);
    return null;
  }
}

const inviteSyncCheckedAt = new Map<string, number>();
const INVITE_SYNC_INTERVAL_MS = 60_000;

export type GetRoomOpts = {
  /** Antes de mutação (ataque/mover) — não dispara auto-passe com persist no read. */
  skipAutoPass?: boolean;
};

export async function getRoom(roomId: string, opts?: GetRoomOpts): Promise<RoomState | null> {
  const map = rooms();
  let room = map.get(roomId) ?? null;

  if (shouldPersistToDb()) {
    if (room) {
      let dbRev = readCachedRevision(roomId);
      if (dbRev == null) {
        dbRev = await dbRooms.fetchRoomRevision(roomId);
        if (dbRev != null) writeCachedRevision(roomId, dbRev);
      }
      if (dbRev == null || dbRev > room.revision) {
        const fromDb = await dbRooms.fetchRoom(roomId);
        if (fromDb && fromDb.revision > room.revision) {
          map.set(roomId, fromDb);
          room = fromDb;
          writeCachedRevision(roomId, fromDb.revision);
        }
      } else {
        writeCachedRevision(roomId, room.revision);
      }
    } else {
      const fromDb = await dbRooms.fetchRoom(roomId);
      if (fromDb) {
        map.set(roomId, fromDb);
        room = fromDb;
        writeCachedRevision(roomId, fromDb.revision);
      } else {
        room = await backfillRoomFromAdventure(roomId);
        if (room) map.set(roomId, room);
      }
    }
  }

  if (room) ensureJournalBaseline(roomId, toSnapshot(room));
  if (room) {
    if (!Array.isArray(room.scene.tokens)) {
      room.scene = { ...room.scene, tokens: [] };
    }
    room.scene = normalizeSceneTokens(room.scene);
    room.combat = normalizeCombatTrack(room.combat, room.scene.tokens);
  }
  if (room && repairStaleCombatPa(room)) {
    return persistRoom(roomId, room, { skipAutoPassSchedule: true });
  }
  // Auto-passe só via tickRoomAutoPassThrottled (SSE / GET poll) — nunca no getRoom quente.
  if (room?.combat?.pendingAutoPass && !requiresCombatPaEconomy(room.settings, room.combat)) {
    room.combat = { ...room.combat, pendingAutoPass: undefined };
  }
  if (room && !room.chat?.length) {
    room.chat = [welcomeChat()];
  }
  if (room) {
    room.settings = normalizeRoomSettings(room.settings);
    if (!room.adventureId) room.adventureId = room.roomId;
    const inviteCheckedAt = inviteSyncCheckedAt.get(roomId) ?? 0;
    if (Date.now() - inviteCheckedAt >= INVITE_SYNC_INTERVAL_MS) {
      inviteSyncCheckedAt.set(roomId, Date.now());
      const { getAdventure } = await import("@/lib/adventure/store");
      const adv = await getAdventure(room.adventureId);
      if (adv && !adv.deletedAt && adv.inviteCode !== room.inviteCode) {
        room.inviteCode = adv.inviteCode;
        return persistRoom(roomId, room);
      }
    }
    const legacyName = migrateLegacyDisplayName(room.name);
    if (legacyName !== room.name) {
      room.name = legacyName;
      room.scene = { ...room.scene, name: legacyName };
      return persistRoom(roomId, room);
    }
  }
  return room;
}
