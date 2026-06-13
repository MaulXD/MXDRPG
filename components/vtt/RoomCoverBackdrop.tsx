"use client";

import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import { resolveMesaCoverSrc } from "@/lib/rpg/systems";

type Props = {
  coverUrl?: string | null;
  coverFocus?: PortraitFocus | null;
};

/** Capa decorativa da mesa — atrás do mapa, sem capturar cliques. */
export function RoomCoverBackdrop({ coverUrl, coverFocus }: Props) {
  const src = resolveMesaCoverSrc(coverUrl);
  const focus = sanitizePortraitFocus(coverFocus) ?? DEFAULT_PORTRAIT_FOCUS;

  return (
    <div className="mesa-room-cover" aria-hidden>
      <img
        src={src}
        alt=""
        className="mesa-room-cover__img"
        style={portraitFocusToImgStyle(focus)}
        decoding="async"
      />
      <div className="mesa-room-cover__veil" />
    </div>
  );
}
