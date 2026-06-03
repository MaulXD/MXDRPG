import {
  formatAttackChatDetail,
  listTokenCombatActions,
  resolveCombatAction,
  resolveTokenAttack,
} from "@/lib/combat/attack";
import {
  canAbilityTarget,
  canUseAbility,
  resolveAbilityUse,
  type AbilityResolution,
} from "@/lib/combat/ability";
import { abilityFromEntry } from "@/lib/combat/compendium-actions";
import { getEntry } from "@/lib/compendium/registry";
import { formatSaveChatDetail, resolveSaveSpell } from "@/lib/combat/spell";
import {
  formatAreaSpellChatDetail,
  resolveAreaSpell,
} from "@/lib/combat/area-spell";
import type { CombatActionRequest } from "@/lib/combat/types";
import { applyLevelUp, canLevelUp, type LevelUpChoices } from "@/lib/character/level-up";
import { applyIdentityPatch, type IdentityPatch } from "@/lib/character/identity";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import { validateImageDataUrl } from "@/lib/media/image-data-url";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import type { Axial } from "@/lib/vtt/hex-math";
import { canMoveToken, resetTokenMovement, type MoveMode } from "@/lib/vtt/movement";
import { createMonsterTokenFromEntryId } from "@/lib/vtt/monsters";
import type { MonsterSpawnOptions } from "@/lib/vtt/monster-scaling";
import type { BattleToken } from "@/lib/vtt/types";
import { createChatId, welcomeChat, type ChatMessage } from "./chat";
import { emptyCombat, nextTurn, rollInitiative, activeTokenId } from "./combat";
import { createDemoRoom, syncLinkedTokens } from "./sync";
import type { RoomActor, RoomSnapshot, RoomState } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRooms: Map<string, RoomState> | undefined;
}

function rooms(): Map<string, RoomState> {
  if (!globalThis.__eldarinRooms) {
    globalThis.__eldarinRooms = new Map([["demo", createDemoRoom()]]);
  }
  return globalThis.__eldarinRooms;
}

function snapshot(state: RoomState): RoomSnapshot {
  return {
    roomId: state.roomId,
    scene: state.scene,
    actors: state.actors,
    combat: state.combat,
    chat: state.chat,
    revision: state.revision,
  };
}

function bump(state: RoomState): RoomState {
  const scene = syncLinkedTokens(state.scene, state.actors);
  return {
    ...state,
    scene,
    revision: state.revision + 1,
    updatedAt: Date.now(),
  };
}

function sanitizeActorPatch(patch: Partial<CharacterSheet> & { identityPatch?: IdentityPatch }): Partial<CharacterSheet> {
  const out: Partial<CharacterSheet> = {};
  if ("portraitUrl" in patch) {
    out.portraitUrl = validateImageDataUrl(patch.portraitUrl);
  }
  if ("tokenImageUrl" in patch) {
    out.tokenImageUrl = validateImageDataUrl(patch.tokenImageUrl);
  }
  if ("portraitFocus" in patch) {
    out.portraitFocus = sanitizePortraitFocus(patch.portraitFocus);
  }
  if ("name" in patch && typeof patch.name === "string" && patch.name.trim()) {
    out.name = patch.name.trim().slice(0, 80);
  }
  if ("biography" in patch && typeof patch.biography === "string") {
    out.biography = patch.biography.slice(0, 2000);
  }
  if ("combatLoadout" in patch) {
    const loadout = patch.combatLoadout;
    if (loadout === null) {
      out.combatLoadout = null;
    } else if (
      loadout &&
      typeof loadout === "object" &&
      (loadout.packId === "armas" || loadout.packId === "magias" || loadout.packId === "habilidades") &&
      typeof loadout.entryId === "string"
    ) {
      out.combatLoadout = { packId: loadout.packId, entryId: loadout.entryId.slice(0, 120) };
    }
  }
  return out;
}

function mergeIdentityPatch(current: CharacterSheet, identityPatch?: IdentityPatch): CharacterSheet {
  if (!identityPatch) return current;
  return applyIdentityPatch(current, identityPatch);
}

export function getRoom(roomId: string): RoomState | null {
  const map = rooms();
  if (!map.has(roomId) && roomId === "demo") {
    map.set("demo", createDemoRoom());
  }
  const room = map.get(roomId) ?? null;
  if (room && !room.combat) {
    room.combat = emptyCombat(room.scene.tokens);
  }
  if (room && !room.chat) {
    room.chat = [welcomeChat()];
  }
  return room;
}

export function getRoomSnapshot(roomId: string): RoomSnapshot | null {
  const room = getRoom(roomId);
  return room ? snapshot(room) : null;
}

export function getRoomActor(roomId: string, actorId: string): RoomActor | null {
  return getRoom(roomId)?.actors[actorId] ?? null;
}

export function updateRoomActor(
  roomId: string,
  actorId: string,
  patch: Partial<CharacterSheet> & { identityPatch?: IdentityPatch }
): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const current = room.actors[actorId];
  if (!current) return null;

  const safe = sanitizeActorPatch(patch);
  const hasIdentity = Boolean(patch.identityPatch);
  if (!Object.keys(safe).length && !hasIdentity) return snapshot(room);

  let next: RoomActor = {
    ...current,
    ...safe,
    id: current.id,
    ownerId: current.ownerId,
    revision: current.revision + 1,
  };

  if (patch.identityPatch) {
    next = { ...mergeIdentityPatch(next, patch.identityPatch), revision: current.revision + 1 };
  }

  next = { ...normalizeCharacter(next), revision: current.revision + 1 };
  room.actors[actorId] = next;
  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}

export function levelUpRoomActor(
  roomId: string,
  actorId: string,
  choices: LevelUpChoices = {}
): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const current = room.actors[actorId];
  if (!current) return null;

  if (!canLevelUp(current)) return null;

  const leveled = normalizeCharacter(applyLevelUp(current, choices));
  room.actors[actorId] = { ...leveled, revision: current.revision + 1 };

  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}

export function updateRoomToken(
  roomId: string,
  tokenId: string,
  patch: Partial<BattleToken>
): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return null;

  const tokens = [...room.scene.tokens];
  const current = tokens[idx];
  const next: BattleToken = { ...current, ...patch, id: current.id };

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

  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}

function resetAllTokenMovement(room: RoomState): void {
  const activeId = room.combat.order[room.combat.activeIndex] ?? null;
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      const reset = resetTokenMovement(t);
      const cleared =
        t.id === activeId && (t.defesaBonus ?? 0) > 0
          ? { ...reset, defesaBonus: undefined, defesaBuffSource: undefined }
          : reset;
      if (t.linked && t.actorId && room.actors[t.actorId]) {
        const actor = room.actors[t.actorId];
        room.actors[t.actorId] = {
          ...actor,
          resources: {
            ...actor.resources,
            pontosAcao: {
              value: actor.resources.pontosAcao.max,
              max: actor.resources.pontosAcao.max,
            },
          },
          revision: actor.revision + 1,
        };
        return { ...cleared, pa: actor.resources.pontosAcao.max };
      }
      return { ...cleared, pa: t.paMax };
    }),
  };
}

export type MoveExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export function moveRoomToken(
  roomId: string,
  tokenId: string,
  target: Axial,
  mode: MoveMode,
  opts: { activeTokenId?: string | null; bypassTurn?: boolean } = {}
): MoveExecuteResult {
  const room = getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };

  const token = room.scene.tokens[idx];
  const activeId = opts.activeTokenId ?? activeTokenId(room.combat);
  if (activeId && token.id !== activeId && !opts.bypassTurn) {
    return { ok: false, error: "Aguarde seu turno na iniciativa" };
  }

  const check = canMoveToken(token, target, mode);
  if (!check.ok) return { ok: false, error: check.reason ?? "Movimento inválido" };

  const tokens = [...room.scene.tokens];
  tokens[idx] = {
    ...token,
    axial: target,
    pa: check.nextPa,
    movementSpentHex: check.nextSpent,
  };

  if (token.linked && token.actorId && room.actors[token.actorId]) {
    const actor = room.actors[token.actorId];
    room.actors[token.actorId] = {
      ...actor,
      resources: {
        ...actor.resources,
        pontosAcao: { ...actor.resources.pontosAcao, value: check.nextPa },
      },
      revision: actor.revision + 1,
    };
  }

  room.scene = { ...room.scene, tokens };
  const updated = bump(room);
  rooms().set(roomId, updated);
  return { ok: true, snapshot: snapshot(updated) };
}

export type SpawnExecuteResult =
  | { ok: true; snapshot: RoomSnapshot; tokenId: string }
  | { ok: false; error: string };

export function spawnRoomMonster(
  roomId: string,
  monsterEntryId: string,
  axial: Axial,
  options?: MonsterSpawnOptions
): SpawnExecuteResult {
  const room = getRoom(roomId);
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

  const updated = bump(room);
  rooms().set(roomId, updated);
  return { ok: true, snapshot: snapshot(updated), tokenId: token.id };
}

export function rollRoomInitiative(roomId: string): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const { order, scores } = rollInitiative(room);
  room.combat = { order, activeIndex: 0, round: 1 };
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => ({
      ...t,
      initiative: scores[t.id] ?? t.initiative,
    })),
  };
  resetAllTokenMovement(room);

  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}

export function advanceRoomTurn(roomId: string): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  room.combat = nextTurn(room.combat);
  resetAllTokenMovement(room);

  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}

export function setRoomCombatOrder(
  roomId: string,
  order: string[]
): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const ids = new Set(room.scene.tokens.map((t) => t.id));
  const valid = order.filter((id) => ids.has(id));
  for (const t of room.scene.tokens) {
    if (!valid.includes(t.id)) valid.push(t.id);
  }

  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}

export type AttackExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export function executeRoomAttack(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): AttackExecuteResult {
  const room = getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  const defender = room.scene.tokens.find((t) => t.id === defenderTokenId);
  if (!attacker || !defender) return { ok: false, error: "Token não encontrado" };

  if (!attacker.linked || !attacker.actorId) {
    if (!attacker.monsterEntryId) {
      return { ok: false, error: "Atacante sem ficha ou monstro" };
    }
  }

  const actor =
    attacker.linked && attacker.actorId ? room.actors[attacker.actorId] ?? null : null;
  if (attacker.linked && attacker.actorId && !actor) {
    return { ok: false, error: "Ficha do atacante não encontrada" };
  }

  const action = actor
    ? resolveCombatAction(actor, opts)
    : (listTokenCombatActions(attacker, null).find(
        (a) => opts.packId && a.packId === opts.packId && a.entryId === opts.entryId
      ) ?? listTokenCombatActions(attacker, null)[0]);

  if (action.kind === "ability") {
    return executeRoomAbility(roomId, attackerTokenId, defenderTokenId, author, opts);
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
  };

  const defenderActor =
    defender.linked && defender.actorId ? room.actors[defender.actorId] ?? null : null;

  if (action.resolution === "save" && actor) {
    let saveResult;
    try {
      saveResult = resolveSaveSpell(attacker, defender, actor, defenderActor, action, turn);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Magia inválida" };
    }

    const newAttackerPa = Math.max(0, attacker.pa - saveResult.paCost);
    room.scene = {
      ...room.scene,
      tokens: room.scene.tokens.map((t) => {
        if (t.id === attackerTokenId) return { ...t, pa: newAttackerPa };
        if (t.id === defenderTokenId && t.vidaMax != null) {
          return { ...t, vida: saveResult.defenderHpAfter };
        }
        return t;
      }),
    };

    if (attacker.actorId && room.actors[attacker.actorId]) {
      const a = room.actors[attacker.actorId];
      room.actors[attacker.actorId] = {
        ...a,
        resources: {
          ...a.resources,
          pontosAcao: { ...a.resources.pontosAcao, value: newAttackerPa },
        },
        revision: a.revision + 1,
      };
    }

    if (defender.linked && defender.actorId && room.actors[defender.actorId]) {
      const d = room.actors[defender.actorId];
      room.actors[defender.actorId] = {
        ...d,
        resources: {
          ...d.resources,
          vida: { ...d.resources.vida, value: saveResult.defenderHpAfter },
        },
        revision: d.revision + 1,
      };
    }

    addRoomChatMessage(roomId, {
      ...author,
      kind: "combat",
      text: saveResult.summary,
      combat: {
        attackerTokenId: saveResult.attackerTokenId,
        defenderTokenId: saveResult.defenderTokenId,
        actionKind: "spell",
        weaponName: saveResult.weaponName,
        resolution: "save",
        saveNatural: saveResult.save.natural,
        saveTotal: saveResult.save.total,
        saveDc: saveResult.save.dc,
        saveSuccess: saveResult.save.success,
        saveAttribute: saveResult.save.attributeLabel,
        saveRollMode: saveResult.save.rollMode,
        damageTotal: saveResult.damage.total,
        defenderHpBefore: saveResult.defenderHpBefore,
        defenderHpAfter: saveResult.defenderHpAfter,
        detail: formatSaveChatDetail(saveResult),
      },
    });

    const updated = bump(room);
    rooms().set(roomId, updated);
    return { ok: true, snapshot: snapshot(updated) };
  }

  let results;
  try {
    results = resolveTokenAttack(attacker, defender, action, actor, turn, undefined, room.scene.tokens);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ataque inválido" };
  }

  const attackResults = Array.isArray(results) ? results : [results];
  const paCost = action.paCost;
  const finalHp = attackResults[attackResults.length - 1].defenderHpAfter;
  const newAttackerPa = Math.max(0, attacker.pa - paCost);

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === attackerTokenId) return { ...t, pa: newAttackerPa };
      if (t.id === defenderTokenId && t.vidaMax != null) return { ...t, vida: finalHp };
      return t;
    }),
  };

  if (attacker.actorId && room.actors[attacker.actorId]) {
    const a = room.actors[attacker.actorId];
    room.actors[attacker.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        pontosAcao: { ...a.resources.pontosAcao, value: newAttackerPa },
      },
      revision: a.revision + 1,
    };
  }

  if (defender.linked && defender.actorId && room.actors[defender.actorId]) {
    const d = room.actors[defender.actorId];
    room.actors[defender.actorId] = {
      ...d,
      resources: {
        ...d.resources,
        vida: { ...d.resources.vida, value: finalHp },
      },
      revision: d.revision + 1,
    };
  }

  for (const result of attackResults) {
    addRoomChatMessage(roomId, {
      ...author,
      kind: "combat",
      text: result.summary,
      combat: {
        attackerTokenId: result.attackerTokenId,
        defenderTokenId: result.defenderTokenId,
        actionKind: result.actionKind,
        weaponName: result.weaponName,
        resolution: "attack",
        attackNatural: result.attack.natural,
        attackTotal: result.attack.total,
        attackRollMode: result.attack.rollMode,
        defenderAc: result.defenderAc,
        hit: result.hit,
        critical: result.critical,
        criticalFail: result.criticalFail,
        damageTotal: result.damage?.total ?? null,
        defenderHpBefore: result.defenderHpBefore,
        defenderHpAfter: result.defenderHpAfter,
        detail: formatAttackChatDetail(result),
        attackIndex: result.attackIndex,
        attackCount: result.attackCount,
      },
    });
  }

  const updated = bump(room);
  rooms().set(roomId, updated);
  return { ok: true, snapshot: snapshot(updated) };
}

export type AbilityExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

function resolveRoomAbilityAction(
  attacker: BattleToken,
  actor: CharacterSheet | null,
  opts: CombatActionRequest
) {
  if (actor) return resolveCombatAction(actor, opts);
  if (opts.entryId && attacker.monsterEntryId) {
    const entry = getEntry("habilidades", opts.entryId);
    if (entry) {
      const a = abilityFromEntry(entry);
      if (a) return a;
    }
  }
  throw new Error("Ação não é habilidade");
}

function applyAbilityToRoom(
  room: RoomState,
  attackerTokenId: string,
  defenderTokenId: string | null,
  resolved: AbilityResolution,
  actionName: string
): void {
  const newPa = Math.max(
    0,
    (room.scene.tokens.find((t) => t.id === attackerTokenId)?.pa ?? 0) - resolved.paCost
  );

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === attackerTokenId) {
        const base = { ...t, pa: newPa };
        if (resolved.kind === "buff" || resolved.kind === "charge") {
          return { ...base, ...resolved.attackerUpdate };
        }
        if ("attackerUpdate" in resolved && resolved.attackerUpdate) {
          return { ...base, ...resolved.attackerUpdate };
        }
        return base;
      }
      if (defenderTokenId && t.id === defenderTokenId) {
        if (resolved.kind === "heal") {
          return { ...t, vida: resolved.defenderHpAfter };
        }
        if (resolved.kind === "mark" && resolved.defenderUpdate) {
          return { ...t, ...resolved.defenderUpdate };
        }
        if (resolved.kind === "ally_buff" && resolved.defenderUpdate) {
          return { ...t, ...resolved.defenderUpdate };
        }
        if (resolved.kind === "spell_save" && resolved.defenderUpdate) {
          return { ...t, ...resolved.defenderUpdate, vida: resolved.save.defenderHpAfter };
        }
        if (
          (resolved.kind === "attack" || resolved.kind === "spell_strike") &&
          t.vidaMax != null
        ) {
          return { ...t, vida: resolved.attack.defenderHpAfter };
        }
      }
      return t;
    }),
  };

  const attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  if (attacker?.linked && attacker.actorId && room.actors[attacker.actorId]) {
    const a = room.actors[attacker.actorId];
    room.actors[attacker.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        pontosAcao: { ...a.resources.pontosAcao, value: newPa },
      },
      revision: a.revision + 1,
    };
  }

  const defender = defenderTokenId
    ? room.scene.tokens.find((t) => t.id === defenderTokenId)
    : null;
  if (defender?.linked && defender.actorId && room.actors[defender.actorId]) {
    const hp =
      resolved.kind === "heal"
        ? resolved.defenderHpAfter
        : resolved.kind === "attack" || resolved.kind === "spell_strike"
          ? resolved.attack.defenderHpAfter
          : resolved.kind === "spell_save"
            ? resolved.save.defenderHpAfter
            : defender.vida;
    const d = room.actors[defender.actorId];
    room.actors[defender.actorId] = {
      ...d,
      resources: {
        ...d.resources,
        vida: { ...d.resources.vida, value: hp ?? d.resources.vida.value },
      },
      revision: d.revision + 1,
    };
  }
}

export function executeRoomAbility(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string | null,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): AbilityExecuteResult {
  const room = getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  if (!attacker) return { ok: false, error: "Token não encontrado" };

  const actor =
    attacker.linked && attacker.actorId ? room.actors[attacker.actorId] ?? null : null;
  if (attacker.linked && attacker.actorId && !actor) {
    return { ok: false, error: "Ficha não encontrada" };
  }
  if (!actor && !attacker.monsterEntryId) {
    return { ok: false, error: "Habilidade requer ficha linkada ou monstro" };
  }

  let action;
  try {
    action = resolveRoomAbilityAction(attacker, actor, opts);
  } catch {
    return { ok: false, error: "Ação não é habilidade" };
  }
  if (action.kind !== "ability") {
    return { ok: false, error: "Ação não é habilidade" };
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
  };

  if (action.selfTarget) {
    const check = canUseAbility(attacker, action, turn);
    if (!check.ok) return { ok: false, error: check.reason ?? "Habilidade inválida" };
  } else {
    if (!defenderTokenId) return { ok: false, error: "Alvo obrigatório" };
    const defender = room.scene.tokens.find((t) => t.id === defenderTokenId);
    if (!defender) return { ok: false, error: "Alvo não encontrado" };
    const targetCheck = canAbilityTarget(attacker, defender, action, turn);
    if (!targetCheck.ok) return { ok: false, error: targetCheck.reason ?? "Alvo inválido" };
  }

  const defender = defenderTokenId
    ? room.scene.tokens.find((t) => t.id === defenderTokenId) ?? null
    : null;
  const defenderActor =
    defender?.linked && defender.actorId ? room.actors[defender.actorId] ?? null : null;

  let resolved: AbilityResolution;
  try {
    const atkForResolve =
      action.bonusDamageFormula && defender
        ? { ...attacker, bonusDamageFormula: action.bonusDamageFormula }
        : attacker;
    resolved = resolveAbilityUse(
      atkForResolve,
      defender,
      actor,
      action,
      room.scene.tokens,
      turn,
      defenderActor
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Habilidade inválida" };
  }

  applyAbilityToRoom(room, attackerTokenId, defenderTokenId, resolved, action.name);

  const defId = defenderTokenId ?? attackerTokenId;
  if (resolved.kind === "attack" || resolved.kind === "spell_strike") {
    const result = resolved.attack;
    addRoomChatMessage(roomId, {
      ...author,
      kind: "combat",
      text: result.summary,
      combat: {
        attackerTokenId: result.attackerTokenId,
        defenderTokenId: result.defenderTokenId,
        actionKind: "ability",
        weaponName: action.name,
        resolution: "attack",
        attackNatural: result.attack.natural,
        attackTotal: result.attack.total,
        attackRollMode: result.attack.rollMode,
        defenderAc: result.defenderAc,
        hit: result.hit,
        critical: result.critical,
        criticalFail: result.criticalFail,
        damageTotal: result.damage?.total ?? null,
        defenderHpBefore: result.defenderHpBefore,
        defenderHpAfter: result.defenderHpAfter,
        detail: formatAttackChatDetail(result),
      },
    });
  } else if (resolved.kind === "spell_save") {
    const save = resolved.save;
    addRoomChatMessage(roomId, {
      ...author,
      kind: "combat",
      text: save.summary,
      combat: {
        attackerTokenId: save.attackerTokenId,
        defenderTokenId: save.defenderTokenId,
        actionKind: "ability",
        weaponName: action.name,
        resolution: "save",
        saveNatural: save.save.natural,
        saveTotal: save.save.total,
        saveDc: save.save.dc,
        saveSuccess: save.save.success,
        saveAttribute: save.save.attributeLabel,
        saveRollMode: save.save.rollMode,
        damageTotal: save.damage.total,
        defenderHpBefore: save.defenderHpBefore,
        defenderHpAfter: save.defenderHpAfter,
        detail: formatSaveChatDetail(save),
      },
    });
  } else {
    const text =
      resolved.kind === "buff" || resolved.kind === "charge" || resolved.kind === "mark"
        ? resolved.summary
        : resolved.kind === "heal" || resolved.kind === "ally_buff"
          ? resolved.summary
          : action.name;
    addRoomChatMessage(roomId, {
      ...author,
      kind: "combat",
      text,
      combat: {
        attackerTokenId,
        defenderTokenId: defId,
        actionKind: "ability",
        weaponName: action.name,
        damageTotal:
          resolved.kind === "heal"
            ? null
            : null,
        defenderHpBefore: defender?.vida ?? attacker.vida ?? 0,
        defenderHpAfter:
          resolved.kind === "heal" ? resolved.defenderHpAfter : defender?.vida ?? attacker.vida ?? 0,
        detail: text,
      },
    });
  }

  const updated = bump(room);
  rooms().set(roomId, updated);
  return { ok: true, snapshot: snapshot(updated) };
}

export function executeRoomAreaSpell(
  roomId: string,
  casterTokenId: string,
  center: Axial,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): AttackExecuteResult {
  const room = getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const caster = room.scene.tokens.find((t) => t.id === casterTokenId);
  if (!caster) return { ok: false, error: "Token não encontrado" };
  if (!caster.linked || !caster.actorId) {
    return { ok: false, error: "Magia de área requer ficha linkada" };
  }

  const actor = room.actors[caster.actorId];
  if (!actor) return { ok: false, error: "Ficha não encontrada" };

  const action = resolveCombatAction(actor, opts);
  if (!action.areaShape || action.areaShape === "single") {
    return { ok: false, error: "Magia não é de área" };
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
  };

  let areaResult;
  try {
    areaResult = resolveAreaSpell(
      caster,
      center,
      actor,
      action,
      room.scene.tokens,
      room.actors,
      turn
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Magia de área inválida" };
  }

  const hpByToken = new Map<string, number>();
  for (const hit of areaResult.hits) {
    if (hit.kind === "attack") {
      hpByToken.set(hit.tokenId, hit.result.defenderHpAfter);
    } else if (hit.kind === "save") {
      hpByToken.set(hit.tokenId, hit.result.defenderHpAfter);
    }
  }

  const newPa = Math.max(0, caster.pa - areaResult.paCost);
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === casterTokenId) return { ...t, pa: newPa };
      const hp = hpByToken.get(t.id);
      if (hp != null && t.vidaMax != null) return { ...t, vida: hp };
      return t;
    }),
  };

  if (room.actors[caster.actorId]) {
    const a = room.actors[caster.actorId];
    room.actors[caster.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        pontosAcao: { ...a.resources.pontosAcao, value: newPa },
      },
      revision: a.revision + 1,
    };
  }

  for (const hit of areaResult.hits) {
    const target = room.scene.tokens.find((t) => t.id === hit.tokenId);
    if (!target?.linked || !target.actorId || !room.actors[target.actorId]) continue;
    const hpAfter =
      hit.kind === "attack"
        ? hit.result.defenderHpAfter
        : hit.kind === "save"
          ? hit.result.defenderHpAfter
          : null;
    if (hpAfter == null) continue;
    const d = room.actors[target.actorId];
    room.actors[target.actorId] = {
      ...d,
      resources: {
        ...d.resources,
        vida: { ...d.resources.vida, value: hpAfter },
      },
      revision: d.revision + 1,
    };
  }

  addRoomChatMessage(roomId, {
    ...author,
    kind: "combat",
    text: areaResult.summary,
    combat: {
      attackerTokenId: caster.id,
      defenderTokenId: areaResult.hits[0]?.tokenId ?? caster.id,
      actionKind: "spell",
      weaponName: areaResult.actionName,
      resolution: action.resolution,
      areaCenterQ: center.q,
      areaCenterR: center.r,
      areaHexCount: areaResult.areaHexes.length,
      damageTotal: areaResult.hits.reduce((sum, h) => {
        if (h.kind === "attack") return sum + (h.result.damage?.total ?? 0);
        if (h.kind === "save") return sum + h.result.damage.total;
        return sum;
      }, 0),
      defenderHpBefore: 0,
      defenderHpAfter: 0,
      detail: formatAreaSpellChatDetail(areaResult),
    },
  });

  for (const hit of areaResult.hits) {
    if (hit.kind === "save") {
      const r = hit.result;
      addRoomChatMessage(roomId, {
        ...author,
        kind: "combat",
        text: r.summary,
        combat: {
          attackerTokenId: r.attackerTokenId,
          defenderTokenId: r.defenderTokenId,
          actionKind: "spell",
          weaponName: r.weaponName,
          resolution: "save",
          saveNatural: r.save.natural,
          saveTotal: r.save.total,
          saveDc: r.save.dc,
          saveSuccess: r.save.success,
          saveAttribute: r.save.attributeLabel,
          saveRollMode: r.save.rollMode,
          damageTotal: r.damage.total,
          defenderHpBefore: r.defenderHpBefore,
          defenderHpAfter: r.defenderHpAfter,
          detail: formatSaveChatDetail(r),
        },
      });
    } else if (hit.kind === "attack") {
      const r = hit.result;
      addRoomChatMessage(roomId, {
        ...author,
        kind: "combat",
        text: r.summary,
        combat: {
          attackerTokenId: r.attackerTokenId,
          defenderTokenId: r.defenderTokenId,
          actionKind: "spell",
          weaponName: r.weaponName,
          resolution: "attack",
          attackNatural: r.attack.natural,
          attackTotal: r.attack.total,
          attackRollMode: r.attack.rollMode,
          defenderAc: r.defenderAc,
          hit: r.hit,
          critical: r.critical,
          criticalFail: r.criticalFail,
          damageTotal: r.damage?.total ?? null,
          defenderHpBefore: r.defenderHpBefore,
          defenderHpAfter: r.defenderHpAfter,
          detail: formatAttackChatDetail(r),
        },
      });
    }
  }

  const updated = bump(room);
  rooms().set(roomId, updated);
  return { ok: true, snapshot: snapshot(updated) };
}

export function addRoomChatMessage(
  roomId: string,
  message: Omit<ChatMessage, "id" | "at"> & { id?: string; at?: number }
): RoomSnapshot | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const msg: ChatMessage = {
    id: message.id ?? createChatId(),
    at: message.at ?? Date.now(),
    authorId: message.authorId,
    authorName: message.authorName,
    authorRole: message.authorRole,
    kind: message.kind,
    text: message.text,
    roll: message.roll,
    combat: message.combat,
  };

  room.chat = [...room.chat, msg].slice(-200);
  const updated = bump(room);
  rooms().set(roomId, updated);
  return snapshot(updated);
}
