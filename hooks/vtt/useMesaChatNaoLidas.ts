"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { contarMensagensNaoLidas, instanteMaisRecente } from "@/lib/room/chat-nao-lidas";
import { getMesaRoomStore } from "@/hooks/vtt/mesa-room-store";

/**
 * Número de mensagens do chat ainda não lidas (BV-055). Com o chat aberto marca
 * tudo como lido e devolve 0.
 *
 * - Relógio: `vistoAte` sai sempre do `at` das mensagens (relógio do servidor),
 *   nunca do Date.now() do cliente.
 * - Histórico: na primeira vez que a sala carrega, o que já existe conta como lido.
 * - Desempenho: assina a fatia de chat do store, mas devolve um número; o
 *   componente só redesenha quando o número muda, não a cada mensagem.
 */
export function useMesaChatNaoLidas(
  roomId: string,
  chatAberto: boolean,
  selfId: string | null,
): number {
  const store = getMesaRoomStore(roomId);
  const vistoAteRef = useRef<number | null>(null);

  const getCount = useCallback(() => {
    const messages = store.getChat();
    if (vistoAteRef.current === null) {
      // Sala ainda não carregou: nada a contar. Carregou: o histórico conta como lido.
      if (!store.getSnapshotFull()) return 0;
      vistoAteRef.current = instanteMaisRecente(messages);
      return 0;
    }
    if (chatAberto) {
      vistoAteRef.current = Math.max(vistoAteRef.current, instanteMaisRecente(messages));
      return 0;
    }
    return contarMensagensNaoLidas(messages, vistoAteRef.current, selfId);
  }, [store, chatAberto, selfId]);

  return useSyncExternalStore(
    (cb) => store.subscribe("chat", cb),
    getCount,
    () => 0
  );
}
