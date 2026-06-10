import Image from "next/image";
import Link from "next/link";
import "./eldarin-logo.css";

export const BRAND_NAME = "MXDRPG";
export const BRAND_LOGO_LANDING = "/brand/logomxdrpg-landing.png";
export const BRAND_LOGO_NAVBAR = "/brand/mxd-navbar.png";

export type EldarinLogoVariant = "header" | "full" | "mark";

type Props = {
  variant?: EldarinLogoVariant;
  /** Omita ou `null` para renderizar sem link (ex.: hero dentro de h1). */
  href?: string | null;
  className?: string;
  /** Texto exibido; padrão MXDRPG */
  name?: string;
  /** Arte MXDRPG — landing (circular) ou navbar (horizontal) */
  image?: "landing" | "navbar";
};

export function EldarinLogo({
  variant = "header",
  href = "/",
  className = "",
  name = BRAND_NAME,
  image,
}: Props) {
  const rootClass = `eldarin-logo eldarin-logo--${variant}${image ? ` eldarin-logo--image eldarin-logo--image-${image}` : ""}${className ? ` ${className}` : ""}`;
  const content =
    image === "landing" ? (
      <Image
        src={BRAND_LOGO_LANDING}
        alt={name}
        width={400}
        height={400}
        className="eldarin-logo__img eldarin-logo__img--landing"
        priority={variant === "full"}
      />
    ) : image === "navbar" ? (
      <Image
        src={BRAND_LOGO_NAVBAR}
        alt={name}
        width={280}
        height={72}
        className="eldarin-logo__img eldarin-logo__img--navbar"
        priority
      />
    ) : (
      <span className="eldarin-logo__name">{name}</span>
    );

  if (href == null || href === "") {
    return <span className={rootClass}>{content}</span>;
  }

  return (
    <Link href={href} className={rootClass} aria-label={name}>
      {content}
    </Link>
  );
}
