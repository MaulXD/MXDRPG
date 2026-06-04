"use client";

import { useMemo } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance, hexDirection, hexNeighbors, hexesInRange } from "@/lib/vtt/hex-math";
import {
  areaNeedsDirection,
  canCastAreaAt,
  computeSpellAreaHexes,
} from "@/lib/combat/area-spell";
import { canAbilityTarget } from "@/lib/combat/ability";
import { canAttackTarget } from "@/lib/combat/attack";
import type { CombatActionOption } from "@/lib/combat/types";
import type { CharacterSheet } from "@/lib/character/types";
import { isMoveMode, isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import { buildHexGrid } from "@/lib/vtt/hex-grid";
import { axialKey } from "@/lib/vtt/token-occupancy";
import { reachableMovementHexes } from "@/lib/vtt/movement-path";
import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { canMoveToken, type MoveCheck } from "@/lib/vtt/movement";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

type TurnCtx = {
  activeTokenId: string | null;
  bypassTurn: boolean;
};

type Params = {
  scene: BattleScene;
  actorRacas?: Record<string, string | undefined>;
  selected: BattleToken | null;
  selectedActor: CharacterSheet | null;
  actionMode: TokenActionMode;
  activeCombatAction: CombatActionOption | null;
  hoverAxial: Axial | null;
  areaCenter: Axial | null;
  areaDirection: number | null;
  turn: TurnCtx;
};

export function useBattlefieldHighlights({
  scene,
  actorRacas = {},
  selected,
  selectedActor,
  actionMode,
  activeCombatAction,
  hoverAxial,
  areaCenter,
  areaDirection,
  turn,
}: Params) {
  const moveMode: "walk" | "run" = actionMode === "move-run" ? "run" : "walk";
  const showMovement = Boolean(selected && isMoveMode(actionMode));
  const isAreaSpellMode = Boolean(
    selected &&
      actionMode === "spell" &&
      activeCombatAction?.areaShape &&
      activeCombatAction.areaShape !== "single"
  );

  const needsAreaDirection = Boolean(
    isAreaSpellMode &&
      activeCombatAction?.areaShape &&
      areaNeedsDirection(activeCombatAction.areaShape) &&
      areaCenter &&
      areaDirection == null
  );

  const gridCells = useMemo(() => buildHexGrid(scene.gridRadius), [scene.gridRadius]);

  const moveCtx = useMemo(
    () =>
      selected
        ? { tokens: scene.tokens, gridRadius: scene.gridRadius, actorRacas }
        : null,
    [selected, scene.tokens, scene.gridRadius, actorRacas]
  );

  const rangeSet = useMemo(() => {
    if (!selected || !showMovement) return new Set<string>();
    const cells = reachableMovementHexes(selected, moveMode, scene, actorRacas);
    return new Set(cells.map(axialKey));
  }, [selected, showMovement, moveMode, scene, actorRacas]);

  const walkSet = useMemo(() => {
    if (!selected || !showMovement) return new Set<string>();
    const cells = reachableMovementHexes(selected, "walk", scene, actorRacas);
    return new Set(cells.map(axialKey));
  }, [selected, showMovement, scene, actorRacas]);

  const movePaOpts = useMemo(
    () =>
      selectedActor
        ? { freeBasicMovePa: paTurnRulesForActor(selectedActor).freeBasicMovePa }
        : undefined,
    [selectedActor]
  );

  /** Hexes alcançáveis em caminhada que ainda gastam PA (faixas do livro). */
  const paidWalkSet = useMemo(() => {
    if (!selected || !showMovement || !moveCtx) return new Set<string>();
    const set = new Set<string>();
    for (const key of walkSet) {
      const [q, r] = key.split(",").map(Number);
      const check = canMoveToken(selected, { q, r }, "walk", moveCtx, movePaOpts);
      if (check.ok && check.paCost > 0) set.add(key);
    }
    return set;
  }, [selected, showMovement, walkSet, moveCtx, movePaOpts]);

  const attackRangeSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode && !needsAreaDirection) {
      return new Set(
        hexesInRange(selected.axial, activeCombatAction.rangeHex).map((c) => `${c.q},${c.r}`)
      );
    }
    if (isAreaSpellMode && needsAreaDirection) return new Set<string>();
    return new Set(
      hexesInRange(selected.axial, activeCombatAction.rangeHex)
        .filter((c) => axialDistance(selected.axial, c) > 0)
        .map((c) => `${c.q},${c.r}`)
    );
  }, [selected, activeCombatAction, actionMode, isAreaSpellMode, needsAreaDirection]);

  const areaDirectionSet = useMemo(() => {
    if (!needsAreaDirection || !areaCenter) return new Set<string>();
    return new Set(hexNeighbors(areaCenter).map((c) => `${c.q},${c.r}`));
  }, [needsAreaDirection, areaCenter]);

  const previewDirection = useMemo(() => {
    if (areaDirection != null) return areaDirection;
    if (!needsAreaDirection || !areaCenter || !hoverAxial) return null;
    return hexDirection(areaCenter, hoverAxial);
  }, [areaDirection, needsAreaDirection, areaCenter, hoverAxial]);

  const areaPreviewSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isAreaSpellMode) return new Set<string>();
    const previewCenter = needsAreaDirection ? areaCenter : hoverAxial;
    if (!previewCenter) return new Set<string>();
    const check = canCastAreaAt(selected, previewCenter, activeCombatAction, {
      activeTokenId: turn.activeTokenId,
      bypassTurn: turn.bypassTurn,
    });
    if (!check.ok) return new Set<string>();
    if (needsAreaDirection && previewDirection == null) {
      return new Set([`${previewCenter.q},${previewCenter.r}`]);
    }
    const hexes = computeSpellAreaHexes(
      previewCenter,
      activeCombatAction.areaShape ?? "burst",
      activeCombatAction.areaRadiusHex ?? 1,
      activeCombatAction.areaHexCount,
      previewDirection,
      activeCombatAction.areaRadiusHex ?? 1
    );
    return new Set(hexes.map((c) => `${c.q},${c.r}`));
  }, [
    selected,
    activeCombatAction,
    isAreaSpellMode,
    hoverAxial,
    areaCenter,
    previewDirection,
    needsAreaDirection,
    turn,
  ]);

  const hoverMovePreview: MoveCheck | null = useMemo(() => {
    if (!selected || !hoverAxial || !showMovement || !moveCtx) return null;
    return canMoveToken(selected, hoverAxial, moveMode, moveCtx, movePaOpts);
  }, [selected, hoverAxial, showMovement, moveMode, moveCtx, movePaOpts]);

  const hoverPathCells: Axial[] = useMemo(() => {
    if (!hoverMovePreview?.ok || !hoverMovePreview.path?.length) return [];
    return hoverMovePreview.path;
  }, [hoverMovePreview]);

  const attackableIds = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (activeCombatAction.selfTarget) return new Set<string>();
    const ids = new Set<string>();
    for (const t of scene.tokens) {
      if (t.id === selected.id) continue;
      const check =
        activeCombatAction.kind === "ability"
          ? canAbilityTarget(selected, t, activeCombatAction, turn, selectedActor)
          : canAttackTarget(selected, t, activeCombatAction, turn, { actor: selectedActor });
      if (check.ok) ids.add(t.id);
    }
    return ids;
  }, [selected, selectedActor, scene.tokens, activeCombatAction, actionMode, turn]);

  return {
    gridCells,
    rangeSet,
    walkSet,
    paidWalkSet,
    attackRangeSet,
    areaPreviewSet,
    areaDirectionSet,
    hoverMovePreview,
    hoverPathCells,
    attackableIds,
    showMovement,
    isAreaSpellMode,
    needsAreaDirection,
    moveMode,
  };
}
