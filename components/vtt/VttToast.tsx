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

  const hud =
    stage.querySelector<HTMLElement>(".vtt-hud-wrapper") ??
    stage.querySelector<HTMLElement>(".vtt-combat-hud-restore");

  if (!hud || hud.offsetHeight === 0) {
    anchor.dataset.toastAnchor = "fallback";
    anchor.style.removeProperty("--vtt-toast-top");
    anchor.style.setProperty("--vtt-toast-lift", "1.25rem");
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const hudRect = hud.getBoundingClientRect();
  const gap = 12;
  const anchorY = hudRect.top - stageRect.top - gap;

  anchor.dataset.toastAnchor = "hud";
  anchor.style.setProperty("--vtt-toast-top", `${Math.max(8, anchorY)}px`);
  anchor.style.removeProperty("--vtt-toast-lift");
}

function useMesaToastLift(itemCount: number) {
  useEffect(() => {
    const anchor = document.getElementById("foundry-mesa-toasts");
    const stage = anchor?.closest(".foundry-mesa__stage");
    if (!anchor || !stage) return;

    const sync = () => syncMesaToastPosition();

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);

    const mo = new MutationObserver(sync);
    mo.observe(stage, { childList: true, subtree: true, attributes: true });

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      ro.disconnect();
      mo.disconnect();
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
    <div className="vtt-toast-stack" aria-live="polite" aria-relevant="additions">
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
