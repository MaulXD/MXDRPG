import "server-only";

import type { AdventureListItem, AdventureListMember } from "@/lib/adventure/types";
import { getAdventure } from "@/lib/adventure/store";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { getSql } from "@/lib/db/client";
import { dbEnabled } from "@/lib/db/enabled";
import { normalizeAvatarSource, resolveUserAvatarUrl } from "@/lib/db/user-avatar";
import { fetchUserById } from "@/lib/db/users";
import { listRoomPresence } from "@/lib/room/presence";
import { normalizeRoomSettings } from "@/lib/room/settings";
import { getRoom } from "@/lib/room/store";
import { normalizeRpgSystemId, resolveMesaCoverSrc } from "@/lib/rpg/systems";

type UserRow = {
  id: string;
  nickname: string | null;
  name: string;
  avatar_url?: string | null;
  oauth_avatar_url?: string | null;
  avatar_source?: string | null;
};

function displayNameFromRow(row: UserRow): string {
  return row.nickname?.trim() || row.name?.trim() || "Jogador";
}

async function fetchUserRows(userIds: string[]): Promise<Map<string, UserRow>> {
  const out = new Map<string, UserRow>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return out;

  if (dbEnabled()) {
    await ensureDbMigrations();
    const sql = getSql();
    if (sql) {
      try {
        const rows = await sql<UserRow[]>`
          SELECT id, nickname, name, avatar_url, oauth_avatar_url, avatar_source
          FROM eldarin_users
          WHERE id = ANY(${unique})
        `;
        for (const row of rows) out.set(row.id, row);
      } catch {
        const rows = await sql<UserRow[]>`
          SELECT id, nickname, name
          FROM eldarin_users
          WHERE id = ANY(${unique})
        `;
        for (const row of rows) out.set(row.id, row);
      }
    }
  }

  for (const id of unique) {
    if (out.has(id)) continue;
    const user = await fetchUserById(id);
    if (!user) continue;
    out.set(id, {
      id: user.id,
      nickname: user.nickname ?? null,
      name: user.name,
      avatar_url: user.avatarUrl,
      oauth_avatar_url: user.oauthAvatarUrl,
      avatar_source: user.avatarSource,
    });
  }

  return out;
}

function memberFromRow(
  row: UserRow,
  isOwner: boolean,
  online: boolean
): AdventureListMember {
  return {
    userId: row.id,
    displayName: displayNameFromRow(row),
    avatarUrl: resolveUserAvatarUrl({
      avatarSource: normalizeAvatarSource(row.avatar_source),
      avatarUrl: row.avatar_url,
      oauthAvatarUrl: row.oauth_avatar_url,
    }),
    isOwner,
    online,
  };
}

async function onlineUserIdsForRoom(roomId: string): Promise<Set<string>> {
  const presence = await listRoomPresence(roomId);
  return new Set(presence.map((p) => p.userId));
}

export async function enrichAdventureListItems(
  items: AdventureListItem[]
): Promise<AdventureListItem[]> {
  const enriched: AdventureListItem[] = [];

  for (const item of items) {
    if (item.deletedAt) {
      enriched.push(item);
      continue;
    }

    const adv = await getAdventure(item.adventureId);
    const memberIds = adv
      ? [adv.ownerId, ...adv.memberIds.filter((id) => id !== adv.ownerId)]
      : [item.ownerId];

    const profiles = await fetchUserRows(memberIds);
    const onlineIds = await onlineUserIdsForRoom(item.primaryRoomId);

    const members: AdventureListMember[] = [];
    for (const userId of memberIds) {
      const row = profiles.get(userId);
      if (row) {
        members.push(memberFromRow(row, userId === item.ownerId, onlineIds.has(userId)));
        continue;
      }
      members.push({
        userId,
        displayName: "Jogador",
        avatarUrl: null,
        isOwner: userId === item.ownerId,
        online: onlineIds.has(userId),
      });
    }

    const room = await getRoom(item.primaryRoomId);
    const settings = normalizeRoomSettings(room?.settings);
    const systemId = normalizeRpgSystemId(adv?.rpgSystemId ?? item.rpgSystemId);
    const coverUrl = resolveMesaCoverSrc(settings.coverUrl, systemId);
    const coverFocus = settings.coverFocus ?? null;
    const onlineCount = members.filter((m) => m.online).length;

    enriched.push({
      ...item,
      rpgSystemId: systemId,
      coverUrl,
      coverFocus,
      members,
      onlineCount,
    });
  }

  return enriched;
}
