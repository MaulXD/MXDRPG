type Corner = "tl" | "tr" | "bl" | "br";

const POLY: Record<Corner, string> = {
  tl: "16,2 2,2 2,16",
  tr: "2,2 16,2 16,16",
  bl: "16,16 2,16 2,2",
  br: "2,16 16,16 16,2",
};

type Props = {
  emphasized?: boolean;
  stroke?: string;
};

export function HudCorners({ emphasized = false, stroke = "#d4a030" }: Props) {
  const sw = emphasized ? 2.5 : 2;
  return (
    <>
      {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
        <svg
          key={c}
          className={`hud-corner hud-corner--${c}`}
          viewBox="0 0 18 18"
          overflow="visible"
          aria-hidden
        >
          <polyline
            points={POLY[c]}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="square"
          />
        </svg>
      ))}
    </>
  );
}
