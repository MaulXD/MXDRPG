"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { resolveActiveBackgroundId, type BackgroundId } from "@/lib/backgrounds";

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
  if (pathname.startsWith("/mesa")) return null;

  const ActiveBackground = BACKGROUND_COMPONENTS[resolveActiveBackgroundId()];

  return (
    <div className="eldarin-animated-bg" aria-hidden>
      <ActiveBackground />
    </div>
  );
}
