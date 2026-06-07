"use client";

import { PortraitFocusFill } from "@/components/character/PortraitFocusFill";
import { PortraitFrameSvg } from "@/components/vtt/PortraitFrameSvg";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";

type Props = {
  tier: PortraitFrameTier;
  imageSrc?: string | null;
  initials?: string;
  alt?: string;
  focus?: PortraitFocus;
  imgW?: number;
  imgH?: number;
  size?: "default" | "hud";
  className?: string;
};

export function Portrait({
  tier,
  imageSrc,
  initials,
  alt = "",
  focus,
  imgW = 0,
  imgH = 0,
  size = "default",
  className = "",
}: Props) {
  const rootClass = `portrait${size === "hud" ? " portrait--hud" : ""}${className ? ` ${className}` : ""}`;
  const canFocus = Boolean(imageSrc && focus && imgW > 0 && imgH > 0);

  return (
    <div className={rootClass}>
      <div className="portrait-inner">
        {canFocus ? (
          <PortraitFocusFill
            imageSrc={imageSrc!}
            focus={focus!}
            imgW={imgW}
            imgH={imgH}
            shape="square"
          />
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={alt} />
        ) : initials ? (
          <span className="portrait-initials">{initials}</span>
        ) : null}
      </div>
      <PortraitFrameSvg tier={tier} />
    </div>
  );
}
