"use client";

import { IconCheck } from "@/components/ui/EldarinIcons";

type Props = {
  steps: readonly string[];
  current: number;
  busy?: boolean;
  onGoTo: (index: number) => void;
};

export function WizardProgress({ steps, current, busy, onGoTo }: Props) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;

  return (
    <div className="char-wizard-progress-wrap">
      <div className="char-wizard-progress-track" aria-hidden>
        <span className="char-wizard-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ol className="char-wizard-progress" aria-label="Progresso da criação">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const canJump = done && !busy;
          return (
            <li
              key={label}
              className={`char-wizard-progress__item ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}
            >
              <button
                type="button"
                className="char-wizard-progress__btn"
                disabled={!canJump}
                onClick={() => canJump && onGoTo(i)}
                aria-current={active ? "step" : undefined}
                title={label}
              >
                <span className="char-wizard-progress__dot">
                  {done ? <IconCheck size={12} /> : i + 1}
                </span>
                <span className="char-wizard-progress__label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
