"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth/types";
import { entrarPath, mesaRoomPath } from "@/lib/auth/post-auth-redirect";
import {
  getDemoTourMode,
  getDemoTourSteps,
  isDemoTourCompleted,
  markDemoTourCompleted,
  type DemoTourMode,
} from "@/lib/vtt/demo-guided-tour";

type Props = {
  roomId: string;
  session: SessionUser | null;
  isRoomGm: boolean;
};

const MODE_LABEL: Record<DemoTourMode, string> = {
  visitor: "Visitante",
  player: "Jogador",
  gm: "Mestre",
};

export function DemoGuidedTour({ roomId, session, isRoomGm }: Props) {
  const mode = useMemo(
    () => getDemoTourMode(session, isRoomGm),
    [session, isRoomGm]
  );
  const steps = useMemo(() => getDemoTourSteps(mode), [mode]);

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const finish = useCallback(() => {
    markDemoTourCompleted();
    setOpen(false);
  }, []);

  const openTour = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    setStepIndex(0);
  }, [mode]);

  useEffect(() => {
    if (roomId !== "demo") return;
    if (isDemoTourCompleted()) return;
    const timer = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(timer);
  }, [roomId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (roomId !== "demo") return null;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= steps.length - 1;
  const loginHref = entrarPath(mesaRoomPath("demo"));

  return (
    <>
      <button
        type="button"
        className="demo-guided-tour__trigger"
        onClick={openTour}
        title="Tour guiado da demo"
        aria-label="Tour guiado da demo"
      >
        Tour
      </button>

      {open && step ? (
        <div
          className="demo-guided-tour"
          role="dialog"
          aria-modal="false"
          aria-labelledby="demo-guided-tour-title"
          aria-describedby="demo-guided-tour-body"
        >
          <div className="demo-guided-tour__card glass-panel">
            <div className="demo-guided-tour__head">
              <p className="demo-guided-tour__kicker">
                Demo guiada · {MODE_LABEL[mode]}
              </p>
              <p className="demo-guided-tour__progress" aria-live="polite">
                {stepIndex + 1} / {steps.length}
              </p>
            </div>
            <h3 id="demo-guided-tour-title" className="demo-guided-tour__title">
              {step.title}
            </h3>
            <p id="demo-guided-tour-body" className="demo-guided-tour__body">
              {step.body}
            </p>
            {mode === "visitor" && isLast ? (
              <p className="demo-guided-tour__cta">
                <Link href={loginHref} className="text-link">
                  Entrar na conta
                </Link>{" "}
                para testar o fluxo completo.
              </p>
            ) : null}
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
