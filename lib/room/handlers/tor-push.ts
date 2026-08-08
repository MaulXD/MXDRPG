import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter, patchTorCharacterResources } from "@/lib/character/um-anel/characters";
import { torPushAvailable, torPushRecovery } from "@/lib/combat/um-anel/push";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";

export type TorPushResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

/**
 * O herói escolhe ser **empurrado** e recupera metade da Resistência perdida no
 * golpe que acabou de levar.
 *
 * Rota própria, e não um campo do ataque, porque a decisão é de quem **levou** o
 * golpe — e quem manda a requisição de ataque é quem atacou. O ataque deixa a
 * oferta gravada no token; aqui ela é aceita.
 *
 * PENDÊNCIA registrada de propósito: o livro cobra a **próxima ação principal**
 * do herói, e a VTT ainda não modela ação principal no Um Anel (não há economia
 * de ações como o PA do Eldarin). O custo fica anotado na mensagem do chat, para
 * a mesa cobrar — fingir que foi cobrado seria pior que dizer que não foi.
 */
export async function executeRoomTorPush(
  roomId: string,
  tokenId: string,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorPushResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };
  const token = room.scene.tokens[idx]!;
  const combat = token.torCombat;
  if (!combat) return { ok: false, error: "Token não é do Um Anel" };
  // "Adversários não podem escolher ser empurrados."
  if (combat.kind !== "hero") return { ok: false, error: "Adversários não podem ser empurrados" };

  const isGm = canManageRoom(room, user);
  let sheetId: string | null = null;
  if (combat.torCharacterId) {
    const sheet = await resolveTorCharacter(combat.torCharacterId);
    if (!sheet) return { ok: false, error: "Ficha não encontrada" };
    sheetId = sheet.id;
    if (!isGm) {
      const account = await resolveCharacterAccount(user.id);
      if (account.canonicalId !== sheet.ownerId) return { ok: false, error: "Sem permissão" };
    }
  } else if (!isGm) {
    return { ok: false, error: "Sem permissão" };
  }

  const round = room.combat?.round ?? 1;
  if (!torPushAvailable({ offer: combat.pushOffer, pushedRound: combat.pushedRound, round })) {
    return {
      ok: false,
      error:
        combat.pushedRound === round
          ? `${token.name} já foi empurrado nesta rodada`
          : "Não há golpe recente para amortecer",
    };
  }

  const recovery = torPushRecovery(combat.pushOffer!.loss);
  const vidaMax = token.vidaMax ?? 0;
  const nextVida = Math.min(vidaMax, (token.vida ?? 0) + recovery);

  const tokens = [...room.scene.tokens];
  tokens[idx] = {
    ...token,
    vida: nextVida,
    // Se o golpe tinha derrubado a Resistência a zero, amortecer devolve o herói
    // ao combate — `defeated` precisa acompanhar, senão ele fica de pé com
    // Resistência positiva e ainda marcado como fora.
    defeated: nextVida > 0 ? undefined : token.defeated,
    torCombat: { ...combat, pushOffer: undefined, pushedRound: round },
  };
  room.scene = { ...room.scene, tokens };

  if (sheetId) {
    try {
      await patchTorCharacterResources(sheetId, { enduranceValue: nextVida }, author.authorId);
    } catch (e) {
      console.error("[tor-push] falha ao sincronizar ficha:", e);
    }
  }

  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text: `${token.name} rola com o golpe e é empurrado — recupera ${recovery} de Resistência. Gasta a próxima ação principal recuperando a posição.`,
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-push] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar o Empurrão" };
  }
}
