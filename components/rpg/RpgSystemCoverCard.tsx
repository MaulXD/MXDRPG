import Link from "next/link";
import type { RpgSystem } from "@/lib/rpg/systems";
import "./mesas-hub.css";

type CompactProps = {
  system: RpgSystem;
  variant: "compact";
};

type HubProps = {
  system: RpgSystem;
  variant: "hub";
};

type Props = CompactProps | HubProps;

function CoverImage({ system, sizes }: { system: RpgSystem; sizes?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={system.coverSrc} alt={system.coverAlt} loading="lazy" decoding="async" sizes={sizes} />
  );
}

export function RpgSystemCoverCard(props: Props) {
  const { system, variant } = props;

  if (variant === "compact") {
    if (system.available && system.href) {
      return (
        <Link href={system.href} className="rpg-cover-card" onClick={(e) => e.stopPropagation()}>
          <div className="rpg-cover-card__cover">
            <CoverImage system={system} />
          </div>
          <div className="rpg-cover-card__body">
            <p className="rpg-cover-card__name">{system.name}</p>
            <p className="rpg-cover-card__tagline">{system.tagline}</p>
            <span className="rpg-cover-card__badge">Jogar</span>
          </div>
        </Link>
      );
    }

    return (
      <article className="rpg-cover-card rpg-cover-card--soon" aria-disabled>
        <div className="rpg-cover-card__cover">
          <CoverImage system={system} />
        </div>
        <div className="rpg-cover-card__body">
          <p className="rpg-cover-card__name">{system.name}</p>
          <p className="rpg-cover-card__tagline">{system.tagline}</p>
          <span className="rpg-cover-card__badge">Em breve</span>
        </div>
      </article>
    );
  }

  if (system.available && system.href) {
    return (
      <Link href={system.href} className="rpg-hub-card">
        <div className="rpg-hub-card__cover">
          <CoverImage system={system} />
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
        <CoverImage system={system} />
      </div>
      <div className="rpg-hub-card__body">
        <h2 className="rpg-hub-card__name">{system.name}</h2>
        <p className="rpg-hub-card__tagline">{system.tagline}</p>
        <span className="rpg-hub-card__cta">Em breve</span>
      </div>
    </article>
  );
}
