"use client";

import { useEffect, useRef, useState } from "react";
import type { CombatModeTransitionPhase } from "@/components/vtt/CombatModeTransition";

/** Duração total da animação (deve bater com --cmt-total no CSS). */
export const COMBAT_MODE_TRANSITION_DURATION_MS = 2300;

/** Tempo sem interação na mesa — cobre animação completa. */
export const COMBAT_MODE_TRANSITION_LOCK_MS = COMBAT_MODE_TRANSITION_DURATION_MS;

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

    const timer = window.setTimeout(() => {
      setLocked(false);
      setPhase(null);
    }, COMBAT_MODE_TRANSITION_LOCK_MS);

    return () => window.clearTimeout(timer);
  }, [combatActive]);

  return { phase, locked };
}
