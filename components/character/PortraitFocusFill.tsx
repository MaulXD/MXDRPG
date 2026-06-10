"use client";

import { PortraitFocusFrame } from "@/components/character/PortraitFocusFrame";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import type { FocusFitMode } from "@/lib/media/portrait-focus-layout";

type Props = {
  imageSrc: string;
  focus: PortraitFocus;
  imgW: number;
  imgH: number;
  shape?: "circle" | "square";
  fitMode?: FocusFitMode;
  className?: string;
};

const FALLBACK_SIZE = 80;

export function PortraitFocusFill({
  imageSrc,
  focus,
  imgW,
  imgH,
  shape = "circle",
  fitMode = "contain",
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
          fitMode={fitMode}
          className={shape === "square" ? "portrait-focus-frame--square" : undefined}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="portrait-focus-img--cover-fallback" />
      )}
    </div>
  );
}
