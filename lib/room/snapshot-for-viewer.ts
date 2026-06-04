import { canViewTokenPa, type CombatTurnRoom } from "@/lib/auth/combat-turn-access";
import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomSnapshot, RoomState } from "@/lib/room/types";
import {
  isMonsterToken,
  normalizeRoomSettings,
  redactMonsterHp,
} from "@/lib/room/settings";
import { filterTokensForFog, visibleHexSetForPlayer } from "@/lib/vtt/fog-of-war";
import type { BattleToken } from "@/lib/vtt/types";
import type { ChatMessage } from "./chat";

function combatRoomFrom(
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds">,
  snapshot: RoomSnapshot
): CombatTurnRoom {
  return {
    roomId: room.roomId,
    ownerId: room.ownerId,
    memberIds: room.memberIds,
    scene: snapshot.scene,
    actors: snapshot.actors,
  };
}

function redactTokenPa(token: BattleToken): BattleToken {
  return {
    ...token,
    pa: 0,
    paMax: 0,
    bankedPa: undefined,
    paSpentThisTurn: undefined,
  };
}

function redactChatForPlayers(
  chat: ChatMessage[],
  tokens: BattleToken[],
  showMonsterHpInChat: boolean
): ChatMessage[] {
  if (showMonsterHpInChat) return chat;
  return chat.map((msg) => {
    if (msg.kind !== "combat" || !msg.combat) return msg;
    const defender = tokens.find((t) => t.id === msg.combat!.defenderTokenId);
    if (!defender || !isMonsterToken(defender)) return msg;
    return {
      ...msg,
      text: msg.text.replace(/\s*\d+\s*HP\s*\([^)]*\)/gi, "").trim() || msg.text,
      combat: {
        ...msg.combat,
        defenderHpBefore: 0,
        defenderHpAfter: 0,
      },
    };
  });
}

/** Oculta PA de monstros e HP conforme configuração da mesa. */
export function snapshotForViewer(
  snapshot: RoomSnapshot,
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds" | "settings">,
  user: SessionUser | null | undefined
): RoomSnapshot {
  const isGm = canManageRoom(room, user);
  const settings = normalizeRoomSettings(room.settings ?? snapshot.settings);
  const actorIds = user
    ? Object.entries(snapshot.actors)
        .filter(([, a]) => a.ownerId === user.id)
        .map(([id]) => id)
    : [];

  const fogVisible = isGm
    ? null
    : visibleHexSetForPlayer(snapshot.scene, snapshot.scene.tokens, {
        userId: user?.id,
        actorIds,
      });

  const turnRoom = combatRoomFrom(room, snapshot);
  let tokens = snapshot.scene.tokens.map((t) => {
    let out = canViewTokenPa(turnRoom, user ?? null, t) ? t : redactTokenPa(t);
    if (!isGm && !settings.showMonsterHpToPlayers && isMonsterToken(out)) {
      out = redactMonsterHp(out);
    }
    return out;
  });

  if (fogVisible) {
    tokens = filterTokensForFog(tokens, snapshot.scene, fogVisible, {
      userId: user?.id,
      actorIds,
    });
  }

  const chat =
    isGm || settings.showMonsterHpInChat
      ? snapshot.chat
      : redactChatForPlayers(snapshot.chat, snapshot.scene.tokens, false);

  const tokensUnchanged =
    isGm &&
    tokens.every((t, i) => t === snapshot.scene.tokens[i]) &&
    chat === snapshot.chat;

  if (tokensUnchanged && settings === snapshot.settings) {
    return snapshot;
  }

  return {
    ...snapshot,
    settings,
    chat,
    scene: {
      ...snapshot.scene,
      tokens,
      revealedHexes: isGm ? snapshot.scene.revealedHexes : snapshot.scene.revealedHexes,
    },
  };
}
