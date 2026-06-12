"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import { buildRoomCoverFromFile } from "@/lib/media/image-upload-client";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import { patchRoomSettings } from "@/hooks/useRoomSync";
import type { RoomSnapshot } from "@/lib/room/types";

type Props = {
  roomId: string;
  coverUrl?: string | null;
  coverFocus?: PortraitFocus | null;
  /** hub = gerenciamento da aventura; vtt = painel da sala ao vivo */
  variant?: "hub" | "vtt";
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function RoomCoverEditor({
  roomId,
  coverUrl,
  coverFocus,
  variant = "vtt",
  onUpdated,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const [draftSrc, setDraftSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
    };
  }, [draftSrc]);

  const focus = sanitizePortraitFocus(coverFocus) ?? DEFAULT_PORTRAIT_FOCUS;
  const previewSrc = draftSrc ?? coverUrl ?? null;

  async function persistFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await buildRoomCoverFromFile(file);
      const snapshot = await patchRoomSettings(roomId, {
        coverUrl: dataUrl,
        coverFocus: focus,
      });
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(null);
      if (fileRef.current) fileRef.current.value = "";
      onUpdated(snapshot);
      setMsg("Capa da mesa salva.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar capa");
    } finally {
      setBusy(false);
    }
  }

  function onPickFile(file: File) {
    pendingFileRef.current = file;
    if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
    setDraftSrc(URL.createObjectURL(file));
    setMsg("Clique em «Aplicar capa» para confirmar.");
  }

  async function removeCover() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await patchRoomSettings(roomId, { coverUrl: null, coverFocus: null });
      pendingFileRef.current = null;
      if (draftSrc?.startsWith("blob:")) URL.revokeObjectURL(draftSrc);
      setDraftSrc(null);
      if (fileRef.current) fileRef.current.value = "";
      onUpdated(snapshot);
      setMsg("Capa removida.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao remover capa");
    } finally {
      setBusy(false);
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();
    onPickFile(file);
  }

  const hub = variant === "hub";

  return (
    <fieldset
      className={`vtt-settings-fieldset mesa-room-cover-editor${hub ? " mesa-room-cover-editor--hub" : ""}`}
      onPaste={onPaste}
    >
      {!hub ? <legend className="vtt-eyebrow">Foto de capa</legend> : null}
      <p className="vtt-combat-hint" style={{ margin: 0 }}>
        {hub
          ? `JPG, PNG ou WebP. ${IMAGE_UPLOAD_HINT}`
          : `Imagem opcional exibida discretamente atrás do mapa para todos na mesa. ${IMAGE_UPLOAD_HINT}`}
      </p>

      <div
        className={`mesa-room-cover-preview${previewSrc ? " mesa-room-cover-preview--has-image" : ""}${hub ? " mesa-room-cover-preview--hub" : ""}`}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            style={portraitFocusToImgStyle(focus)}
            className="mesa-room-cover-preview__img"
          />
        ) : (
          <span className="mesa-room-cover-preview__placeholder">Sem capa</span>
        )}
      </div>

      <div className="vtt-map-panel-actions mesa-room-cover-editor__actions">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
          }}
        />
        <button
          type="button"
          className="vtt-btn vtt-btn--ghost"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Escolher imagem
        </button>
        {draftSrc ? (
          <button
            type="button"
            className="vtt-btn"
            disabled={busy}
            onClick={() => {
              const file = pendingFileRef.current;
              if (file) void persistFile(file);
            }}
          >
            Aplicar capa
          </button>
        ) : null}
        {coverUrl ? (
          <button
            type="button"
            className="vtt-btn vtt-btn--ghost"
            disabled={busy}
            onClick={() => void removeCover()}
          >
            Remover
          </button>
        ) : null}
      </div>
      {msg ? <p className="vtt-combat-hint">{msg}</p> : null}
    </fieldset>
  );
}
