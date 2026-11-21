import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRoomNotifier: EventEmitter | undefined;
}

/**
 * Um emissor só para o processo inteiro (BV-048). Cada rota do Next pode carregar
 * a própria cópia deste módulo; com o emissor no módulo, uma rota fora de
 * /api/room (ex.: PATCH /api/tor-characters/[id]) avisava um emissor que a rota
 * SSE (/api/room/[roomId]/events) não escutava. Mesmo padrão de rooms() e presence.
 */
function emitter(): EventEmitter {
  if (!globalThis.__eldarinRoomNotifier) {
    const e = new EventEmitter();
    e.setMaxListeners(200);
    globalThis.__eldarinRoomNotifier = e;
  }
  return globalThis.__eldarinRoomNotifier;
}

export function notifyRoomUpdated(roomId: string, revision: number): void {
  emitter().emit(`room:${roomId}`, revision);
}

export function onRoomUpdated(
  roomId: string,
  callback: (revision: number) => void
): () => void {
  const e = emitter();
  e.on(`room:${roomId}`, callback);
  return () => {
    e.off(`room:${roomId}`, callback);
  };
}
