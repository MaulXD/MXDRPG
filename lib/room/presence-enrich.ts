import "server-only";

import { normalizeUserRole } from "@/lib/auth/roles";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { parseAvatarFocus, resolveUserAvatarUrl } from "@/lib/db/user-avatar";
import { getSql } from "@/lib/db/client";
import { dbEnabled } from "@/lib/db/enabled";
import { fetchClerkIdForUser, fetchUserByClerkId, fetchUserById } from "@/lib/db/users";
import { dedupePresenceByUser } from "@/lib/room/presence-identity";
import { resolveActorTokenImageUrl } from "@/lib/room/portrait-sync";
import { listRoomPresence } from "@/lib/room/presence";
import type { RoomActor, RoomState } from "@/lib/room/types";

import type { PortraitFocus } from "@/lib/media/portrait-focus";

export type RoomPresenceMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFocus?: PortraitFocus | null;
  characterPortraitUrl: string | null;
  role: "gm" | "player";
  characterName: string | null;
  isOwner: boolean;
};

type UserPresenceRow = {
  id: string;
  nickname: string | null;
  name: string;
  role: string | null;
  avatar_url?: string | null;
  oauth_avatar_url?: string | null;
  avatar_source?: string | null;
  avatar_focus?: unknown;
};

function displayNameFromRow(row: UserPresenceRow): string {
  return row.nickname?.trim() || row.name?.trim() || "Jogador";
}

function characterForUser(
  userId: string,
  room: RoomState
): { name: string | null; portraitUrl: string | null } {
  let fallback: RoomActor | null = null;

  for (const token of room.scene.tokens) {
    if (!token.linked || !token.actorId) continue;
    const actor = room.actors[token.actorId];
    if (!actor || actor.ownerId !== userId || actor.gmAuthored) continue;
    const name = actor.name?.trim() || token.name?.trim() || null;
    return {
      name,
      portraitUrl: resolveActorTokenImageUrl(actor),
    };
  }

  for (const actor of Object.values(room.actors)) {
    if (actor.gmAuthored || actor.ownerId !== userId) continue;
    if (!fallback) fallback = actor;
  }

  if (!fallback) return { name: null, portraitUrl: null };
  return {
    name: fallback.name?.trim() || null,
    portraitUrl: resolveActorTokenImageUrl(fallback),
  };
}

async function fetchUserPresenceRows(userIds: string[]): Promise<Map<string, UserPresenceRow>> {
  const out = new Map<string, UserPresenceRow>();
  if (!userIds.length || !dbEnabled()) return out;

  await ensureDbMigrations();
  const sql = getSql();
  if (!sql) return out;

  const fullSelect =
    "id, nickname, name, role, avatar_url, oauth_avatar_url, avatar_source, avatar_focus";
  const baseSelect = "id, nickname, name, role";

  let rows: UserPresenceRow[] = [];
  try {
    rows = await sql<UserPresenceRow[]>`
      SELECT ${sql.unsafe(fullSelect)}
      FROM eldarin_users
      WHERE id = ANY(${userIds})
    `;
  } catch {
    rows = await sql<UserPresenceRow[]>`
      SELECT ${sql.unsafe(baseSelect)}
      FROM eldarin_users
      WHERE id = ANY(${userIds})
    `;
  }

  for (const row of rows) {
    out.set(row.id, row);
  }
  return out;
}

async function profileForUserId(
  userId: string,
  profiles: Map<string, UserPresenceRow>
): Promise<UserPresenceRow | null> {
  const direct = profiles.get(userId);
  if (direct) return direct;

  if (userId.startsWith("clerk-")) {
    const stored = await fetchUserByClerkId(userId.slice("clerk-".length));
    if (stored) {
      return {
        id: stored.id,
        nickname: stored.nickname ?? null,
        name: stored.name,
        role: stored.role,
        avatar_url: stored.avatarUrl ?? null,
        oauth_avatar_url: stored.oauthAvatarUrl ?? null,
        avatar_source: stored.avatarSource ?? null,
        avatar_focus: stored.avatarFocus ?? null,
      };
    }
  }

  const sessionUser = await fetchUserById(userId);
  if (sessionUser) {
    return {
      id: sessionUser.id,
      nickname: sessionUser.nickname ?? null,
      name: sessionUser.name,
      role: sessionUser.role,
      avatar_url: sessionUser.avatarUrl ?? null,
      oauth_avatar_url: sessionUser.oauthAvatarUrl ?? null,
      avatar_source: sessionUser.avatarSource ?? null,
      avatar_focus: sessionUser.avatarFocus ?? null,
    };
  }

  return null;
}

async function isPresenceGmUser(
  userId: string,
  room: RoomState,
  profileRole: string | null | undefined
): Promise<boolean> {
  if (userId === room.ownerId) return true;
  if (normalizeUserRole(profileRole) === "admin") return true;

  if (userId.startsWith("usr_") && room.ownerId.startsWith("clerk-")) {
    const clerk = await fetchClerkIdForUser(userId);
    if (clerk && room.ownerId === `clerk-${clerk}`) return true;
  }
  if (userId.startsWith("clerk-") && room.ownerId.startsWith("usr_")) {
    const ownerClerk = await fetchClerkIdForUser(room.ownerId);
    if (ownerClerk && userId === `clerk-${ownerClerk}`) return true;
  }
  if (userId.startsWith("usr_") && room.ownerId.startsWith("usr_")) {
    const userClerk = await fetchClerkIdForUser(userId);
    const ownerClerk = await fetchClerkIdForUser(room.ownerId);
    if (userClerk && ownerClerk && userClerk === ownerClerk) return true;
  }
  return false;
}

/** Lista presença online enriquecida com avatar, papel e ficha ativa no mapa. */
export async function buildEnrichedRoomPresence(room: RoomState): Promise<RoomPresenceMember[]> {
  const raw = await dedupePresenceByUser(await listRoomPresence(room.roomId));
  if (!raw.length) return [];

  const userIds = raw.map((e) => e.userId);
  const profiles = await fetchUserPresenceRows(userIds);

  const members: RoomPresenceMember[] = [];
  for (const entry of raw) {
    const profile = await profileForUserId(entry.userId, profiles);
    const userId = profile?.id ?? entry.userId;
    const isOwner = await isPresenceGmUser(userId, room, profile?.role);
    const displayName = profile ? displayNameFromRow(profile) : entry.displayName;
    const character = characterForUser(userId, room);
    members.push({
      userId,
      displayName,
      avatarUrl: profile
        ? resolveUserAvatarUrl({
            avatarSource: profile.avatar_source,
            avatarUrl: profile.avatar_url,
            oauthAvatarUrl: profile.oauth_avatar_url,
          })
        : null,
      avatarFocus: profile ? parseAvatarFocus(profile.avatar_focus) : null,
      characterPortraitUrl: character.portraitUrl,
      role: isOwner ? "gm" : "player",
      characterName: character.name,
      isOwner,
    });
  }
  return members;
}
