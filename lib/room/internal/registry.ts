import * as dbRooms from "@/lib/db/rooms";
import { getCharacter } from "@/lib/character/characters";
import { getEntry } from "@/lib/compendium/registry";
import { DEMO_SCENE } from "@/lib/vtt/demo-scene";
import { welcomeChat } from "../chat";
import { emptyCombat } from "../combat";
import { prunePings } from "@/lib/vtt/ping";
import { normalizeRoomSettings } from "../settings";
import { createDemoRoom, syncLinkedTokens } from "../sync";
import type { RoomSnapshot, RoomState } from "../types";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRooms: Map<string, RoomState> | undefined;
}

export function rooms(): Map<string, RoomState> {
  if (!globalThis.__eldarinRooms) {
    globalThis.__eldarinRooms = new Map([["demo", createDemoRoom()]]);
  }
  return globalThis.__eldarinRooms;
}

export function toSnapshot(state: RoomState): RoomSnapshot {
  return {
    roomId: state.roomId,
    settings: normalizeRoomSettings(state.settings),
    scene: state.scene,
    actors: state.actors,
    combat: state.combat,
    chat: state.chat,
    pings: prunePings(state.pings ?? []),
    revision: state.revision,
  };
}

export function bumpRoom(state: RoomState): RoomState {
  const inCombat = Boolean(state.combat?.order?.length);
  const scene = syncLinkedTokens(state.scene, state.actors, {
    preserveCombatPa: inCombat,
  });
  return {
    ...state,
    scene,
    revision: state.revision + 1,
    updatedAt: Date.now(),
  };
}

function shouldPersistToDb(roomId: string): boolean {
  return dbRooms.dbEnabled() && roomId !== "demo";
}

/** Inventário demo antigo (ids slug) quebrava listagem de armas na UI. */
function refreshDemoActorsIfStale(room: RoomState): void {
  if (room.roomId !== "demo") return;
  const adv = room.actors["pc-aventureiro"];
  if (!adv) return;

  const brokenWeapon = adv.inventory.some(
    (i) =>
      (i.packId === "armas" || i.packId === "magias") &&
      i.quantity > 0 &&
      !getEntry(i.packId, i.entryId)
  );
  if (brokenWeapon) {
    const fresh = createDemoRoom();
    room.actors = { ...room.actors, "pc-aventureiro": fresh.actors["pc-aventureiro"] };
    room.scene = syncLinkedTokens(room.scene, room.actors);
    return;
  }

  const template = getCharacter("pc-aventureiro");
  if (template) {
    const xpStale = adv.identity.xpTotal !== template.identity.xpTotal;
    const nivelStale = adv.identity.nivel !== template.identity.nivel;
    if (xpStale || nivelStale) {
      room.actors["pc-aventureiro"] = {
        ...adv,
        identity: {
          ...adv.identity,
          xpTotal: template.identity.xpTotal,
          nivel: template.identity.nivel,
        },
        revision: adv.revision + 1,
      };
      room.scene = syncLinkedTokens(room.scene, room.actors);
    }
  }

  const freshGoblin = DEMO_SCENE.tokens.find((t) => t.monsterEntryId === "monstros-goblin");
  if (!freshGoblin?.vidaMax) return;
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.monsterEntryId !== "monstros-goblin") return t;
      const vidaMax = freshGoblin.vidaMax!;
      const vida = Math.min(t.vida ?? vidaMax, vidaMax);
      return { ...t, vidaMax, vida, defesa: freshGoblin.defesa ?? t.defesa };
    }),
  };
}

export async function persistRoom(roomId: string, state: RoomState): Promise<RoomState> {
  const updated = bumpRoom(state);
  rooms().set(roomId, updated);
  if (shouldPersistToDb(roomId)) {
    await dbRooms.saveRoom(updated);
  }
  return updated;
}

export async function getRoom(roomId: string): Promise<RoomState | null> {
  const map = rooms();
  let room = map.get(roomId) ?? null;

  if (!room && shouldPersistToDb(roomId)) {
    room = await dbRooms.fetchRoom(roomId);
    if (room) map.set(roomId, room);
  }

  if (!room && roomId === "demo") {
    const demo = createDemoRoom();
    map.set("demo", demo);
    room = demo;
  }

  if (room) refreshDemoActorsIfStale(room);
  if (room && !room.combat) {
    room.combat = emptyCombat(room.scene.tokens);
  }
  if (room && !room.chat?.length) {
    room.chat = [welcomeChat()];
  }
  if (room) {
    room.settings = normalizeRoomSettings(room.settings);
    if (!room.adventureId) room.adventureId = room.roomId;
  }
  return room;
}
