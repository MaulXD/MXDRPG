"use client";

import { useEffect, useState } from "react";

export function useImageNaturalSize(src: string | null | undefined): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!src) {
      setSize({ w: 0, h: 0 });
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      if (!cancelled) setSize({ w: 0, h: 0 });
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return size;
}
