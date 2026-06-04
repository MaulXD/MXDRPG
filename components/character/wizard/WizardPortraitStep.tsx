"use client";

import { useEffect, useRef, useState } from "react";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  focusToObjectPosition,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import { buildPortraitBundle } from "@/lib/media/image-upload-client";

type Props = {
  portraitUrl: string | null;
  tokenImageUrl: string | null;
  portraitFocus: PortraitFocus | null;
  onChange: (patch: {
    portraitUrl: string | null;
    tokenImageUrl: string | null;
    portraitFocus: PortraitFocus | null;
  }) => void;
};

export function WizardPortraitStep({
  portraitUrl,
  tokenImageUrl,
  portraitFocus,
  onChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [draftSrc, setDraftSrc] = useState<string | null>(null);
  const [focus, setFocus] = useState<PortraitFocus>(
    sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS
  );

  useEffect(() => {
    if (!draftSrc) {
      setFocus(sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS);
    }
  }, [portraitFocus, draftSrc]);

  const previewSrc = draftSrc ?? portraitUrl;
  const objectPosition = focusToObjectPosition(focus);

  async function onPickFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      pendingFileRef.current = file;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(URL.createObjectURL(file));
      setFocus(DEFAULT_PORTRAIT_FOCUS);
      setMsg("Ajuste o enquadramento e clique em Aplicar retrato.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao ler arquivo");
    } finally {
      setBusy(false);
    }
  }

  async function applyPortrait() {
    const file = pendingFileRef.current;
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const bundle = await buildPortraitBundle(file, focus);
      onChange({
        portraitUrl: bundle.portraitUrl,
        tokenImageUrl: bundle.tokenImageUrl,
        portraitFocus: bundle.portraitFocus,
      });
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(null);
      setMsg("Retrato e token prontos.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setBusy(false);
    }
  }

  function skipPortrait() {
    onChange({ portraitUrl: null, tokenImageUrl: null, portraitFocus: null });
    setDraftSrc(null);
    pendingFileRef.current = null;
    setMsg("Sem retrato — pode adicionar depois na ficha.");
  }

  return (
    <div className="wizard-portrait">
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Opcional. WebP + token hex gerados no navegador (sem Blob externo por agora).
      </p>

      <div className="sheet-portrait-grid sheet-portrait-grid--single">
        <div className="sheet-portrait-slot">
          <div
            className={`sheet-portrait-frame ${previewSrc ? "has-image" : ""}`}
            style={
              previewSrc
                ? ({ ["--portrait-focus" as string]: objectPosition } as React.CSSProperties)
                : undefined
            }
          >
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Retrato"
                className="sheet-portrait-img-cover"
                style={{ objectPosition }}
              />
            ) : (
              <span>?</span>
            )}
          </div>
          {tokenImageUrl ? (
            <p className="sheet-portrait-hint" style={{ marginTop: "0.5rem" }}>
              Token gerado ✓
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPickFile(f);
          e.target.value = "";
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Escolher foto
        </button>
        {draftSrc ? (
          <button type="button" className="btn" disabled={busy} onClick={applyPortrait}>
            Aplicar retrato + token
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={skipPortrait}>
          Pular por agora
        </button>
      </div>

      {previewSrc ? (
        <PortraitFocusEditor
          imageSrc={previewSrc}
          focus={focus}
          onFocusChange={setFocus}
          disabled={busy}
        />
      ) : null}

      <p className="sheet-portrait-hint">{IMAGE_UPLOAD_HINT}</p>
      {msg ? <p className="sheet-portrait-msg">{msg}</p> : null}
    </div>
  );
}
