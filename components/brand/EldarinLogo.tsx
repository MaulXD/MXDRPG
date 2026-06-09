import Link from "next/link";
import "./eldarin-logo.css";

export const BRAND_NAME = "MXDRPG";

export type EldarinLogoVariant = "header" | "full" | "mark";

type Props = {
  variant?: EldarinLogoVariant;
  /** Omita ou `null` para renderizar sem link (ex.: hero dentro de h1). */
  href?: string | null;
  className?: string;
  /** Texto exibido; padrão MXDRPG */
  name?: string;
};

export function EldarinLogo({
  variant = "header",
  href = "/",
  className = "",
  name = BRAND_NAME,
}: Props) {
  const rootClass = `eldarin-logo eldarin-logo--${variant}${className ? ` ${className}` : ""}`;
  const content = <span className="eldarin-logo__name">{name}</span>;

  if (href == null || href === "") {
    return <span className={rootClass}>{content}</span>;
  }

  return (
    <Link href={href} className={rootClass} aria-label={name}>
      {content}
    </Link>
  );
}
