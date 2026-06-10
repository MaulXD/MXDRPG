"use client";

import "./user-avatar.css";
import type { CSSProperties } from "react";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";

type Props = {
  url: string | null | undefined;
  focus?: PortraitFocus | null;
  label: string;
  className?: string;
  imgClassName?: string;
};

export function UserAvatar({ url, focus, label, className = "", imgClassName = "" }: Props) {
  const initial = (label.trim() || "?").slice(0, 1).toUpperCase();
  const resolvedFocus = sanitizePortraitFocus(focus) ?? DEFAULT_PORTRAIT_FOCUS;
  const imgStyle: CSSProperties = {
    objectFit: "cover",
    ...portraitFocusToImgStyle(resolvedFocus),
  };

  if (url) {
    return (
      <span className={`user-avatar ${className}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className={imgClassName || undefined} style={imgStyle} />
      </span>
    );
  }

  return <span className={`user-avatar user-avatar--fallback ${className}`.trim()}>{initial}</span>;
}
