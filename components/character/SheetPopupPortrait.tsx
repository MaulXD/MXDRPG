"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { PortraitFocusFill } from "@/components/character/PortraitFocusFill";
import { IconCamera, IconUser } from "@/components/character/SheetPopupIcons";
import { useImageNaturalSize } from "@/hooks/useImageNaturalSize";
import { patchRoomActor } from "@/hooks/useRoomSync";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import {
  buildPortraitBundle,
  buildPortraitBundleFromDataUrl,
} from "@/lib/media/image-upload-client";
import { playerColorForActor } from "@/lib/vtt/token-colors";

type Props = {
  actorId: string;
  roomId: string;
  name: string;
  portraitUrl?: string | null;
  tokenImageUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  canEdit: boolean;
  onSaved: () => void;
};

export function SheetPopupPortrait({
  actorId,
  roomId,
  name,
  portraitUrl,
  tokenImageUrl,
  portraitFocus,
  tokenFocus,
  canEdit,
  onSaved,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [draftSrc, setDraftSrc] = useState<string | null>(null);
  const [focusPortrait, setFocusPortrait] = useState<PortraitFocus>(() =>
    sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS
  );
  const [focusToken, setFocusToken] = useState<PortraitFocus>(() =>
    sanitizePortraitFocus(tokenFocus) ?? sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS
  );
  const [editingSlot, setEditingSlot] = useState<"portrait" | "token">("portrait");

  const previewSrc = draftSrc ?? portraitUrl;
  const imgSize = useImageNaturalSize(draftSrc ? previewSrc : null);
  const ringColor = playerColorForActor(actorId, [actorId]);

  useEffect(() => {
    if (draftSrc) return;
    setFocusPortrait(sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS);
    setFocusToken(
      sanitizePortraitFocus(tokenFocus) ??
        sanitizePortraitFocus(portraitFocus) ??
        DEFAULT_PORTRAIT_FOCUS
    );
  }, [portraitFocus, tokenFocus, draftSrc]);

  const persist = useCallback(
    async (bundle: {
      portraitUrl: string;
      tokenImageUrl: string;
      portraitFocus: PortraitFocus;
      tokenFocus: PortraitFocus;
    }) => {
      await patchRoomActor(roomId, actorId, bundle);
      onSaved();
    },
    [actorId, onSaved, roomId]
  );

  async function onPickFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      pendingFileRef.current = file;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(URL.createObjectURL(file));
      setFocusPortrait(DEFAULT_PORTRAIT_FOCUS);
      setFocusToken(DEFAULT_PORTRAIT_FOCUS);
      setOpen(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao ler imagem");
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
        tokenFocus: focusToken,
      });
      await persist(bundle);
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(null);
      setOpen(false);
      setMsg("Retrato salvo — token atualizado.");
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
        tokenFocus: focusToken,
      });
      await persist(bundle);
      setOpen(false);
      setMsg("Enquadramento atualizado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-popup-portrait-wrap">
      <button
        type="button"
        className={`sheet-popup-portrait ${previewSrc ? "has-image" : "is-empty"}`}
        onClick={() => {
          if (!canEdit) return;
          if (previewSrc) setOpen(true);
          else fileRef.current?.click();
        }}
        aria-label={previewSrc ? `Retrato de ${name}` : `Adicionar retrato de ${name}`}
      >
        {previewSrc ? (
          draftSrc && imgSize.w > 0 ? (
            <PortraitFocusFill
              imageSrc={previewSrc}
              focus={focusPortrait}
              imgW={imgSize.w}
              imgH={imgSize.h}
              shape="square"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" />
          )
        ) : (
          <span className="sheet-popup-portrait__placeholder">
            <IconUser size={42} />
          </span>
        )}
        {canEdit ? (
          <span className="sheet-popup-portrait__hover" aria-hidden>
            <IconCamera size={22} />
            <span>{previewSrc ? "Ajustar retrato" : "Inserir imagem"}</span>
          </span>
        ) : null}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPickFile(file);
          e.target.value = "";
        }}
      />

      {open && canEdit ? (
        <div className="sheet-popup-portrait-editor" role="dialog" aria-label="Editor de retrato">
          <div className="sheet-popup-portrait-editor__head">
            <strong>Retrato e token</strong>
            <button type="button" className="sheet-popup-portrait-editor__close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <p className="sheet-popup-portrait-editor__hint">{IMAGE_UPLOAD_HINT}</p>
          <PortraitFocusEditor
            imageSrc={previewSrc ?? ""}
            focus={editingSlot === "token" ? focusToken : focusPortrait}
            portraitFocus={focusPortrait}
            tokenFocus={focusToken}
            onFocusChange={(next) => {
              if (editingSlot === "token") setFocusToken(next);
              else setFocusPortrait(next);
            }}
            disabled={busy}
            previewMode={editingSlot}
            onPreviewModeChange={setEditingSlot}
            tokenRingColor={ringColor}
          />
          <div className="sheet-popup-portrait-editor__actions">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
              Trocar arquivo
            </button>
            {draftSrc ? (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveDraft()}>
                Salvar retrato
              </button>
            ) : (
              <button type="button" className="btn btn-primary" disabled={busy || !portraitUrl} onClick={() => void saveFocusOnly()}>
                Aplicar enquadramento
              </button>
            )}
          </div>
          {msg ? <p className="sheet-popup-portrait-editor__msg">{msg}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
