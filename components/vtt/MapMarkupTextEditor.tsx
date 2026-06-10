"use client";

import { useEffect, useRef } from "react";
import type { BattlefieldView } from "@/lib/vtt/battlefield-view";
import { worldToScreen } from "@/lib/vtt/battlefield-view";

type Props = {
  wx: number;
  wy: number;
  wrapW: number;
  wrapH: number;
  view: BattlefieldView;
  color: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
};

export function MapMarkupTextEditor({
  wx,
  wy,
  wrapW,
  wrapH,
  view,
  color,
  onCommit,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const screen = worldToScreen(wx, wy, wrapW, wrapH, view);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      className="map-markup-text-input"
      maxLength={120}
      placeholder="Texto…"
      aria-label="Texto da marcação"
      style={{ left: screen.x, top: screen.y, color }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          const text = e.currentTarget.value.trim();
          if (text) onCommit(text);
          else onCancel();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={(e) => {
        const text = e.currentTarget.value.trim();
        if (text) onCommit(text);
        else onCancel();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
