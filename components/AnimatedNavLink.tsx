"use client";

import Link from "next/link";
import { cloneElement, isValidElement, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Só marca ativo na URL exata (ex.: Início `/`). */
  exact?: boolean;
  icon?: ReactNode;
};

function renderNavIcon(icon: ReactNode): ReactNode {
  if (!icon) return null;
  if (isValidElement<{ className?: string }>(icon)) {
    const prev = icon.props.className ?? "";
    return cloneElement(icon, {
      className: `nav-link__icon${prev ? ` ${prev}` : ""}`,
    });
  }
  return <span className="nav-link__icon">{icon}</span>;
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AnimatedNavLink({
  href,
  children,
  className = "nav-link",
  exact,
  icon,
}: Props) {
  const pathname = usePathname() ?? "";
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      className={`${className}${active ? " nav-link--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {renderNavIcon(icon)}
      <span className="nav-link__label">{children}</span>
    </Link>
  );
}
