import type { ReactNode } from "react";
import type { CombatEventTone } from "@/lib/room/chat-events";

export type IconProps = { className?: string; size?: number };

const S = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none" as const,
};

function Svg({ className, size = 20, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function IconCheck({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 12.5l3.5 3.5L18 7.5" {...S} />
    </Svg>
  );
}

export function IconPencil({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 20h4l9.5-9.5a2.2 2.2 0 00-3.1-3.1L4.9 16.9V20z" {...S} />
      <path d="M13.5 6.5l4 4" {...S} />
    </Svg>
  );
}

export function IconBell({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 4.5a4.5 4.5 0 00-4.5 4.5c0 3.5-1.5 4-1.5 4h12s-1.5-.5-1.5-4A4.5 4.5 0 0012 4.5z" {...S} />
      <path d="M10 18.5a2 2 0 004 0" {...S} />
    </Svg>
  );
}

export function IconClose({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M7 7l10 10M17 7L7 17" {...S} />
    </Svg>
  );
}

export function IconWarning({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 4.5L3.5 19h17L12 4.5z" {...S} />
      <path d="M12 10v4M12 17.5v.5" {...S} strokeWidth={2} />
    </Svg>
  );
}

export function IconBug({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <ellipse cx="12" cy="13" rx="5" ry="6" {...S} />
      <path d="M12 7V4M8 5.5L6 4M16 5.5L18 4M6 11H3M21 11h-3M6 15H3M21 15h-3" {...S} />
      <path d="M9.5 7.5c.8-1.2 2.2-2 3.5-2s2.7.8 3.5 2" {...S} />
    </Svg>
  );
}

export function IconHex({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3.5l6.5 3.75v7.5L12 18.5l-6.5-3.75v-7.5L12 3.5z" {...S} />
    </Svg>
  );
}

export function IconCircleTarget({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="7.5" {...S} />
      <circle cx="12" cy="12" r="2.5" {...S} />
    </Svg>
  );
}

export function IconDiamond({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3.5l7.5 8.5L12 20.5 4.5 12 12 3.5z" {...S} />
    </Svg>
  );
}

export function IconSword({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 20l5-5M14 4l6 6M9 9l6 6M16 3l5 5-3 3" {...S} />
    </Svg>
  );
}

export function IconSpell({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z" {...S} />
    </Svg>
  );
}

export function IconAbility({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 5l5.5 5.5L12 16 6.5 10.5 12 5z" {...S} />
    </Svg>
  );
}

export function IconFlask({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9 3h6v3l4 9a4 4 0 01-3.6 5.9H8.6A4 4 0 015 15l4-9V3z" {...S} />
      <path d="M9 6h6" {...S} />
    </Svg>
  );
}

export function IconHeart({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M12 20s-7-4.6-7-10a4 4 0 017-2.2A4 4 0 0119 10c0 5.4-7 10-7 10z"
        {...S}
        fill="currentColor"
        fillOpacity={0.12}
      />
    </Svg>
  );
}

export function IconShield({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M12 2.5l7.5 3v6.2c0 4.8-3.2 9.2-7.5 10.3C7.7 20.9 4.5 16.5 4.5 11.7V5.5L12 2.5z"
        {...S}
        fill="currentColor"
        fillOpacity={0.1}
      />
    </Svg>
  );
}

export function IconSkull({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="11" r="6.5" {...S} />
      <circle cx="9.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 15.5h6M8 19.5h8" {...S} />
    </Svg>
  );
}

export function IconMiss({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 5.5l5.5 5.5L12 16.5 6.5 11 12 5.5z" {...S} opacity={0.45} />
    </Svg>
  );
}

export function IconDot({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconEye({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" {...S} />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconMask({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 10c0-3.5 3.1-6 7-6s7 2.5 7 6v2.5c0 2.5-2 5-7 5s-7-2.5-7-5V10z" {...S} />
      <circle cx="9" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M10 15c.8.8 2.2.8 3 0" {...S} />
    </Svg>
  );
}

export function IconMenu({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 7h14M5 12h14M5 17h14" {...S} />
    </Svg>
  );
}

export function IconSheet({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M7 4.5h7l3.5 3.5V19.5H7V4.5z" {...S} />
      <path d="M14 4.5V8h3.5" {...S} />
      <path d="M9.5 12h7M9.5 15.5h5" {...S} opacity={0.7} />
    </Svg>
  );
}

export function IconMove({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 5v14M8 9l4-4 4 4" {...S} />
    </Svg>
  );
}

export function IconRun({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 18l4-6 3 2 5-8" {...S} />
      <path d="M16 6h3v3" {...S} />
    </Svg>
  );
}

export function IconChevronLeft({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14.5 6L8 12l6.5 6" {...S} />
    </Svg>
  );
}

export function IconStar({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M12 3.5l2.4 5.5 5.9.5-4.5 3.9 1.4 5.8L12 16.8 6.8 19.2l1.4-5.8-4.5-3.9 5.9-.5L12 3.5z"
        {...S}
        fill="currentColor"
        fillOpacity={0.1}
      />
    </Svg>
  );
}

export function IconHourglass({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M8 4h8M8 20h8" {...S} />
      <path
        d="M9.5 4c0 2.2 1.8 4 4 4s4-1.8 4-4M9.5 20c0-2.2 1.8-4 4-4s4 1.8 4 4"
        {...S}
      />
      <path d="M10 8.5h4l-2 3.5 2 3.5h-4l2-3.5-2-3.5z" {...S} />
    </Svg>
  );
}

export type ActionKind = "spell" | "ability" | "attack";

export function ActionKindIcon({
  kind,
  className,
  size = 16,
}: IconProps & { kind: ActionKind }) {
  if (kind === "spell") return <IconSpell className={className} size={size} />;
  if (kind === "ability") return <IconAbility className={className} size={size} />;
  return <IconSword className={className} size={size} />;
}

export function CombatEventIcon({ tone, className, size = 18 }: IconProps & { tone: CombatEventTone }) {
  switch (tone) {
    case "defeat":
      return <IconSkull className={className} size={size} />;
    case "crit":
      return <IconSpell className={className} size={size} />;
    case "crit-fail":
      return <IconClose className={className} size={size} />;
    case "hit":
      return <IconSword className={className} size={size} />;
    case "miss":
      return <IconMiss className={className} size={size} />;
    case "save":
      return <IconShield className={className} size={size} />;
    case "heal":
      return <IconHeart className={className} size={size} />;
    default:
      return <IconDot className={className} size={size} />;
  }
}

export function IconHome({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 10.5V19.5h5v-5h4v5h5V10.5L12 5.5 5 10.5z" {...S} />
    </Svg>
  );
}

export function IconBook({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 5.5h5.5a2.5 2.5 0 012.5 2.5V19.5H6V5.5z" {...S} />
      <path d="M12 5.5H17.5A2.5 2.5 0 0120 8v11.5H12V5.5z" {...S} />
      <path d="M9 9.5h2M15 9.5h2" {...S} opacity={0.7} />
    </Svg>
  );
}

export function IconScroll({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M8 5.5h9a2 2 0 012 2v11.5H9.5A2.5 2.5 0 007 16.5V5.5z" {...S} />
      <path d="M8 9h6M8 12h5M8 15h4" {...S} opacity={0.7} />
    </Svg>
  );
}

export function IconUser({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="9" r="3.25" {...S} />
      <path d="M6.5 19.5c.8-3 2.8-4.5 5.5-4.5s4.7 1.5 5.5 4.5" {...S} />
    </Svg>
  );
}

export function IconChat({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M5 6.5h14a2 2 0 012 2v6.5a2 2 0 01-2 2H10l-4.5 3v-3H5a2 2 0 01-2-2V8.5a2 2 0 012-2z"
        {...S}
      />
    </Svg>
  );
}

export type HomeFeatureIconName = "hex" | "target" | "diamond" | "sword";

export function HomeFeatureIcon({ name, className, size = 28 }: IconProps & { name: HomeFeatureIconName }) {
  switch (name) {
    case "hex":
      return <IconHex className={className} size={size} />;
    case "target":
      return <IconCircleTarget className={className} size={size} />;
    case "diamond":
      return <IconDiamond className={className} size={size} />;
    case "sword":
      return <IconSword className={className} size={size} />;
  }
}
