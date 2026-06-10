"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export function useCanvasWrapSize(wrapRef: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 800, h: 640 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      setSize({
        w: Math.max(el.clientWidth, 1),
        h: Math.max(el.clientHeight, 1),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wrapRef]);

  return size;
}
