"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isLegacySiteTitle, resolveStaticTabTitle } from "@/lib/site-metadata";

/** Garante título correto da aba após navegação client-side. */
export function SiteTabTitle() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const expected = resolveStaticTabTitle(pathname);
    if (!expected) return;

    const current = document.title.trim();
    if (current === expected) return;
    if (isLegacySiteTitle(current) || !current.startsWith("MXDRPG")) {
      document.title = expected;
    }
  }, [pathname]);

  return null;
}
