"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaInstallState = "loading" | "available" | "installed" | "unsupported";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [state, setState] = useState<PwaInstallState>("loading");
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandaloneDisplay()) {
      setState("installed");
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setState("available");
    };

    const onInstalled = () => {
      setPromptEvent(null);
      setState("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => {
      if (isStandaloneDisplay()) setState("installed");
    };
    media.addEventListener("change", onDisplayChange);

    setState("unsupported");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const install = useCallback(async () => {
    setInstallError(null);
    if (!promptEvent) {
      return false;
    }
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setPromptEvent(null);
        setState("installed");
        return true;
      }
      return false;
    } catch {
      setInstallError("Não foi possível abrir o instalador. Tente pelo menu do Chrome.");
      return false;
    }
  }, [promptEvent]);

  return { state, install, installError, canPrompt: state === "available" && Boolean(promptEvent) };
}
