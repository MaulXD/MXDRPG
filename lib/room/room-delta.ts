import type { BattleToken } from "@/lib/vtt/types";
import type { ChatMessage } from "@/lib/room/chat";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { RoomSnapshot } from "@/lib/room/types";

export const ROOM_DELTA_KIND = "delta" as const;

/** Resposta mínima de mutação (ataque, mover, consumir…) — merge no cliente. */
export type RoomDelta = {
  kind: typeof ROOM_DELTA_KIND;
  roomId: string;
  revision: number;
  tokens?: BattleToken[];
  actors?: RoomSnapshot["actors"];
  combat?: RoomSnapshot["combat"];
  settings?: RoomSnapshot["settings"];
  chatAppend?: ChatMessage[];
  pings?: RoomSnapshot["pings"];
};

export type RoomApiPayload = RoomSnapshot | RoomDelta;

export function isRoomDelta(v: unknown): v is RoomDelta {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as RoomDelta).kind === ROOM_DELTA_KIND &&
    typeof (v as RoomDelta).revision === "number"
  );
}

/** Delta que só acrescenta chat — não deve remontar mapa/combate. */
export function isChatOnlyDelta(delta: RoomDelta): boolean {
  return (
    Boolean(delta.chatAppend?.length) &&
    !delta.tokens?.length &&
    !delta.actors &&
    !delta.combat &&
    !delta.settings &&
    !delta.pings
  );
}

/** Campos que afetam canvas, turno ou HUD de combate. */
export function deltaAffectsBattlefield(delta: RoomDelta): boolean {
  return (
    Boolean(delta.tokens?.length) ||
    Boolean(delta.actors) ||
    Boolean(delta.combat) ||
    Boolean(delta.settings) ||
    Boolean(delta.pings?.length)
  );
}

function jsonEq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function changedTokens(before: BattleToken[], after: BattleToken[]): BattleToken[] {
  const prev = new Map(before.map((t) => [t.id, t]));
  const out: BattleToken[] = [];
  for (const t of after) {
    const b = prev.get(t.id);
    if (!b || !jsonEq(b, t)) out.push(t);
  }
  return out;
}

function changedActors(
  before: RoomSnapshot["actors"],
  after: RoomSnapshot["actors"]
): RoomSnapshot["actors"] | undefined {
  const out: RoomSnapshot["actors"] = {};
  for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = after[id];
    if (!a) continue;
    const b = before[id];
    if (!b || !jsonEq(b, a)) out[id] = a;
  }
  return Object.keys(out).length ? out : undefined;
}

export function buildRoomDelta(before: RoomSnapshot, after: RoomSnapshot): RoomDelta {
  const tokens = changedTokens(before.scene.tokens, after.scene.tokens);
  const actors = changedActors(before.actors, after.actors);
  const chatAppend =
    after.chat.length > before.chat.length ? after.chat.slice(before.chat.length) : undefined;

  const delta: RoomDelta = {
    kind: ROOM_DELTA_KIND,
    roomId: after.roomId,
    revision: after.revision,
  };

  if (tokens.length) delta.tokens = tokens;
  if (actors) delta.actors = actors;
  if (!jsonEq(before.combat, after.combat)) delta.combat = after.combat;
  if (!jsonEq(before.settings, after.settings)) delta.settings = after.settings;
  if (chatAppend?.length) delta.chatAppend = chatAppend;
  if (!jsonEq(before.pings ?? [], after.pings ?? [])) delta.pings = after.pings;

  return delta;
}

export function mergeRoomDelta(base: RoomSnapshot, delta: RoomDelta): RoomSnapshot {
  if (delta.revision < base.revision) return base;

  let tokens = base.scene.tokens;
  let sceneChanged = false;
  if (delta.tokens?.length) {
    const map = new Map(tokens.map((t) => [t.id, t]));
    for (const t of delta.tokens) map.set(t.id, t);
    tokens = Array.from(map.values());
    sceneChanged = true;
  }

  let chat = base.chat;
  if (delta.chatAppend?.length) {
    const ids = new Set(chat.map((m) => m.id));
    const appended = delta.chatAppend.filter((m) => !ids.has(m.id));
    if (appended.length) chat = [...chat, ...appended];
  }

  const settings = delta.settings ?? base.settings;
  const combat = delta.combat ?? base.combat;
  const actors = delta.actors ? { ...base.actors, ...delta.actors } : base.actors;
  const pings = delta.pings ?? base.pings;
  const revision = Math.max(base.revision, delta.revision);

  const changed =
    sceneChanged ||
    settings !== base.settings ||
    combat !== base.combat ||
    actors !== base.actors ||
    chat !== base.chat ||
    pings !== base.pings;

  if (!changed) {
    return revision === base.revision ? base : { ...base, revision };
  }

  const next: RoomSnapshot = {
    ...base,
    revision,
    settings,
    combat,
    actors,
    chat,
    pings,
    scene: sceneChanged ? { ...base.scene, tokens } : base.scene,
  };

  if (
    next.revision === base.revision &&
    next.settings === base.settings &&
    next.combat === base.combat &&
    next.actors === base.actors &&
    next.chat === base.chat &&
    next.pings === base.pings &&
    next.scene === base.scene
  ) {
    return base;
  }

  return next;
}

export function applyRoomApiPayload(
  base: RoomSnapshot | null,
  payload: RoomApiPayload
): RoomSnapshot {
  if (!isRoomDelta(payload)) return payload;
  if (!base) {
    if (!isRoomDelta(payload)) return payload;
    const seed: RoomSnapshot = {
      roomId: payload.roomId,
      revision: 0,
      settings: normalizeRoomSettings(undefined),
      scene: {
        id: payload.roomId,
        name: "",
        cellSize: 70,
        gridRadius: 24,
        tokens: payload.tokens ?? [],
      },
      actors: payload.actors ?? {},
      combat: payload.combat ?? { round: 1, activeIndex: 0, order: [] },
      chat: payload.chatAppend ?? [],
      pings: payload.pings ?? [],
    };
    return mergeRoomDelta(seed, payload);
  }
  return mergeRoomDelta(base, payload);
}
