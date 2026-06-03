"use client";

import { useRef, useState, useEffect } from "react";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  focusToObjectPosition,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import {
  buildPortraitBundle,
  buildPortraitBundleFromDataUrl,
} from "@/lib/media/image-upload-client";
import { patchRoomActor } from "@/hooks/useRoomSync";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { playerColorForActor } from "@/lib/vtt/token-colors";

type Props = {
  roomId: string;
  actorId: string;
  portraitUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  tokenImageUrl?: string | null;
  canEdit: boolean;
  onSaved: () => void;
};

export function PortraitFields({
  roomId,
  actorId,
  portraitUrl,
  portraitFocus,
  tokenImageUrl,
  canEdit,
  onSaved,
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

  const previewSrc = draftSrc ?? portraitUrl ?? null;
  const ringColor = playerColorForActor(actorId, [actorId]);

  async function persistBundle(bundle: {
    portraitUrl: string;
    tokenImageUrl: string;
    portraitFocus: PortraitFocus;
  }) {
    await patchRoomActor(roomId, actorId, {
      portraitUrl: bundle.portraitUrl,
      tokenImageUrl: bundle.tokenImageUrl,
      portraitFocus: bundle.portraitFocus,
    });
    setDraftSrc(null);
    setFocus(bundle.portraitFocus);
    setMsg("WebP salvo · token gerado · foco aplicado.");
    onSaved();
  }

  async function onPickFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      pendingFileRef.current = file;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(URL.createObjectURL(file));
      setFocus(DEFAULT_PORTRAIT_FOCUS);
      setMsg("Ajuste o enquadramento e clique em Salvar.");
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
      await persistBundle(bundle);
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
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
      await persistBundle(bundle);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao atualizar foco");
    } finally {
      setBusy(false);
    }
  }

  async function clearPortrait() {
    setBusy(true);
    try {
      await patchRoomActor(roomId, actorId, {
        portraitUrl: null,
        tokenImageUrl: null,
        portraitFocus: null,
      });
      setDraftSrc(null);
      setFocus(DEFAULT_PORTRAIT_FOCUS);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  const objectPosition = focusToObjectPosition(
    sanitizePortraitFocus(portraitFocus) ?? focus
  );

  return (
    <div className="sheet-portraits">
      <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>
        Retrato e token
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
          <strong>Retrato</strong>
          {canEdit ? (
            <div className="sheet-portrait-btns">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                Enviar foto
              </button>
              {portraitUrl ? (
                <button
                  type="button"
                  className="inv-remove"
                  disabled={busy}
                  onClick={clearPortrait}
                >
                  Remover
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="sheet-portrait-slot sheet-token-preview">
          <div
            className="sheet-token-preview-ring"
            style={{ boxShadow: `0 0 0 4px ${ringColor}` }}
          >
            {tokenImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenImageUrl}
                alt="Token"
                className="sheet-portrait-img-cover"
                style={{ objectPosition }}
              />
            ) : (
              <span style={{ background: ringColor }} />
            )}
          </div>
          <strong>Token na mesa</strong>
          <span>Gerado automaticamente · anel {ringColor}</span>
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
                Salvar retrato + token
              </button>
            ) : portraitUrl ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={saveFocusOnly}
              >
                Aplicar novo enquadramento
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
