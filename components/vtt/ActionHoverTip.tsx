"use client";

import { useMemo, type ReactNode } from "react";
import { formatCombatActionTooltipLines } from "@/lib/combat/action-tooltip";
import type { CombatActionOption } from "@/lib/combat/types";
import type { RoomActor } from "@/lib/room/types";

type Props = {
  action: CombatActionOption;
  actor?: RoomActor | null;
  children: ReactNode;
  className?: string;
};

/** Envolve um botão/slot e exibe tooltip rico ao passar o mouse. */
export function ActionHoverTip({ action, actor, children, className }: Props) {
  const lines = useMemo(
    () => formatCombatActionTooltipLines(action, actor),
    [action, actor]
  );

  return (
    <span className={`action-hover-tip${className ? ` ${className}` : ""}`}>
      {children}
      <span className="action-hover-tip__bubble" role="tooltip">
        <strong className="action-hover-tip__name">{action.name}</strong>
        {lines.map((line) => (
          <span key={line} className="action-hover-tip__line">
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}
