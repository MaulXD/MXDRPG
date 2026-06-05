"use client";

import { useEffect, useRef, useState } from "react";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  resolveCoverFocus,
  resolveTokenFocus,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import {
  buildPortraitBundle,
  buildPortraitBundleFromDataUrl,
  type PortraitBundle,
} from "@/lib/media/image-upload-client";

export type PortraitEditorBundle = PortraitBundle;

type FocusSlot = "cover" | "portrait" | "token";

type Props = {
  portraitUrl: string | null;
  tokenImageUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  canEdit: boolean;
  tokenRingColor?: string;
  onPersist: (bundle: PortraitEditorBundle) => Promise<void>;
  onClear: () => Promise<void>;
  saveNewLabel?: string;
  saveFocusLabel?: string;
  onDraftChange?: (hasDraft: boolean) => void;
};

const SLOT_LABELS: Record<FocusSlot, string> = {
  cover: "Capa",
  portrait: "Retrato",
  token: "Token",
};

function initialFocus(
  primary: PortraitFocus | null | undefined,
  fallback?: PortraitFocus | null
): PortraitFocus {
  return sanitizePortraitFocus(primary) ?? sanitizePortraitFocus(fallback) ?? DEFAULT_PORTRAIT_FOCUS;
}

export function PortraitEditorPanel({
  portraitUrl,
  tokenImageUrl,
  portraitFocus,
  coverFocus,
  tokenFocus,
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
  const [editingSlot, setEditingSlot] = useState<FocusSlot>("portrait");
  const [focusCover, setFocusCover] = useState<PortraitFocus>(() =>
    initialFocus(coverFocus, portraitFocus)
  );
  const [focusPortrait, setFocusPortrait] = useState<PortraitFocus>(() =>
    initialFocus(portraitFocus)
  );
  const [focusToken, setFocusToken] = useState<PortraitFocus>(() =>
    initialFocus(tokenFocus, portraitFocus)
  );

  useEffect(() => {
    if (draftSrc) return;
    setFocusCover(initialFocus(coverFocus, portraitFocus));
    setFocusPortrait(initialFocus(portraitFocus));
    setFocusToken(initialFocus(tokenFocus, portraitFocus));
  }, [portraitFocus, coverFocus, tokenFocus, draftSrc]);

  useEffect(() => {
    onDraftChange?.(Boolean(draftSrc));
  }, [draftSrc, onDraftChange]);

  const previewSrc = draftSrc ?? portraitUrl;
  const coverStyle = portraitFocusToImgStyle(focusCover);
  const portraitStyle = portraitFocusToImgStyle(focusPortrait);
  const tokenStyle = portraitFocusToImgStyle(focusToken);

  const activeFocus =
    editingSlot === "cover" ? focusCover : editingSlot === "token" ? focusToken : focusPortrait;

  function setActiveFocus(next: PortraitFocus) {
    if (editingSlot === "cover") setFocusCover(next);
    else if (editingSlot === "token") setFocusToken(next);
    else setFocusPortrait(next);
  }

  async function onPickFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      pendingFileRef.current = file;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(URL.createObjectURL(file));
      setFocusCover(DEFAULT_PORTRAIT_FOCUS);
      setFocusPortrait(DEFAULT_PORTRAIT_FOCUS);
      setFocusToken(DEFAULT_PORTRAIT_FOCUS);
      setEditingSlot("portrait");
      setMsg("Ajuste capa, retrato e token separadamente, depois salve.");
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
      const bundle = await buildPortraitBundle(file, {
        portraitFocus: focusPortrait,
        coverFocus: focusCover,
        tokenFocus: focusToken,
      });
      await onPersist(bundle);
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(null);
      setFocusCover(bundle.coverFocus);
      setFocusPortrait(bundle.portraitFocus);
      setFocusToken(bundle.tokenFocus);
      setMsg("Imagens salvas com enquadramento individual.");
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
      const bundle = await buildPortraitBundleFromDataUrl(portraitUrl, {
        portraitFocus: focusPortrait,
        coverFocus: focusCover,
        tokenFocus: focusToken,
      });
      await onPersist(bundle);
      setFocusCover(bundle.coverFocus);
      setFocusPortrait(bundle.portraitFocus);
      setFocusToken(bundle.tokenFocus);
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
      setFocusCover(DEFAULT_PORTRAIT_FOCUS);
      setFocusPortrait(DEFAULT_PORTRAIT_FOCUS);
      setFocusToken(DEFAULT_PORTRAIT_FOCUS);
      await onClear();
      setMsg("Retrato removido.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setBusy(false);
    }
  }

  const persistedCover = resolveCoverFocus({ portraitFocus, coverFocus });
  const persistedToken = resolveTokenFocus({ portraitFocus, tokenFocus });

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
                style={draftSrc ? coverStyle : persistedCover ? portraitFocusToImgStyle(persistedCover) : coverStyle}
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
                style={draftSrc ? portraitStyle : portraitFocus ? portraitFocusToImgStyle(portraitFocus) : portraitStyle}
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
                style={
                  draftSrc
                    ? tokenStyle
                    : persistedToken
                      ? portraitFocusToImgStyle(persistedToken)
                      : tokenStyle
                }
              />
            ) : (
              <span style={{ background: tokenRingColor }} />
            )}
          </div>
          <strong>Token na mesa</strong>
        </div>
      </div>

      {canEdit && previewSrc ? (
        <div className="sheet-portrait-focus-tabs" role="tablist" aria-label="Ajustar enquadramento">
          {(["cover", "portrait", "token"] as FocusSlot[]).map((slot) => (
            <button
              key={slot}
              type="button"
              role="tab"
              aria-selected={editingSlot === slot}
              className={`sheet-portrait-focus-tab ${editingSlot === slot ? "is-active" : ""}`}
              onClick={() => setEditingSlot(slot)}
            >
              {SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      ) : null}

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
            focus={activeFocus}
            onFocusChange={setActiveFocus}
            disabled={busy}
          />
          <p className="sheet-portrait-hint" style={{ marginTop: "0.35rem" }}>
            Editando: <strong>{SLOT_LABELS[editingSlot]}</strong> — cada slot tem zoom e posição
            independentes.
          </p>
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
