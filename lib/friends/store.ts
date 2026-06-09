import "server-only";

import { getAdventure } from "@/lib/adventure/store";
import { memberIdsHasUser } from "@/lib/auth/member-ids";
import { validateNickname } from "@/lib/auth/nickname";
import { roomInviteUrl } from "@/lib/auth/room-access";
import {
  deleteFriendLink,
  insertFriendLink,
  insertMesaInvite,
  isFriendLink,
  listFriendIds,
  listPendingMesaInvitesForUser,
  dismissMesaInvite,
} from "@/lib/db/friends";
import { dbEnabled } from "@/lib/db/enabled";
import { fetchUserById, fetchUserByNickname } from "@/lib/db/users";
import { resolveUserAvatarUrl } from "@/lib/db/user-avatar";
import type { FriendSummary, MesaInviteSummary } from "@/lib/friends/types";

function requireDb(): { ok: true } | { ok: false; error: string } {
  if (!dbEnabled()) {
    return { ok: false, error: "Amigos e convites exigem Postgres (DATABASE_URL)." };
  }
  return { ok: true };
}

function displayName(user: {
  nickname?: string | null;
  name: string;
}): string {
  return user.nickname?.trim() || user.name?.trim() || "Jogador";
}

export async function addFriendByNickname(
  userId: string,
  nicknameRaw: string
): Promise<{ ok: true; friend: FriendSummary } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const v = validateNickname(nicknameRaw);
  if (!v.ok) return v;

  const target = await fetchUserByNickname(v.nickname);
  if (!target) return { ok: false, error: "Apelido não encontrado" };
  if (target.id === userId) return { ok: false, error: "Você não pode adicionar a si mesmo" };

  await insertFriendLink(userId, target.id);

  return {
    ok: true,
    friend: {
      id: target.id,
      nickname: target.nickname ?? null,
      name: target.name,
      avatarUrl: resolveUserAvatarUrl(target),
      avatarFocus: target.avatarFocus ?? null,
      addedAt: Date.now(),
    },
  };
}

export async function listFriends(userId: string): Promise<FriendSummary[]> {
  const gate = requireDb();
  if (!gate.ok) return [];

  const links = await listFriendIds(userId);
  const out: FriendSummary[] = [];
  for (const link of links) {
    const user = await fetchUserById(link.friendId);
    if (!user) continue;
    out.push({
      id: user.id,
      nickname: user.nickname ?? null,
      name: user.name,
      avatarUrl: resolveUserAvatarUrl(user),
      avatarFocus: user.avatarFocus ?? null,
      addedAt: link.addedAt,
    });
  }
  return out;
}

export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;
  const removed = await deleteFriendLink(userId, friendId);
  if (!removed) return { ok: false, error: "Amigo não encontrado na sua lista" };
  return { ok: true };
}

async function canShareAdventureInvite(
  userId: string,
  adventureId: string,
  clerkId?: string | null
): Promise<boolean> {
  const adv = await getAdventure(adventureId);
  if (!adv || adv.deletedAt) return false;
  if (adv.ownerId === userId) return true;
  return memberIdsHasUser(adv.memberIds, userId, clerkId);
}

export async function sendMesaInviteToFriend(
  fromUserId: string,
  friendId: string,
  adventureId: string,
  opts?: { message?: string; clerkId?: string | null }
): Promise<{ ok: true; invite: MesaInviteSummary } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  if (friendId === fromUserId) {
    return { ok: false, error: "Escolha um amigo da lista" };
  }

  const isFriend = await isFriendLink(fromUserId, friendId);
  if (!isFriend) return { ok: false, error: "Só é possível convidar amigos da sua lista" };

  const canShare = await canShareAdventureInvite(fromUserId, adventureId, opts?.clerkId);
  if (!canShare) return { ok: false, error: "Você não participa desta mesa" };

  const adv = await getAdventure(adventureId);
  if (!adv) return { ok: false, error: "Mesa não encontrada" };

  const fromUser = await fetchUserById(fromUserId);
  if (!fromUser) return { ok: false, error: "Sessão inválida" };

  const id = `minv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const inviteUrl = roomInviteUrl(adv.primaryRoomId, adv.inviteCode);

  await insertMesaInvite({
    id,
    fromUserId,
    toUserId: friendId,
    roomId: adv.primaryRoomId,
    adventureId: adv.adventureId,
    inviteCode: adv.inviteCode,
    roomName: adv.name,
    message: opts?.message,
  });

  return {
    ok: true,
    invite: {
      id,
      fromUserId,
      fromDisplayName: displayName(fromUser),
      fromAvatarUrl: resolveUserAvatarUrl(fromUser),
      roomId: adv.primaryRoomId,
      adventureId: adv.adventureId,
      inviteCode: adv.inviteCode,
      roomName: adv.name,
      message: opts?.message?.trim() || null,
      inviteUrl,
      createdAt: Date.now(),
    },
  };
}

export async function listReceivedMesaInvites(userId: string): Promise<MesaInviteSummary[]> {
  const gate = requireDb();
  if (!gate.ok) return [];

  const rows = await listPendingMesaInvitesForUser(userId);
  const out: MesaInviteSummary[] = [];

  for (const row of rows) {
    const fromUser = await fetchUserById(row.from_user_id);
    out.push({
      id: row.id,
      fromUserId: row.from_user_id,
      fromDisplayName: fromUser ? displayName(fromUser) : "Jogador",
      fromAvatarUrl: fromUser ? resolveUserAvatarUrl(fromUser) : null,
      roomId: row.room_id,
      adventureId: row.adventure_id,
      inviteCode: row.invite_code,
      roomName: row.room_name,
      message: row.message,
      inviteUrl: roomInviteUrl(row.room_id, row.invite_code),
      createdAt: Number(row.created_at),
    });
  }
  return out;
}

export async function dismissReceivedMesaInvite(
  userId: string,
  inviteId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;
  const ok = await dismissMesaInvite(inviteId, userId);
  if (!ok) return { ok: false, error: "Convite não encontrado" };
  return { ok: true };
}
