import Image from "next/image";
import Link from "next/link";
import "./eldarin-logo.css";

const BRAND = {
  logotipo: "/brand/eldarin-logotipo.png",
  dragao: "/brand/eldarin-dragao.png",
  tipografia: "/brand/eldarin-tipografia.png",
} as const;

export type EldarinLogoVariant = "header" | "full" | "mark";

type Props = {
  variant?: EldarinLogoVariant;
  /** Omita ou `null` para renderizar sem link (ex.: hero dentro de h1). */
  href?: string | null;
  className?: string;
  /** Texto alternativo; padrão descreve a marca. */
  alt?: string;
};

export function EldarinLogo({
  variant = "header",
  href = "/",
  className = "",
  alt = "Eldarin",
}: Props) {
  const rootClass = `eldarin-logo eldarin-logo--${variant}${className ? ` ${className}` : ""}`;

  const content =
    variant === "full" ? (
      <Image
        src={BRAND.logotipo}
        alt={alt}
        width={160}
        height={72}
        className="eldarin-logo__full-img"
        priority={variant === "full"}
      />
    ) : variant === "mark" ? (
      <Image
        src={BRAND.dragao}
        alt={alt}
        width={32}
        height={32}
        className="eldarin-logo__mark-img"
      />
    ) : (
      <>
        <Image
          src={BRAND.dragao}
          alt=""
          aria-hidden
          width={28}
          height={28}
          className="eldarin-logo__dragao"
        />
        <Image
          src={BRAND.tipografia}
          alt={alt}
          width={108}
          height={24}
          className="eldarin-logo__tipografia"
          priority
        />
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
