"use client";

import { PortraitFocusFrame } from "@/components/character/PortraitFocusFrame";
import { useImageNaturalSize } from "@/hooks/useImageNaturalSize";
import {
  DEFAULT_PORTRAIT_FOCUS,
  PORTRAIT_FOCUS_SCALE_MAX,
  PORTRAIT_FOCUS_SCALE_MIN,
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";

type Props = {
  imageSrc: string;
  focus: PortraitFocus;
  onFocusChange: (focus: PortraitFocus) => void;
  disabled?: boolean;
  /** Qual prévia destacar no editor */
  previewMode?: "portrait" | "token";
};

const FRAME = 200;
const TOKEN_PREVIEW = 96;

export function PortraitFocusEditor({
  imageSrc,
  focus,
  onFocusChange,
  disabled,
  previewMode = "portrait",
}: Props) {
  const normalized = normalizePortraitFocus(focus);
  const scale = normalized.scale ?? 1;
  const { w: imgW, h: imgH } = useImageNaturalSize(imageSrc);

  return (
    <div className="portrait-focus-editor">
      <p className="sheet-portrait-hint">
        Arraste dentro de qualquer círculo para posicionar. Use o controle de zoom abaixo.
      </p>

      <div className="portrait-focus-previews portrait-focus-previews--duo">
        <div
          className={`portrait-focus-preview-slot ${previewMode === "portrait" ? "is-active" : ""}`}
        >
          <span className="portrait-focus-preview-label">Retrato</span>
          <PortraitFocusFrame
            imageSrc={imageSrc}
            focus={normalized}
            onFocusChange={onFocusChange}
            size={TOKEN_PREVIEW}
            imgW={imgW}
            imgH={imgH}
            disabled={disabled}
            className="portrait-focus-frame--main portrait-focus-frame--preview portrait-focus-frame--interactive"
            label="Ajustar retrato"
          />
        </div>
        <div
          className={`portrait-focus-preview-slot ${previewMode === "token" ? "is-active" : ""}`}
        >
          <span className="portrait-focus-preview-label">Token</span>
          <PortraitFocusFrame
            imageSrc={imageSrc}
            focus={normalized}
            onFocusChange={onFocusChange}
            size={TOKEN_PREVIEW}
            imgW={imgW}
            imgH={imgH}
            disabled={disabled}
            className="portrait-focus-frame--token portrait-focus-frame--preview portrait-focus-frame--interactive"
            label="Ajustar token"
          />
        </div>
      </div>

      <PortraitFocusFrame
        imageSrc={imageSrc}
        focus={normalized}
        onFocusChange={onFocusChange}
        size={FRAME}
        imgW={imgW}
        imgH={imgH}
        disabled={disabled}
        className="portrait-focus-frame--main portrait-focus-frame--interactive"
        label="Ajustar enquadramento"
      />

      <div className="portrait-focus-sliders">
        <label>
          Zoom ({Math.round(scale * 100)}%)
          <input
            type="range"
            min={Math.round(PORTRAIT_FOCUS_SCALE_MIN * 100)}
            max={Math.round(PORTRAIT_FOCUS_SCALE_MAX * 100)}
            value={Math.round(scale * 100)}
            disabled={disabled}
            onChange={(e) =>
              onFocusChange(
                normalizePortraitFocus({
                  ...normalized,
                  scale: Number(e.target.value) / 100,
                })
              )
            }
          />
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled}
          onClick={() => onFocusChange(DEFAULT_PORTRAIT_FOCUS)}
        >
          Restaurar enquadramento
        </button>
      </div>
    </div>
  );
}
