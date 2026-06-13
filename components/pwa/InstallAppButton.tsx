"use client";

import Link from "next/link";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { SITE_NAME } from "@/lib/site-metadata";

type Props = {
  className?: string;
  variant?: "btn" | "btn-ghost" | "link";
  showInstalled?: boolean;
};

export function InstallAppButton({
  className = "",
  variant = "btn",
  showInstalled = false,
}: Props) {
  const { state, install, installError, canPrompt } = usePwaInstall();

  if (state === "loading") return null;
  if (state === "installed" && !showInstalled) return null;

  const baseClass =
    variant === "link"
      ? "pwa-install-link"
      : variant === "btn-ghost"
        ? "btn btn-ghost"
        : "btn";

  if (state === "installed") {
    return (
      <span className={`pwa-install-status${className ? ` ${className}` : ""}`} role="status">
        App instalado
      </span>
    );
  }

  if (!canPrompt) {
    return (
      <Link href="/aplicativo" className={`${baseClass}${className ? ` ${className}` : ""}`}>
        Instalar aplicativo
      </Link>
    );
  }

  return (
    <span className={`pwa-install-wrap${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={baseClass}
        onClick={() => void install()}
        aria-label={`Instalar ${SITE_NAME} como aplicativo`}
      >
        Instalar aplicativo
      </button>
      {installError ? (
        <span className="pwa-install-error" role="alert">
          {installError}
        </span>
      ) : null}
    </span>
  );
}
