"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

type Props = {
  /** Chave única — dismiss persiste na sessão do navegador */
  bannerId: string;
  children: ReactNode;
  className?: string;
  role?: "status" | "region";
  "aria-label"?: string;
};

function storageKey(bannerId: string): string {
  return `eldarin-mesa-banner:${bannerId}`;
}

export function DismissibleMesaBanner({
  bannerId,
  children,
  className = "",
  role = "region",
  "aria-label": ariaLabel,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(storageKey(bannerId)) !== "1");
    } catch {
      setVisible(true);
    }
  }, [bannerId]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(storageKey(bannerId), "1");
    } catch {
      /* privado / quota */
    }
    setVisible(false);
  }, [bannerId]);

  if (!visible) return null;

  return (
    <div
      className={`mesa-dismissible-banner ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="mesa-dismissible-banner__close"
        onClick={dismiss}
        aria-label="Fechar aviso"
        title="Fechar"
      >
        ×
      </button>
      <div className="mesa-dismissible-banner__body">{children}</div>
    </div>
  );
}
