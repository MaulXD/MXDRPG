import { xpFromMonster, xpMultiplierForLevelGap } from "@/lib/character/xp";
import { listCharactersForUserInAdventure } from "@/lib/character/characters";
import { getRoomGmCreations } from "@/lib/room/gm-creations";
import { isMonsterToken } from "@/lib/room/settings";
import { getMonsterTemplate } from "@/lib/vtt/monsters";
import type { BattleToken } from "@/lib/vtt/types";
import {
  actorBelongsToRoom,
  attachCharacterToRoomState,
  persistActorToAdventureSheet,
} from "./adventure-actors";
import { recordPlayerBestiaryKill } from "@/lib/bestiary/record";
import { appendDefeatChatMessage } from "./combat-chat-events";
import type { ChatMessage } from "./chat";
import { appendRoomChatMessage } from "./handlers/chat";
import type { RoomActor, RoomState } from "./types";

type Author = Pick<ChatMessage, "authorId" | "authorName" | "authorRole">;

function participantIds(room: RoomState): string[] {
  return [...new Set([room.ownerId, ...room.memberIds])];
}

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

function xpEligibleRecipientsFromState(room: RoomState): RoomActor[] {
  return Object.values(room.actors).filter(
    (a) => !a.gmAuthored && !a.gmTemplateId && actorBelongsToRoom(room, a)
  );
}

/** Fichas de jogador na aventura — reidrata do banco se sumiram da mesa. */
export async function ensureXpRecipients(room: RoomState): Promise<RoomActor[]> {
  let recipients = xpEligibleRecipientsFromState(room);
  if (recipients.length > 0) return prioritizeOnMapRecipients(room, recipients);

  const adventureId = room.adventureId ?? room.roomId;
  for (const userId of participantIds(room)) {
    const sheets = await listCharactersForUserInAdventure(userId, adventureId);
    for (const sheet of sheets) {
      attachCharacterToRoomState(room, sheet);
    }
  }

  recipients = xpEligibleRecipientsFromState(room);
  return prioritizeOnMapRecipients(room, recipients);
}

/** Prioriza quem tem token no mapa (participou do combate). */
function prioritizeOnMapRecipients(room: RoomState, recipients: RoomActor[]): RoomActor[] {
  const onMapIds = new Set(
    room.scene.tokens
      .filter((t) => t.linked && t.actorId)
      .map((t) => t.actorId as string)
  );
  if (!onMapIds.size) return recipients;
  const onMap = recipients.filter((a) => onMapIds.has(a.id));
  return onMap.length > 0 ? onMap : recipients;
}

function averagePartyLevel(actors: RoomActor[]): number {
  if (!actors.length) return 1;
  const sum = actors.reduce((s, a) => s + a.identity.nivel, 0);
  return sum / actors.length;
}

function applyMonsterXpAward(
  room: RoomState,
  token: BattleToken,
  recipients: RoomActor[]
): { share: number; pool: number; actorIds: string[]; monsterLevel: number } | null {
  if (!isMonsterToken(token) || !recipients.length) return null;

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
    const live = room.actors[actor.id] ?? actor;
    const prev = live.identity.xpTotal ?? 0;
    room.actors[actor.id] = {
      ...live,
      identity: { ...live.identity, xpTotal: prev + share },
      revision: live.revision + 1,
    };
    actorIds.push(actor.id);
  }

  return { share, pool, actorIds, monsterLevel };
}

/** Divide XP do monstro entre fichas elegíveis. */
export async function distributeMonsterXp(
  room: RoomState,
  token: BattleToken
): Promise<{ share: number; pool: number; actorIds: string[]; monsterLevel: number } | null> {
  const recipients = await ensureXpRecipients(room);
  return applyMonsterXpAward(room, token, recipients);
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
  if (!token || !isMonsterToken(token)) return;

  if (room.settings.xpFromMonstersEnabled === false) return;

  const award = await distributeMonsterXp(room, token);
  if (!award) return;

  const participantActors = award.actorIds
    .map((id) => room.actors[id])
    .filter((a): a is RoomActor => Boolean(a));
  await recordPlayerBestiaryKill(room, token, participantActors).catch((err) => {
    console.error("[bestiary] kill record failed", err);
  });

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
