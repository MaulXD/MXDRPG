"use client";

import type { ActionPreview } from "@/lib/combat/action-preview";

type Props = {
  preview: ActionPreview | null;
};

export function BattlefieldActionHud({ preview }: Props) {
  if (!preview) return null;

  return (
    <div className="vtt-action-hud glass-panel" role="status" aria-live="polite">
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
