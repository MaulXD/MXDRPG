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
  /** Arte emoldurada (public/icons/...). Sem ela, mostra o glifo SVG de sempre. */
  artSrc?: string | null;
};

export function WizardPickIcon({ kind, color, className, artSrc }: Props) {
  const label = wizardIconLabel(kind);
  if (artSrc) {
    const artClass = ["char-wizard-pick__icon", "char-wizard-pick__icon--art", className]
      .filter(Boolean)
      .join(" ");
    return (
      <span className={artClass} data-site-tip={label} aria-label={label}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ícone fixo de 256 px, já otimizado em webp */}
        <img src={artSrc} alt="" width={76} height={76} loading="lazy" decoding="async" />
      </span>
    );
  }
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
      data-site-tip={label}
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
