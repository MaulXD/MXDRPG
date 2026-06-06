"use client";

import type { ActionPreview } from "@/lib/combat/action-preview";

type Props = {
  preview: ActionPreview | null;
  /** Ponto de ancoragem acima do alvo em px (relativo ao wrap do canvas). */
  anchor?: { x: number; y: number } | null;
};

export function BattlefieldActionHud({ preview, anchor }: Props) {
  if (!preview) return null;

  const anchored = anchor != null;

  return (
    <div
      className={`vtt-action-hud glass-panel${anchored ? " vtt-action-hud--anchored" : ""}`}
      style={
        anchored
          ? { left: anchor.x, top: anchor.y, bottom: "auto", transform: "translate(-50%, -100%)" }
          : undefined
      }
      role="status"
      aria-live="polite"
    >
      <p className={`vtt-action-hud-pa${preview.ok ? "" : " vtt-action-hud-pa--err"}`}>
        {preview.paChip}
      </p>
      <strong className="vtt-action-hud-title">{preview.title}</strong>
      <ul className="vtt-action-hud-lines">
        {preview.lines.map((line, i) => (
          <li key={i} className={line.tone ? `tone-${line.tone}` : undefined}>
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
