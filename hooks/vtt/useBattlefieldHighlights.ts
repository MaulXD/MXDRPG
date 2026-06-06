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
  combatRound?: number;
};

type Params = {
  scene: BattleScene;
  actorRacas?: Record<string, string | undefined>;
  selected: BattleToken | null;
  selectedActor: CharacterSheet | null;
  actionMode: TokenActionMode;
  activeCombatAction: CombatActionOption | null;
  hoverAxial: Axial | null;
  hoverTurnToken: BattleToken | null;
  hoverTurnActor: CharacterSheet | null;
  canPreviewTurnMove?: (token: BattleToken) => boolean;
  areaCenter: Axial | null;
  areaDirection: number | null;
  channelExtraPa?: number;
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
  hoverTurnToken,
  hoverTurnActor,
  canPreviewTurnMove,
  areaCenter,
  areaDirection,
  channelExtraPa = 0,
  turn,
}: Params) {
  const moveMode: "walk" | "run" = actionMode === "move-run" ? "run" : "walk";
  const turnMovePreview = Boolean(
    actionMode === "idle" &&
      hoverTurnToken &&
      canPreviewTurnMove?.(hoverTurnToken)
  );
  const moveHighlightToken = isMoveMode(actionMode)
    ? selected
    : turnMovePreview
      ? hoverTurnToken
      : null;
  const canActMoveNow = Boolean(
    moveHighlightToken &&
      (!turn.activeTokenId ||
        turn.activeTokenId === moveHighlightToken.id ||
        turn.bypassTurn)
  );
  const showMovement = Boolean(
    moveHighlightToken &&
      canActMoveNow &&
      (isMoveMode(actionMode) || turnMovePreview)
  );
  const effectiveMoveMode: "walk" | "run" = turnMovePreview ? "walk" : moveMode;
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
      areaDirection == null
  );

  const gridCells = useMemo(() => buildHexGrid(scene.gridRadius), [scene.gridRadius]);

  const moveCtx = useMemo(
    () =>
      moveHighlightToken
        ? {
            tokens: scene.tokens,
            gridRadius: scene.gridRadius,
            actorRacas,
            dungeonObjects: scene.dungeonObjects,
          }
        : null,
    [moveHighlightToken, scene.tokens, scene.gridRadius, scene.dungeonObjects, actorRacas]
  );

  const highlightActor = turnMovePreview ? hoverTurnActor : selectedActor;

  const rangeSet = useMemo(() => {
    if (!moveHighlightToken || !showMovement || turnMovePreview) return new Set<string>();
    const cells = reachableMovementHexes(moveHighlightToken, effectiveMoveMode, scene, actorRacas);
    return new Set(cells.map(axialKey));
  }, [moveHighlightToken, showMovement, turnMovePreview, effectiveMoveMode, scene, actorRacas]);

  const walkSet = useMemo(() => {
    if (!moveHighlightToken || !showMovement) return new Set<string>();
    const cells = reachableMovementHexes(moveHighlightToken, "walk", scene, actorRacas);
    return new Set(cells.map(axialKey));
  }, [moveHighlightToken, showMovement, scene, actorRacas]);

  const movePaOptsHighlight = useMemo(
    () => ({
      ...(highlightActor
        ? { freeBasicMovePa: paTurnRulesForActor(highlightActor).freeBasicMovePa }
        : {}),
      ...(turn.bypassTurn ? { gmBypass: true as const } : {}),
    }),
    [highlightActor, turn.bypassTurn]
  );

  const paidWalkSet = useMemo(() => {
    if (!moveHighlightToken || !showMovement || !moveCtx || turnMovePreview) {
      return new Set<string>();
    }
    const hexKeys =
      effectiveMoveMode === "run"
        ? new Set([...walkSet, ...rangeSet])
        : walkSet;
    const set = new Set<string>();
    for (const key of hexKeys) {
      const [q, r] = key.split(",").map(Number);
      const check = canMoveToken(
        moveHighlightToken,
        { q, r },
        effectiveMoveMode,
        moveCtx,
        movePaOptsHighlight
      );
      if (check.ok && check.paCost > 0) set.add(key);
    }
    return set;
  }, [
    moveHighlightToken,
    showMovement,
    walkSet,
    rangeSet,
    moveCtx,
    movePaOptsHighlight,
    turnMovePreview,
    effectiveMoveMode,
  ]);

  const attackRangeSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode && !needsAreaDirection) {
      return new Set(
        hexesInRange(selected.axial, activeCombatAction.rangeHex).map((c) => `${c.q},${c.r}`)
      );
    }
    if (isAreaSpellMode && needsAreaDirection && selected) {
      return new Set([`${selected.axial.q},${selected.axial.r}`]);
    }
    return new Set(
      hexesInRange(selected.axial, activeCombatAction.rangeHex)
        .filter((c) => axialDistance(selected.axial, c) > 0)
        .map((c) => `${c.q},${c.r}`)
    );
  }, [selected, activeCombatAction, actionMode, isAreaSpellMode, needsAreaDirection, turn]);

  const areaDirectionSet = useMemo(() => {
    if (!needsAreaDirection || !selected) return new Set<string>();
    return new Set(hexNeighbors(selected.axial).map((c) => `${c.q},${c.r}`));
  }, [needsAreaDirection, selected]);

  const previewDirection = useMemo(() => {
    if (areaDirection != null) return areaDirection;
    if (!needsAreaDirection || !selected || !hoverAxial) return null;
    return hexDirection(selected.axial, hoverAxial);
  }, [areaDirection, needsAreaDirection, selected, hoverAxial]);

  const areaPreviewSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isAreaSpellMode) return new Set<string>();
    const previewCenter = needsAreaDirection ? selected.axial : hoverAxial;
    if (!previewCenter) return new Set<string>();
    const check = canCastAreaAt(
      selected,
      previewCenter,
      activeCombatAction,
      {
        activeTokenId: turn.activeTokenId,
        bypassTurn: turn.bypassTurn,
        combatRound: turn.combatRound,
      },
      selectedActor,
      channelExtraPa
    );
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
    selectedActor,
    channelExtraPa,
  ]);

  const hoverMovePreview: MoveCheck | null = useMemo(() => {
    if (!moveHighlightToken || !hoverAxial || !showMovement || !moveCtx) return null;
    return canMoveToken(
      moveHighlightToken,
      hoverAxial,
      effectiveMoveMode,
      moveCtx,
      movePaOptsHighlight
    );
  }, [
    moveHighlightToken,
    hoverAxial,
    showMovement,
    turnMovePreview,
    effectiveMoveMode,
    moveCtx,
    movePaOptsHighlight,
  ]);

  const hoverPathCells: Axial[] = useMemo(() => {
    if (!hoverMovePreview?.ok || !hoverMovePreview.path?.length) return [];
    return hoverMovePreview.path;
  }, [hoverMovePreview]);

  const attackableIds = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode) return new Set<string>();
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
  }, [selected, selectedActor, scene.tokens, activeCombatAction, actionMode, isAreaSpellMode, turn]);

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
    turnMovePreview,
    isAreaSpellMode,
    needsAreaDirection,
    moveMode: effectiveMoveMode,
  };
}
