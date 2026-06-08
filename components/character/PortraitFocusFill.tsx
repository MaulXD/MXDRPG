"use client";

import { PortraitFocusFrame } from "@/components/character/PortraitFocusFrame";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

type Props = {
  imageSrc: string;
  focus: PortraitFocus;
  imgW: number;
  imgH: number;
  shape?: "circle" | "square";
  className?: string;
};

const FALLBACK_SIZE = 80;

export function PortraitFocusFill({
  imageSrc,
  focus,
  imgW,
  imgH,
  shape = "circle",
  className = "",
}: Props) {
  const canLayout = imgW > 0 && imgH > 0;

  return (
    <div className={`portrait-focus-fill ${className}`.trim()}>
      {canLayout ? (
        <PortraitFocusFrame
          imageSrc={imageSrc}
          focus={focus}
          size={FALLBACK_SIZE}
          imgW={imgW}
          imgH={imgH}
          className={shape === "square" ? "portrait-focus-frame--square" : undefined}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="portrait-focus-img--cover-fallback" />
      )}
    </div>
  );
}
