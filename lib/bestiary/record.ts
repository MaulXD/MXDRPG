import { monsterTypeKey } from "@/lib/bestiary/monster-identity";
import { getBestiaryEntry, setBestiaryEntry } from "@/lib/bestiary/registry";
import type { PlayerBestiaryEntry, PlayerMonsterAttackRecord } from "@/lib/bestiary/types";
import { savePlayerBestiaryEntry } from "@/lib/db/player-bestiary";
import type { ChatMessage } from "@/lib/room/chat";
import { isMonsterToken } from "@/lib/room/settings";
import type { RoomActor, RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

function playerDefenderOwnerId(room: RoomState, defender: BattleToken): string | null {
  if (!defender.linked || !defender.actorId) return null;
  const actor = room.actors[defender.actorId];
  if (!actor || actor.gmAuthored || actor.gmTemplateId) return null;
  return actor.ownerId ?? null;
}

function playerAttackerOwnerId(room: RoomState, attacker: BattleToken): string | null {
  if (!attacker.linked || !attacker.actorId) return null;
  return playerDefenderOwnerId(room, attacker);
}

function emptyEntry(token: BattleToken, typeKey: string): PlayerBestiaryEntry {
  return {
    typeKey,
    monsterEntryId: token.monsterEntryId,
    gmCreationId: token.gmCreationId,
    displayName: token.name,
    attacksAgainstPlayer: [],
    damageDealtByPlayer: 0,
    killCount: 0,
    updatedAt: Date.now(),
  };
}

function ensureEntry(
  userId: string,
  adventureId: string,
  token: BattleToken,
  typeKey: string
): PlayerBestiaryEntry {
  const existing = getBestiaryEntry(userId, adventureId, typeKey);
  if (existing) {
    return {
      ...existing,
      displayName: token.name || existing.displayName,
      monsterEntryId: token.monsterEntryId ?? existing.monsterEntryId,
      gmCreationId: token.gmCreationId ?? existing.gmCreationId,
    };
  }
  return emptyEntry(token, typeKey);
}

function sanitizeAttackDetail(detail: string): string {
  return detail.replace(/\s*\d+\s*HP\s*\([^)]*\)/gi, "").trim() || detail;
}

function appendAttack(
  entry: PlayerBestiaryEntry,
  record: PlayerMonsterAttackRecord
): PlayerBestiaryEntry {
  if (entry.attacksAgainstPlayer.some((a) => a.messageId === record.messageId)) {
    return entry;
  }
  return {
    ...entry,
    attacksAgainstPlayer: [...entry.attacksAgainstPlayer, record].slice(-80),
    updatedAt: Date.now(),
  };
}

async function persistEntry(userId: string, adventureId: string, entry: PlayerBestiaryEntry): Promise<void> {
  setBestiaryEntry(entry, userId, adventureId);
  await savePlayerBestiaryEntry(userId, adventureId, entry);
}

/** Registra um evento de combate relevante ao bestiário individual do jogador. */
export async function recordPlayerBestiaryFromCombat(
  room: RoomState,
  msg: ChatMessage
): Promise<void> {
  if (msg.kind !== "combat" || !msg.combat) return;
  const adventureId = room.adventureId ?? room.roomId;
  const combat = msg.combat;

  const attacker = room.scene.tokens.find((t) => t.id === combat.attackerTokenId);
  const defender = room.scene.tokens.find((t) => t.id === combat.defenderTokenId);
  if (!attacker || !defender) return;

  const writes: Promise<void>[] = [];

  if (isMonsterToken(attacker)) {
    const userId = playerDefenderOwnerId(room, defender);
    if (userId) {
      const typeKey = monsterTypeKey(attacker);
      let entry = ensureEntry(userId, adventureId, attacker, typeKey);
      const damageToPlayer =
        combat.hit && combat.damageTotal != null && combat.damageTotal > 0 ? combat.damageTotal : 0;
      entry = appendAttack(entry, {
        messageId: msg.id,
        at: msg.at,
        attackerTokenId: attacker.id,
        weaponName: combat.weaponName,
        actionKind: combat.actionKind,
        hit: Boolean(combat.hit),
        damageToPlayer,
        detail: sanitizeAttackDetail(combat.detail || msg.text),
      });
      writes.push(persistEntry(userId, adventureId, entry));
    }
  }

  if (isMonsterToken(defender)) {
    const userId = playerAttackerOwnerId(room, attacker);
    if (userId && combat.hit && combat.damageTotal != null && combat.damageTotal > 0) {
      const typeKey = monsterTypeKey(defender);
      let entry = ensureEntry(userId, adventureId, defender, typeKey);
      entry = {
        ...entry,
        damageDealtByPlayer: entry.damageDealtByPlayer + combat.damageTotal,
        updatedAt: Date.now(),
      };
      writes.push(persistEntry(userId, adventureId, entry));
    }
  }

  await Promise.all(writes);
}

/** Participação em abate — revela vida máxima aproximada do tipo. */
export async function recordPlayerBestiaryKill(
  room: RoomState,
  token: BattleToken,
  participantActors: RoomActor[]
): Promise<void> {
  if (!isMonsterToken(token)) return;
  const adventureId = room.adventureId ?? room.roomId;
  const typeKey = monsterTypeKey(token);
  const hpMax = token.vidaMax ?? token.vida;
  if (hpMax == null || hpMax <= 0) return;

  const ownerIds = [
    ...new Set(
      participantActors
        .map((a) => a.ownerId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  await Promise.all(
    ownerIds.map(async (userId) => {
      let entry = ensureEntry(userId, adventureId, token, typeKey);
      entry = {
        ...entry,
        killCount: entry.killCount + 1,
        hpMaxKnown: hpMax,
        updatedAt: Date.now(),
      };
      await persistEntry(userId, adventureId, entry);
    })
  );
}
