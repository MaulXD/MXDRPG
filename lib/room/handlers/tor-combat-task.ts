import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter } from "@/lib/character/um-anel/characters";
import { rollTorSkillCheck } from "@/lib/character/um-anel/dice";
import { SKILL_LABEL } from "@/lib/character/um-anel/data";
import {
  TOR_COMBAT_TASK_BY_ID,
  intimidateMightCap,
  isTorCombatTask,
  rallyStances,
} from "@/lib/combat/um-anel/combat-tasks";
import {
  addTorRoundEffect,
  findTorRoundEffect,
  type TorRoundEffect,
} from "@/lib/combat/um-anel/round-effects";
import { torStanceLabel } from "@/lib/combat/um-anel/stances";
import { torAttributeTnBase } from "@/lib/combat/um-anel/session-state";
import { appendRoomChatMessage } from "./chat";
import { torTokenStance } from "./tor-stance";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomSnapshot, RoomState } from "../types";

export type TorTaskResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

function withEffect(token: BattleToken, effect: TorRoundEffect): BattleToken {
  const combat = token.torCombat;
  if (!combat) return token;
  return { ...token, torCombat: { ...combat, roundEffects: addTorRoundEffect(combat.roundEffects, effect) } };
}

/**
 * Executa uma Tarefa de Combate do Um Anel.
 *
 * Custa a **ação principal** da rodada; o app não bloqueia atacar também, porque
 * quatro Virtudes justamente permitem a tarefa como ação secundária e não há
 * como distinguir aqui quem tem qual — a mesa combina, como já combinava.
 *
 * Só herói: as quatro tarefas são descritas do lado do herói-jogador, e cada uma
 * exige uma postura, que adversário não escolhe.
 */
export async function executeRoomTorTask(
  roomId: string,
  tokenId: string,
  taskId: string,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { allyTokenId?: string; room?: RoomState } = {}
): Promise<TorTaskResult> {
  if (!user) return { ok: false, error: "Sem permissão" };
  if (!isTorCombatTask(taskId)) return { ok: false, error: "Tarefa de combate inválida" };
  const task = TOR_COMBAT_TASK_BY_ID[taskId];

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  // Isolamento de hub — a tarefa não existe numa mesa do Eldarin.
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };
  const actor = room.scene.tokens[idx]!;
  const combat = actor.torCombat;
  if (combat?.kind !== "hero") return { ok: false, error: "Só heróis usam Tarefas de Combate" };
  if (combat.eliminated) return { ok: false, error: "Herói fora de combate" };
  if (!combat.torCharacterId) return { ok: false, error: "Token sem ficha" };

  const sheet = await resolveTorCharacter(combat.torCharacterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada" };

  const isGm = canManageRoom(room, user);
  if (!isGm) {
    const account = await resolveCharacterAccount(user.id);
    if (account.canonicalId !== sheet.ownerId) return { ok: false, error: "Sem permissão" };
  }

  const stance = torTokenStance(actor);
  if (stance !== task.stance) {
    return {
      ok: false,
      error: `${task.label} exige a postura ${torStanceLabel(task.stance)} — ${actor.name} está em ${torStanceLabel(stance)}`,
    };
  }

  const round = room.combat?.round ?? 1;

  // "Apenas um herói-jogador pode escolher Reunir Companheiros em uma dada rodada."
  if (task.oncePerRound) {
    const jaUsou = room.scene.tokens.find(
      (t) => t.torCombat?.kind === "hero" && findTorRoundEffect(t.torCombat.roundEffects, "reuniu", round)
    );
    if (jaUsou) {
      return { ok: false, error: `${jaUsou.name} já usou ${task.label} nesta rodada` };
    }
  }

  let ally: BattleToken | undefined;
  if (task.needsAlly) {
    ally = room.scene.tokens.find((t) => t.id === opts.allyTokenId);
    if (!ally || ally.torCombat?.kind !== "hero" || ally.torCombat.eliminated) {
      return { ok: false, error: "Escolha um herói para proteger" };
    }
    if (ally.id === actor.id) return { ok: false, error: "Escolha outro herói" };
    // "…proteger outro herói lutando em uma postura de combate corpo a corpo."
    if (torTokenStance(ally) === "retaguarda") {
      return { ok: false, error: `${ally.name} está em Retaguarda — não pode ser protegido` };
    }
  }

  const { outcome, message } = rollTorSkillCheck(sheet, task.skill, {
    attributeTnBase: torAttributeTnBase(room.torSession),
  });
  const tokens = [...room.scene.tokens];
  const notas: string[] = [];

  if (outcome.success) {
    const icons = outcome.successIcons;
    if (task.id === "intimidar-inimigo") {
      const cap = intimidateMightCap(icons);
      let atingidos = 0;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!;
        const c = t.torCombat;
        if (c?.kind !== "adversary" || c.eliminated) continue;
        if (cap != null && Math.max(1, c.might ?? 1) > cap) continue;
        tokens[i] = withEffect(t, { kind: "intimidado", dice: 0, untilRound: round + 1, source: actor.name });
        atingidos++;
      }
      notas.push(
        cap == null
          ? `todos os ${atingidos} adversários ficam Exaustos na próxima rolagem de ataque`
          : `${atingidos} adversário(s) de Vigor até ${cap} ficam Exaustos na próxima rolagem de ataque`
      );
    }

    if (task.id === "reunir-companheiros") {
      const alcance = rallyStances(icons);
      let atingidos = 0;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!;
        const c = t.torCombat;
        if (c?.kind !== "hero" || c.eliminated) continue;
        if (!alcance.includes(torTokenStance(t))) continue;
        // "na rodada seguinte" — vale a rodada inteira, não some no 1º ataque.
        tokens[i] = withEffect(t, { kind: "reunido", dice: 1, untilRound: round + 1, source: actor.name });
        atingidos++;
      }
      notas.push(
        `${atingidos} herói(s) em ${alcance.map(torStanceLabel).join("/")} ganham (1d) no ataque na rodada seguinte`
      );
    }

    if (task.id === "proteger-companheiro" && ally) {
      const j = tokens.findIndex((t) => t.id === ally!.id);
      const dice = 1 + icons;
      tokens[j] = withEffect(tokens[j]!, {
        kind: "protegido",
        dice,
        untilRound: round + 1,
        source: actor.name,
      });
      notas.push(`o próximo ataque contra ${ally.name} perde (${dice}d)`);
    }

    if (task.id === "preparar-tiro") {
      const dice = 1 + icons;
      tokens[idx] = withEffect(tokens[idx]!, {
        kind: "tiro-preparado",
        dice,
        untilRound: round + 1,
        source: actor.name,
      });
      notas.push(`${actor.name} ganha (${dice}d) no próximo ataque à distância`);
    }

    if (task.oncePerRound) {
      tokens[idx] = withEffect(tokens[idx]!, { kind: "reuniu", dice: 0, untilRound: round });
    }
  } else {
    notas.push("sem efeito");
  }

  room.scene = { ...room.scene, tokens };

  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text: `${task.label} (${SKILL_LABEL[task.skill]}) — ${message} → ${notas.join("; ")}`,
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-task] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a tarefa" };
  }
}
