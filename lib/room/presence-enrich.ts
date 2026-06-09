import "server-only";

import { resolveUserAvatarUrl } from "@/lib/db/user-avatar";
import { getSql } from "@/lib/db/client";
import { dbEnabled } from "@/lib/db/enabled";
import { resolveActorTokenImageUrl } from "@/lib/room/portrait-sync";
import { listRoomPresence } from "@/lib/room/presence";
import type { RoomActor, RoomState } from "@/lib/room/types";

export type RoomPresenceMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  characterPortraitUrl: string | null;
  role: "gm" | "player";
  characterName: string | null;
  isOwner: boolean;
};

type UserPresenceRow = {
  id: string;
  nickname: string | null;
  name: string;
  avatar_url: string | null;
  oauth_avatar_url: string | null;
  avatar_source: string | null;
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

  const sql = getSql();
  if (!sql) return out;

  const rows = await sql<UserPresenceRow[]>`
    SELECT id, nickname, name, avatar_url, oauth_avatar_url, avatar_source
    FROM eldarin_users
    WHERE id = ANY(${userIds})
  `;
  for (const row of rows) {
    out.set(row.id, row);
  }
  return out;
}

/** Lista presença online enriquecida com avatar, papel e ficha ativa no mapa. */
export async function buildEnrichedRoomPresence(room: RoomState): Promise<RoomPresenceMember[]> {
  const raw = listRoomPresence(room.roomId);
  if (!raw.length) return [];

  const userIds = raw.map((e) => e.userId);
  const profiles = await fetchUserPresenceRows(userIds);

  return raw.map((entry) => {
    const profile = profiles.get(entry.userId);
    const isOwner = entry.userId === room.ownerId;
    const displayName = profile ? displayNameFromRow(profile) : entry.displayName;
    const character = characterForUser(entry.userId, room);
    return {
      userId: entry.userId,
      displayName,
      avatarUrl: profile
        ? resolveUserAvatarUrl({
            avatarSource: profile.avatar_source,
            avatarUrl: profile.avatar_url,
            oauthAvatarUrl: profile.oauth_avatar_url,
          })
        : null,
      characterPortraitUrl: character.portraitUrl,
      role: isOwner ? "gm" : "player",
      characterName: character.name,
      isOwner,
    };
  });
}
