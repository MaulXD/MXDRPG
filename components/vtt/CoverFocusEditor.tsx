"use client";

import { PortraitFocusFrame } from "@/components/character/PortraitFocusFrame";
import "@/components/character/portrait-focus.css";
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
};

const CARD_PREVIEW = 120;
const STAGE_SIZE = 200;

/** Zoom e arraste para capa quadrada (cartões de mesa). */
export function CoverFocusEditor({ imageSrc, focus, onFocusChange, disabled }: Props) {
  const normalized = normalizePortraitFocus(focus);
  const scale = normalized.scale ?? 1;
  const { w: imgW, h: imgH } = useImageNaturalSize(imageSrc);

  return (
    <div className="cover-focus-editor">
      <p className="vtt-combat-hint cover-focus-editor__hint">
        Zoom 100% mostra a imagem inteira no quadrado. Arraste para reposicionar ao aproximar.
      </p>

      <div className="cover-focus-editor__card-preview" aria-hidden>
        <span className="cover-focus-editor__label">Miniatura nos cartões</span>
        <PortraitFocusFrame
          imageSrc={imageSrc}
          focus={normalized}
          size={CARD_PREVIEW}
          imgW={imgW}
          imgH={imgH}
          fitMode="cover"
          className="cover-focus-editor__frame cover-focus-editor__frame--card"
          label="Prévia quadrada"
        />
      </div>

      <div className="cover-focus-editor__stage">
        <PortraitFocusFrame
          imageSrc={imageSrc}
          focus={normalized}
          onFocusChange={onFocusChange}
          size={STAGE_SIZE}
          imgW={imgW}
          imgH={imgH}
          fitMode="cover"
          disabled={disabled}
          className="cover-focus-editor__frame cover-focus-editor__frame--stage portrait-focus-frame--interactive"
          label="Ajustar enquadramento da capa"
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
          className="vtt-btn vtt-btn--ghost"
          disabled={disabled}
          onClick={() => onFocusChange(DEFAULT_PORTRAIT_FOCUS)}
        >
          Imagem inteira (sem zoom)
        </button>
      </div>
    </div>
  );
}
