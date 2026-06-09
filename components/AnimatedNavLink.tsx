"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Só marca ativo na URL exata (ex.: Início `/`). */
  exact?: boolean;
  icon?: React.ReactNode;
};

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
      {icon ? <span className="nav-link__icon">{icon}</span> : null}
      <span className="nav-link__label">{children}</span>
    </Link>
  );
}
