import "server-only";

import {
  bindPlayerToAdventure,
  getAdventure,
  listCachedAdventures,
} from "@/lib/adventure/store";
import type { Adventure } from "@/lib/adventure/types";
import { memberIdsHasUser } from "@/lib/auth/member-ids";
import { dbEnabled } from "@/lib/db/enabled";
import * as dbAdventures from "@/lib/db/adventures";
import { fetchUserById, fetchUserByNickname } from "@/lib/db/users";
import { getRoom, persistRoom, rooms } from "@/lib/room/internal/registry";
import { syncAdventureMembersToRoom } from "@/lib/room/adventure-room";

export type AdminMemberSummary = {
  userId: string;
  nickname: string | null;
  name: string;
  isOwner: boolean;
};

export type AdminMesaSummary = {
  adventureId: string;
  name: string;
  inviteCode: string;
  primaryRoomId: string;
  ownerId: string;
  ownerNickname: string | null;
  memberIds: string[];
  members: AdminMemberSummary[];
  updatedAt: number;
  deletedAt: number | null;
};

async function resolveMember(userId: string, isOwner: boolean): Promise<AdminMemberSummary> {
  const user = await fetchUserById(userId);
  return {
    userId,
    nickname: user?.nickname ?? null,
    name: user?.name ?? userId,
    isOwner,
  };
}

async function adventureToAdminSummary(adv: Adventure): Promise<AdminMesaSummary> {
  const ids = [...new Set([adv.ownerId, ...adv.memberIds])];
  const members = await Promise.all(
    ids.map((id) => resolveMember(id, id === adv.ownerId))
  );
  const owner = members.find((m) => m.userId === adv.ownerId);
  return {
    adventureId: adv.adventureId,
    name: adv.name,
    inviteCode: adv.inviteCode,
    primaryRoomId: adv.primaryRoomId,
    ownerId: adv.ownerId,
    ownerNickname: owner?.nickname ?? null,
    memberIds: adv.memberIds,
    members,
    updatedAt: adv.updatedAt,
    deletedAt: adv.deletedAt ?? null,
  };
}

export async function listAllMesasForAdmin(): Promise<AdminMesaSummary[]> {
  const seen = new Set<string>();
  const list: Adventure[] = [];

  if (dbEnabled()) {
    const fromDb = await dbAdventures.listAllAdventures();
    for (const adv of fromDb) {
      if (seen.has(adv.adventureId)) continue;
      seen.add(adv.adventureId);
      list.push(adv);
    }
  }

  for (const adv of listCachedAdventures()) {
    if (seen.has(adv.adventureId)) continue;
    seen.add(adv.adventureId);
    list.push(adv);
  }

  const summaries = await Promise.all(list.map(adventureToAdminSummary));
  return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getMesaAdminDetail(
  adventureId: string
): Promise<AdminMesaSummary | null> {
  const adv = await getAdventure(adventureId);
  if (!adv) return null;
  return adventureToAdminSummary(adv);
}

async function resolveUserIdFromInput(
  userId?: string | null,
  nickname?: string | null
): Promise<{ userId: string } | { error: string }> {
  if (userId?.trim()) return { userId: userId.trim() };
  const nick = nickname?.trim();
  if (!nick) return { error: "Informe apelido ou ID do usuário" };
  const user = await fetchUserByNickname(nick);
  if (!user) return { error: "Usuário não encontrado" };
  return { userId: user.id };
}

async function persistAdventureAndRoom(adv: Adventure): Promise<Adventure> {
  const { cacheAdventure } = await import("@/lib/adventure/store");
  cacheAdventure(adv);
  if (dbEnabled() && adv.adventureId !== "demo") {
    await dbAdventures.saveAdventure(adv);
  }
  const room = await getRoom(adv.primaryRoomId);
  if (room) {
    room.ownerId = adv.ownerId;
    room.memberIds = [...new Set(adv.memberIds.filter((id) => id !== adv.ownerId))];
    room.inviteCode = adv.inviteCode;
    room.name = adv.name;
    room.adventureId = adv.adventureId;
    room.revision += 1;
    room.updatedAt = Date.now();
    rooms().set(room.roomId, room);
    await persistRoom(room.roomId, room);
  } else {
    await syncAdventureMembersToRoom(adv);
  }
  return adv;
}

export type AdminMesaMutationResult =
  | { ok: true; adventure: Adventure }
  | { ok: false; error: string };

export async function adminAddMesaMember(
  adventureId: string,
  input: { userId?: string; nickname?: string }
): Promise<AdminMesaMutationResult> {
  const adv = await getAdventure(adventureId);
  if (!adv) return { ok: false, error: "Mesa não encontrada" };

  const resolved = await resolveUserIdFromInput(input.userId, input.nickname);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const updated = await bindPlayerToAdventure(adventureId, resolved.userId);
  if (!updated) return { ok: false, error: "Mesa não encontrada" };
  return { ok: true, adventure: updated };
}

export async function adminRemoveMesaMember(
  adventureId: string,
  input: { userId?: string; nickname?: string }
): Promise<AdminMesaMutationResult> {
  const adv = await getAdventure(adventureId);
  if (!adv) return { ok: false, error: "Mesa não encontrada" };

  const resolved = await resolveUserIdFromInput(input.userId, input.nickname);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  if (adv.ownerId === resolved.userId) {
    return { ok: false, error: "Não é possível remover o mestre da mesa" };
  }

  adv.memberIds = adv.memberIds.filter((id) => id !== resolved.userId);
  adv.updatedAt = Date.now();
  const saved = await persistAdventureAndRoom(adv);
  return { ok: true, adventure: saved };
}

export async function adminSetMesaOwner(
  adventureId: string,
  input: { userId?: string; nickname?: string }
): Promise<AdminMesaMutationResult> {
  const adv = await getAdventure(adventureId);
  if (!adv) return { ok: false, error: "Mesa não encontrada" };
  if (adventureId === "demo") return { ok: false, error: "A demo não pode ser alterada" };

  const resolved = await resolveUserIdFromInput(input.userId, input.nickname);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const prevOwner = adv.ownerId;
  adv.ownerId = resolved.userId;
  adv.memberIds = adv.memberIds.filter((id) => id !== resolved.userId);
  if (prevOwner !== resolved.userId && !memberIdsHasUser(adv.memberIds, prevOwner)) {
    adv.memberIds.push(prevOwner);
  }
  adv.updatedAt = Date.now();

  const saved = await persistAdventureAndRoom(adv);
  return { ok: true, adventure: saved };
}
