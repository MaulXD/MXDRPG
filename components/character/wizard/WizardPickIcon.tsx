"use client";

import {
  WIZARD_ICON_PATHS,
  wizardIconLabel,
  type WizardIconKind,
} from "@/lib/character/wizard-icons";

type Props = {
  kind: WizardIconKind;
  color: string;
  className?: string;
};

export function WizardPickIcon({ kind, color, className }: Props) {
  const label = wizardIconLabel(kind);
  const rootClass = ["char-wizard-pick__icon", "char-wizard-pick__icon--svg", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={rootClass}
      style={{
        background: `${color}22`,
        color,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
      }}
      title={label}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={WIZARD_ICON_PATHS[kind]} />
      </svg>
    </span>
  );
}
