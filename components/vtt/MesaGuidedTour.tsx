"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth/types";
import {
  getMesaTourMode,
  getMesaTourSteps,
  isMesaTourCompleted,
  markMesaTourCompleted,
  type MesaTourMode,
} from "@/lib/vtt/mesa-guided-tour";

type Props = {
  roomId: string;
  session: SessionUser | null;
  isRoomGm: boolean;
  watchOnly?: boolean;
  triggerVariant?: "pill" | "map";
};

const MODE_LABEL: Record<MesaTourMode, string> = {
  spectator: "Espectador",
  player: "Jogador",
  gm: "Mestre",
};

export function MesaGuidedTour({
  roomId,
  session,
  isRoomGm,
  watchOnly = false,
  triggerVariant = "pill",
}: Props) {
  const mode = useMemo(
    () => getMesaTourMode(session, isRoomGm, watchOnly),
    [session, isRoomGm, watchOnly]
  );
  const steps = useMemo(() => getMesaTourSteps(mode), [mode]);
  const userId = session?.id ?? null;

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const finish = useCallback(() => {
    markMesaTourCompleted(userId);
    setOpen(false);
  }, [userId]);

  const openTour = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    setStepIndex(0);
  }, [mode]);

  useEffect(() => {
    if (isMesaTourCompleted(userId)) return;
    const timer = window.setTimeout(() => setOpen(true), 1800);
    return () => window.clearTimeout(timer);
  }, [roomId, userId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= steps.length - 1;

  return (
    <>
      <button
        type="button"
        className={`demo-guided-tour__trigger${triggerVariant === "map" ? " demo-guided-tour__trigger--map" : ""}`}
        onClick={openTour}
        title="Tour da mesa"
        aria-label="Tour da mesa"
      >
        {triggerVariant === "map" ? "T" : "Tour"}
      </button>

      {open && step ? (
        <div
          className="demo-guided-tour"
          role="dialog"
          aria-modal="false"
          aria-labelledby="mesa-guided-tour-title"
          aria-describedby="mesa-guided-tour-body"
        >
          <div className="demo-guided-tour__card glass-panel">
            <div className="demo-guided-tour__head">
              <p className="demo-guided-tour__kicker">
                Primeira mesa · {MODE_LABEL[mode]}
              </p>
              <p className="demo-guided-tour__progress" aria-live="polite">
                {stepIndex + 1} / {steps.length}
              </p>
            </div>
            <h3 id="mesa-guided-tour-title" className="demo-guided-tour__title">
              {step.title}
            </h3>
            <p id="mesa-guided-tour-body" className="demo-guided-tour__body">
              {step.body}
            </p>
            <div className="demo-guided-tour__actions">
              <button
                type="button"
                className="demo-guided-tour__btn demo-guided-tour__btn--ghost"
                onClick={finish}
              >
                Pular
              </button>
              <div className="demo-guided-tour__nav">
                <button
                  type="button"
                  className="demo-guided-tour__btn demo-guided-tour__btn--secondary"
                  disabled={isFirst}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                  Anterior
                </button>
                {isLast ? (
                  <button
                    type="button"
                    className="demo-guided-tour__btn demo-guided-tour__btn--primary"
                    onClick={finish}
                  >
                    Concluir
                  </button>
                ) : (
                  <button
                    type="button"
                    className="demo-guided-tour__btn demo-guided-tour__btn--primary"
                    onClick={() =>
                      setStepIndex((i) => Math.min(steps.length - 1, i + 1))
                    }
                  >
                    Próximo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
