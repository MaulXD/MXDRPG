"use client";

import { useEffect, useRef, useState } from "react";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import {
  buildPortraitBundle,
  buildPortraitBundleFromDataUrl,
  type PortraitBundle,
} from "@/lib/media/image-upload-client";

export type PortraitEditorBundle = PortraitBundle;

type Props = {
  portraitUrl: string | null;
  tokenImageUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  canEdit: boolean;
  tokenRingColor?: string;
  onPersist: (bundle: PortraitEditorBundle) => Promise<void>;
  onClear: () => Promise<void>;
  saveNewLabel?: string;
  saveFocusLabel?: string;
  onDraftChange?: (hasDraft: boolean) => void;
};

export function PortraitEditorPanel({
  portraitUrl,
  tokenImageUrl,
  portraitFocus,
  canEdit,
  tokenRingColor = "var(--accent)",
  onPersist,
  onClear,
  saveNewLabel = "Salvar retrato + token",
  saveFocusLabel = "Aplicar enquadramento",
  onDraftChange,
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

  useEffect(() => {
    onDraftChange?.(Boolean(draftSrc));
  }, [draftSrc, onDraftChange]);

  const previewSrc = draftSrc ?? portraitUrl;

  async function onPickFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      pendingFileRef.current = file;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(URL.createObjectURL(file));
      setFocus(DEFAULT_PORTRAIT_FOCUS);
      setMsg("Organize a imagem (arrastar, zoom) e salve.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao ler arquivo");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    const file = pendingFileRef.current;
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const bundle = await buildPortraitBundle(file, focus);
      await onPersist(bundle);
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(null);
      setFocus(bundle.portraitFocus);
      setMsg("Retrato salvo com enquadramento aplicado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function saveFocusOnly() {
    if (!portraitUrl) return;
    setBusy(true);
    setMsg(null);
    try {
      const bundle = await buildPortraitBundleFromDataUrl(portraitUrl, focus);
      await onPersist(bundle);
      setFocus(bundle.portraitFocus);
      setMsg("Enquadramento atualizado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setBusy(false);
    }
  }

  async function clearPortrait() {
    setBusy(true);
    setMsg(null);
    try {
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      pendingFileRef.current = null;
      setDraftSrc(null);
      setFocus(DEFAULT_PORTRAIT_FOCUS);
      await onClear();
      setMsg("Retrato removido.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-portraits">
      <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>
        Retrato e token
      </p>

      <div className="sheet-portrait-grid">
        <div className="sheet-portrait-slot sheet-portrait-slot--wide">
          <div className={`sheet-portrait-cover-preview ${previewSrc ? "has-image" : ""}`}>
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Prévia da capa"
                className="sheet-portrait-img-cover"
                style={portraitFocusToImgStyle(focus)}
              />
            ) : (
              <span className="sheet-portrait-cover-empty">Capa</span>
            )}
          </div>
          <strong>Capa da ficha</strong>
        </div>

        <div className="sheet-portrait-slot">
          <div className={`sheet-portrait-frame ${previewSrc ? "has-image" : ""}`}>
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Retrato"
                className="sheet-portrait-img-cover"
                style={portraitFocusToImgStyle(focus)}
              />
            ) : (
              <span>?</span>
            )}
          </div>
          <strong>Retrato</strong>
        </div>

        <div className="sheet-portrait-slot sheet-token-preview">
          <div
            className="sheet-token-preview-ring"
            style={{ boxShadow: `0 0 0 4px ${tokenRingColor}` }}
          >
            {(draftSrc ? null : tokenImageUrl) || previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draftSrc ?? tokenImageUrl ?? portraitUrl ?? ""}
                alt="Token"
                className="sheet-portrait-img-cover"
                style={portraitFocusToImgStyle(focus)}
              />
            ) : (
              <span style={{ background: tokenRingColor }} />
            )}
          </div>
          <strong>Token na mesa</strong>
        </div>
      </div>

      {canEdit ? (
        <div className="sheet-portrait-toolbar">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Escolher imagem
          </button>
          {previewSrc ? (
            <button type="button" className="inv-remove" disabled={busy} onClick={clearPortrait}>
              Remover imagem
            </button>
          ) : null}
        </div>
      ) : null}

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

      {canEdit && previewSrc ? (
        <>
          <PortraitFocusEditor
            imageSrc={previewSrc}
            focus={focus}
            onFocusChange={setFocus}
            disabled={busy}
          />
          <div className="sheet-portrait-actions">
            {draftSrc ? (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={saveDraft}>
                {saveNewLabel}
              </button>
            ) : portraitUrl ? (
              <button type="button" className="btn" disabled={busy} onClick={saveFocusOnly}>
                {saveFocusLabel}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {canEdit ? <p className="sheet-portrait-hint">{IMAGE_UPLOAD_HINT}</p> : null}
      {msg ? <p className="sheet-portrait-msg">{msg}</p> : null}
    </div>
  );
}
