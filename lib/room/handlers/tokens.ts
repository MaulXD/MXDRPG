import { prepareCombatToken, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { applyConditionPaRules, applyPaSpend } from "@/lib/combat/pa-turn";
import type { Axial } from "@/lib/vtt/hex-math";
import { canMoveToken, type MoveMode } from "@/lib/vtt/movement";
import { createMonsterTokenFromEntryId } from "@/lib/vtt/monsters";
import { createPlayerTokenFromActor } from "@/lib/vtt/player-token";
import { axialDistance } from "@/lib/vtt/hex-math";
import type { MonsterSpawnOptions } from "@/lib/vtt/monster-scaling";
import type { BattleToken } from "@/lib/vtt/types";
import { activeTokenId } from "../combat";
import { revealAxial } from "@/lib/vtt/fog-of-war";
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

  const tokens = [...room.scene.tokens];
  const current = tokens[idx];
  let next: BattleToken = applyConditionPaRules({ ...current, ...patch, id: current.id });

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
  if (activeId && token.id !== activeId && !opts.bypassTurn) {
    return { ok: false, error: "Aguarde seu turno na iniciativa" };
  }

  const actorRacas: Record<string, string | undefined> = {};
  for (const [id, actor] of Object.entries(room.actors)) {
    actorRacas[id] = actor.identity.raca;
  }
  const actor = token.linked && token.actorId ? room.actors[token.actorId] : null;
  const movePaOpts = actor
    ? { freeBasicMovePa: paTurnRulesForActor(actor).freeBasicMovePa }
    : undefined;
  const check = canMoveToken(
    token,
    target,
    mode,
    {
      tokens: room.scene.tokens,
      gridRadius: room.scene.gridRadius,
      actorRacas,
    },
    movePaOpts
  );
  if (!check.ok) return { ok: false, error: check.reason ?? "Movimento inválido" };

  let moved: BattleToken = {
    ...token,
    axial: target,
    movementSpentHex: check.nextSpent,
  };
  if (check.paCost > 0) {
    moved = applyPaSpend(moved, check.paCost);
  }
  if (
    movePaOpts?.freeBasicMovePa &&
    (check.rawPaCost ?? check.paCost) > check.paCost
  ) {
    moved = { ...moved, peaoFreeMoveUsed: true };
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

function hexOccupied(
  tokens: BattleToken[],
  axial: Axial,
  exceptTokenId?: string
): boolean {
  return tokens.some(
    (t) =>
      t.id !== exceptTokenId && t.axial.q === axial.q && t.axial.r === axial.r
  );
}

function hexInGrid(axial: Axial, gridRadius: number): boolean {
  return axialDistance({ q: 0, r: 0 }, axial) <= gridRadius;
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

  if (!hexInGrid(target, room.scene.gridRadius)) {
    return { ok: false, error: "Fora do tabuleiro" };
  }
  if (hexOccupied(room.scene.tokens, target, tokenId)) {
    return { ok: false, error: "Hex ocupado" };
  }

  const tokens = [...room.scene.tokens];
  tokens[idx] = { ...tokens[idx], axial: target };
  room.scene = { ...room.scene, tokens };

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

  if (!hexInGrid(target, room.scene.gridRadius)) {
    return { ok: false, error: "Fora do tabuleiro" };
  }

  const existing = room.scene.tokens.find(
    (t) => t.linked && t.actorId === actorId
  );
  if (existing) {
    if (hexOccupied(room.scene.tokens, target, existing.id)) {
      return { ok: false, error: "Hex ocupado" };
    }
    const tokens = room.scene.tokens.map((t) =>
      t.id === existing.id ? { ...t, axial: target } : t
    );
    room.scene = { ...room.scene, tokens };
    const updated = await persistRoom(roomId, room);
    return { ok: true, snapshot: toSnapshot(updated), tokenId: existing.id };
  }

  if (hexOccupied(room.scene.tokens, target)) {
    return { ok: false, error: "Hex ocupado" };
  }

  const token = createPlayerTokenFromActor(actor, target);
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
