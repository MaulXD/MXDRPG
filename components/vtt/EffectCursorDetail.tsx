"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { computeCursorDetailPlacement } from "@/lib/vtt/cursor-detail-placement";
import "./token-action-ring.css";

type Props = {
  pointer: { x: number; y: number } | null;
  children: ReactNode;
  className?: string;
};

export function EffectCursorDetail({ pointer, children, className = "" }: Props) {
  if (!pointer || typeof document === "undefined") return null;

  const placement = computeCursorDetailPlacement(pointer);

  return createPortal(
    <div
      className={`token-action-ring__detail token-action-ring__detail--hint token-action-ring__detail--cursor${
        placement.flipLeft ? " token-action-ring__detail--cursor-left" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        {
          left: placement.left,
          top: placement.top,
        } as CSSProperties
      }
      role="tooltip"
    >
      {children}
    </div>,
    document.body
  );
}
