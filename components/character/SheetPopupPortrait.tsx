"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { IconCamera } from "@/components/character/SheetPopupIcons";
import { Portrait } from "@/components/vtt/Portrait";
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
  type PortraitBundle,
} from "@/lib/media/image-upload-client";
import { firstPortraitDataUrl } from "@/lib/room/portrait-sync";
import { playerColorForActor } from "@/lib/vtt/token-colors";

type Props = {
  actorId: string;
  roomId?: string;
  name: string;
  portraitUrl?: string | null;
  tokenImageUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  canEdit: boolean;
  onSaved: () => void;
  /** Persistência fora da sala (ex.: página /personagem/:id) */
  onPersistBundle?: (bundle: PortraitBundle) => Promise<void>;
  /** Ficha DDB — um único container, sem moldura dourada */
  layout?: "classic" | "ddb";
};

const EDITOR_WIDTH = 300;
const EDITOR_EST_HEIGHT = 420;

function clampEditorPosition(rect: DOMRect): { top: number; left: number } {
  const width = Math.min(EDITOR_WIDTH, window.innerWidth * 0.92);
  let left = rect.left;
  let top = rect.bottom + 6;

  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - width - 8;
  }
  if (left < 8) left = 8;

  if (top + EDITOR_EST_HEIGHT > window.innerHeight - 8) {
    top = rect.top - EDITOR_EST_HEIGHT - 6;
    if (top < 8) top = 8;
  }

  return { top, left };
}

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
  onPersistBundle,
  layout = "classic",
}: Props) {
  const isDdb = layout === "ddb";
  const fileRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [draftSrc, setDraftSrc] = useState<string | null>(null);
  const [editorPos, setEditorPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [focusPortrait, setFocusPortrait] = useState<PortraitFocus>(() =>
    sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS
  );
  const [focusToken, setFocusToken] = useState<PortraitFocus>(() =>
    sanitizePortraitFocus(tokenFocus) ?? sanitizePortraitFocus(portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS
  );
  const [editingSlot, setEditingSlot] = useState<"portrait" | "token">("portrait");

  const previewSrc = draftSrc ?? firstPortraitDataUrl(portraitUrl, tokenImageUrl);
  const imgSize = useImageNaturalSize(previewSrc);
  const ringColor = playerColorForActor(actorId, [actorId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateEditorPos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setEditorPos(clampEditorPosition(el.getBoundingClientRect()));
  }, []);

  useEffect(() => {
    if (!open) return;
    updateEditorPos();
    window.addEventListener("scroll", updateEditorPos, true);
    window.addEventListener("resize", updateEditorPos);
    return () => {
      window.removeEventListener("scroll", updateEditorPos, true);
      window.removeEventListener("resize", updateEditorPos);
    };
  }, [open, updateEditorPos]);

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
    async (bundle: PortraitBundle) => {
      if (onPersistBundle) {
        await onPersistBundle(bundle);
      } else {
        if (!roomId) throw new Error("roomId ausente para salvar retrato na mesa");
        await patchRoomActor(roomId, actorId, bundle);
      }
      onSaved();
    },
    [actorId, onPersistBundle, onSaved, roomId]
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
    if (!previewSrc) return;
    setBusy(true);
    setMsg(null);
    try {
      const bundle = await buildPortraitBundleFromDataUrl(previewSrc, {
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

  const portraitBtn = (
    <button
      type="button"
      className={
        isDdb
          ? `sheet-ddb-portrait ${previewSrc ? "has-image" : "is-empty"}`
          : `sheet-popup-portrait ${previewSrc ? "has-image" : "is-empty"}`
      }
      onClick={() => {
        if (!canEdit) return;
        if (previewSrc) setOpen(true);
        else fileRef.current?.click();
      }}
      aria-label={previewSrc ? `Retrato de ${name}` : `Adicionar retrato de ${name}`}
    >
      <Portrait
        tier="hero"
        frameless={isDdb}
        imageSrc={previewSrc}
        initials={previewSrc ? undefined : "?"}
        alt={name}
        focus={focusPortrait}
        imgW={imgSize.w > 0 ? imgSize.w : undefined}
        imgH={imgSize.h > 0 ? imgSize.h : undefined}
        className={isDdb ? "portrait--ddb" : "portrait--sheet-popup"}
      />
      {canEdit ? (
        <span
          className={isDdb ? "sheet-ddb-portrait__hover" : "sheet-popup-portrait__hover"}
          aria-hidden
        >
          <IconCamera size={22} />
          <span>{previewSrc ? "Ajustar retrato" : "Inserir imagem"}</span>
        </span>
      ) : null}
    </button>
  );

  const editorDialog =
    open && canEdit && editorPos ? (
      <div
        className="sheet-popup-portrait-editor sheet-popup-portrait-editor--portal"
        style={{ top: editorPos.top, left: editorPos.left }}
        role="dialog"
        aria-label="Editor de retrato"
      >
        <div className="sheet-popup-portrait-editor__head">
          <strong>Retrato e token</strong>
          <button
            type="button"
            className="sheet-popup-portrait-editor__close"
            onClick={() => setOpen(false)}
          >
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
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Trocar arquivo
          </button>
          {draftSrc ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void saveDraft()}
            >
              Salvar retrato
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !previewSrc}
              onClick={() => void saveFocusOnly()}
            >
              Aplicar enquadramento
            </button>
          )}
        </div>
        {msg ? <p className="sheet-popup-portrait-editor__msg">{msg}</p> : null}
      </div>
    ) : null;

  return (
    <>
      {isDdb ? (
        <div className="sheet-ddb-portrait-anchor" ref={anchorRef}>
          {portraitBtn}
        </div>
      ) : (
        <div className="sheet-popup-portrait-wrap" ref={anchorRef}>
          {portraitBtn}
        </div>
      )}

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

      {mounted && editorDialog ? createPortal(editorDialog, document.body) : null}
    </>
  );
}
