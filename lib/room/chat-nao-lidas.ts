import type { ChatMessage } from "./chat";

/**
 * Autores automáticos que não contam como mensagem nova: "system" é o aviso de
 * abertura da mesa e "xp" é o XP por monstro derrubado (efeito da própria ação).
 */
const AUTORES_AUTOMATICOS: ReadonlySet<string> = new Set(["system", "xp"]);

/**
 * Conta as mensagens do chat que chegaram depois de `vistoAte` (ms, relógio do
 * servidor, o mesmo de `at`) e que não foram escritas pelo próprio usuário nem
 * geradas automaticamente. Função pura, sem efeitos.
 */
export function contarMensagensNaoLidas(
  messages: readonly ChatMessage[],
  vistoAte: number,
  selfId: string | null,
): number {
  let total = 0;
  for (const message of messages) {
    if (message.at <= vistoAte) continue;
    if (selfId !== null && message.authorId === selfId) continue;
    if (AUTORES_AUTOMATICOS.has(message.authorId)) continue;
    total += 1;
  }
  return total;
}

/** Maior `at` da lista (0 se vazia). */
export function instanteMaisRecente(messages: readonly ChatMessage[]): number {
  let max = 0;
  for (const message of messages) {
    if (message.at > max) max = message.at;
  }
  return max;
}
