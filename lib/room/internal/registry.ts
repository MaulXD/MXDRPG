import * as dbAdventures from "@/lib/db/adventures";
import * as dbRooms from "@/lib/db/rooms";
import { getCharacterFromRegistry } from "@/lib/character/character-registry";
import { getEntry } from "@/lib/compendium/registry";
import { DEMO_SCENE } from "@/lib/vtt/demo-scene";
import {
  alignDemoPcTokenIds,
  repairCombatOrderTokenIds,
  repairDuplicateTokenIds,
} from "@/lib/vtt/token-integrity";
import { welcomeChat } from "../chat";
import { normalizeCombatTrack } from "../combat";
import {
  ensureCombatActiveHasPa,
  executePendingAutoPassIfDue,
  scheduleAutoPassWhenActivePaZero,
} from "../handlers/combat-turn";
import { requiresCombatTurnEconomy } from "@/lib/combat/mesa-mode";
import { pruneMapMarkups } from "@/lib/vtt/map-markup";
import { prunePings } from "@/lib/vtt/ping";
import { getRoomGmCreations } from "../gm-creations";
import { normalizeRoomSettings } from "../settings";
import { backfillActorPortraitsFromTokens } from "../portrait-sync";
import { migrateLegacyDisplayName } from "@/lib/moderation/display-name";
import { createDemoRoom, syncLinkedTokens } from "../sync";
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
    gmCreations: getRoomGmCreations(state),
    chat: state.chat,
    pings: prunePings(state.pings ?? []),
    revision: state.revision,
  };
}

export function bumpRoom(state: RoomState): RoomState {
  const inCombatEconomy = requiresCombatTurnEconomy(state.settings, state.combat);
  const backfill = backfillActorPortraitsFromTokens(state.actors, state.scene.tokens);
  const base = backfill.changed ? { ...state, actors: backfill.actors } : state;
  const scene = syncLinkedTokens(base.scene, base.actors, {
    preserveCombatPa: inCombatEconomy,
    explorationDisplay: !inCombatEconomy,
  });
  return {
    ...base,
    scene,
    revision: state.revision + 1,
    updatedAt: Date.now(),
  };
}

function shouldPersistToDb(roomId: string): boolean {
  return dbRooms.dbEnabled() && roomId !== "demo";
}

const DEMO_ACTOR_IDS = [
  "pc-thrain-ferroescudo",
  "pc-lyanna-umbral",
  "pc-maelis-purificador",
  "pc-pippin-sussurro",
] as const;

function mergeDemoSceneTokens(room: RoomState, freshScene: RoomState["scene"]): void {
  const existingIds = new Set(room.scene.tokens.map((t) => t.id));
  const added = freshScene.tokens.filter((t) => !existingIds.has(t.id));
  if (added.length === 0) return;
  room.scene = { ...room.scene, tokens: [...room.scene.tokens, ...added] };
}

/** Inventário demo antigo (ids slug) quebrava listagem de armas na UI. */
function refreshDemoActorsIfStale(room: RoomState): void {
  if (room.roomId !== "demo") return;

  const fresh = createDemoRoom();
  let changed = false;

  for (const actorId of DEMO_ACTOR_IDS) {
    const adv = room.actors[actorId];
    const template = getCharacterFromRegistry(actorId);
    if (!template) continue;

    if (!adv) {
      room.actors[actorId] = fresh.actors[actorId];
      changed = true;
      continue;
    }

    const brokenEntry = adv.inventory.some(
      (i) =>
        (i.packId === "armas" || i.packId === "magias" || i.packId === "habilidades") &&
        i.quantity > 0 &&
        !getEntry(i.packId, i.entryId)
    );
    if (brokenEntry) {
      room.actors[actorId] = fresh.actors[actorId];
      changed = true;
      continue;
    }

    const xpStale = adv.identity.xpTotal !== template.identity.xpTotal;
    const nivelStale = adv.identity.nivel !== template.identity.nivel;
    if (xpStale || nivelStale) {
      room.actors[actorId] = {
        ...adv,
        identity: {
          ...adv.identity,
          xpTotal: template.identity.xpTotal,
          nivel: template.identity.nivel,
        },
        revision: adv.revision + 1,
      };
      changed = true;
    }
  }

  mergeDemoSceneTokens(room, fresh.scene);

  let repairedScene = repairDuplicateTokenIds(room.scene);
  const alignedScene = alignDemoPcTokenIds(repairedScene, fresh.scene);
  if (alignedScene !== room.scene) {
    room.scene = alignedScene;
    changed = true;
  } else if (repairedScene !== room.scene) {
    room.scene = repairedScene;
    changed = true;
  }

  if (room.combat?.order?.length) {
    const fixedOrder = repairCombatOrderTokenIds(room.combat.order, room.scene.tokens);
    if (fixedOrder.join(",") !== room.combat.order.join(",")) {
      room.combat = { ...room.combat, order: fixedOrder };
      changed = true;
    }
  }

  if (changed) {
    const inCombatEconomy = requiresCombatTurnEconomy(room.settings, room.combat);
    room.scene = syncLinkedTokens(room.scene, room.actors, {
      preserveCombatPa: inCombatEconomy,
      explorationDisplay: !inCombatEconomy,
    });
  }

  for (const seed of DEMO_SCENE.tokens) {
    if (!seed.monsterEntryId || seed.vidaMax == null) continue;
    room.scene = {
      ...room.scene,
      tokens: room.scene.tokens.map((t) => {
        if (t.monsterEntryId !== seed.monsterEntryId || t.id !== seed.id) return t;
        const vidaMax = seed.vidaMax!;
        const vida = Math.min(t.vida ?? vidaMax, vidaMax);
        return { ...t, vidaMax, vida, defesa: seed.defesa ?? t.defesa };
      }),
    };
  }
}

export type PersistRoomOpts = {
  /** Evita reagendar auto-passe logo após avançar turno manualmente/automático. */
  skipAutoPassSchedule?: boolean;
};

export async function persistRoom(
  roomId: string,
  state: RoomState,
  opts?: PersistRoomOpts
): Promise<RoomState> {
  if (state.combat?.order?.length) {
    ensureCombatActiveHasPa(state);
    if (requiresCombatTurnEconomy(state.settings, state.combat)) {
      if (!opts?.skipAutoPassSchedule) {
        scheduleAutoPassWhenActivePaZero(state);
      }
      executePendingAutoPassIfDue(state);
    } else if (state.combat.pendingAutoPass) {
      state.combat = { ...state.combat, pendingAutoPass: undefined };
    }
  }
  const updated = bumpRoom(state);
  rooms().set(roomId, updated);
  if (shouldPersistToDb(roomId)) {
    await dbRooms.saveRoom(updated);
  }
  return updated;
}

async function backfillRoomFromAdventure(roomId: string): Promise<RoomState | null> {
  if (!shouldPersistToDb(roomId)) return null;
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

export async function getRoom(roomId: string): Promise<RoomState | null> {
  const map = rooms();
  let room = map.get(roomId) ?? null;

  if (shouldPersistToDb(roomId)) {
    const fromDb = await dbRooms.fetchRoom(roomId);
    if (fromDb) {
      if (!room || fromDb.revision > room.revision) {
        map.set(roomId, fromDb);
        room = fromDb;
      }
    } else if (!room) {
      room = await backfillRoomFromAdventure(roomId);
      if (room) map.set(roomId, room);
    }
  }

  if (!room && roomId === "demo") {
    const demo = createDemoRoom();
    map.set("demo", demo);
    room = demo;
    if (shouldPersistToDb("demo")) {
      await dbRooms.insertRoom(demo);
    }
  }

  if (room) refreshDemoActorsIfStale(room);
  if (room) {
    if (!Array.isArray(room.scene.tokens)) {
      room.scene = { ...room.scene, tokens: [] };
    }
    room.combat = normalizeCombatTrack(room.combat, room.scene.tokens);
  }
  if (room?.combat?.order?.length) {
    ensureCombatActiveHasPa(room);
    if (requiresCombatTurnEconomy(room.settings, room.combat)) {
      scheduleAutoPassWhenActivePaZero(room);
      if (executePendingAutoPassIfDue(room)) {
        return persistRoom(roomId, room);
      }
    } else if (room.combat.pendingAutoPass) {
      room.combat = { ...room.combat, pendingAutoPass: undefined };
    }
  }
  if (room && !room.chat?.length) {
    room.chat = [welcomeChat()];
  }
  if (room) {
    room.settings = normalizeRoomSettings(room.settings);
    if (!room.adventureId) room.adventureId = room.roomId;
    const { getAdventure } = await import("@/lib/adventure/store");
    const adv = await getAdventure(room.adventureId);
    if (adv && !adv.deletedAt && adv.inviteCode !== room.inviteCode) {
      room.inviteCode = adv.inviteCode;
      return persistRoom(roomId, room);
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
