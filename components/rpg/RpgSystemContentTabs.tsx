import Link from "next/link";
import { RPG_SYSTEMS, type RpgSystemId } from "@/lib/rpg/systems";
import "./rpg-content-tabs.css";

type Props = {
  current: RpgSystemId;
  basePath: string;
};

/** Seletor de sistema pra páginas de conteúdo (compêndio, mundo) — só sistemas disponíveis. */
export function RpgSystemContentTabs({ current, basePath }: Props) {
  const systems = RPG_SYSTEMS.filter((s) => s.available);
  if (systems.length <= 1) return null;

  return (
    <nav className="rpg-content-tabs" aria-label="Escolher sistema de RPG">
      {systems.map((sys) => (
        <Link
          key={sys.id}
          href={sys.id === "eldarin" ? basePath : `${basePath}?sistema=${sys.id}`}
          className={`rpg-content-tabs__tab${sys.id === current ? " rpg-content-tabs__tab--active" : ""}`}
          aria-current={sys.id === current ? "page" : undefined}
        >
          {sys.shortName}
        </Link>
      ))}
    </nav>
  );
}
