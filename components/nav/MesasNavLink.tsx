"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconShield } from "@/components/ui/EldarinIcons";
import { isMesasNavActive, MESAS_HUB_PATH } from "@/lib/rpg/systems";

type Props = {
  variant?: "site" | "vtt";
};

/** Link na navbar → página /mesas (hub de RPGs com capas). */
export function MesasNavLink({ variant = "site" }: Props) {
  const pathname = usePathname() ?? "";
  const active = isMesasNavActive(pathname);

  return (
    <Link
      href={MESAS_HUB_PATH}
      className={`nav-link${active ? " nav-link--active" : ""}${variant === "vtt" ? " mesas-nav-link--vtt" : ""}`}
      aria-current={active ? "page" : undefined}
      data-site-tip="Hub de mesas e RPGs"
    >
      <IconShield size={18} className="nav-link__icon" />
      <span className="nav-link__label">Mesas</span>
    </Link>
  );
}
