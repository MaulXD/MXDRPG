"use client";

import { useMemo } from "react";
import { formatCombatActionTooltipLines } from "@/lib/combat/action-tooltip";
import type { CombatActionOption } from "@/lib/combat/types";
import type { RoomActor } from "@/lib/room/types";

type Props = {
  action: CombatActionOption | null | undefined;
  actor?: RoomActor | null;
  className?: string;
};

/** Cartão com descrição, dano/cura e regras da ação selecionada. */
export function CombatActionDetail({ action, actor, className }: Props) {
  const lines = useMemo(
    () => (action ? formatCombatActionTooltipLines(action, actor) : []),
    [action, actor]
  );

  if (!action || lines.length === 0) return null;

  return (
    <aside
      className={`combat-action-detail${className ? ` ${className}` : ""}`}
      aria-label={`Detalhes: ${action.name}`}
    >
      <p className="combat-action-detail__title">{action.name}</p>
      <ul className="combat-action-detail__list">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
