"use client";

import { useEffect } from "react";

/** Registra SW na raiz — critério de instalabilidade PWA no Chrome. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        void registration.update();
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      })
      .catch(() => {
        /* Falha silenciosa em ambientes sem HTTPS (exceto localhost). */
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
