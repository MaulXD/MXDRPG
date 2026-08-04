import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import {
  applyTorSessionPatch,
  normalizeTorSession,
  type TorSessionPatch,
} from "@/lib/combat/um-anel/session-state";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";

/**
 * Grava o estado de sessão do Um Anel (Jornada, Conselho, Fase de Companhia).
 *
 * Só o Mestre escreve — os três são ferramentas de condução. Os jogadores leem
 * pelo snapshot, que já carrega `torSession` para todos: é o que faz o placar da
 * Jornada aparecer na mesa em vez de existir só no chat.
 *
 * Isolamento de hub: recusa em mesa que não seja do Um Anel, para o campo nunca
 * aparecer num estado do Eldarin.
 */
export async function patchTorSession(
  roomId: string,
  user: SessionUser | null,
  patch: TorSessionPatch
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (!canManageRoom(room, user)) return null;
  if (room.rpgSystemId !== "um-anel") return null;

  const next = applyTorSessionPatch(normalizeTorSession(room.torSession), patch);
  if (next) room.torSession = next;
  else delete room.torSession;

  const updated = await persistRoom(roomId, room);
  return toSnapshot(updated);
}
