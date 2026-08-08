import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter, patchTorCharacterResources } from "@/lib/character/um-anel/characters";
import { computeLoad, computeProtectionDice } from "@/lib/character/um-anel/rules";
import { formatTorHelmMessage, torHelmSwap } from "@/lib/combat/um-anel/gear-in-combat";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";

export type TorHelmResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

/**
 * Tirar e recuperar o Elmo no meio do combate.
 *
 * A jogada existe no livro e não existia no app: "às vezes, durante o combate,
 * um herói pode recorrer a descartá-lo para reduzir a Carga carregada e evitar
 * ficar Exausto muito cedo". `removable: true` estava em `data.ts` desde o começo
 * com um único consumidor — uma dica de tooltip no compêndio.
 *
 * Escreve na **ficha**, não no token: Carga, Exausto e Dados de Proteção saem
 * todos de `armour`, e duplicar o estado no token criaria duas verdades que
 * divergem no primeiro golpe. É a mesma lição do bônus de escudo, que já foi
 * guardado e já divergiu.
 */
export async function executeRoomTorHelm(
  roomId: string,
  tokenId: string,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorHelmResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  const tokens = [...room.scene.tokens];
  const idx = tokens.findIndex((t) => t.id === tokenId);
  const token = idx >= 0 ? tokens[idx] : undefined;
  const combat = token?.torCombat;
  if (!token || combat?.kind !== "hero" || !combat.torCharacterId) {
    return { ok: false, error: "Só heróis do Um Anel usam Elmo" };
  }

  const sheet = await resolveTorCharacter(combat.torCharacterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada" };

  // Tirar o próprio elmo é decisão de quem joga o herói — o Mestre também pode,
  // para conduzir a mesa de quem faltou. Mesmo critério de Endurecer a Vontade.
  const isGm = canManageRoom(room, user);
  if (!isGm) {
    const account = await resolveCharacterAccount(user.id);
    if (account.canonicalId !== sheet.ownerId) return { ok: false, error: "Sem permissão" };
  }

  const armourBefore = sheet.armour;
  const armourAfter = { ...armourBefore, helm: !armourBefore.helm };

  const swap = torHelmSwap({
    wearingBefore: Boolean(armourBefore.helm),
    equipmentLoadBefore: computeLoad(sheet.warGear, armourBefore, sheet.culture),
    equipmentLoadAfter: computeLoad(sheet.warGear, armourAfter, sheet.culture),
    fatigue: sheet.fatigue,
    protectionBefore: computeProtectionDice(armourBefore),
    protectionAfter: computeProtectionDice(armourAfter),
    enduranceValue: sheet.endurance.value,
  });

  // Grava ANTES de anunciar: a mesa não pode ler que o Elmo saiu se a ficha
  // recusou a escrita.
  try {
    await patchTorCharacterResources(sheet.id, { armour: armourAfter }, author.authorId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao gravar a ficha" };
  }

  /* O token guarda uma FOTOGRAFIA dos Dados de Proteção, tirada quando o herói
     entrou em cena. Quem manda no Teste de Proteção é a ficha (ver
     tor-combat-attack), mas deixar o número velho no token seria uma verdade
     paralela esperando para ser lida por engano. */
  tokens[idx] = {
    ...token,
    torCombat: { ...combat, protectionDice: swap.protectionDice, helm: swap.wearing },
  };
  room.scene = { ...room.scene, tokens };

  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text: formatTorHelmMessage(token.name, swap),
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-helm] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}
