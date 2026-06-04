"use client";

import { useEffect, useState } from "react";
import { PortraitEditorPanel } from "@/components/character/PortraitEditorPanel";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

type Props = {
  portraitUrl: string | null;
  tokenImageUrl: string | null;
  portraitFocus: PortraitFocus | null;
  onChange: (patch: {
    portraitUrl: string | null;
    tokenImageUrl: string | null;
    portraitFocus: PortraitFocus | null;
  }) => void;
  onPendingChange?: (pending: boolean) => void;
};

export function WizardPortraitStep({
  portraitUrl,
  tokenImageUrl,
  portraitFocus,
  onChange,
  onPendingChange,
}: Props) {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    onPendingChange?.(hasDraft);
  }, [hasDraft, onPendingChange]);

  return (
    <div className="wizard-portrait">
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Opcional. Ajuste como a imagem aparece na capa da ficha e no token da mesa.
      </p>

      <PortraitEditorPanel
        portraitUrl={portraitUrl}
        tokenImageUrl={tokenImageUrl}
        portraitFocus={portraitFocus}
        canEdit
        saveNewLabel="Aplicar retrato + token"
        saveFocusLabel="Atualizar enquadramento"
        onDraftChange={setHasDraft}
        onPersist={async (bundle) => {
          onChange({
            portraitUrl: bundle.portraitUrl,
            tokenImageUrl: bundle.tokenImageUrl,
            portraitFocus: bundle.portraitFocus,
          });
        }}
        onClear={async () => {
          onChange({ portraitUrl: null, tokenImageUrl: null, portraitFocus: null });
        }}
      />

      <button
        type="button"
        className="btn btn-ghost"
        style={{ marginTop: "0.5rem" }}
        onClick={() =>
          onChange({ portraitUrl: null, tokenImageUrl: null, portraitFocus: null })
        }
      >
        Pular por agora
      </button>
    </div>
  );
}
