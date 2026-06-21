import { normalizeRoomSettings } from "@/lib/room/settings";
import type { RoomSnapshot } from "@/lib/room/types";

/** Evita que SSE/poll reverta combatActive enquanto POST do toggle está in flight. */
let pendingRoomId: string | null = null;
let pendingCombatActive: boolean | null = null;

export function setCombatModeTogglePending(
  roomId: string,
  combatActive: boolean | null
): void {
  if (combatActive === null) {
    pendingRoomId = null;
    pendingCombatActive = null;
    return;
  }
  pendingRoomId = roomId;
  pendingCombatActive = combatActive;
}

export function getCombatModeTogglePending(roomId?: string): boolean | null {
  if (pendingCombatActive === null) return null;
  if (roomId && pendingRoomId !== roomId) return null;
  return pendingCombatActive;
}

export function isCombatModeTogglePending(roomId?: string): boolean {
  return getCombatModeTogglePending(roomId) !== null;
}

/** Mantém o modo escolhido pelo mestre até o POST confirmar. */
export function clampSnapshotCombatMode(snapshot: RoomSnapshot): RoomSnapshot {
  const target = getCombatModeTogglePending(snapshot.roomId);
  if (target === null) return snapshot;

  const settings = normalizeRoomSettings({
    ...snapshot.settings,
    combatActive: target,
  });
  if (settings === snapshot.settings) return snapshot;
  return { ...snapshot, settings };
}
