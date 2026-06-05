"use client";

import type { ReactNode } from "react";

type Props = {
  text?: string | null;
  children: ReactNode;
  className?: string;
};

/** Tooltip ao passar o mouse — wizard de criação. */
export function WizardHoverTip({ text, children, className }: Props) {
  if (!text?.trim()) return <>{children}</>;

  return (
    <span className={`wizard-hover-tip${className ? ` ${className}` : ""}`} title={text}>
      {children}
      <span className="wizard-hover-tip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}
