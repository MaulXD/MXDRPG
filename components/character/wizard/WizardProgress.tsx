"use client";

import { IconCheck } from "@/components/ui/EldarinIcons";

type Props = {
  steps: readonly string[];
  current: number;
  busy?: boolean;
  invalidSteps?: number[];
  onGoTo: (index: number) => void;
};

export function WizardProgress({ steps, current, busy, invalidSteps = [], onGoTo }: Props) {
  const invalidSet = new Set(invalidSteps);
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;

  return (
    <div className="char-wizard-progress-wrap">
      <div className="char-wizard-progress-track" aria-hidden>
        <span className="char-wizard-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ol className="char-wizard-progress" aria-label="Passos da criação">
        {steps.map((label, i) => {
          const active = i === current;
          const invalid = invalidSet.has(i);
          const done = i < current && !invalid;
          const visited = i <= current;
          return (
            <li
              key={label}
              className={[
                "char-wizard-progress__item",
                active ? "is-active" : "",
                done ? "is-done" : "",
                visited ? "is-visited" : "",
                invalid ? "is-invalid" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="char-wizard-progress__btn"
                disabled={busy}
                onClick={() => onGoTo(i)}
                aria-current={active ? "step" : undefined}
                aria-invalid={invalid || undefined}
                title={invalid ? `${label} — pendente` : label}
              >
                <span className="char-wizard-progress__dot">
                  {invalid ? "!" : done ? <IconCheck size={12} /> : i + 1}
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
