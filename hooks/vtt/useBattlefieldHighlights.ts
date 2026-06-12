"use client";

import { useMemo } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance, hexDirection, hexNeighbors, hexesInRange } from "@/lib/vtt/hex-math";
import {
  areaUsesCasterOrigin,
  canCastAreaAt,
  computeSpellAreaHexes,
} from "@/lib/combat/area-spell";
import { canAbilityTarget } from "@/lib/combat/ability";
import { canAttackTarget, isHealingSpell } from "@/lib/combat/attack";
import { tokensInArea } from "@/lib/combat/area-spell";
import { attackerForCombatCheck } from "@/lib/combat/combat-token-pa";
import type { CombatActionOption } from "@/lib/combat/types";
import type { CharacterSheet } from "@/lib/character/types";
import { isMoveMode, isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import { buildHexGrid } from "@/lib/vtt/hex-grid";
import { tokenAxialDistance } from "@/lib/vtt/creature-size";
import { reachabilityBundle } from "@/lib/vtt/movement-path";
import { effectiveRangedMaxHex, isWithinRangedAttackRange } from "@/lib/combat/ranged-attack-range";
import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { canMoveToken, paidMovementHexKeys, type MoveCheck } from "@/lib/vtt/movement";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { canActOnCombatTurn, effectiveBypassTurn } from "@/lib/combat/turn-guard";

type TurnCtx = {
  activeTokenId: string | null;
  bypassTurn: boolean;
  combatRound?: number;
  combatHasOrder?: boolean;
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
  combatHasOrder?: boolean;
  /** Mestre arrastando token livremente — sem preview de PA/movimento de turno. */
  gmRepositionActive?: boolean;
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
  combatHasOrder = true,
  gmRepositionActive = false,
}: Params) {
  const moveMode: "walk" | "run" = actionMode === "move-run" ? "run" : "walk";
  const turnMovePreview = Boolean(
    !gmRepositionActive &&
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
      canActOnCombatTurn(moveHighlightToken.id, {
        activeTokenId: turn.activeTokenId,
        bypassTurn: effectiveBypassTurn(moveHighlightToken, turn.bypassTurn),
        combatHasOrder: turn.combatHasOrder,
      })
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

  const areaShape = activeCombatAction?.areaShape;
  const isWallSpell = areaShape === "wall";
  const wallAwaitingDirection = Boolean(isWallSpell && areaCenter);

  const needsAreaDirection = Boolean(
    isAreaSpellMode &&
      areaShape &&
      ((areaUsesCasterOrigin(areaShape) && areaDirection == null) ||
        (isWallSpell && areaCenter != null))
  );

  const gridCells = useMemo(() => buildHexGrid(scene.gridRadius), [scene.gridRadius]);

  const sceneMoveKey = useMemo(
    () =>
      `${scene.gridRadius}|${scene.tokens
        .map((t) => `${t.id}:${t.axial.q},${t.axial.r}`)
        .join(";")}|${(scene.dungeonObjects ?? [])
        .map((o) => `${o.id}:${o.q},${o.r}`)
        .join(";")}`,
    [scene.gridRadius, scene.tokens, scene.dungeonObjects]
  );

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

  const walkReach = useMemo(() => {
    if (!moveHighlightToken || !showMovement) return null;
    return reachabilityBundle(moveHighlightToken, "walk", scene, actorRacas);
  }, [moveHighlightToken, showMovement, sceneMoveKey, actorRacas]);

  const runReach = useMemo(() => {
    if (
      !moveHighlightToken ||
      !showMovement ||
      turnMovePreview ||
      effectiveMoveMode === "walk"
    ) {
      return null;
    }
    return reachabilityBundle(moveHighlightToken, "run", scene, actorRacas);
  }, [
    moveHighlightToken,
    showMovement,
    turnMovePreview,
    effectiveMoveMode,
    sceneMoveKey,
    actorRacas,
  ]);

  const walkSet = useMemo(
    () => walkReach?.footprintKeys ?? new Set<string>(),
    [walkReach]
  );

  const rangeSet = useMemo(() => {
    if (!runReach) return new Set<string>();
    const set = new Set(runReach.footprintKeys);
    for (const key of walkSet) set.delete(key);
    return set;
  }, [runReach, walkSet]);

  const movePaOptsHighlight = useMemo(() => {
    const moveBypass = moveHighlightToken
      ? effectiveBypassTurn(moveHighlightToken, turn.bypassTurn)
      : false;
    return {
      ...(highlightActor
        ? { freeBasicMovePa: paTurnRulesForActor(highlightActor).freeBasicMovePa }
        : {}),
      ...(moveBypass ? { gmBypass: true as const } : {}),
    };
  }, [highlightActor, moveHighlightToken, turn.bypassTurn]);

  const paidWalkSet = useMemo(() => {
    if (!moveHighlightToken || !showMovement || !moveCtx) {
      return new Set<string>();
    }
    const bundle = effectiveMoveMode === "run" ? runReach : walkReach;
    if (!bundle) return new Set<string>();
    return paidMovementHexKeys(
      moveHighlightToken,
      effectiveMoveMode,
      moveCtx,
      movePaOptsHighlight,
      bundle.distMap
    );
  }, [
    moveHighlightToken,
    showMovement,
    moveCtx,
    movePaOptsHighlight,
    effectiveMoveMode,
    walkReach,
    runReach,
    sceneMoveKey,
  ]);

  const attackRangeSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode && !needsAreaDirection) {
      return new Set(
        hexesInRange(selected.axial, activeCombatAction.rangeHex).map((c) => `${c.q},${c.r}`)
      );
    }
    if (isAreaSpellMode && needsAreaDirection && areaUsesCasterOrigin(activeCombatAction.areaShape ?? "burst") && selected) {
      return new Set([`${selected.axial.q},${selected.axial.r}`]);
    }
    if (isAreaSpellMode && wallAwaitingDirection && areaCenter) {
      return new Set(hexNeighbors(areaCenter).map((c) => `${c.q},${c.r}`));
    }
    return new Set(
      hexesInRange(selected.axial, effectiveRangedMaxHex(activeCombatAction))
        .filter((c) => axialDistance(selected.axial, c) > 0)
        .map((c) => `${c.q},${c.r}`)
    );
  }, [selected, activeCombatAction, actionMode, isAreaSpellMode, needsAreaDirection, wallAwaitingDirection, areaCenter, turn]);

  const areaDirectionSet = useMemo(() => {
    if (!needsAreaDirection) return new Set<string>();
    if (wallAwaitingDirection && areaCenter) {
      return new Set(hexNeighbors(areaCenter).map((c) => `${c.q},${c.r}`));
    }
    if (selected) {
      return new Set(hexNeighbors(selected.axial).map((c) => `${c.q},${c.r}`));
    }
    return new Set<string>();
  }, [needsAreaDirection, wallAwaitingDirection, areaCenter, selected]);

  const previewDirection = useMemo(() => {
    if (areaDirection != null) return areaDirection;
    if (!needsAreaDirection || !hoverAxial) return null;
    const origin =
      wallAwaitingDirection && areaCenter
        ? areaCenter
        : selected?.axial ?? null;
    if (!origin) return null;
    return hexDirection(origin, hoverAxial);
  }, [areaDirection, needsAreaDirection, wallAwaitingDirection, areaCenter, selected, hoverAxial]);

  const areaPreviewSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isAreaSpellMode) return new Set<string>();
    const previewCenter = areaUsesCasterOrigin(activeCombatAction.areaShape ?? "burst")
      ? selected.axial
      : wallAwaitingDirection && areaCenter
        ? areaCenter
        : hoverAxial;
    if (!previewCenter) return new Set<string>();
    const check = canCastAreaAt(
      selected,
      previewCenter,
      activeCombatAction,
      {
        activeTokenId: turn.activeTokenId,
        bypassTurn: effectiveBypassTurn(selected, turn.bypassTurn),
        combatRound: turn.combatRound,
        combatHasOrder: turn.combatHasOrder,
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

  const areaTargetIds = useMemo(() => {
    if (!selected || !activeCombatAction || !isAreaSpellMode) return new Set<string>();
    if (areaPreviewSet.size === 0) return new Set<string>();
    const hexes: Axial[] = [];
    for (const key of areaPreviewSet) {
      const [q, r] = key.split(",").map(Number);
      hexes.push({ q, r });
    }
    const areaHeal = isHealingSpell(activeCombatAction);
    return new Set(
      tokensInArea(scene.tokens, hexes, actorRacas)
        .filter((t) => areaHeal || t.id !== selected.id)
        .map((t) => t.id)
    );
  }, [
    selected,
    activeCombatAction,
    isAreaSpellMode,
    areaPreviewSet,
    scene.tokens,
    actorRacas,
  ]);

  /** Tokens no alcance (só distância) — anel no mapa mesmo se PA/turno bloquear. */
  const rangeTargetIds = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode) return areaTargetIds;
    if (activeCombatAction.selfTarget) return new Set<string>();
    const ids = new Set<string>();
    for (const t of scene.tokens) {
      if (t.id === selected.id) continue;
      const dist = tokenAxialDistance(selected, t, actorRacas);
      if (isWithinRangedAttackRange(dist, activeCombatAction)) ids.add(t.id);
    }
    return ids;
  }, [
    selected,
    scene.tokens,
    activeCombatAction,
    actionMode,
    isAreaSpellMode,
    areaTargetIds,
    actorRacas,
  ]);

  const attackableIds = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode) return areaTargetIds;
    if (activeCombatAction.selfTarget) return new Set<string>();
    const selectedTurn = {
      activeTokenId: turn.activeTokenId,
      bypassTurn: effectiveBypassTurn(selected, turn.bypassTurn),
      combatRound: turn.combatRound,
      combatHasOrder: turn.combatHasOrder ?? combatHasOrder,
    };
    const attacker = attackerForCombatCheck(selected, selectedActor, selectedTurn, {
      combatHasOrder,
    });
    const ids = new Set<string>();
    for (const t of scene.tokens) {
      if (t.id === selected.id) continue;
      const check =
        activeCombatAction.kind === "ability"
          ? canAbilityTarget(attacker, t, activeCombatAction, selectedTurn, selectedActor)
          : canAttackTarget(attacker, t, activeCombatAction, selectedTurn, { actor: selectedActor });
      if (check.ok) ids.add(t.id);
    }
    return ids;
  }, [
    selected,
    selectedActor,
    scene.tokens,
    activeCombatAction,
    actionMode,
    isAreaSpellMode,
    turn,
    combatHasOrder,
    areaTargetIds,
  ]);

  return useMemo(
    () => ({
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
      rangeTargetIds,
      areaTargetIds,
      showMovement,
      turnMovePreview,
      isAreaSpellMode,
      needsAreaDirection,
      moveMode: effectiveMoveMode,
    }),
    [
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
      rangeTargetIds,
      areaTargetIds,
      showMovement,
      turnMovePreview,
      isAreaSpellMode,
      needsAreaDirection,
      effectiveMoveMode,
    ]
  );
}
