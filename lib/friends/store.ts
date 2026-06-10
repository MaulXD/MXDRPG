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
import {
  countPendingIncomingFriendRequests,
  findPendingFriendRequest,
  getFriendRequestById,
  insertFriendRequest,
  listPendingFriendRequestsForUser,
  resolveFriendRequest,
} from "@/lib/db/friend-requests";
import { dbEnabled } from "@/lib/db/enabled";
import { fetchUserById, fetchUserByNickname } from "@/lib/db/users";
import { resolveUserAvatarUrl } from "@/lib/db/user-avatar";
import type {
  FriendRequestSummary,
  FriendSummary,
  MesaInviteSummary,
  PublicUserProfile,
} from "@/lib/friends/types";

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

async function friendSummaryFromUserId(
  userId: string,
  addedAt = Date.now()
): Promise<FriendSummary | null> {
  const user = await fetchUserById(userId);
  if (!user) return null;
  return {
    id: user.id,
    nickname: user.nickname ?? null,
    name: user.name,
    avatarUrl: resolveUserAvatarUrl(user),
    avatarFocus: user.avatarFocus ?? null,
    addedAt,
  };
}

async function createMutualFriendLinks(userA: string, userB: string): Promise<void> {
  await insertFriendLink(userA, userB);
  await insertFriendLink(userB, userA);
}

async function rowToFriendRequest(
  row: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    created_at: string | number;
  },
  viewerId: string
): Promise<FriendRequestSummary | null> {
  const fromUser = await fetchUserById(row.from_user_id);
  const toUser = await fetchUserById(row.to_user_id);
  if (!fromUser || !toUser) return null;
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    fromDisplayName: displayName(fromUser),
    fromNickname: fromUser.nickname ?? null,
    fromAvatarUrl: resolveUserAvatarUrl(fromUser),
    toDisplayName: displayName(toUser),
    toNickname: toUser.nickname ?? null,
    toAvatarUrl: resolveUserAvatarUrl(toUser),
    createdAt: Number(row.created_at),
    direction: row.to_user_id === viewerId ? "incoming" : "outgoing",
  };
}

export async function acceptFriendRequest(
  userId: string,
  requestId: string
): Promise<{ ok: true; friend: FriendSummary } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const row = await getFriendRequestById(requestId);
  if (!row || row.status !== "pending") {
    return { ok: false, error: "Pedido não encontrado" };
  }
  if (row.to_user_id !== userId) {
    return { ok: false, error: "Só quem recebeu pode aceitar" };
  }

  const resolved = await resolveFriendRequest(requestId, "accepted");
  if (!resolved) return { ok: false, error: "Pedido já respondido" };

  await createMutualFriendLinks(row.from_user_id, row.to_user_id);

  const friend = await friendSummaryFromUserId(row.from_user_id, Date.now());
  if (!friend) return { ok: false, error: "Usuário não encontrado" };
  return { ok: true, friend };
}

export async function rejectFriendRequest(
  userId: string,
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const row = await getFriendRequestById(requestId);
  if (!row || row.status !== "pending") {
    return { ok: false, error: "Pedido não encontrado" };
  }
  if (row.to_user_id !== userId) {
    return { ok: false, error: "Só quem recebeu pode recusar" };
  }

  const resolved = await resolveFriendRequest(requestId, "rejected");
  if (!resolved) return { ok: false, error: "Pedido já respondido" };
  return { ok: true };
}

export async function cancelFriendRequest(
  userId: string,
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const row = await getFriendRequestById(requestId);
  if (!row || row.status !== "pending") {
    return { ok: false, error: "Pedido não encontrado" };
  }
  if (row.from_user_id !== userId) {
    return { ok: false, error: "Só quem enviou pode cancelar" };
  }

  const resolved = await resolveFriendRequest(requestId, "rejected");
  if (!resolved) return { ok: false, error: "Pedido já respondido" };
  return { ok: true };
}

export async function listFriendRequests(userId: string): Promise<{
  incoming: FriendRequestSummary[];
  outgoing: FriendRequestSummary[];
}> {
  const gate = requireDb();
  if (!gate.ok) return { incoming: [], outgoing: [] };

  const [incomingRows, outgoingRows] = await Promise.all([
    listPendingFriendRequestsForUser(userId, "incoming"),
    listPendingFriendRequestsForUser(userId, "outgoing"),
  ]);

  const incoming: FriendRequestSummary[] = [];
  for (const row of incomingRows) {
    const item = await rowToFriendRequest(row, userId);
    if (item) incoming.push(item);
  }

  const outgoing: FriendRequestSummary[] = [];
  for (const row of outgoingRows) {
    const item = await rowToFriendRequest(row, userId);
    if (item) outgoing.push(item);
  }

  return { incoming, outgoing };
}

export async function countIncomingFriendRequests(userId: string): Promise<number> {
  const gate = requireDb();
  if (!gate.ok) return 0;
  return countPendingIncomingFriendRequests(userId);
}

async function requestFriendship(
  userId: string,
  targetId: string
): Promise<
  | { ok: true; kind: "friend"; friend: FriendSummary }
  | { ok: true; kind: "request"; request: FriendRequestSummary }
  | { ok: false; error: string }
> {
  if (targetId === userId) return { ok: false, error: "Você não pode adicionar a si mesmo" };

  const alreadyFriend =
    (await isFriendLink(userId, targetId)) || (await isFriendLink(targetId, userId));
  if (alreadyFriend) return { ok: false, error: "Vocês já são amigos" };

  const reversePending = await findPendingFriendRequest(targetId, userId);
  if (reversePending) {
    const accepted = await acceptFriendRequest(userId, reversePending.id);
    if (!accepted.ok) return accepted;
    return { ok: true, kind: "friend", friend: accepted.friend };
  }

  const existing = await findPendingFriendRequest(userId, targetId);
  if (existing) return { ok: false, error: "Pedido já enviado — aguardando resposta" };

  const id = `freq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  await insertFriendRequest({ id, fromUserId: userId, toUserId: targetId });

  const request = await rowToFriendRequest(
    {
      id,
      from_user_id: userId,
      to_user_id: targetId,
      created_at: Date.now(),
    },
    userId
  );
  if (!request) return { ok: false, error: "Erro ao criar pedido" };

  return { ok: true, kind: "request", request };
}

export async function addFriendByNickname(
  userId: string,
  nicknameRaw: string
): Promise<
  | { ok: true; kind: "friend"; friend: FriendSummary }
  | { ok: true; kind: "request"; request: FriendRequestSummary }
  | { ok: false; error: string }
> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const v = validateNickname(nicknameRaw);
  if (!v.ok) return v;

  const target = await fetchUserByNickname(v.nickname);
  if (!target) return { ok: false, error: "Apelido não encontrado" };

  return requestFriendship(userId, target.id);
}

export async function addFriendByUserId(
  userId: string,
  targetUserId: string
): Promise<
  | { ok: true; kind: "friend"; friend: FriendSummary }
  | { ok: true; kind: "request"; request: FriendRequestSummary }
  | { ok: false; error: string }
> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const target = await fetchUserById(targetUserId);
  if (!target) return { ok: false, error: "Usuário não encontrado" };

  return requestFriendship(userId, target.id);
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
  await deleteFriendLink(friendId, userId);
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

export async function sendMesaInviteToUser(
  fromUserId: string,
  toUserId: string,
  adventureId: string,
  opts?: { message?: string; clerkId?: string | null }
): Promise<{ ok: true; invite: MesaInviteSummary } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  if (toUserId === fromUserId) {
    return { ok: false, error: "Escolha outro jogador" };
  }

  const target = await fetchUserById(toUserId);
  if (!target) return { ok: false, error: "Usuário não encontrado" };

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
    toUserId,
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

export async function sendMesaInviteToFriend(
  fromUserId: string,
  friendId: string,
  adventureId: string,
  opts?: { message?: string; clerkId?: string | null }
): Promise<{ ok: true; invite: MesaInviteSummary } | { ok: false; error: string }> {
  const isFriend = await isFriendLink(fromUserId, friendId);
  if (!isFriend) return { ok: false, error: "Só é possível convidar amigos da sua lista" };
  return sendMesaInviteToUser(fromUserId, friendId, adventureId, opts);
}

export async function sendMesaInviteByNickname(
  fromUserId: string,
  nicknameRaw: string,
  adventureId: string,
  opts?: { message?: string; clerkId?: string | null }
): Promise<{ ok: true; invite: MesaInviteSummary } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const v = validateNickname(nicknameRaw);
  if (!v.ok) return v;

  const target = await fetchUserByNickname(v.nickname);
  if (!target) return { ok: false, error: "Apelido não encontrado" };

  return sendMesaInviteToUser(fromUserId, target.id, adventureId, opts);
}

export async function getUserPublicProfile(
  viewerId: string,
  targetUserId: string
): Promise<{ ok: true; profile: PublicUserProfile } | { ok: false; error: string }> {
  const gate = requireDb();
  if (!gate.ok) return gate;

  const target = await fetchUserById(targetUserId);
  if (!target) return { ok: false, error: "Jogador não encontrado" };

  if (target.id === viewerId) {
    return {
      ok: true,
      profile: {
        id: target.id,
        nickname: target.nickname ?? null,
        name: target.name,
        displayName: displayName(target),
        avatarUrl: resolveUserAvatarUrl(target),
        avatarFocus: target.avatarFocus ?? null,
        relationship: "self",
      },
    };
  }

  let relationship: PublicUserProfile["relationship"] = "none";
  let friendSince: number | undefined;
  let pendingRequestId: string | null = null;

  if (await isFriendLink(viewerId, target.id)) {
    relationship = "friend";
    const links = await listFriendIds(viewerId);
    friendSince = links.find((l) => l.friendId === target.id)?.addedAt;
  } else {
    const incoming = await findPendingFriendRequest(target.id, viewerId);
    if (incoming) {
      relationship = "incoming";
      pendingRequestId = incoming.id;
    } else {
      const outgoing = await findPendingFriendRequest(viewerId, target.id);
      if (outgoing) {
        relationship = "outgoing";
        pendingRequestId = outgoing.id;
      }
    }
  }

  return {
    ok: true,
    profile: {
      id: target.id,
      nickname: target.nickname ?? null,
      name: target.name,
      displayName: displayName(target),
      avatarUrl: resolveUserAvatarUrl(target),
      avatarFocus: target.avatarFocus ?? null,
      relationship,
      friendSince,
      pendingRequestId,
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
