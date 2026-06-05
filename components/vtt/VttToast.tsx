"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

export function VttToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VttToastItem[]>([]);

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

  return (
    <VttToastContext.Provider value={value}>
      {children}
      <div className="vtt-toast-stack" aria-live="polite" aria-relevant="additions">
        {items.map((t) => (
          <div key={t.id} className={`vtt-toast vtt-toast--${t.variant}`} role="status">
            {t.message}
          </div>
        ))}
      </div>
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
