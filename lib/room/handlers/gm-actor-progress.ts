import { attributeMod, hpMaxFor, paMaxFor } from "@/lib/character/rules";
import { normalizeCharacter } from "@/lib/character/normalize";
import { saveCharacter } from "@/lib/character/characters";
import { MAX_LEVEL, xpTotalForLevel } from "@/lib/character/xp";
import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { syncCombatOrderWithTokens } from "../combat-order";
import { syncLinkedTokens } from "../sync";
import { appendRoomChatMessage } from "./chat";
import { persistActorToAdventureSheet } from "../adventure-actors";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomActor, RoomSnapshot } from "../types";

export type GmActorProgressAction =
  | { action: "grant-xp"; actorId: string; amount: number }
  | { action: "set-level"; actorId: string; level: number }
  | { action: "set-hp"; actorId: string; value: number; max?: number };

function assertGm(
  room: NonNullable<Awaited<ReturnType<typeof getRoom>>>,
  user: SessionUser | null | undefined
): string | null {
  if (room.roomId === "demo") return null;
  if (!user) return "Faça login";
  if (!canManageRoom(room, user)) return "Só o mestre pode ajustar XP, nível e vida";
  return null;
}

async function persistActor(actor: RoomActor): Promise<void> {
  const { revision: _r, ...sheet } = actor;
  await saveCharacter(sheet);
  await persistActorToAdventureSheet(actor);
}

function applySetLevel(actor: RoomActor, level: number): RoomActor {
  const nivel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const conMod = attributeMod(actor.attributes.constituicao);
  const hpMax = hpMaxFor(actor.identity.classe, nivel, conMod);
  const paMax = paMaxFor(nivel, actor.resources.pontosAcao.max);
  const resetProgression = nivel <= 1;
  return {
    ...normalizeCharacter({
      ...actor,
      identity: {
        ...actor.identity,
        nivel,
        xpTotal: xpTotalForLevel(nivel),
        subclasse: resetProgression ? null : actor.identity.subclasse,
        talentos: resetProgression ? [] : actor.identity.talentos,
      },
      resources: {
        vida: {
          max: hpMax,
          value: Math.min(actor.resources.vida.value, hpMax),
        },
        pontosAcao: {
          max: paMax,
          value: Math.min(actor.resources.pontosAcao.value, paMax),
        },
      },
    }),
    revision: actor.revision,
    gmAuthored: actor.gmAuthored,
    gmTemplateId: actor.gmTemplateId,
  };
}

export async function executeGmActorProgress(
  roomId: string,
  body: GmActorProgressAction,
  user: SessionUser | null | undefined
): Promise<{ ok: true; snapshot: RoomSnapshot } | { ok: false; error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const denied = assertGm(room, user);
  if (denied) return { ok: false, error: denied };

  const actorId = body.actorId?.trim();
  if (!actorId) return { ok: false, error: "Personagem inválido" };

  const current = room.actors[actorId];
  if (!current) return { ok: false, error: "Personagem não está na sala" };
  if (current.gmAuthored) return { ok: false, error: "Use o painel de criações para NPCs" };

  const author = {
    authorId: user?.id ?? "gm",
    authorName: user?.name ?? "Mestre",
    authorRole: "mestre" as const,
  };

  let next: RoomActor;

  switch (body.action) {
    case "grant-xp": {
      const amount = Math.floor(Number(body.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: "Informe um valor de XP positivo" };
      }
      const prev = current.identity.xpTotal ?? 0;
      next = {
        ...normalizeCharacter(current),
        identity: { ...current.identity, xpTotal: prev + amount },
        revision: current.revision + 1,
      };
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre concedeu +${amount} XP a ${current.name} (${prev} → ${prev + amount}).`,
      });
      break;
    }
    case "set-level": {
      const level = Math.floor(Number(body.level));
      if (!Number.isFinite(level) || level < 1 || level > MAX_LEVEL) {
        return { ok: false, error: `Nível deve ser entre 1 e ${MAX_LEVEL}` };
      }
      next = {
        ...applySetLevel(current, level),
        revision: current.revision + 1,
      };
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre definiu ${current.name} como nível ${next.identity.nivel}.`,
      });
      break;
    }
    case "set-hp": {
      const value = Math.floor(Number(body.value));
      if (!Number.isFinite(value) || value < 0) {
        return { ok: false, error: "Informe uma vida válida (0 ou mais)" };
      }
      const maxRaw = body.max != null ? Math.floor(Number(body.max)) : current.resources.vida.max;
      if (!Number.isFinite(maxRaw) || maxRaw < 1) {
        return { ok: false, error: "Vida máxima deve ser pelo menos 1" };
      }
      const hpMax = maxRaw;
      const hpValue = Math.min(value, hpMax);
      const prev = current.resources.vida;
      next = {
        ...current,
        resources: {
          ...current.resources,
          vida: { max: hpMax, value: hpValue },
        },
        revision: current.revision + 1,
      };
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre ajustou a vida de ${current.name}: ${prev.value}/${prev.max} → ${hpValue}/${hpMax}.`,
      });
      break;
    }
    default:
      return { ok: false, error: "Ação inválida" };
  }

  room.actors[actorId] = next;
  room.scene = syncLinkedTokens(room.scene, room.actors, { preserveCombatPa: true });
  syncCombatOrderWithTokens(room);
  await persistActor(next);
  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
