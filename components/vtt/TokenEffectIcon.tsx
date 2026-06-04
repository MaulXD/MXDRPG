import type { TokenEffectIconId } from "@/lib/vtt/token-effect-icons";
import { EFFECT_ICON_PATHS } from "@/lib/vtt/token-effect-icons";

type Props = {
  icon: TokenEffectIconId;
  size?: number;
  className?: string;
};

export function TokenEffectIcon({ icon, size = 14, className = "" }: Props) {
  const d = EFFECT_ICON_PATHS[icon];
  if (!d) return null;

  return (
    <svg
      className={`vtt-effect-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
