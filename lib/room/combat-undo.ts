import type { CombatTrack } from "./combat";
import type { RoomActor, RoomState } from "./types";
import type { BattleScene } from "@/lib/vtt/types";

export type CombatUndoKind = "move" | "attack" | "ability" | "area";

export type CombatUndoEntry = {
  id: string;
  tokenId: string;
  tokenName: string;
  kind: CombatUndoKind;
  summary: string;
  at: number;
  scene: BattleScene;
  actors: Record<string, RoomActor>;
  combat: CombatTrack;
};

const MAX_UNDO_STACK = 12;

/** Clone raso proposital — handlers criam novos objetos via spread,
 *  então o clone preserva as referências antigas sem structuredClone profundo. */
export function captureCombatUndoState(room: RoomState): Pick<CombatUndoEntry, "scene" | "actors" | "combat"> {
  return {
    scene: { ...room.scene, tokens: [...room.scene.tokens] },
    actors: { ...room.actors },
    combat: { ...room.combat },
  };
}

export function pushCombatUndo(
  room: RoomState,
  entry: {
    tokenId: string;
    tokenName: string;
    kind: CombatUndoKind;
    summary: string;
    stateBefore: Pick<CombatUndoEntry, "scene" | "actors" | "combat">;
  }
): CombatUndoEntry {
  const full: CombatUndoEntry = {
    id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: Date.now(),
    tokenId: entry.tokenId,
    tokenName: entry.tokenName,
    kind: entry.kind,
    summary: entry.summary,
    ...entry.stateBefore,
  };
  const stack = [...(room.combatUndo ?? []), full];
  room.combatUndo = stack.length > MAX_UNDO_STACK ? stack.slice(-MAX_UNDO_STACK) : stack;
  return full;
}

/** Registra estado atual antes de mutar a sala (ignora ações do mestre com bypass). */
export function maybeRecordCombatUndo(
  room: RoomState,
  opts: {
    tokenId: string;
    tokenName: string;
    kind: CombatUndoKind;
    summary: string;
    bypassTurn?: boolean;
  }
): void {
  if (opts.bypassTurn) return;
  pushCombatUndo(room, {
    tokenId: opts.tokenId,
    tokenName: opts.tokenName,
    kind: opts.kind,
    summary: opts.summary,
    stateBefore: captureCombatUndoState(room),
  });
}

export function latestUndoForToken(room: RoomState, tokenId: string): CombatUndoEntry | null {
  const stack = room.combatUndo ?? [];
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i]!.tokenId === tokenId) return stack[i]!;
  }
  return null;
}

export function revertCombatUndo(room: RoomState, undoId: string): CombatUndoEntry | null {
  const stack = room.combatUndo ?? [];
  const idx = stack.findIndex((u) => u.id === undoId);
  if (idx < 0) return null;

  const entry = stack[idx]!;
  room.scene = { ...entry.scene, tokens: [...entry.scene.tokens] };
  room.actors = { ...entry.actors };
  room.combat = { ...entry.combat };
  room.combatUndo = stack.slice(0, idx);
  return entry;
}
