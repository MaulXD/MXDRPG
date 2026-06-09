import "server-only";

import { dbEnabled } from "@/lib/db/enabled";
import type {
  SheetEditRequest,
  SheetEditScope,
} from "@/lib/character/sheet-edit-request";
import { newSheetEditRequestId } from "@/lib/character/sheet-edit-request";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinSheetEditRequests: Map<string, SheetEditRequest> | undefined;
}

function memoryStore(): Map<string, SheetEditRequest> {
  if (!globalThis.__eldarinSheetEditRequests) {
    globalThis.__eldarinSheetEditRequests = new Map();
  }
  return globalThis.__eldarinSheetEditRequests;
}

async function db() {
  return import("@/lib/db/sheet-edit-requests");
}

export async function getSheetEditRequest(id: string): Promise<SheetEditRequest | null> {
  if (dbEnabled()) {
    const { fetchSheetEditRequest } = await db();
    const fromDb = await fetchSheetEditRequest(id);
    if (fromDb) return fromDb;
  }
  return memoryStore().get(id) ?? null;
}

export async function getActiveSheetEditRequestForCharacter(
  characterId: string,
  requesterUserId: string
): Promise<SheetEditRequest | null> {
  if (dbEnabled()) {
    const { fetchActiveRequestForCharacter } = await db();
    const fromDb = await fetchActiveRequestForCharacter(characterId, requesterUserId);
    if (fromDb) return fromDb;
  }
  const all = [...memoryStore().values()]
    .filter(
      (r) =>
        r.characterId === characterId &&
        r.requesterUserId === requesterUserId &&
        ["pending", "approved", "rejected"].includes(r.status)
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return all[0] ?? null;
}

export async function getApprovedGrantForCharacter(
  characterId: string,
  userId: string
): Promise<SheetEditRequest | null> {
  const active = await getActiveSheetEditRequestForCharacter(characterId, userId);
  if (active?.status === "approved") return active;
  return null;
}

export async function listPendingSheetEditRequests(
  adventureId: string
): Promise<SheetEditRequest[]> {
  if (dbEnabled()) {
    const { listPendingRequestsForAdventure } = await db();
    return listPendingRequestsForAdventure(adventureId);
  }
  return [...memoryStore().values()]
    .filter((r) => r.adventureId === adventureId && r.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function createSheetEditRequest(input: {
  characterId: string;
  adventureId: string;
  roomId?: string | null;
  requesterUserId: string;
  scope: SheetEditScope;
}): Promise<SheetEditRequest> {
  if (dbEnabled()) {
    const { insertSheetEditRequest, fetchPendingRequestForCharacter } = await db();
    const pending = await fetchPendingRequestForCharacter(input.characterId);
    if (pending) return pending;
    const created = await insertSheetEditRequest(input);
    if (created) return created;
  }

  const store = memoryStore();
  const existing = [...store.values()].find(
    (r) => r.characterId === input.characterId && r.status === "pending"
  );
  if (existing) return existing;

  const now = Date.now();
  const request: SheetEditRequest = {
    id: newSheetEditRequestId(),
    characterId: input.characterId,
    adventureId: input.adventureId,
    roomId: input.roomId ?? null,
    requesterUserId: input.requesterUserId,
    scope: input.scope,
    status: "pending",
    gmUserId: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store.set(request.id, request);
  return request;
}

export async function resolveSheetEditRequestByGm(
  requestId: string,
  action: "approve" | "reject",
  gmUserId: string
): Promise<SheetEditRequest | null> {
  if (dbEnabled()) {
    const { resolveSheetEditRequest } = await db();
    const updated = await resolveSheetEditRequest(requestId, action, gmUserId);
    if (updated) return updated;
  }

  const store = memoryStore();
  const current = store.get(requestId);
  if (!current || current.status !== "pending") return null;
  const now = Date.now();
  const updated: SheetEditRequest = {
    ...current,
    status: action === "approve" ? "approved" : "rejected",
    gmUserId,
    resolvedAt: now,
    updatedAt: now,
  };
  store.set(requestId, updated);
  return updated;
}

export async function consumeSheetEditGrant(requestId: string): Promise<boolean> {
  if (dbEnabled()) {
    const { consumeSheetEditRequest } = await db();
    const ok = await consumeSheetEditRequest(requestId);
    if (ok) return true;
  }

  const store = memoryStore();
  const current = store.get(requestId);
  if (!current || current.status !== "approved") return false;
  store.set(requestId, {
    ...current,
    status: "consumed",
    updatedAt: Date.now(),
  });
  return true;
}
