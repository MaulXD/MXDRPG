"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ComponentType } from "react";
import { resolveActiveBackgroundId, type BackgroundId } from "@/lib/backgrounds";

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
  const isMesa = pathname.startsWith("/mesa");

  useEffect(() => {
    document.documentElement.classList.toggle(HTML_ANIMATED_BG_CLASS, !isMesa);
    return () => document.documentElement.classList.remove(HTML_ANIMATED_BG_CLASS);
  }, [isMesa]);

  if (isMesa) return null;

  const ActiveBackground = BACKGROUND_COMPONENTS[resolveActiveBackgroundId()];

  return (
    <div className="eldarin-animated-bg" aria-hidden>
      <ActiveBackground />
    </div>
  );
}
