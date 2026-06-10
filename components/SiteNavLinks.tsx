"use client";

import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { MesasNavLink } from "@/components/nav/MesasNavLink";
import { IconBook, IconHome, IconScroll } from "@/components/ui/EldarinIcons";

const links = [
  { href: "/", label: "Início", exact: true, icon: IconHome },
  { href: "/sistema", label: "Sistema", icon: IconScroll },
  { href: "/compendios", label: "Compêndios", icon: IconBook },
] as const;

export function SiteNavLinks() {
  return (
    <>
      <MesasNavLink />
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <AnimatedNavLink
            key={l.href}
            href={l.href}
            exact={"exact" in l ? l.exact : undefined}
            icon={<Icon size={18} />}
          >
            {l.label}
          </AnimatedNavLink>
        );
      })}
    </>
  );
}
