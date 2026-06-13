import Link from "next/link";
import type { RpgSystem } from "@/lib/rpg/systems";
import "./mesas-hub.css";

type Props = {
  system: RpgSystem;
};

function CoverArt({ system }: { system: RpgSystem }) {
  return (
    <div
      className="rpg-cover-art"
      style={{ backgroundImage: `url(${system.coverSrc})` }}
      role="img"
      aria-label={system.coverAlt}
    />
  );
}

export function RpgSystemCoverCard({ system }: Props) {
  if (system.available && system.href) {
    return (
      <Link href={system.href} className="rpg-hub-card">
        <div className="rpg-hub-card__cover">
          <CoverArt system={system} />
        </div>
        <div className="rpg-hub-card__body">
          <h2 className="rpg-hub-card__name">{system.name}</h2>
          <p className="rpg-hub-card__tagline">{system.tagline}</p>
          <span className="rpg-hub-card__cta">Abrir mesas →</span>
        </div>
      </Link>
    );
  }

  return (
    <article className="rpg-hub-card rpg-hub-card--soon" aria-disabled>
      <div className="rpg-hub-card__cover">
        <CoverArt system={system} />
        <span className="rpg-hub-card__soon-badge">Em breve</span>
      </div>
      <div className="rpg-hub-card__body">
        <h2 className="rpg-hub-card__name">{system.name}</h2>
        <p className="rpg-hub-card__tagline">{system.tagline}</p>
        <span className="rpg-hub-card__cta rpg-hub-card__cta--soon">Indisponível no hub</span>
      </div>
    </article>
  );
}
