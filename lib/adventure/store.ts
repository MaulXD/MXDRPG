import "server-only";

import * as dbAdventures from "@/lib/db/adventures";
import { dbEnabled } from "@/lib/db/enabled";
import { resolveInviteCodeForCreate } from "@/lib/adventure/invite-code";
import {
  canRestoreAdventure,
  isAdventureJoinable,
  shouldPurgeAdventure,
} from "./lifecycle";
import type { Adventure, AdventureListItem } from "./types";
import {
  createRoomForAdventure,
  joinRoomMembers,
  syncAdventureMembersToRoom,
} from "@/lib/room/adventure-room";
import { getRoom } from "@/lib/room/store";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinAdventures: Map<string, Adventure> | undefined;
}

function adventures(): Map<string, Adventure> {
  if (!globalThis.__eldarinAdventures) {
    globalThis.__eldarinAdventures = new Map();
  }
  return globalThis.__eldarinAdventures;
}

function slugAdventureId(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "aventura";
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

function ensureDemoAdventure(): Adventure {
  const demo: Adventure = {
    adventureId: "demo",
    ownerId: "usr_demo_mestre",
    name: "Mesa demonstração",
    synopsis: "Aventura pública para testar o VTT.",
    inviteCode: "DEMOELDR",
    memberIds: [],
    primaryRoomId: "demo",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  adventures().set("demo", demo);
  return demo;
}

async function purgeAdventureIfExpired(adv: Adventure): Promise<Adventure | null> {
  if (!shouldPurgeAdventure(adv)) return adv;
  adventures().delete(adv.adventureId);
  if (dbEnabled() && adv.adventureId !== "demo") {
    await dbAdventures.deleteAdventurePermanent(adv.adventureId);
  }
  return null;
}

export async function getAdventure(adventureId: string): Promise<Adventure | null> {
  if (adventureId === "demo") return ensureDemoAdventure();

  const cached = adventures().get(adventureId);
  if (cached) return purgeAdventureIfExpired(cached);

  if (dbEnabled()) {
    const fromDb = await dbAdventures.fetchAdventure(adventureId);
    if (fromDb) {
      adventures().set(adventureId, fromDb);
      return purgeAdventureIfExpired(fromDb);
    }
  }

  const room = await getRoom(adventureId);
  if (room) {
    const inferred: Adventure = {
      adventureId: room.adventureId ?? room.roomId,
      ownerId: room.ownerId,
      name: room.name,
      synopsis: "",
      inviteCode: room.inviteCode,
      memberIds: [...room.memberIds],
      primaryRoomId: room.roomId,
      createdAt: room.updatedAt,
      updatedAt: room.updatedAt,
    };
    adventures().set(inferred.adventureId, inferred);
    return inferred;
  }

  return null;
}

export type CreateAdventureResult =
  | { ok: true; adventure: Adventure }
  | { ok: false; error: string };

export async function createAdventure(
  ownerId: string,
  name: string
): Promise<CreateAdventureResult> {
  const adventureId = slugAdventureId(name);
  const label = name.trim().slice(0, 80) || "Nova aventura";
  const now = Date.now();

  const resolved = await resolveInviteCodeForCreate();
  if ("error" in resolved) {
    return { ok: false, error: resolved.error };
  }
  const inviteCode = resolved.code;

  const adventure: Adventure = {
    adventureId,
    ownerId,
    name: label,
    synopsis: "",
    inviteCode,
    memberIds: [],
    primaryRoomId: adventureId,
    createdAt: now,
    updatedAt: now,
  };

  adventures().set(adventureId, adventure);
  await createRoomForAdventure(adventure);

  if (dbEnabled()) {
    await dbAdventures.saveAdventure(adventure);
  }

  return { ok: true, adventure };
}

/** Vincula jogador à aventura de forma permanente (só adiciona, nunca remove). */
export async function bindPlayerToAdventure(
  adventureId: string,
  userId: string
): Promise<Adventure | null> {
  const adv = await getAdventure(adventureId);
  if (!adv || adv.ownerId === userId) return adv;
  return joinAdventureRecord(adv, userId);
}

/** Reconcilia membro se já tem ficha nesta aventura (vínculo retroativo). */
export async function ensureAdventureMembership(
  adventureId: string,
  userId: string
): Promise<Adventure | null> {
  const adv = await getAdventure(adventureId);
  if (!adv) return null;
  if (adv.ownerId === userId || adv.memberIds.includes(userId)) return adv;

  const { listCharactersForUserInAdventure } = await import("@/lib/character/characters");
  const chars = await listCharactersForUserInAdventure(userId, adventureId);
  if (chars.length === 0) return adv;

  return joinAdventureRecord(adv, userId);
}

export async function joinAdventureByInvite(
  inviteCode: string,
  userId: string
): Promise<Adventure | null> {
  const code = inviteCode.trim().toUpperCase();

  if (dbEnabled()) {
    const fromDb = await dbAdventures.fetchAdventureByInvite(code);
    if (fromDb) {
      if (!isAdventureJoinable(fromDb)) return null;
      return joinAdventureRecord(fromDb, userId);
    }
  }

  for (const adv of adventures().values()) {
    if (adv.inviteCode.toUpperCase() === code) {
      if (!isAdventureJoinable(adv)) return null;
      return joinAdventureRecord(adv, userId);
    }
  }

  const { joinRoomByInviteLegacy } = await import("@/lib/room/handlers/room-lifecycle");
  const room = await joinRoomByInviteLegacy(code, userId);
  if (!room) return null;
  return getAdventure(room.adventureId ?? room.roomId);
}

async function joinAdventureRecord(adventure: Adventure, userId: string): Promise<Adventure> {
  if (adventure.ownerId !== userId && !adventure.memberIds.includes(userId)) {
    adventure.memberIds.push(userId);
    adventure.updatedAt = Date.now();
  }
  adventures().set(adventure.adventureId, adventure);
  await joinRoomMembers(adventure.primaryRoomId, userId);
  await syncAdventureMembersToRoom(adventure);
  if (dbEnabled() && adventure.adventureId !== "demo") {
    await dbAdventures.saveAdventure(adventure);
  }
  const { syncAdventureActorsForRoom } = await import("@/lib/room/adventure-actors");
  await syncAdventureActorsForRoom(adventure.primaryRoomId);
  return adventure;
}

function toListItem(adv: Adventure, userId: string): AdventureListItem {
  return {
    adventureId: adv.adventureId,
    name: adv.name,
    ownerId: adv.ownerId,
    inviteCode: adv.inviteCode,
    primaryRoomId: adv.primaryRoomId,
    isOwner: adv.ownerId === userId,
    updatedAt: adv.updatedAt,
    deletedAt: adv.deletedAt ?? null,
  };
}

export async function listAdventuresForUser(userId: string): Promise<AdventureListItem[]> {
  const seen = new Set<string>();
  const out: AdventureListItem[] = [];

  if (dbEnabled()) {
    const fromDb = await dbAdventures.listAdventuresForOwnerOrMember(userId);
    for (const item of fromDb) {
      const full = await getAdventure(item.adventureId);
      if (!full) continue;
      adventures().set(full.adventureId, full);
      seen.add(full.adventureId);
      out.push(toListItem(full, userId));
    }
  }

  for (const adv of adventures().values()) {
    if (adv.ownerId !== userId && !adv.memberIds.includes(userId)) continue;
    if (seen.has(adv.adventureId)) continue;
    if (shouldPurgeAdventure(adv)) continue;
    out.push(toListItem(adv, userId));
    seen.add(adv.adventureId);
  }

  if (!out.some((a) => a.adventureId === "demo")) {
    const demo = ensureDemoAdventure();
    out.push({
      adventureId: demo.adventureId,
      name: demo.name,
      ownerId: demo.ownerId,
      inviteCode: demo.inviteCode,
      primaryRoomId: demo.primaryRoomId,
      isOwner: demo.ownerId === userId,
      updatedAt: demo.updatedAt,
    });
  }

  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export type AdventureMutationResult =
  | { ok: true; adventure: Adventure }
  | { ok: false; error: string };

export async function softDeleteAdventure(
  adventureId: string,
  ownerId: string
): Promise<AdventureMutationResult> {
  if (adventureId === "demo") return { ok: false, error: "A demo não pode ser excluída" };
  const adv = await getAdventure(adventureId);
  if (!adv) return { ok: false, error: "Mesa não encontrada" };
  if (adv.ownerId !== ownerId) return { ok: false, error: "Só o mestre pode excluir a mesa" };
  if (adv.deletedAt) return { ok: false, error: "Mesa já está na lixeira" };

  adv.deletedAt = Date.now();
  adv.updatedAt = Date.now();
  adventures().set(adventureId, adv);
  if (dbEnabled()) await dbAdventures.saveAdventure(adv);
  return { ok: true, adventure: adv };
}

export async function restoreAdventure(
  adventureId: string,
  ownerId: string
): Promise<AdventureMutationResult> {
  const adv = await getAdventure(adventureId);
  if (!adv) return { ok: false, error: "Mesa não encontrada ou prazo de restauração expirou" };
  if (adv.ownerId !== ownerId) return { ok: false, error: "Só o mestre pode restaurar" };
  if (!adv.deletedAt) return { ok: false, error: "Mesa não está excluída" };
  if (!canRestoreAdventure(adv)) {
    await purgeAdventureIfExpired(adv);
    return { ok: false, error: "Prazo de 30 dias para restaurar expirou" };
  }

  adv.deletedAt = null;
  adv.updatedAt = Date.now();
  adventures().set(adventureId, adv);
  if (dbEnabled()) await dbAdventures.saveAdventure(adv);
  return { ok: true, adventure: adv };
}

export async function updateAdventureMeta(
  adventureId: string,
  patch: Partial<Pick<Adventure, "name" | "synopsis">>
): Promise<Adventure | null> {
  const adv = await getAdventure(adventureId);
  if (!adv) return null;
  if (patch.name?.trim()) adv.name = patch.name.trim().slice(0, 80);
  if (patch.synopsis !== undefined) adv.synopsis = patch.synopsis.trim().slice(0, 2000);
  adv.updatedAt = Date.now();
  adventures().set(adventureId, adv);
  if (dbEnabled() && adventureId !== "demo") await dbAdventures.saveAdventure(adv);
  const room = await getRoom(adv.primaryRoomId);
  if (room && patch.name?.trim()) {
    room.name = adv.name;
    room.scene = { ...room.scene, name: adv.name };
    const { persistRoom } = await import("@/lib/room/internal/registry");
    await persistRoom(adv.primaryRoomId, room);
  }
  return adv;
}
