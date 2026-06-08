"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";

type Props = {
  combat: CombatTrack | null | undefined;
  tokens: BattleToken[];
};

const HOLD_MS = 2000;
const FADE_MS = 420;

function combatTurnKey(combat: CombatTrack): string {
  const activeId = activeTokenId(combat);
  return `${combat.round}:${combat.activeIndex}:${activeId ?? ""}`;
}

/** Escurece o mapa e anuncia o novo turno ao passar a vez. */
export function TurnHandoffOverlay({ combat, tokens }: Props) {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">("hidden");
  const [name, setName] = useState("");
  const prevKey = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const tokensRef = useRef(tokens);
  const combatRef = useRef(combat);
  tokensRef.current = tokens;
  combatRef.current = combat;

  /** Chave estável — não reexecutar o efeito a cada snapshot SSE (só quando o turno muda). */
  const turnKey = useMemo(() => {
    if (!combat?.order.length) return null;
    return combatTurnKey(combat);
  }, [combat?.round, combat?.activeIndex, combat?.order.length, combat?.order]);

  useEffect(() => {
    const clearTimers = () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };

    if (turnKey === null) {
      prevKey.current = null;
      clearTimers();
      setPhase("hidden");
      return;
    }

    if (prevKey.current === null) {
      prevKey.current = turnKey;
      return;
    }

    if (turnKey === prevKey.current) return;
    prevKey.current = turnKey;

    const activeId = combatRef.current ? activeTokenId(combatRef.current) : null;
    const token = activeId ? tokensRef.current.find((t) => t.id === activeId) : undefined;
    setName(token?.name ?? "—");
    setPhase("visible");
    clearTimers();

    timers.current.push(
      window.setTimeout(() => {
        setPhase("leaving");
        timers.current.push(
          window.setTimeout(() => {
            setPhase("hidden");
          }, FADE_MS)
        );
      }, HOLD_MS)
    );

    return clearTimers;
  }, [turnKey]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`vtt-turn-handoff vtt-turn-handoff--${phase}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="vtt-turn-handoff__veil" aria-hidden />
      <p className="vtt-turn-handoff__text">
        Vez de <strong className="vtt-turn-handoff__name">“{name}”</strong>
      </p>
    </div>
  );
}
