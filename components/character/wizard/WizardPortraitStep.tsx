"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  PortraitEditorPanel,
  type PortraitEditorPanelHandle,
} from "@/components/character/PortraitEditorPanel";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

export type WizardPortraitStepHandle = {
  flushPending: () => Promise<boolean>;
};

type Props = {
  portraitUrl: string | null;
  tokenImageUrl: string | null;
  portraitFocus: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  onChange: (patch: {
    portraitUrl: string | null;
    tokenImageUrl: string | null;
    portraitFocus: PortraitFocus | null;
    coverFocus: PortraitFocus | null;
    tokenFocus: PortraitFocus | null;
  }) => void;
  onPendingChange?: (pending: boolean) => void;
};

export const WizardPortraitStep = forwardRef<WizardPortraitStepHandle, Props>(
  function WizardPortraitStep(
    {
      portraitUrl,
      tokenImageUrl,
      portraitFocus,
      tokenFocus,
      onChange,
      onPendingChange,
    },
    ref
  ) {
    const panelRef = useRef<PortraitEditorPanelHandle>(null);
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
      onPendingChange?.(hasDraft);
    }, [hasDraft, onPendingChange]);

    useImperativeHandle(ref, () => ({
      flushPending: async () => panelRef.current?.flushPending() ?? true,
    }));

    return (
      <div className="wizard-portrait">
        <p className="char-wizard-meta" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Envie uma imagem ou pule este passo — o retrato aparece na ficha e o token no mapa hex.
          Ao avançar, a imagem escolhida é aplicada automaticamente (ou use &quot;Aplicar retrato +
          token&quot; antes).
        </p>

        <PortraitEditorPanel
          ref={panelRef}
          portraitUrl={portraitUrl}
          tokenImageUrl={tokenImageUrl}
          portraitFocus={portraitFocus}
          tokenFocus={tokenFocus}
          canEdit
          saveNewLabel="Aplicar retrato + token"
          saveFocusLabel="Atualizar enquadramento"
          onDraftChange={setHasDraft}
          onPersist={async (bundle) => {
            onChange({
              portraitUrl: bundle.portraitUrl,
              tokenImageUrl: bundle.tokenImageUrl,
              portraitFocus: bundle.portraitFocus,
              coverFocus: bundle.coverFocus,
              tokenFocus: bundle.tokenFocus,
            });
          }}
          onClear={async () => {
            onChange({
              portraitUrl: null,
              tokenImageUrl: null,
              portraitFocus: null,
              coverFocus: null,
              tokenFocus: null,
            });
          }}
        />

        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: "0.5rem" }}
          onClick={() =>
            onChange({
              portraitUrl: null,
              tokenImageUrl: null,
              portraitFocus: null,
              coverFocus: null,
              tokenFocus: null,
            })
          }
        >
          Pular por agora
        </button>
      </div>
    );
  }
);
