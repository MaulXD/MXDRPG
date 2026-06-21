"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./vtt-toast.css";

export type VttToastVariant = "info" | "warn" | "success";

export type VttToastItem = {
  id: string;
  message: string;
  variant: VttToastVariant;
};

type VttToastContextValue = {
  push: (message: string, variant?: VttToastVariant) => void;
  pushMany: (messages: string[], variant?: VttToastVariant) => void;
};

const VttToastContext = createContext<VttToastContextValue | null>(null);

let toastSeq = 0;

/** Ancora o stack logo acima do HUD de combate (dentro do stage). */
export function syncMesaToastPosition(): void {
  const anchor = document.getElementById("foundry-mesa-toasts");
  const stage = anchor?.closest(".foundry-mesa__stage");
  if (!anchor || !stage) return;

  const mobileBar = document.querySelector<HTMLElement>(".mesa-mobile-bar");
  const mobileBarVisible =
    mobileBar != null && getComputedStyle(mobileBar).display !== "none";
  const mobileBarHeight = mobileBarVisible ? mobileBar.offsetHeight : 0;

  const hud =
    stage.querySelector<HTMLElement>(".vtt-hud-wrapper") ??
    stage.querySelector<HTMLElement>(".vtt-combat-hud-restore");

  if (!hud || hud.offsetHeight === 0) {
    const lift = `${Math.max(20, mobileBarHeight + 12)}px`;
    if (anchor.dataset.toastAnchor !== "fallback") {
      anchor.dataset.toastAnchor = "fallback";
    }
    if (anchor.style.getPropertyValue("--vtt-toast-top")) {
      anchor.style.removeProperty("--vtt-toast-top");
    }
    if (anchor.style.getPropertyValue("--vtt-toast-lift") !== lift) {
      anchor.style.setProperty("--vtt-toast-lift", lift);
    }
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const hudRect = hud.getBoundingClientRect();
  const gap = 12;
  const anchorY = hudRect.top - stageRect.top - gap;
  const top = `${Math.max(8, anchorY)}px`;

  if (anchor.dataset.toastAnchor !== "hud") {
    anchor.dataset.toastAnchor = "hud";
  }
  if (anchor.style.getPropertyValue("--vtt-toast-top") !== top) {
    anchor.style.setProperty("--vtt-toast-top", top);
  }
  if (anchor.style.getPropertyValue("--vtt-toast-lift")) {
    anchor.style.removeProperty("--vtt-toast-lift");
  }
}

function useMesaToastLift(itemCount: number) {
  useEffect(() => {
    const anchor = document.getElementById("foundry-mesa-toasts");
    const stage = anchor?.closest(".foundry-mesa__stage");
    if (!anchor || !stage) return;

    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => syncMesaToastPosition());
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);

    // childList apenas — attributes dispara loop (sync altera style/dataset do anchor no stage)
    const mo = new MutationObserver(sync);
    mo.observe(stage, { childList: true, subtree: true });

    const mobileBar = document.querySelector<HTMLElement>(".mesa-mobile-bar");
    const roBar = mobileBar ? new ResizeObserver(sync) : null;
    roBar?.observe(mobileBar!);

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      ro.disconnect();
      mo.disconnect();
      roBar?.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, []);

  useEffect(() => {
    syncMesaToastPosition();
    const id = requestAnimationFrame(syncMesaToastPosition);
    return () => cancelAnimationFrame(id);
  }, [itemCount]);
}

export function VttToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VttToastItem[]>([]);
  const [toastHost, setToastHost] = useState<HTMLElement | null>(null);

  useMesaToastLift(items.length);

  useEffect(() => {
    setToastHost(document.getElementById("foundry-mesa-toasts"));
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: VttToastVariant = "info") => {
      const id = `toast-${++toastSeq}`;
      setItems((prev) => [...prev.slice(-4), { id, message, variant }]);
      requestAnimationFrame(syncMesaToastPosition);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss]
  );

  const pushMany = useCallback(
    (messages: string[], variant: VttToastVariant = "info") => {
      for (const m of messages) {
        if (m.trim()) push(m, variant);
      }
    },
    [push]
  );

  const value = useMemo(() => ({ push, pushMany }), [push, pushMany]);

  const stack = (
    <div className="vtt-toast-stack" aria-relevant="additions">
      {items.map((t) => (
        <div key={t.id} className={`vtt-toast vtt-toast--${t.variant}`} role="status">
          {t.message}
        </div>
      ))}
    </div>
  );

  return (
    <VttToastContext.Provider value={value}>
      {children}
      {toastHost ? createPortal(stack, toastHost) : null}
    </VttToastContext.Provider>
  );
}

export function useVttToast(): VttToastContextValue {
  const ctx = useContext(VttToastContext);
  if (!ctx) {
    return {
      push: () => {},
      pushMany: () => {},
    };
  }
  return ctx;
}
