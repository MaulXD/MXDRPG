import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter } from "@/lib/character/um-anel/characters";
import {
  canAssumeRearward,
  isTorStance,
  torStanceLabel,
  TOR_DEFAULT_STANCE,
  TOR_STANCE_META,
  type TorStanceId,
} from "@/lib/combat/um-anel/stances";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";
import type { BattleToken } from "@/lib/vtt/types";

export type TorStanceResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

/** Heróis vivos no mapa — a "Companhia" para efeito dos limites de Retaguarda. */
function livingHeroes(tokens: BattleToken[]): BattleToken[] {
  return tokens.filter((t) => t.torCombat?.kind === "hero" && !t.torCombat.eliminated);
}

function livingAdversaries(tokens: BattleToken[]): BattleToken[] {
  return tokens.filter((t) => t.torCombat?.kind === "adversary" && !t.torCombat.eliminated);
}

export function torTokenStance(token: BattleToken): TorStanceId {
  const raw = token.torCombat?.stance;
  return isTorStance(raw) ? raw : TOR_DEFAULT_STANCE;
}

/**
 * Troca a Postura de Combate de um herói.
 *
 * Quem pode: o dono da ficha ou o Mestre. A postura é decisão tática do jogador
 * (livro: "no início de cada rodada, cada jogador escolhe a postura do seu
 * herói"), então o Mestre entra só como quem conduz a mesa, não como dono.
 *
 * Adversário não entra aqui de propósito: o livro modela postura apenas do lado
 * do herói, e `resolveTorAttack` já trata adversário como Aberta.
 *
 * O `override` só vale para o Mestre — é o "o Mestre pode liberar por terreno"
 * do requisito da Retaguarda. Sem ele, um jogador conseguiria burlar o limite
 * mandando o pedido direto na API.
 */
export async function setRoomTorStance(
  roomId: string,
  tokenId: string,
  stance: string,
  user: SessionUser | null,
  /** Autor da mensagem de chat — vem pronto da rota, que já usa apelido (nunca
   *  o nome real da conta) como todas as outras rotas de mesa. */
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { override?: boolean; room?: RoomState } = {}
): Promise<TorStanceResult> {
  if (!user) return { ok: false, error: "Sem permissão" };
  if (!isTorStance(stance)) return { ok: false, error: "Postura inválida" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  // Isolamento de hub: postura do Um Anel não existe numa mesa do Eldarin.
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { ok: false, error: "Token não encontrado" };
  const token = room.scene.tokens[idx]!;
  const combat = token.torCombat;
  if (!combat) return { ok: false, error: "Token não é do Um Anel" };
  if (combat.kind !== "hero") return { ok: false, error: "Adversários não escolhem postura" };
  if (combat.eliminated) return { ok: false, error: "Herói fora de combate" };

  const isGm = canManageRoom(room, user);
  if (!isGm) {
    if (!combat.torCharacterId) return { ok: false, error: "Sem permissão" };
    const sheet = await resolveTorCharacter(combat.torCharacterId);
    if (!sheet) return { ok: false, error: "Ficha não encontrada" };
    const account = await resolveCharacterAccount(user.id);
    if (account.canonicalId !== sheet.ownerId) return { ok: false, error: "Sem permissão" };
  }

  const current = torTokenStance(token);
  if (current === stance) return { ok: true, snapshot: toSnapshot(room) };

  if (stance === "retaguarda") {
    const heroes = livingHeroes(room.scene.tokens);
    // Contagens excluem o próprio herói: ele está saindo da linha de frente
    // neste instante, e contar-se a si mesmo como "em corpo a corpo" deixaria
    // o segundo recuado passar por um requisito que não cumpre.
    const others = heroes.filter((t) => t.id !== token.id);
    const check = canAssumeRearward({
      companySize: heroes.length,
      enemyCount: livingAdversaries(room.scene.tokens).length,
      heroesInCloseCombat: others.filter((t) => TOR_STANCE_META[torTokenStance(t)].range === "close")
        .length,
      heroesAlreadyRearward: others.filter((t) => torTokenStance(t) === "retaguarda").length,
      loremasterOverride: isGm && opts.override === true,
    });
    if (!check.ok) return { ok: false, error: check.reason };
  }

  const tokens = [...room.scene.tokens];
  tokens[idx] = { ...token, torCombat: { ...combat, stance } };
  room.scene = { ...room.scene, tokens };

  const meta = TOR_STANCE_META[stance];
  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text: `${token.name} assume postura ${torStanceLabel(stance)} — tarefa de combate: ${meta.combatTask}`,
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-stance] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a postura" };
  }
}
