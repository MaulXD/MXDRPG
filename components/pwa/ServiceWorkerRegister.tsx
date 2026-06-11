"use client";

import { useEffect } from "react";

/** Registra SW na raiz — critério de instalabilidade PWA no Chrome. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* Falha silenciosa em ambientes sem HTTPS (exceto localhost). */
    });
  }, []);

  return null;
}
