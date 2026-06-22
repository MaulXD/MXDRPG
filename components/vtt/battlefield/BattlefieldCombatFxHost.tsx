"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatFxState } from "@/lib/vtt/combat-fx-types";
import type { TokenCastFxKind } from "@/lib/vtt/token-cast-fx";
import type { BattlefieldView } from "@/lib/vtt/battlefield-view";
import type { TokenCombatFlash } from "@/components/vtt/CombatFxLayer";

const CombatFxLayer = dynamic(
  () => import("@/components/vtt/CombatFxLayer").then((m) => m.CombatFxLayer),
  { ssr: false }
);

type GridMetrics = {
  cellSize: number;
  ox: number;
  oy: number;
};

type Props = {
  wrapRef: RefObject<HTMLDivElement | null>;
  combatFxGrid: GridMetrics;
  view: BattlefieldView;
  fx: CombatFxState | null;
  tokens: BattleToken[];
  onApplyState: () => void;
  onTokenFlash: (
    tokenId: string | null,
    kind: import("@/lib/vtt/draw-battlefield").TokenFlashKind | null
  ) => void;
  onTokenCastFx: (tokenId: string, kind: TokenCastFxKind) => void;
  onChatReveal?: (messageIds: string[], phase: "roll" | "damage" | "done") => void;
  onDone: () => void;
};

/** Camada de FX de combate (dados 3D, flashes) sobre o canvas. */
export function BattlefieldCombatFxHost({
  wrapRef,
  combatFxGrid,
  view,
  fx,
  tokens,
  onApplyState,
  onTokenFlash,
  onTokenCastFx,
  onChatReveal,
  onDone,
}: Props) {
  if (!fx) return null;

  return (
    <CombatFxLayer
      wrapRef={wrapRef}
      cellSize={combatFxGrid.cellSize}
      gridOx={combatFxGrid.ox}
      gridOy={combatFxGrid.oy}
      fx={fx}
      tokens={tokens}
      view={view}
      onApplyState={onApplyState}
      onTokenFlash={onTokenFlash}
      onTokenCastFx={onTokenCastFx}
      onChatReveal={onChatReveal}
      onDone={onDone}
    />
  );
}
