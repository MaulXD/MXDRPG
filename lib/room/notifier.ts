import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

export function notifyRoomUpdated(roomId: string, revision: number): void {
  emitter.emit(`room:${roomId}`, revision);
}

export function onRoomUpdated(
  roomId: string,
  callback: (revision: number) => void
): () => void {
  emitter.on(`room:${roomId}`, callback);
  return () => {
    emitter.off(`room:${roomId}`, callback);
  };
}
