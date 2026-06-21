import "server-only";

import { tickRoomAutoPass } from "@/lib/room/handlers/combat-turn";

const lastTickAt = new Map<string, number>();
/** Evita N clientes SSE disparando auto-passe + persist no MariaDB ao mesmo tempo. */
const AUTO_PASS_TICK_MS = 2_500;

/** Executa auto-passe vencido no máximo 1× por intervalo por sala. */
export async function tickRoomAutoPassThrottled(roomId: string): Promise<boolean> {
  const now = Date.now();
  const last = lastTickAt.get(roomId) ?? 0;
  if (now - last < AUTO_PASS_TICK_MS) return false;
  lastTickAt.set(roomId, now);
  return tickRoomAutoPass(roomId);
}
