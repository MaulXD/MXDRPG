import type { ReactNode } from "react";

type CornerStroke = "#d4a030" | "#8a6020";

const CORNERS = ["tl", "tr", "bl", "br"] as const;
const POLY: Record<(typeof CORNERS)[number], string> = {
  tl: "16,2 2,2 2,16",
  tr: "2,2 16,2 16,16",
  bl: "16,16 2,16 2,2",
  br: "2,16 16,16 16,2",
};

type Props = {
  children: ReactNode;
  variant?: "default" | "parchment";
  className?: string;
};

export function OrnamentCard({ children, variant = "default", className = "" }: Props) {
  const stroke: CornerStroke = variant === "parchment" ? "#8a6020" : "#d4a030";
  const rootClass = [
    "ornament-card",
    variant === "parchment" ? "ornament-card--parchment" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {CORNERS.map((c) => (
        <svg
          key={c}
          className={`card-corner card-corner--${c}`}
          viewBox="0 0 18 18"
          overflow="visible"
          aria-hidden
        >
          <polyline
            points={POLY[c]}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="square"
          />
        </svg>
      ))}
      {children}
    </div>
  );
}
