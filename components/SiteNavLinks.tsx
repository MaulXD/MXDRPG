"use client";

import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { MesasNavLink } from "@/components/nav/MesasNavLink";
import { IconBook, IconScroll } from "@/components/ui/EldarinIcons";

const links = [
  { href: "/compendios", label: "Compêndios", icon: IconBook },
  { href: "/sistema", label: "Sistema", icon: IconScroll },
] as const;

export function SiteNavLinks() {
  return (
    <>
      <MesasNavLink />
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <AnimatedNavLink key={l.href} href={l.href} icon={<Icon size={18} />}>
            {l.label}
          </AnimatedNavLink>
        );
      })}
    </>
  );
}
