import Image from "next/image";
import Link from "next/link";
import "./eldarin-logo.css";

export const BRAND_FAVICON = "/brand/favicon.png";
export const BRAND_NAVBAR = "/brand/navbar.png";
export const BRAND_LANDING = "/brand/landing.png";

export type EldarinLogoVariant = "header" | "full" | "mark";

type Props = {
  variant?: EldarinLogoVariant;
  /** Omita ou `null` para renderizar sem link (ex.: hero dentro de h1). */
  href?: string | null;
  className?: string;
  /** Texto alternativo; padrão descreve a marca. */
  alt?: string;
  /** Exibir nome “Eldarin” ao lado do ícone (padrão: sim, exceto mark). */
  showName?: boolean;
};

const ICON_SIZE: Record<EldarinLogoVariant, number> = {
  header: 28,
  full: 56,
  mark: 32,
};

export function EldarinLogo({
  variant = "header",
  href = "/",
  className = "",
  alt = variant === "header" ? "MXDRPG" : "Eldarin",
  showName = variant !== "mark" && variant !== "header",
}: Props) {
  const rootClass = `eldarin-logo eldarin-logo--${variant}${className ? ` ${className}` : ""}`;
  const size = ICON_SIZE[variant];

  const content =
    variant === "header" ? (
      <Image
        src={BRAND_NAVBAR}
        alt={alt}
        width={26}
        height={38}
        className="eldarin-logo__navbar"
        priority
      />
    ) : (
      <>
        <Image
          src={BRAND_FAVICON}
          alt={showName ? "" : alt}
          aria-hidden={showName ? true : undefined}
          width={size}
          height={size}
          className="eldarin-logo__icon"
          priority={variant === "full"}
        />
        {showName ? <span className="eldarin-logo__name">{alt}</span> : null}
      </>
    );

  if (href == null || href === "") {
    return <span className={rootClass}>{content}</span>;
  }

  return (
    <Link href={href} className={rootClass} aria-label={alt}>
      {content}
    </Link>
  );
}
