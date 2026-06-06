"use client";

import { useCallback, useRef } from "react";
import {
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import {
  computeFocusImgLayout,
  focusLayoutToImgStyle,
} from "@/lib/media/portrait-focus-layout";

type Props = {
  imageSrc: string;
  focus: PortraitFocus;
  onFocusChange?: (focus: PortraitFocus) => void;
  size: number;
  imgW: number;
  imgH: number;
  disabled?: boolean;
  className?: string;
  label?: string;
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
}: Props) {
  const dragRef = useRef<{ px: number; py: number; fx: number; fy: number } | null>(null);
  const normalized = normalizePortraitFocus(focus);
  const interactive = Boolean(onFocusChange) && !disabled && imgW > 0 && imgH > 0;

  const layout =
    imgW > 0 && imgH > 0
      ? computeFocusImgLayout(normalized, size, size, imgW, imgH)
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
      const dx = (e.clientX - d.px) / size;
      const dy = (e.clientY - d.py) / size;
      onFocusChange(
        normalizePortraitFocus({
          ...normalized,
          x: Math.min(1, Math.max(0, d.fx - dx)),
          y: Math.min(1, Math.max(0, d.fy - dy)),
        })
      );
    },
    [normalized, onFocusChange, size]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div
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
      ) : null}
      <span className="portrait-focus-ring portrait-focus-ring--overlay" aria-hidden />
    </div>
  );
}
