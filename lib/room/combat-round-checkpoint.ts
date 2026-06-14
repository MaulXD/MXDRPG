import type { CombatTrack } from "./combat";
import type { RoomActor, RoomState } from "./types";
import type { BattleScene } from "@/lib/vtt/types";

export type CombatRoundCheckpoint = {
  round: number;
  at: number;
  scene: BattleScene;
  actors: Record<string, RoomActor>;
  combat: CombatTrack;
};

export const MAX_ROUND_CHECKPOINTS = 20;

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

export function captureRoundCheckpoint(room: RoomState): CombatRoundCheckpoint {
  return {
    round: room.combat.round,
    at: Date.now(),
    scene: cloneState(room.scene),
    actors: cloneState(room.actors),
    combat: cloneState(room.combat),
  };
}

export function pushRoundCheckpoint(room: RoomState): void {
  const entry = captureRoundCheckpoint(room);
  const stack = [...(room.combat.roundCheckpoints ?? []), entry];
  room.combat = {
    ...room.combat,
    roundCheckpoints:
      stack.length > MAX_ROUND_CHECKPOINTS
        ? stack.slice(-MAX_ROUND_CHECKPOINTS)
        : stack,
  };
}

export function restoreRoundCheckpoint(
  room: RoomState,
  round: number
): CombatRoundCheckpoint | null {
  const stack = room.combat.roundCheckpoints ?? [];
  const idx = stack.findLastIndex((c) => c.round === round);
  if (idx < 0) return null;

  const entry = stack[idx]!;
  room.scene = cloneState(entry.scene);
  room.actors = cloneState(entry.actors);
  room.combat = {
    ...cloneState(entry.combat),
    roundCheckpoints: stack.slice(0, idx),
  };
  return entry;
}
