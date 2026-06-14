import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { saveCharacter } from "@/lib/character/characters";
import { normalizeCharacter } from "@/lib/character/normalize";
import { attributeMod, hpMaxFor, paMaxFor } from "@/lib/character/rules";
import { MAX_LEVEL, xpTotalForLevel } from "@/lib/character/xp";
import { restoreRoundCheckpoint } from "@/lib/room/combat-round-checkpoint";
import {
  applyGmCombatOrder,
  deferTokenToEndOfOrder,
  gmResetTokenPaInRoom,
  restoreNaturalCombatOrder,
} from "../combat-gm";
import { syncCombatOrderWithTokens } from "../combat-order";
import { revertCombatUndo } from "../combat-undo";
import { persistActorToAdventureSheet } from "../adventure-actors";
import { syncLinkedTokens } from "../sync";
import { appendRoomChatMessage } from "./chat";
import { patchTokenVitals } from "@/lib/vtt/token-hp-display";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import { applyExplorationPaDisplay } from "@/lib/combat/exploration-pa";
import { beginCombatTurnEconomyPa } from "./combat-turn";
import type { RoomSnapshot } from "../types";

export type GmCombatAction =
  | { action: "reset-pa"; tokenId: string }
  | { action: "defer-turn"; tokenId: string }
  | { action: "restore-order" }
  | { action: "set-order"; order: string[]; activeTokenId?: string }
  | { action: "set-active"; tokenId: string }
  | { action: "revert"; undoId: string }
  | { action: "restore-round"; round: number }
  | { action: "set-combat-mode"; active: boolean }
  | { action: "grant-xp-all"; amount: number }
  | { action: "level-up-all" }
  | { action: "set-hp"; tokenId: string; value: number; max?: number; temp?: number };

function assertGm(
  room: NonNullable<Awaited<ReturnType<typeof getRoom>>>,
  user: SessionUser | null | undefined
): string | null {
  if (room.roomId === "demo") return null;
  if (!user) return "Faça login";
  if (!canManageRoom(room, user)) return "Só o mestre pode usar este controle";
  return null;
}

export async function executeGmCombatAction(
  roomId: string,
  body: GmCombatAction,
  user: SessionUser | null | undefined
): Promise<{ ok: true; snapshot: RoomSnapshot } | { ok: false; error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const denied = assertGm(room, user);
  if (denied) return { ok: false, error: denied };

  const author = {
    authorId: user?.id ?? "gm",
    authorName: user?.name ?? "Mestre",
    authorRole: "mestre" as const,
  };

  switch (body.action) {
    case "reset-pa": {
      const tokenId = body.tokenId?.trim();
      if (!tokenId) return { ok: false, error: "Token inválido" };
      const token = room.scene.tokens.find((t) => t.id === tokenId);
      if (!token) return { ok: false, error: "Token não encontrado" };

      const refreshed = gmResetTokenPaInRoom(room, tokenId);
      if (!refreshed) return { ok: false, error: "Falha ao resetar PA" };

      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre restaurou os PA de ${token.name} (${refreshed.pa}/${refreshed.paMax}).`,
      });
      break;
    }

    case "defer-turn": {
      const tokenId = body.tokenId?.trim();
      if (!tokenId) return { ok: false, error: "Token inválido" };
      const token = room.scene.tokens.find((t) => t.id === tokenId);
      if (!token) return { ok: false, error: "Token não encontrado" };
      if (!room.combat.order.includes(tokenId)) {
        return { ok: false, error: "Token fora da ordem de combate" };
      }

      room.combat = deferTokenToEndOfOrder(room.combat, tokenId);
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre adiou ${token.name} para o fim da rodada.`,
      });
      break;
    }

    case "restore-order": {
      if (!room.combat.orderOverridden) {
        return { ok: false, error: "A ordem já está na iniciativa natural" };
      }
      if (!restoreNaturalCombatOrder(room)) {
        return { ok: false, error: "Sem ordem natural salva — role iniciativa" };
      }
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: "Mestre restaurou a ordem natural de iniciativa.",
      });
      break;
    }

    case "set-order": {
      if (!Array.isArray(body.order) || body.order.length === 0) {
        return { ok: false, error: "Ordem inválida" };
      }
      room.combat = applyGmCombatOrder(room.combat, room, body.order, {
        activeTokenId: body.activeTokenId,
      });
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: "Mestre reordenou a fila de combate.",
      });
      break;
    }

    case "set-active": {
      const tokenId = body.tokenId?.trim();
      if (!tokenId) return { ok: false, error: "Token inválido" };
      const token = room.scene.tokens.find((t) => t.id === tokenId);
      if (!token) return { ok: false, error: "Token não encontrado" };
      const idx = room.combat.order.indexOf(tokenId);
      if (idx < 0) return { ok: false, error: "Token fora da ordem de combate" };

      room.combat = { ...room.combat, activeIndex: idx, paRefreshTurnKey: undefined };
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre definiu ${token.name} como turno ativo.`,
      });
      break;
    }

    case "revert": {
      const undoId = body.undoId?.trim();
      if (!undoId) return { ok: false, error: "Jogada inválida" };
      const entry = revertCombatUndo(room, undoId);
      if (!entry) return { ok: false, error: "Jogada não encontrada ou já desfeita" };

      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre reverteu: ${entry.tokenName} — ${entry.summary}`,
      });
      break;
    }

    case "restore-round": {
      const round = Math.floor(Number(body.round));
      if (!Number.isFinite(round) || round < 1) {
        return { ok: false, error: "Rodada inválida" };
      }
      const entry = restoreRoundCheckpoint(room, round);
      if (!entry) {
        return { ok: false, error: `Sem checkpoint do início da rodada ${round}` };
      }
      syncCombatOrderWithTokens(room);
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre restaurou o estado do início da rodada ${round}.`,
      });
      break;
    }

    case "set-combat-mode": {
      const active = Boolean(body.active);
      room.settings = { ...room.settings, combatActive: active };
      if (!active) {
        room.combat = { ...room.combat, pendingAutoPass: undefined };
        applyExplorationPaDisplay(room);
      } else if (room.combat?.order?.length) {
        beginCombatTurnEconomyPa(room);
      }
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: active
          ? "Mestre ativou o modo combate (PA e turnos)."
          : "Mestre encerrou o modo combate — exploração livre.",
      });
      break;
    }

    case "grant-xp-all": {
      const amount = Math.floor(Number(body.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: "Informe um valor de XP positivo" };
      }
      const targets = Object.entries(room.actors).filter(([, a]) => !a.gmAuthored);
      if (targets.length === 0) {
        return { ok: false, error: "Nenhum personagem de jogador na sala" };
      }
      for (const [actorId, current] of targets) {
        const prev = current.identity.xpTotal ?? 0;
        const next = {
          ...normalizeCharacter(current),
          identity: { ...current.identity, xpTotal: prev + amount },
          revision: current.revision + 1,
        };
        room.actors[actorId] = next;
        const { revision: _r, ...sheet } = next;
        await saveCharacter(sheet);
        await persistActorToAdventureSheet(next);
      }
      room.scene = syncLinkedTokens(room.scene, room.actors, { preserveCombatPa: true });
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre concedeu +${amount} XP a todos os personagens (${targets.length}).`,
      });
      break;
    }

    case "level-up-all": {
      const targets = Object.entries(room.actors).filter(([, a]) => !a.gmAuthored);
      if (targets.length === 0) {
        return { ok: false, error: "Nenhum personagem de jogador na sala" };
      }
      let leveled = 0;
      for (const [actorId, current] of targets) {
        const nextLevel = current.identity.nivel + 1;
        if (nextLevel > MAX_LEVEL) continue;
        const conMod = attributeMod(current.attributes.constituicao);
        const hpMax = hpMaxFor(current.identity.classe, nextLevel, conMod);
        const paMax = paMaxFor(nextLevel, current.resources.pontosAcao.max);
        const next = {
          ...normalizeCharacter({
            ...current,
            identity: {
              ...current.identity,
              nivel: nextLevel,
              xpTotal: xpTotalForLevel(nextLevel),
            },
            resources: {
              vida: {
                max: hpMax,
                value: Math.min(current.resources.vida.value, hpMax),
              },
              pontosAcao: {
                max: paMax,
                value: Math.min(current.resources.pontosAcao.value, paMax),
              },
            },
          }),
          revision: current.revision + 1,
        };
        room.actors[actorId] = next;
        const { revision: _r, ...sheet } = next;
        await saveCharacter(sheet);
        await persistActorToAdventureSheet(next);
        leveled += 1;
      }
      if (leveled === 0) {
        return { ok: false, error: "Todos os personagens já estão no nível máximo" };
      }
      room.scene = syncLinkedTokens(room.scene, room.actors, { preserveCombatPa: true });
      syncCombatOrderWithTokens(room);
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre subiu 1 nível a ${leveled} personagem(ns).`,
      });
      break;
    }

    case "set-hp": {
      const tokenId = body.tokenId?.trim();
      if (!tokenId) return { ok: false, error: "Token inválido" };
      const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
      if (idx < 0) return { ok: false, error: "Token não encontrado" };

      const value = Math.floor(Number(body.value));
      if (!Number.isFinite(value) || value < 0) {
        return { ok: false, error: "Informe uma vida válida (0 ou mais)" };
      }

      const tokens = [...room.scene.tokens];
      const before = tokens[idx];
      const hpMaxRaw = body.max != null ? Math.floor(Number(body.max)) : before.vidaMax;
      if (hpMaxRaw != null && (!Number.isFinite(hpMaxRaw) || hpMaxRaw < 1)) {
        return { ok: false, error: "Vida máxima deve ser pelo menos 1" };
      }
      const hpMax = hpMaxRaw ?? Math.max(value, before.vidaMax ?? value, 1);
      const vida = Math.min(value, hpMax);
      const prevHp = before.vida ?? hpMax;
      const prevTemp = before.vidaTemp ?? 0;

      let vidaTemp = before.vidaTemp ?? 0;
      if (body.temp != null) {
        const tempRaw = Math.floor(Number(body.temp));
        if (!Number.isFinite(tempRaw) || tempRaw < 0) {
          return { ok: false, error: "Vida temporária deve ser 0 ou mais" };
        }
        vidaTemp = tempRaw;
      }

      tokens[idx] = patchTokenVitals(before, {
        vida,
        vidaMax: hpMax,
        vidaTemp: vidaTemp > 0 ? vidaTemp : undefined,
      });
      room.scene = { ...room.scene, tokens };

      if (before.linked && before.actorId && room.actors[before.actorId]) {
        const actor = room.actors[before.actorId];
        const nextActor = {
          ...actor,
          resources: {
            ...actor.resources,
            vida: {
              max: hpMax,
              value: vida,
              temp: vidaTemp > 0 ? vidaTemp : undefined,
            },
          },
          revision: actor.revision + 1,
        };
        room.actors[before.actorId] = nextActor;
        const { revision: _r, ...sheet } = nextActor;
        await saveCharacter(sheet);
        await persistActorToAdventureSheet(nextActor);
      }

      syncCombatOrderWithTokens(room);
      const tempNote =
        body.temp != null && vidaTemp !== prevTemp
          ? vidaTemp > 0
            ? ` · temp ${prevTemp}→${vidaTemp}`
            : " · temp removida"
          : "";
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre ajustou a vida de ${before.name}: ${prevHp}/${before.vidaMax ?? hpMax} → ${vida}/${hpMax}${tempNote}.`,
      });
      break;
    }

    default:
      return { ok: false, error: "Ação inválida" };
  }

  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
