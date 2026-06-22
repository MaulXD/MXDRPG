"use client";

import { useState } from "react";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import { ELDARIN_DEFAULT_COVER_SRC, resolveMesaCoverSrc } from "@/lib/rpg/systems";

type Props = {
  coverUrl?: string | null;
  coverFocus?: PortraitFocus | null;
};

/** Capa decorativa da mesa — atrás do mapa, sem capturar cliques. */
export function RoomCoverBackdrop({ coverUrl, coverFocus }: Props) {
  const custom = coverUrl?.trim();
  if (!custom) return null;

  const primary = resolveMesaCoverSrc(custom);
  const [src, setSrc] = useState(primary);
  const focus = sanitizePortraitFocus(coverFocus) ?? DEFAULT_PORTRAIT_FOCUS;

  return (
    <div className="mesa-room-cover" aria-hidden>
      <img
        src={src}
        alt=""
        className="mesa-room-cover__img"
        style={portraitFocusToImgStyle(focus)}
        decoding="async"
        onError={() => {
          if (src !== ELDARIN_DEFAULT_COVER_SRC) setSrc(ELDARIN_DEFAULT_COVER_SRC);
        }}
      />
      <div className="mesa-room-cover__veil" />
    </div>
  );
}
