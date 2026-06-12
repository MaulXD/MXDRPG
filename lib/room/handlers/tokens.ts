import { prepareCombatToken, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { applyConditionPaRules, applyPaSpend } from "@/lib/combat/pa-turn";
import type { Axial } from "@/lib/vtt/hex-math";
import { canMoveToken, type MoveMode } from "@/lib/vtt/movement";
import { createMonsterTokenFromEntryId } from "@/lib/vtt/monsters";
import { nextMonsterDisplayName } from "@/lib/vtt/monster-display-name";
import { activeTokenId } from "../combat";
import { removeTokenFromCombatOrder } from "../combat-order";
import { ensureCombatActiveHasPa } from "./combat-turn";
import { createPlayerTokenFromActor } from "@/lib/vtt/player-token";
import type { MonsterSpawnOptions } from "@/lib/vtt/monster-scaling";
import type { BattleToken } from "@/lib/vtt/types";
import { canActOnCombatTurn, TURN_WAIT_MSG } from "@/lib/combat/turn-guard";
import { canAnchorTokenAt } from "@/lib/vtt/dungeon-layer";
import { revealAxial } from "@/lib/vtt/fog-of-war";
import { characterBelongsToAdventure } from "@/lib/character/adventure-bind";
import { ensureAdventureActorInRoom } from "@/lib/room/adventure-actors";
import { maybeRecordCombatUndo } from "../combat-undo";
import { normalizeImageDataUrl } from "@/lib/media/image-normalize";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";

export async function updateRoomToken(
  roomId: string,
  tokenId: string,
  patch: Partial<BattleToken>
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return null;

  const safePatch = { ...patch };
  if ("imageUrl" in safePatch) {
    safePatch.imageUrl =
      (await normalizeImageDataUrl(safePatch.imageUrl, { maxEdge: 512 })) ?? undefined;
  }

  const tokens = [...room.scene.tokens];
  const current = tokens[idx];
  let next: BattleToken = applyConditionPaRules({ ...current, ...safePatch, id: current.id });

  if (next.linked && next.actorId) {
    const actor = room.actors[next.actorId];
    if (actor) {
      room.actors[next.actorId] = {
        ...actor,
        resources: {
          ...actor.resources,
          pontosAcao: {
            ...actor.resources.pontosAcao,
            value: next.pa,
          },
        },
        revision: actor.revision + 1,
      };
    }
  }

  tokens[idx] = next;
  room.scene = { ...room.scene, tokens };

  return toSnapshot(await persistRoom(roomId, room));
}

export type MoveExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export async function moveRoomToken(
  roomId: string,
  tokenId: string,
  target: Axial,
  mode: MoveMode,
  opts: { activeTokenId?: string | null; bypassTurn?: boolean } = {}
): Promise<MoveExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };

  let token = prepareCombatToken(room, room.scene.tokens[idx]);
  const activeId = opts.activeTokenId ?? activeTokenId(room.combat);
  const combatHasOrder = Boolean(room.combat?.order?.length);
  if (
    !canActOnCombatTurn(token.id, {
      activeTokenId: activeId,
      bypassTurn: opts.bypassTurn,
      combatHasOrder,
    })
  ) {
    return { ok: false, error: TURN_WAIT_MSG };
  }

  const actorRacas: Record<string, string | undefined> = {};
  for (const [id, actor] of Object.entries(room.actors)) {
    actorRacas[id] = actor.identity.raca;
  }
  const actor = token.linked && token.actorId ? room.actors[token.actorId] : null;
  const movePaOpts = {
    ...(actor ? { freeBasicMovePa: paTurnRulesForActor(actor).freeBasicMovePa } : {}),
    ...(opts.bypassTurn ? { gmBypass: true as const } : {}),
  };
  const check = canMoveToken(
    token,
    target,
    mode,
    {
      tokens: room.scene.tokens,
      gridRadius: room.scene.gridRadius,
      actorRacas,
      dungeonObjects: room.scene.dungeonObjects,
    },
    movePaOpts
  );
  if (!check.ok) return { ok: false, error: check.reason ?? "Movimento inválido" };

  maybeRecordCombatUndo(room, {
    tokenId: token.id,
    tokenName: token.name,
    kind: "move",
    summary: `Movimento (${mode === "run" ? "corrida" : "caminhada"})`,
    bypassTurn: opts.bypassTurn,
  });

  let moved: BattleToken = {
    ...token,
    axial: target,
    movementSpentHex: opts.bypassTurn ? token.movementSpentHex ?? 0 : check.nextSpent,
  };
  if (!opts.bypassTurn) {
    if (check.paCost > 0) {
      moved = applyPaSpend(moved, check.paCost);
    }
    if (
      movePaOpts.freeBasicMovePa &&
      (check.rawPaCost ?? check.paCost) > check.paCost
    ) {
      moved = { ...moved, peaoFreeMoveUsed: true };
    }
  }

  const tokens = [...room.scene.tokens];
  tokens[idx] = moved;
  let scene = { ...room.scene, tokens };
  if (scene.fogEnabled) {
    scene = revealAxial(scene, target);
  }
  room.scene = scene;
  syncActorPaFromToken(room, moved);
  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated) };
}

export type SpawnExecuteResult =
  | { ok: true; snapshot: RoomSnapshot; tokenId: string }
  | { ok: false; error: string };

export async function spawnRoomMonster(
  roomId: string,
  monsterEntryId: string,
  axial: Axial,
  options?: MonsterSpawnOptions
): Promise<SpawnExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const token = createMonsterTokenFromEntryId(monsterEntryId, axial, options);
  if (!token) return { ok: false, error: "Monstro não encontrado no compêndio" };

  token.name = nextMonsterDisplayName(room.scene.tokens, token.name);

  if (!canAnchorTokenAt(room.scene, axial, { token })) {
    return { ok: false, error: "Hex bloqueado ou ocupado" };
  }

  room.scene = {
    ...room.scene,
    tokens: [...room.scene.tokens, token],
  };

  if (room.combat?.order) {
    room.combat = {
      ...room.combat,
      order: [...room.combat.order, token.id],
    };
    ensureCombatActiveHasPa(room);
  }

  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated), tokenId: token.id };
}

/** Mestre: move token para qualquer hex livre, sem PA nem turno. */
export async function repositionRoomToken(
  roomId: string,
  tokenId: string,
  target: Axial
): Promise<MoveExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };

  const mover = room.scene.tokens[idx];
  if (!canAnchorTokenAt(room.scene, target, { exceptTokenId: tokenId, token: mover })) {
    return { ok: false, error: "Hex bloqueado, fora do tabuleiro ou ocupado" };
  }

  const tokens = [...room.scene.tokens];
  tokens[idx] = { ...tokens[idx], axial: target };
  room.scene = { ...room.scene, tokens };

  if (room.combat?.notices?.length) {
    room.combat = { ...room.combat, notices: [] };
  }

  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated) };
}

/** Jogador ou mestre: coloca ficha no hex (move token existente ou cria um novo). */
export async function placeRoomActorOnHex(
  roomId: string,
  actorId: string,
  target: Axial
): Promise<SpawnExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const actor = room.actors[actorId];
  if (!actor) return { ok: false, error: "Personagem não está nesta aventura" };
  const adventureId = room.adventureId ?? roomId;
  if (!characterBelongsToAdventure(actor, adventureId)) {
    return { ok: false, error: "Esta ficha pertence a outra aventura" };
  }

  const actorRacas = { [actorId]: actor.identity.raca };
  const existing = room.scene.tokens.find(
    (t) => t.linked && t.actorId === actorId
  );
  if (existing) {
    if (
      !canAnchorTokenAt(room.scene, target, {
        exceptTokenId: existing.id,
        token: existing,
        actorRacas,
      })
    ) {
      return { ok: false, error: "Hex bloqueado, fora do tabuleiro ou ocupado" };
    }
    const tokens = room.scene.tokens.map((t) =>
      t.id === existing.id ? { ...t, axial: target } : t
    );
    room.scene = { ...room.scene, tokens };
    const updated = await persistRoom(roomId, room);
    return { ok: true, snapshot: toSnapshot(updated), tokenId: existing.id };
  }

  const token = createPlayerTokenFromActor(actor, target);
  if (!canAnchorTokenAt(room.scene, target, { token, actorRacas })) {
    return { ok: false, error: "Hex bloqueado, fora do tabuleiro ou ocupado" };
  }
  room.scene = {
    ...room.scene,
    tokens: [...room.scene.tokens, token],
  };
  if (room.combat?.order) {
    room.combat = {
      ...room.combat,
      order: [...room.combat.order, token.id],
    };
  }

  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated), tokenId: token.id };
}

export type RemoveTokenResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

/** Mestre: remove token do mapa (ficha do ator permanece na aventura). */
export async function removeRoomToken(
  roomId: string,
  tokenId: string
): Promise<RemoveTokenResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };

  const removed = room.scene.tokens[idx];
  const preserveActorId =
    removed.linked && removed.actorId ? removed.actorId : null;

  if (room.combat?.order?.length) {
    const prevActiveId = activeTokenId(room.combat);
    if (prevActiveId === tokenId) {
      return {
        ok: false,
        error: "Este token está na vez — passe o turno antes de remover do mapa",
      };
    }
  }

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.filter((t) => t.id !== tokenId),
  };

  if (room.combat?.order?.length) {
    removeTokenFromCombatOrder(room, tokenId);
  }

  let updated = await persistRoom(roomId, room);

  if (preserveActorId && !updated.actors[preserveActorId]) {
    const repaired = await ensureAdventureActorInRoom(roomId, preserveActorId);
    if (repaired) updated = repaired;
  }

  return { ok: true, snapshot: toSnapshot(updated) };
}
