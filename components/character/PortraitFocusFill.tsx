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
    const measure = (entry?: ResizeObserverEntry) => {
      const rect = entry?.contentRect ?? el.getBoundingClientRect();
      const dim = Math.round(Math.min(rect.width, rect.height));
      if (dim > 0) setSize(dim);
    };
    measure();
    const ro = new ResizeObserver(([entry]) => measure(entry));
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageSrc]);

  return (
    <div ref={ref} className={`portrait-focus-fill ${className}`.trim()}>
      {size > 0 && imgW > 0 && imgH > 0 ? (
        <PortraitFocusFrame
          imageSrc={imageSrc}
          focus={focus}
          size={size}
          imgW={imgW}
          imgH={imgH}
          className={shape === "square" ? "portrait-focus-frame--square" : undefined}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
  );
}
