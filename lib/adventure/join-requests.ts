import "server-only";

import { getAdventure, joinAdventureRecord } from "@/lib/adventure/store";
import { isAdventureClosed } from "@/lib/adventure/access";
import { dbEnabled } from "@/lib/db/enabled";
import * as dbJoinRequests from "@/lib/db/join-requests";
import { fetchUserById } from "@/lib/db/users";
import { resolveUserAvatarUrl } from "@/lib/db/user-avatar";

export type JoinRequestSummary = {
  id: string;
  adventureId: string;
  roomId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  message: string | null;
  createdAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __eldarinJoinRequests: Map<string, JoinRequestSummary & { status: string; respondedBy?: string | null; respondedAt?: number | null }> | undefined;
}

function memoryStore() {
  if (!globalThis.__eldarinJoinRequests) {
    globalThis.__eldarinJoinRequests = new Map();
  }
  return globalThis.__eldarinJoinRequests;
}

function newRequestId(): string {
  return `jreq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function displayName(user: { nickname?: string | null; name: string }): string {
  return user.nickname?.trim() || "Jogador";
}

async function rowToSummary(row: dbJoinRequests.JoinRequestRow): Promise<JoinRequestSummary | null> {
  const user = await fetchUserById(row.user_id);
  if (!user) return null;
  return {
    id: row.id,
    adventureId: row.adventure_id,
    roomId: row.room_id,
    userId: row.user_id,
    userDisplayName: displayName(user),
    userAvatarUrl: resolveUserAvatarUrl(user),
    message: row.message,
    createdAt: Number(row.created_at),
  };
}

export async function createJoinRequest(
  adventureId: string,
  userId: string,
  message?: string | null
): Promise<{ ok: true; request: JoinRequestSummary } | { ok: false; error: string }> {
  const adv = await getAdventure(adventureId);
  if (!adv || adv.deletedAt) return { ok: false, error: "Mesa não encontrada" };
  if (!isAdventureClosed(adv)) {
    return { ok: false, error: "Esta mesa é pública — use o código do mestre" };
  }
  if (adv.ownerId === userId || adv.memberIds.includes(userId)) {
    return { ok: false, error: "Você já participa desta mesa" };
  }

  const existing = dbEnabled()
    ? await dbJoinRequests.findPendingJoinRequest(adventureId, userId)
    : [...memoryStore().values()].find(
        (r) => r.adventureId === adventureId && r.userId === userId && r.status === "pending"
      );

  if (existing) {
    return { ok: false, error: "Você já tem um pedido pendente nesta mesa" };
  }

  const id = newRequestId();
  const user = await fetchUserById(userId);
  if (!user) return { ok: false, error: "Usuário não encontrado" };

  const summary: JoinRequestSummary = {
    id,
    adventureId,
    roomId: adv.primaryRoomId,
    userId,
    userDisplayName: displayName(user),
    userAvatarUrl: resolveUserAvatarUrl(user),
    message: message?.trim() || null,
    createdAt: Date.now(),
  };

  memoryStore().set(id, { ...summary, status: "pending" });
  if (dbEnabled()) {
    await dbJoinRequests.insertJoinRequest({
      id,
      adventureId,
      roomId: adv.primaryRoomId,
      userId,
      message,
    });
  }

  return { ok: true, request: summary };
}

export async function listPendingJoinRequests(
  adventureId: string,
  ownerId: string
): Promise<JoinRequestSummary[]> {
  const adv = await getAdventure(adventureId);
  if (!adv || adv.ownerId !== ownerId) return [];

  let rows: dbJoinRequests.JoinRequestRow[] = [];
  if (dbEnabled()) {
    rows = await dbJoinRequests.listPendingJoinRequestsForAdventure(adventureId);
  } else {
    rows = [...memoryStore().values()]
      .filter((r) => r.adventureId === adventureId && r.status === "pending")
      .map((r) => ({
        id: r.id,
        adventure_id: r.adventureId,
        room_id: r.roomId,
        user_id: r.userId,
        message: r.message,
        status: "pending" as const,
        created_at: r.createdAt,
        responded_at: null,
        responded_by: null,
      }));
  }

  const out: JoinRequestSummary[] = [];
  for (const row of rows) {
    const item = await rowToSummary(row);
    if (item) out.push(item);
  }
  return out;
}

export async function listPendingJoinRequestsForOwner(
  ownerId: string
): Promise<(JoinRequestSummary & { adventureName: string })[]> {
  let rows: dbJoinRequests.JoinRequestRow[] = [];
  if (dbEnabled()) {
    rows = await dbJoinRequests.listPendingJoinRequestsForOwner(ownerId);
  } else {
    const owned = (await import("@/lib/adventure/store")).listCachedAdventures();
    const ownedIds = new Set(owned.filter((a) => a.ownerId === ownerId).map((a) => a.adventureId));
    rows = [...memoryStore().values()]
      .filter((r) => ownedIds.has(r.adventureId) && r.status === "pending")
      .map((r) => ({
        id: r.id,
        adventure_id: r.adventureId,
        room_id: r.roomId,
        user_id: r.userId,
        message: r.message,
        status: "pending" as const,
        created_at: r.createdAt,
        responded_at: null,
        responded_by: null,
      }));
  }

  const out: (JoinRequestSummary & { adventureName: string })[] = [];
  for (const row of rows) {
    const item = await rowToSummary(row);
    if (!item) continue;
    const adv = await getAdventure(row.adventure_id);
    out.push({ ...item, adventureName: adv?.name ?? "Mesa" });
  }
  return out;
}

export async function approveJoinRequest(
  ownerId: string,
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = dbEnabled()
    ? await dbJoinRequests.getJoinRequestById(requestId)
    : memoryStore().get(requestId)
      ? {
          id: requestId,
          adventure_id: memoryStore().get(requestId)!.adventureId,
          room_id: memoryStore().get(requestId)!.roomId,
          user_id: memoryStore().get(requestId)!.userId,
          message: memoryStore().get(requestId)!.message,
          status: memoryStore().get(requestId)!.status as dbJoinRequests.JoinRequestStatus,
          created_at: memoryStore().get(requestId)!.createdAt,
          responded_at: null,
          responded_by: null,
        }
      : null;

  if (!row || row.status !== "pending") {
    return { ok: false, error: "Pedido não encontrado" };
  }

  const adv = await getAdventure(row.adventure_id);
  if (!adv || adv.ownerId !== ownerId) {
    return { ok: false, error: "Sem permissão" };
  }

  if (dbEnabled()) {
    const ok = await dbJoinRequests.resolveJoinRequest(requestId, "approved", ownerId);
    if (!ok) return { ok: false, error: "Pedido já respondido" };
  } else {
    const mem = memoryStore().get(requestId);
    if (!mem) return { ok: false, error: "Pedido não encontrado" };
    mem.status = "approved";
    mem.respondedBy = ownerId;
    mem.respondedAt = Date.now();
  }

  await joinAdventureRecord(adv, row.user_id);
  return { ok: true };
}

export async function rejectJoinRequest(
  ownerId: string,
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = dbEnabled()
    ? await dbJoinRequests.getJoinRequestById(requestId)
    : memoryStore().get(requestId)
      ? {
          id: requestId,
          adventure_id: memoryStore().get(requestId)!.adventureId,
          user_id: memoryStore().get(requestId)!.userId,
          status: memoryStore().get(requestId)!.status as dbJoinRequests.JoinRequestStatus,
        }
      : null;

  if (!row || row.status !== "pending") {
    return { ok: false, error: "Pedido não encontrado" };
  }

  const adv = await getAdventure(row.adventure_id);
  if (!adv || adv.ownerId !== ownerId) {
    return { ok: false, error: "Sem permissão" };
  }

  if (dbEnabled()) {
    const ok = await dbJoinRequests.resolveJoinRequest(requestId, "rejected", ownerId);
    if (!ok) return { ok: false, error: "Pedido já respondido" };
  } else {
    const mem = memoryStore().get(requestId);
    if (!mem) return { ok: false, error: "Pedido não encontrado" };
    mem.status = "rejected";
    mem.respondedBy = ownerId;
    mem.respondedAt = Date.now();
  }

  return { ok: true };
}
