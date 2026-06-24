"use client";

import { useEffect, useRef, useState } from "react";
import type { CombatModeTransitionPhase } from "@/components/vtt/CombatModeTransition";

/** Duração total da animação (deve bater com --cmt-total no CSS). */
export const COMBAT_MODE_TRANSITION_DURATION_MS = 1400;

/** Tempo sem interação na mesa após iniciar a transição. Menor que a duração para liberar a UI mais cedo. */
export const COMBAT_MODE_TRANSITION_LOCK_MS = 400;

export function useCombatModeTransition(combatActive: boolean): {
  phase: CombatModeTransitionPhase | null;
  locked: boolean;
} {
  const prevRef = useRef<boolean | null>(null);
  const [phase, setPhase] = useState<CombatModeTransitionPhase | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = combatActive;

    if (prev === null) return;
    if (prev === combatActive) return;

    setPhase(combatActive ? "in" : "out");
    setLocked(true);

    const unlockTimer = window.setTimeout(() => setLocked(false), COMBAT_MODE_TRANSITION_LOCK_MS);
    const endTimer = window.setTimeout(() => setPhase(null), COMBAT_MODE_TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(unlockTimer);
      window.clearTimeout(endTimer);
    };
  }, [combatActive]);

  return { phase, locked };
}
