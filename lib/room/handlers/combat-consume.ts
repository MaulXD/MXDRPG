import {
  canUseConsumable,
  listActorConsumables,
  resolveConsumableUse,
  type ActorConsumable,
} from "@/lib/combat/consumables";
import { prepareCombatToken, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { applyPaSpend } from "@/lib/combat/pa-turn";
import { activeTokenId } from "../combat";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot, RoomState } from "../types";
import type { ChatMessage } from "../chat";
import { patchTokenVitals } from "@/lib/vtt/token-hp-display";

export type ConsumeExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export async function executeRoomConsume(
  roomId: string,
  tokenId: string,
  instanceId: string,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: { bypassTurn?: boolean } = {}
): Promise<ConsumeExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  let token = room.scene.tokens.find((t) => t.id === tokenId);
  if (!token) return { ok: false, error: "Token não encontrado" };
  const actorId = token.actorId;
  if (!token.linked || !actorId) {
    return { ok: false, error: "Só personagens com ficha podem usar consumíveis" };
  }

  const actor = room.actors[actorId];
  if (!actor) return { ok: false, error: "Ficha não encontrada" };

  const consumables = listActorConsumables(actor);
  const item = consumables.find((c) => c.instanceId === instanceId);
  if (!item) return { ok: false, error: "Poção não disponível no inventário" };

  const turnCheck = canUseConsumable(
    token,
    room.combat,
    activeTokenId(room.combat),
    opts.bypassTurn
  );
  if (!turnCheck.ok) return { ok: false, error: turnCheck.reason };

  token = prepareCombatToken(room, token);
  const turnRecheck = canUseConsumable(
    token,
    room.combat,
    activeTokenId(room.combat),
    opts.bypassTurn
  );
  if (!turnRecheck.ok) return { ok: false, error: turnRecheck.reason };

  let resolved;
  try {
    resolved = resolveConsumableUse(token, actor, item);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao usar item" };
  }

  const spent = applyPaSpend(token, resolved.paCost, { actionKind: "ability" });
  syncActorPaFromToken(room, spent);

  const healed = patchTokenVitals(
    { ...spent, ...resolved.tokenPatch },
    { vida: resolved.hpAfter }
  );

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => (t.id === tokenId ? healed : t)),
  };

  room.actors[actorId] = {
    ...actor,
    inventory: resolved.inventory,
    resources: {
      ...actor.resources,
      vida: { ...actor.resources.vida, value: resolved.hpAfter },
    },
    revision: actor.revision + 1,
  };

  appendRoomChatMessage(room, {
    ...author,
    kind: "combat",
    text: resolved.summary,
    combat: {
      attackerTokenId: tokenId,
      defenderTokenId: tokenId,
      actionKind: "ability",
      weaponName: item.name,
      resolution: "attack",
      damageTotal: null,
      attackerHeal: resolved.healRoll?.total,
      defenderHpBefore: resolved.hpBefore,
      defenderHpAfter: resolved.hpAfter,
      detail: resolved.detail,
      hit: true,
    },
  });

  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}

export function consumablesForActor(actorId: string, room: RoomState): ActorConsumable[] {
  const actor = room.actors[actorId];
  if (!actor) return [];
  return listActorConsumables(actor);
}
