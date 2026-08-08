import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import {
  formatTorEyeMessage,
  torHuntThreshold,
  TOR_EYE_SOURCE_META,
  type TorEyeSource,
} from "@/lib/combat/um-anel/eye";
import { applyTorSessionPatch, normalizeTorSession } from "@/lib/combat/um-anel/session-state";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";

export type TorEyeResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

export type TorEyeAction =
  | { kind: "gain"; source: TorEyeSource; points: number }
  /** Episódio de Revelação interpretado — a contagem volta ao valor inicial. */
  | { kind: "reveal" };

/**
 * Atenção do Olho subindo, e o episódio de Revelação.
 *
 * A configuração da regra (ligar, região, modificadores) vai pela rota de
 * sessão, como qualquer outro ajuste de mesa. Aqui ficam só os dois momentos que
 * a mesa precisa **ler no chat**: quando a Atenção sobe, e quando o Mestre já
 * interpretou a Revelação e a contagem volta ao início.
 *
 * O app **não decide** o episódio de Revelação: o livro deixa isso explicitamente
 * ao Mestre ("deveria ponderar as circunstâncias atuais da Companhia e escolher
 * um curso de eventos"). O que o app faz é avisar, em voz alta, no instante em
 * que o limiar é alcançado.
 */
export async function executeRoomTorEye(
  roomId: string,
  action: TorEyeAction,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorEyeResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };
  if (!canManageRoom(room, user)) {
    return { ok: false, error: "Só o Mestre registra a Atenção do Olho" };
  }

  const session = normalizeTorSession(room.torSession);
  const eye = session?.eye;
  if (!eye) {
    return { ok: false, error: "O Olho de Mordor é regra opcional e não está ligado nesta mesa" };
  }

  const threshold = torHuntThreshold(eye.region, eye.modifiers);
  const before = eye.value;

  let after: number;
  let text: string;

  if (action.kind === "reveal") {
    // "Assim que o Mestre tiver interpretado um episódio de Revelação, a
    // Companhia é considerada escondida de novo, e o nível de Atenção do Olho é
    // redefinido em seu valor INICIAL" — inicial, não zero.
    after = eye.initial;
    text = formatTorEyeMessage({ before, after, threshold, reset: true });
  } else {
    const points = Math.max(1, Math.min(10, Math.floor(action.points)));
    after = Math.min(99, before + points);
    text = formatTorEyeMessage({ before, after, threshold, source: action.source });
  }

  room.torSession = applyTorSessionPatch(session, { eye: { ...eye, value: after } });
  appendRoomChatMessage(room, { ...author, kind: "chat", text });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-eye] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}

/**
 * Sombra ganha **fora do combate** sobe a Atenção do Olho em quantidade igual.
 *
 * Chamada de dentro do handler de Sombra, e não uma ação separada, porque o
 * livro amarra as duas: "sempre que um herói-jogador ganha 1 ou mais pontos de
 * Sombra fora do combate, aumente o nível de Atenção do Olho em quantidade
 * igual". Deixar a cargo de o Mestre lembrar de clicar duas vezes é o mesmo que
 * não implementar.
 *
 * Devolve o texto para o chamador anexar à mensagem dele — não escreve no chat
 * nem persiste, porque quem persiste é o handler de Sombra, numa gravação só.
 */
export function applyTorEyeShadowGain(room: RoomState, shadowPoints: number): string | null {
  const points = Math.max(0, Math.floor(shadowPoints));
  if (points === 0) return null;

  const session = normalizeTorSession(room.torSession);
  const eye = session?.eye;
  if (!eye) return null;

  // "Sempre que um herói-jogador ganha 1 ou mais pontos de Sombra FORA DO
  // COMBATE". Fila de iniciativa montada é o sinal que a mesa já usa para dizer
  // que há um combate em curso — o mesmo que o painel de iniciativa mostra.
  if ((room.combat?.order.length ?? 0) > 0) return null;

  const threshold = torHuntThreshold(eye.region, eye.modifiers);
  const before = eye.value;
  const after = Math.min(99, before + points);
  room.torSession = applyTorSessionPatch(session, { eye: { ...eye, value: after } });

  return formatTorEyeMessage({ before, after, threshold, source: "sombra" });
}

/** Rótulo da fonte, para a UI não repetir a tabela. */
export function torEyeSourceLabel(source: TorEyeSource): string {
  return TOR_EYE_SOURCE_META[source].label;
}
