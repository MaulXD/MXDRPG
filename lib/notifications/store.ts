import "server-only";

import { listAdventuresForUser, getAdventure } from "@/lib/adventure/store";
import { sheetEditScopeLabel, sheetEditStatusLabel } from "@/lib/character/sheet-edit-request";
import { listPendingSheetEditRequests } from "@/lib/character/sheet-edit-request-store";
import { resolveCharacter } from "@/lib/character/characters";
import { listPendingJoinRequestsForOwner } from "@/lib/adventure/join-requests";
import {
  countIncomingFriendRequests,
  listFriendRequests,
  listReceivedMesaInvites,
} from "@/lib/friends/store";
import { dbEnabled } from "@/lib/db/enabled";
import { fetchUserById } from "@/lib/db/users";
import type { NotificationItem } from "@/lib/notifications/types";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinSheetEditRequests: Map<string, import("@/lib/character/sheet-edit-request").SheetEditRequest> | undefined;
}

function sheetMemoryStore() {
  return globalThis.__eldarinSheetEditRequests ?? new Map();
}

async function listPlayerSheetEditNotifications(userId: string): Promise<NotificationItem[]> {
  const adventures = await listAdventuresForUser(userId);
  const items: NotificationItem[] = [];

  for (const adv of adventures) {
    if (adv.isOwner || adv.deletedAt) continue;
    const full = await getAdventure(adv.adventureId);
    if (!full) continue;

    let requests = await import("@/lib/character/sheet-edit-request-store").then((m) =>
      m.listActiveSheetEditRequestsForUser(adv.adventureId, userId)
    );

    if (!dbEnabled()) {
      requests = [...sheetMemoryStore().values()].filter(
        (r) =>
          r.adventureId === adv.adventureId &&
          r.requesterUserId === userId &&
          ["pending", "approved"].includes(r.status)
      );
    } else {
      requests = requests.filter((r) => r.status === "pending" || r.status === "approved");
    }

    for (const r of requests) {
      const character = await resolveCharacter(r.characterId);
      const charName = character?.name ?? "Personagem";
      const isApproved = r.status === "approved";
      items.push({
        id: `sheet-player:${r.id}`,
        type: "sheet_edit_player",
        title: isApproved ? "Edição de ficha aprovada" : "Pedido de edição de ficha",
        body: `${charName} · ${sheetEditScopeLabel(r.scope)} — ${sheetEditStatusLabel(r.status)}`,
        href: isApproved
          ? `/personagem/${r.characterId}/editar`
          : `/mesa/${full.primaryRoomId}`,
        createdAt: r.updatedAt,
        meta: {
          requestId: r.id,
          adventureId: adv.adventureId,
          roomId: full.primaryRoomId,
          characterId: r.characterId,
        },
      });
    }
  }

  return items;
}

async function listGmSheetEditNotifications(ownerId: string): Promise<NotificationItem[]> {
  const adventures = await listAdventuresForUser(ownerId);
  const items: NotificationItem[] = [];

  for (const adv of adventures) {
    if (!adv.isOwner || adv.deletedAt) continue;
    const pending = await listPendingSheetEditRequests(adv.adventureId);
    for (const r of pending) {
      const character = await resolveCharacter(r.characterId);
      const requester = await fetchUserById(r.requesterUserId);
      const requesterName =
        requester?.nickname?.trim() || requester?.name?.trim() || "Jogador";
      items.push({
        id: `sheet-gm:${r.id}`,
        type: "sheet_edit_gm",
        title: "Pedido de edição de ficha",
        body: `${character?.name ?? "Personagem"} (${requesterName}) · ${sheetEditScopeLabel(r.scope)}`,
        href: `/mesa/${adv.primaryRoomId}`,
        createdAt: r.createdAt,
        meta: {
          requestId: r.id,
          adventureId: adv.adventureId,
          roomId: adv.primaryRoomId,
          characterId: r.characterId,
        },
      });
    }
  }

  return items;
}

export async function listNotificationsForUser(userId: string): Promise<NotificationItem[]> {
  const items: NotificationItem[] = [];

  const { incoming } = await listFriendRequests(userId);
  for (const req of incoming) {
    items.push({
      id: `friend:${req.id}`,
      type: "friend_request",
      title: "Pedido de amizade",
      body: `${req.fromDisplayName} quer ser seu amigo`,
      href: "/amigos",
      createdAt: req.createdAt,
      meta: {
        requestId: req.id,
        fromUserId: req.fromUserId,
        fromDisplayName: req.fromDisplayName,
        fromAvatarUrl: req.fromAvatarUrl,
        canAccept: true,
        canReject: true,
      },
    });
  }

  const invites = await listReceivedMesaInvites(userId);
  for (const inv of invites) {
    items.push({
      id: `mesa-invite:${inv.id}`,
      type: "mesa_invite",
      title: "Convite de mesa",
      body: `${inv.fromDisplayName} convidou você para ${inv.roomName}`,
      href: inv.inviteUrl,
      createdAt: inv.createdAt,
      meta: {
        inviteId: inv.id,
        adventureId: inv.adventureId,
        roomId: inv.roomId,
        fromUserId: inv.fromUserId,
        fromDisplayName: inv.fromDisplayName,
        fromAvatarUrl: inv.fromAvatarUrl,
        canDismiss: true,
      },
    });
  }

  const [gmEdits, playerEdits, joinReqs] = await Promise.all([
    listGmSheetEditNotifications(userId),
    listPlayerSheetEditNotifications(userId),
    listPendingJoinRequestsForOwner(userId),
  ]);
  items.push(...gmEdits, ...playerEdits);

  for (const jr of joinReqs) {
    items.push({
      id: `join-req:${jr.id}`,
      type: "join_request",
      title: "Pedido para entrar na mesa",
      body: `${jr.userDisplayName} quer entrar em ${jr.adventureName}`,
      href: `/aventura/${jr.adventureId}/configurar`,
      createdAt: jr.createdAt,
      meta: {
        requestId: jr.id,
        adventureId: jr.adventureId,
        roomId: jr.roomId,
        fromUserId: jr.userId,
        fromDisplayName: jr.userDisplayName,
      },
    });
  }

  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function countNotificationsForUser(userId: string): Promise<number> {
  const items = await listNotificationsForUser(userId);
  return items.length;
}

/** Contagem rápida sem enriquecer tudo (amigos + convites). */
export async function countNotificationsQuick(userId: string): Promise<number> {
  const [friendCount, invites, adventures] = await Promise.all([
    countIncomingFriendRequests(userId),
    listReceivedMesaInvites(userId),
    listAdventuresForUser(userId),
  ]);

  let sheetCount = 0;
  for (const adv of adventures) {
    if (adv.deletedAt) continue;
    if (adv.isOwner) {
      sheetCount += (await listPendingSheetEditRequests(adv.adventureId)).length;
    } else {
      const active = await import("@/lib/character/sheet-edit-request-store").then((m) =>
        m.listActiveSheetEditRequestsForUser(adv.adventureId, userId)
      );
      sheetCount += active.filter((r) => r.status === "pending" || r.status === "approved").length;
    }
  }

  const joinCount = (await listPendingJoinRequestsForOwner(userId)).length;
  return friendCount + invites.length + sheetCount + joinCount;
}
