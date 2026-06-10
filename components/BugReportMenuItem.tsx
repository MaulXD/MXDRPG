"use client";

import { IconBug } from "@/components/ui/EldarinIcons";
import "@/components/bug-report.css";

type Props = {
  onOpen: () => void;
};

/** Item do menu do usuário — o modal fica no `HeaderUserMenu` para não sumir ao fechar o dropdown. */
export function BugReportMenuItem({ onOpen }: Props) {
  return (
    <button
      type="button"
      className="header-user-menu__item bug-report-menu-item"
      role="menuitem"
      onClick={onOpen}
    >
      <IconBug size={16} className="bug-report-menu-item__icon" aria-hidden />
      Reportar bug
    </button>
  );
}
