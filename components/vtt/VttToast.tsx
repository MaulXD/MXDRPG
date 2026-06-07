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

function useMesaToastLift() {
  useEffect(() => {
    const anchor = document.getElementById("foundry-mesa-toasts");
    const stage = anchor?.closest(".foundry-mesa__stage");
    if (!anchor || !stage) return;

    const sync = () => {
      const hud =
        stage.querySelector<HTMLElement>(".vtt-hud-wrapper") ??
        stage.querySelector<HTMLElement>(".vtt-combat-hud-restore") ??
        stage.querySelector<HTMLElement>(".vtt-combat-hud");
      if (!hud || hud.offsetHeight === 0) {
        anchor.style.setProperty("--vtt-toast-lift", "1.25rem");
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const hudRect = hud.getBoundingClientRect();
      const gap = 14;
      const lift = Math.max(28, stageRect.bottom - hudRect.top + gap);
      anchor.style.setProperty("--vtt-toast-lift", `${lift}px`);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    const mo = new MutationObserver(sync);
    mo.observe(stage, { childList: true, subtree: true, attributes: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
}

export function VttToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VttToastItem[]>([]);
  const [toastHost, setToastHost] = useState<HTMLElement | null>(null);

  useMesaToastLift();

  useEffect(() => {
    setToastHost(document.getElementById("foundry-mesa-toasts"));
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: VttToastVariant = "info") => {
    const id = `toast-${++toastSeq}`;
    setItems((prev) => [...prev.slice(-4), { id, message, variant }]);
    window.setTimeout(() => dismiss(id), 5200);
  }, [dismiss]);

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
      {toastHost ? createPortal(stack, toastHost) : stack}
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
