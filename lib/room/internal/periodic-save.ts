/**
 * Salva periódico de salas — desacopla writes do DB do caminho crítico.
 *
 * Durante o jogo a sala vive em memória (registry.ts). A cada SAVE_INTERVAL_MS
 * o estado mais recente de cada sala modificada é gravado no DB em lote.
 * Pior caso de perda: 1 min de ações (aceitável para hospedagem local).
 */
import * as dbRooms from "@/lib/db/rooms";
import type { RoomState } from "../types";

const SAVE_INTERVAL_MS = 60_000;

declare global {
  // eslint-disable-next-line no-var
  var __eldarinPeriodicSave:
    | { pending: Map<string, RoomState>; timer: ReturnType<typeof setInterval> }
    | undefined;
}

function getStore() {
  if (!globalThis.__eldarinPeriodicSave) {
    const pending = new Map<string, RoomState>();

    const timer = setInterval(() => {
      if (!pending.size) return;
      const batch = Array.from(pending.entries());
      pending.clear();
      for (const [roomId, state] of batch) {
        dbRooms.saveRoom(state).catch((e) => {
          console.error("[periodic-save] falha ao persistir sala:", roomId, e);
        });
      }
    }, SAVE_INTERVAL_MS);

    // Não bloqueia o processo Node ao encerrar
    if (timer.unref) timer.unref();

    globalThis.__eldarinPeriodicSave = { pending, timer };
  }
  return globalThis.__eldarinPeriodicSave;
}

/** Agenda gravação da sala. Substitui o await dbRooms.saveRoom() inline. */
export function scheduleSave(roomId: string, state: RoomState): void {
  if (roomId === "demo") return;
  getStore().pending.set(roomId, state);
}

/** Força flush imediato — útil no SIGTERM / shutdown gracioso. */
export async function flushPendingSaves(): Promise<void> {
  const store = globalThis.__eldarinPeriodicSave;
  if (!store?.pending.size) return;
  const batch = Array.from(store.pending.entries());
  store.pending.clear();
  await Promise.allSettled(
    batch.map(([roomId, state]) =>
      dbRooms.saveRoom(state).catch((e) =>
        console.error("[periodic-save] flush falhou:", roomId, e)
      )
    )
  );
}
