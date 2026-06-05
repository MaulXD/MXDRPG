import {
  characterBelongsToAdventure,
  isAdventureBoundCharacter,
} from "@/lib/character/adventure-bind";
import { xpFromMonster, xpMultiplierForLevelGap } from "@/lib/character/xp";
import { getRoomGmCreations } from "@/lib/room/gm-creations";
import { isMonsterToken } from "@/lib/room/settings";
import { getMonsterTemplate } from "@/lib/vtt/monsters";
import type { BattleToken } from "@/lib/vtt/types";
import { persistActorToAdventureSheet } from "./adventure-actors";
import { appendDefeatChatMessage } from "./combat-chat-events";
import type { ChatMessage } from "./chat";
import { appendRoomChatMessage } from "./handlers/chat";
import type { RoomActor, RoomState } from "./types";

type Author = Pick<ChatMessage, "authorId" | "authorName" | "authorRole">;

function monsterLevelForXp(room: RoomState, token: BattleToken): number {
  if (token.nivel != null && token.nivel > 0) return token.nivel;
  if (token.monsterEntryId) {
    const t = getMonsterTemplate(token.monsterEntryId);
    if (t) return t.ameaca;
  }
  if (token.gmCreationId) {
    const c = getRoomGmCreations(room)[token.gmCreationId];
    if (c?.creature?.ameaca) return c.creature.ameaca;
  }
  if (token.gmCreatureStats?.ameaca) return token.gmCreatureStats.ameaca;
  return 1;
}

function xpEligibleRecipients(room: RoomState): RoomActor[] {
  const adventureId = room.adventureId ?? room.roomId;
  return Object.values(room.actors).filter(
    (a) =>
      !a.gmAuthored &&
      isAdventureBoundCharacter(a) &&
      characterBelongsToAdventure(a, adventureId)
  );
}

function averagePartyLevel(actors: RoomActor[]): number {
  if (!actors.length) return 1;
  const sum = actors.reduce((s, a) => s + a.identity.nivel, 0);
  return sum / actors.length;
}

/** Divide XP do monstro entre fichas de jogador na aventura. */
export function distributeMonsterXp(
  room: RoomState,
  token: BattleToken
): { share: number; pool: number; actorIds: string[]; monsterLevel: number } | null {
  if (!isMonsterToken(token)) return null;

  const recipients = xpEligibleRecipients(room);
  if (!recipients.length) return null;

  const monsterLevel = monsterLevelForXp(room, token);
  const partyLevel = Math.round(averagePartyLevel(recipients));
  const elite = token.monsterVariant === "elite";
  let pool = xpFromMonster(monsterLevel, { elite });
  pool = Math.round(pool * xpMultiplierForLevelGap(partyLevel, monsterLevel));
  if (pool <= 0) return null;

  const share = Math.floor(pool / recipients.length);
  if (share <= 0) return null;

  const actorIds: string[] = [];
  for (const actor of recipients) {
    const prev = actor.identity.xpTotal ?? 0;
    room.actors[actor.id] = {
      ...actor,
      identity: { ...actor.identity, xpTotal: prev + share },
      revision: actor.revision + 1,
    };
    actorIds.push(actor.id);
  }

  return { share, pool, actorIds, monsterLevel };
}

/** Derrota no chat + XP automático para o grupo. */
export async function recordMonsterDefeat(
  room: RoomState,
  author: Author,
  opts: {
    defenderTokenId: string;
    defenderName: string;
    attackerTokenId?: string;
    hpBefore: number;
  }
): Promise<void> {
  appendDefeatChatMessage(room, author, opts);

  const token = room.scene.tokens.find((t) => t.id === opts.defenderTokenId);
  if (!token) return;

  const award = distributeMonsterXp(room, token);
  if (!award) return;

  for (const id of award.actorIds) {
    await persistActorToAdventureSheet(room.actors[id]);
  }

  const text =
    award.actorIds.length === 1
      ? `${room.actors[award.actorIds[0]]?.name ?? "Jogador"} ganhou +${award.share} XP (nv ${award.monsterLevel} · ${opts.defenderName}).`
      : `Cada jogador ganhou +${award.share} XP (${award.pool} no total) por derrotar ${opts.defenderName} (nv ${award.monsterLevel}).`;

  appendRoomChatMessage(room, {
    authorId: "xp",
    authorName: "Experiência",
    authorRole: "mestre",
    kind: "system",
    text,
  });
}
