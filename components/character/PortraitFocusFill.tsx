"use client";

import { useEffect, useRef, useState } from "react";
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

export function PortraitFocusFill({
  imageSrc,
  focus,
  imgW,
  imgH,
  shape = "circle",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 0;
      if (w > 0) setSize(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`portrait-focus-fill ${className}`.trim()}>
      {size > 0 && imgW > 0 ? (
        <PortraitFocusFrame
          imageSrc={imageSrc}
          focus={focus}
          size={size}
          imgW={imgW}
          imgH={imgH}
          className={shape === "square" ? "portrait-focus-frame--square" : undefined}
        />
      ) : null}
    </div>
  );
}
