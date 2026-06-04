import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";

export const MONSTER_SPAWN_DRAG_MIME = "application/x-eldarin-monster-spawn";
const SPAWN_PLAIN_PREFIX = "eldarin-spawn:";

export type MonsterSpawnDragPayload = {
  entryId: string;
  variant: MonsterSpawnVariant;
  groupLevelDelta: number;
};

/** Fallback quando o navegador não expõe o MIME customizado no drop. */
let activeSpawnDragPayload: MonsterSpawnDragPayload | null = null;

export function setActiveSpawnDragPayload(payload: MonsterSpawnDragPayload | null): void {
  activeSpawnDragPayload = payload;
}

export function getActiveSpawnDragPayload(): MonsterSpawnDragPayload | null {
  return activeSpawnDragPayload;
}

function parsePayloadJson(raw: string): MonsterSpawnDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as MonsterSpawnDragPayload;
    if (!parsed?.entryId || typeof parsed.entryId !== "string") return null;
    const variant =
      parsed.variant === "elite" || parsed.variant === "colossal" ? parsed.variant : "normal";
    const groupLevelDelta =
      typeof parsed.groupLevelDelta === "number" && parsed.groupLevelDelta > 0
        ? Math.min(3, Math.floor(parsed.groupLevelDelta))
        : 0;
    return { entryId: parsed.entryId, variant, groupLevelDelta };
  } catch {
    return null;
  }
}

export function writeMonsterSpawnDrag(
  dt: DataTransfer,
  payload: MonsterSpawnDragPayload
): void {
  const json = JSON.stringify(payload);
  setActiveSpawnDragPayload(payload);
  dt.setData(MONSTER_SPAWN_DRAG_MIME, json);
  dt.setData("text/plain", `${SPAWN_PLAIN_PREFIX}${json}`);
  dt.effectAllowed = "copy";
}

export function readMonsterSpawnDrag(dt: DataTransfer): MonsterSpawnDragPayload | null {
  const rawMime = dt.getData(MONSTER_SPAWN_DRAG_MIME);
  if (rawMime) {
    const parsed = parsePayloadJson(rawMime);
    if (parsed) return parsed;
  }
  const plain = dt.getData("text/plain");
  if (plain.startsWith(SPAWN_PLAIN_PREFIX)) {
    const parsed = parsePayloadJson(plain.slice(SPAWN_PLAIN_PREFIX.length));
    if (parsed) return parsed;
  }
  return getActiveSpawnDragPayload();
}

export function isMonsterSpawnDrag(dt: DataTransfer): boolean {
  if (activeSpawnDragPayload) return true;
  const types = Array.from(dt.types);
  if (types.includes(MONSTER_SPAWN_DRAG_MIME)) return true;
  const plain = dt.getData("text/plain");
  return plain.startsWith(SPAWN_PLAIN_PREFIX);
}

export function clearActiveSpawnDragPayload(): void {
  activeSpawnDragPayload = null;
}

export const ACTOR_SPAWN_DRAG_MIME = "application/x-eldarin-actor-spawn";
const ACTOR_PLAIN_PREFIX = "eldarin-actor:";

export type ActorSpawnDragPayload = { actorId: string };

let activeActorSpawnDragPayload: ActorSpawnDragPayload | null = null;

export function setActiveActorSpawnDragPayload(payload: ActorSpawnDragPayload | null): void {
  activeActorSpawnDragPayload = payload;
}

export function writeActorSpawnDrag(dt: DataTransfer, payload: ActorSpawnDragPayload): void {
  const json = JSON.stringify(payload);
  setActiveActorSpawnDragPayload(payload);
  dt.setData(ACTOR_SPAWN_DRAG_MIME, json);
  dt.setData("text/plain", `${ACTOR_PLAIN_PREFIX}${json}`);
  dt.effectAllowed = "copy";
}

export function readActorSpawnDrag(dt: DataTransfer): ActorSpawnDragPayload | null {
  const rawMime = dt.getData(ACTOR_SPAWN_DRAG_MIME);
  if (rawMime) {
    try {
      const parsed = JSON.parse(rawMime) as ActorSpawnDragPayload;
      if (parsed?.actorId && typeof parsed.actorId === "string") return parsed;
    } catch {
      /* ignore */
    }
  }
  const plain = dt.getData("text/plain");
  if (plain.startsWith(ACTOR_PLAIN_PREFIX)) {
    try {
      const parsed = JSON.parse(plain.slice(ACTOR_PLAIN_PREFIX.length)) as ActorSpawnDragPayload;
      if (parsed?.actorId) return parsed;
    } catch {
      /* ignore */
    }
  }
  return activeActorSpawnDragPayload;
}

export function isActorSpawnDrag(dt: DataTransfer): boolean {
  if (activeActorSpawnDragPayload) return true;
  const types = Array.from(dt.types);
  if (types.includes(ACTOR_SPAWN_DRAG_MIME)) return true;
  const plain = dt.getData("text/plain");
  return plain.startsWith(ACTOR_PLAIN_PREFIX);
}

export function clearActiveActorSpawnDragPayload(): void {
  activeActorSpawnDragPayload = null;
}

/** Monstro ou personagem sendo arrastado para o tabuleiro. */
export function isBoardSpawnDrag(dt: DataTransfer): boolean {
  return isMonsterSpawnDrag(dt) || isActorSpawnDrag(dt);
}
