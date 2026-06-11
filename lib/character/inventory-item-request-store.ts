import "server-only";

import { dbEnabled } from "@/lib/db/enabled";
import { mergeInventoryItem } from "@/lib/character/inventory-merge";
import {
  newInventoryItemRequestId,
  type InventoryItemRequest,
} from "@/lib/character/inventory-item-request";
import { resolveCharacter, saveCharacter } from "@/lib/character/characters";
import { updateRoomActor } from "@/lib/room/handlers/actors";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinInventoryItemRequests: Map<string, InventoryItemRequest> | undefined;
}

function memoryStore(): Map<string, InventoryItemRequest> {
  if (!globalThis.__eldarinInventoryItemRequests) {
    globalThis.__eldarinInventoryItemRequests = new Map();
  }
  return globalThis.__eldarinInventoryItemRequests;
}

async function db() {
  return import("@/lib/db/inventory-item-requests");
}

async function applyApprovedInventory(request: InventoryItemRequest): Promise<void> {
  const character = await resolveCharacter(request.characterId);
  if (!character) return;

  const inventory = mergeInventoryItem(character.inventory, request);
  const saved = await saveCharacter({ ...character, inventory });

  if (request.roomId) {
    await updateRoomActor(request.roomId, saved.id, { inventory: saved.inventory });
  }
}

export async function getInventoryItemRequest(id: string): Promise<InventoryItemRequest | null> {
  if (dbEnabled()) {
    const { fetchInventoryItemRequest } = await db();
    const fromDb = await fetchInventoryItemRequest(id);
    if (fromDb) return fromDb;
  }
  return memoryStore().get(id) ?? null;
}

export async function listPendingInventoryRequestsForAdventure(
  adventureId: string
): Promise<InventoryItemRequest[]> {
  if (dbEnabled()) {
    const { listPendingInventoryRequestsForAdventure: listDb } = await db();
    return listDb(adventureId);
  }
  return [...memoryStore().values()]
    .filter((r) => r.adventureId === adventureId && r.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function listPendingInventoryRequestsForCharacter(
  characterId: string
): Promise<InventoryItemRequest[]> {
  if (dbEnabled()) {
    const { listPendingInventoryRequestsForCharacter: listDb } = await db();
    return listDb(characterId);
  }
  return [...memoryStore().values()]
    .filter((r) => r.characterId === characterId && r.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function createInventoryItemRequest(input: {
  characterId: string;
  adventureId: string;
  roomId?: string | null;
  requesterUserId: string;
  packId: string;
  entryId: string;
  quantity: number;
  mergeExisting: boolean;
  instanceId: string | null;
  itemLabel: string;
}): Promise<InventoryItemRequest> {
  if (dbEnabled()) {
    const { insertInventoryItemRequest } = await db();
    const created = await insertInventoryItemRequest(input);
    if (created) return created;
  }

  const now = Date.now();
  const request: InventoryItemRequest = {
    id: newInventoryItemRequestId(),
    characterId: input.characterId,
    adventureId: input.adventureId,
    roomId: input.roomId ?? null,
    requesterUserId: input.requesterUserId,
    packId: input.packId,
    entryId: input.entryId,
    quantity: input.quantity,
    mergeExisting: input.mergeExisting,
    instanceId: input.instanceId,
    itemLabel: input.itemLabel,
    status: "pending",
    gmUserId: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryStore().set(request.id, request);
  return request;
}

export async function resolveInventoryItemRequestByGm(
  requestId: string,
  action: "approve" | "reject",
  gmUserId: string
): Promise<InventoryItemRequest | null> {
  let updated: InventoryItemRequest | null = null;

  if (dbEnabled()) {
    const { resolveInventoryItemRequest } = await db();
    updated = await resolveInventoryItemRequest(requestId, action, gmUserId);
  }

  if (!updated) {
    const store = memoryStore();
    const current = store.get(requestId);
    if (!current || current.status !== "pending") return null;
    const now = Date.now();
    updated = {
      ...current,
      status: action === "approve" ? "approved" : "rejected",
      gmUserId,
      resolvedAt: now,
      updatedAt: now,
    };
    store.set(requestId, updated);
  }

  if (updated && action === "approve") {
    await applyApprovedInventory(updated);
  }

  return updated;
}

export async function approveAllPendingInventoryRequestsForAdventure(
  adventureId: string,
  gmUserId: string
): Promise<{ approved: number; requests: InventoryItemRequest[] }> {
  const pending = await listPendingInventoryRequestsForAdventure(adventureId);
  const approved: InventoryItemRequest[] = [];

  for (const request of pending) {
    const resolved = await resolveInventoryItemRequestByGm(request.id, "approve", gmUserId);
    if (resolved) approved.push(resolved);
  }

  return { approved: approved.length, requests: approved };
}
