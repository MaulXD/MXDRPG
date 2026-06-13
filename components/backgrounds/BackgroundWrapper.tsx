"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  msUntilNextBackgroundChange,
  resolveActiveBackgroundId,
  shouldShowAnimatedBackground,
  type BackgroundId,
} from "@/lib/backgrounds";

const HTML_ANIMATED_BG_CLASS = "eldarin-has-animated-bg";

const BACKGROUND_COMPONENTS: Record<BackgroundId, ComponentType> = {
  NevoaRoxa: dynamic(() => import("./NevoaRoxa"), { ssr: false }),
  GridTatico: dynamic(() => import("./GridTatico"), { ssr: false }),
  Oceano: dynamic(() => import("./Oceano"), { ssr: false }),
  Brasas: dynamic(() => import("./Brasas"), { ssr: false }),
  Runas: dynamic(() => import("./Runas"), { ssr: false }),
  Pergaminho: dynamic(() => import("./Pergaminho"), { ssr: false }),
  VoidArcano: dynamic(() => import("./VoidArcano"), { ssr: false }),
};

export function BackgroundWrapper() {
  const pathname = usePathname() ?? "";
  const showBackground = shouldShowAnimatedBackground(pathname);
  const [backgroundId, setBackgroundId] = useState<BackgroundId>(() =>
    resolveActiveBackgroundId()
  );

  useEffect(() => {
    document.documentElement.classList.toggle(HTML_ANIMATED_BG_CLASS, showBackground);
    return () => document.documentElement.classList.remove(HTML_ANIMATED_BG_CLASS);
  }, [showBackground]);

  useEffect(() => {
    if (!showBackground) return;

    const sync = () => setBackgroundId(resolveActiveBackgroundId());

    sync();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        sync();
        scheduleNext();
      }, msUntilNextBackgroundChange());
    };

    scheduleNext();
    const minuteCheck = setInterval(sync, 60_000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(minuteCheck);
    };
  }, [showBackground]);

  if (!showBackground) return null;

  const ActiveBackground = BACKGROUND_COMPONENTS[backgroundId];

  return (
    <div className="eldarin-animated-bg" aria-hidden key={backgroundId}>
      <ActiveBackground />
    </div>
  );
}
