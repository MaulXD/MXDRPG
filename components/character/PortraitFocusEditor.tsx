"use client";

import type { CSSProperties } from "react";
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
  onPreviewModeChange?: (mode: "portrait" | "token") => void;
  /** Focos separados para as miniaturas (quando omitido, usa `focus` em ambas). */
  portraitFocus?: PortraitFocus;
  tokenFocus?: PortraitFocus;
  tokenRingColor?: string;
};

const FRAME = 200;
const TOKEN_PREVIEW = 96;

export function PortraitFocusEditor({
  imageSrc,
  focus,
  onFocusChange,
  disabled,
  previewMode = "portrait",
  onPreviewModeChange,
  portraitFocus,
  tokenFocus,
  tokenRingColor,
}: Props) {
  const normalized = normalizePortraitFocus(focus);
  const portraitPreview = normalizePortraitFocus(portraitFocus ?? focus);
  const tokenPreview = normalizePortraitFocus(tokenFocus ?? focus);
  const scale = normalized.scale ?? 1;
  const { w: imgW, h: imgH } = useImageNaturalSize(imageSrc);

  function pickSlot(slot: "portrait" | "token") {
    if (disabled) return;
    onPreviewModeChange?.(slot);
  }

  return (
    <div className="portrait-focus-editor">
      <p className="sheet-portrait-hint portrait-focus-editor__hint">
        Arraste no círculo grande para posicionar. Clique em Retrato ou Token para alternar o alvo.
      </p>

      <div className="portrait-focus-previews portrait-focus-previews--duo">
        <button
          type="button"
          className={`portrait-focus-preview-slot${previewMode === "portrait" ? " is-active" : ""}`}
          onClick={() => pickSlot("portrait")}
          disabled={disabled}
          aria-pressed={previewMode === "portrait"}
        >
          <span className="portrait-focus-preview-label">Retrato</span>
          <PortraitFocusFrame
            imageSrc={imageSrc}
            focus={portraitPreview}
            size={TOKEN_PREVIEW}
            imgW={imgW}
            imgH={imgH}
            className="portrait-focus-frame--preview"
            label="Prévia do retrato"
          />
        </button>
        <button
          type="button"
          className={`portrait-focus-preview-slot portrait-focus-preview-slot--token${previewMode === "token" ? " is-active" : ""}`}
          onClick={() => pickSlot("token")}
          disabled={disabled}
          aria-pressed={previewMode === "token"}
          style={tokenRingColor ? ({ "--token-ring": tokenRingColor } as CSSProperties) : undefined}
        >
          <span className="portrait-focus-preview-label">Token</span>
          <PortraitFocusFrame
            imageSrc={imageSrc}
            focus={tokenPreview}
            size={TOKEN_PREVIEW}
            imgW={imgW}
            imgH={imgH}
            className="portrait-focus-frame--preview portrait-focus-frame--token-ring"
            label="Prévia do token"
          />
        </button>
      </div>

      <div className="portrait-focus-editor__stage">
        <PortraitFocusFrame
          imageSrc={imageSrc}
          focus={normalized}
          onFocusChange={onFocusChange}
          size={FRAME}
          imgW={imgW}
          imgH={imgH}
          disabled={disabled}
          className="portrait-focus-frame--stage portrait-focus-frame--interactive"
          label="Ajustar enquadramento"
        />
      </div>

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
