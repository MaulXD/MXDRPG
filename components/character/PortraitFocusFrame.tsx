"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import {
  computeFocusImgLayout,
  focusLayoutToImgStyle,
  type FocusFitMode,
} from "@/lib/media/portrait-focus-layout";

type Props = {
  imageSrc: string;
  focus: PortraitFocus;
  onFocusChange?: (focus: PortraitFocus) => void;
  /** Tamanho inicial / fallback antes do ResizeObserver medir o frame real */
  size: number;
  imgW: number;
  imgH: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** contain = retrato; cover = token (preenche sem letterbox) */
  fitMode?: FocusFitMode;
};

export function PortraitFocusFrame({
  imageSrc,
  focus,
  onFocusChange,
  size,
  imgW,
  imgH,
  disabled,
  className = "",
  label,
  fitMode = "contain",
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ px: number; py: number; fx: number; fy: number } | null>(null);
  const [framePx, setFramePx] = useState({ w: size, h: size });
  const normalized = normalizePortraitFocus(focus);
  const interactive = Boolean(onFocusChange) && !disabled && imgW > 0 && imgH > 0;

  useEffect(() => {
    setFramePx({ w: size, h: size });
  }, [size]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0) setFramePx({ w, h });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageSrc, className]);

  const frameW = framePx.w;
  const frameH = framePx.h;
  const dragDenom = Math.max(frameW, frameH, 1);

  const layout =
    imgW > 0 && imgH > 0 && frameW > 0 && frameH > 0
      ? computeFocusImgLayout(normalized, frameW, frameH, imgW, imgH, fitMode)
      : null;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || !onFocusChange) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { px: e.clientX, py: e.clientY, fx: normalized.x, fy: normalized.y };
    },
    [interactive, normalized.x, normalized.y, onFocusChange]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || !onFocusChange) return;
      const dx = (e.clientX - d.px) / dragDenom;
      const dy = (e.clientY - d.py) / dragDenom;
      onFocusChange(
        normalizePortraitFocus({
          ...normalized,
          x: Math.min(1, Math.max(0, d.fx - dx)),
          y: Math.min(1, Math.max(0, d.fy - dy)),
        })
      );
    },
    [normalized, onFocusChange, dragDenom]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div
      ref={frameRef}
      className={`portrait-focus-frame ${className}`.trim()}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role={interactive ? "application" : undefined}
      aria-label={label ?? (interactive ? "Ajustar enquadramento arrastando" : undefined)}
    >
      {layout ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="portrait-focus-img"
          style={focusLayoutToImgStyle(layout)}
          draggable={false}
        />
      ) : imgW > 0 && imgH > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="portrait-focus-img portrait-focus-img--cover-fallback"
          draggable={false}
        />
      ) : null}
      <span className="portrait-focus-ring portrait-focus-ring--overlay" aria-hidden />
    </div>
  );
}
