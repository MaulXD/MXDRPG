"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BattleToken } from "@/lib/vtt/types";

/** Cache de HTMLImageElement por token — evita recriar src a cada render */
export function useTokenImages(tokens: BattleToken[]) {
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imgTick, setImgTick] = useState(0);
  const imageKey = useMemo(
    () => tokens.map((t) => `${t.id}:${t.imageUrl ?? ""}`).join("|"),
    [tokens]
  );

  useEffect(() => {
    const map = imagesRef.current;
    let cancelled = false;

    const bump = () => {
      if (!cancelled) setImgTick((n) => n + 1);
    };

    for (const token of tokens) {
      if (!token.imageUrl) {
        map.delete(token.id);
        continue;
      }
      let img = map.get(token.id);
      if (img?.src === token.imageUrl) {
        if (!img.complete) {
          img.addEventListener("load", bump, { once: true });
          img.addEventListener("error", bump, { once: true });
        }
        continue;
      }
      img = new Image();
      img.decoding = "async";
      img.addEventListener("load", bump, { once: true });
      img.addEventListener("error", bump, { once: true });
      img.src = token.imageUrl;
      map.set(token.id, img);
      if (img.complete) bump();
    }

    return () => {
      cancelled = true;
    };
  }, [imageKey, tokens]);

  return { imagesRef, imgTick };
}
