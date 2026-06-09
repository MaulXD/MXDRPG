import type { ReactNode } from "react";
import type { MapToolMode } from "@/lib/vtt/map-toolbar";
import type { WhiteboardTool } from "@/lib/vtt/map-markup";

export type MapToolbarIconName =
  | MapToolMode
  | WhiteboardTool
  | "dungeon"
  | "zoom-in"
  | "zoom-out"
  | "reset-view";

type Props = {
  name: MapToolbarIconName;
  className?: string;
};

const S = {
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconSvg({
  className = "map-toolbar__icon",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

/** Ícones SVG para a barra de ferramentas do mapa (sem emojis). */
export function MapToolbarIcon({ name, className = "map-toolbar__icon" }: Props) {
  switch (name) {
    case "token":
      return (
        <IconSvg className={className}>
          <path d="M5.5 5.5 12 3l6.5 2.5v6.5L12 18.5l-6.5-3V5.5z" {...S} />
          <path d="m8.5 11.5 2 2 5-5" {...S} />
        </IconSvg>
      );

    case "ping":
      return (
        <IconSvg className={className}>
          <circle cx="12" cy="12" r="3.25" {...S} />
          <circle cx="12" cy="12" r="7.25" {...S} opacity="0.55" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </IconSvg>
      );

    case "measure":
      return (
        <IconSvg className={className}>
          <path d="M5 18.5h14" {...S} />
          <path d="M7 16.5V9M10.5 16.5V7M14 16.5v-5M17.5 16.5V11" {...S} />
          <path d="M6 9.5h12" {...S} opacity="0.55" />
        </IconSvg>
      );

    case "fog":
      return (
        <IconSvg className={className}>
          <circle cx="12" cy="12" r="8.25" {...S} />
          <path
            d="M12 4a8.25 8.25 0 0 1 0 16.5"
            fill="color-mix(in srgb, currentColor 18%, transparent)"
            stroke="none"
          />
        </IconSvg>
      );

    case "select":
      return (
        <IconSvg className={className}>
          <rect x="5.5" y="5.5" width="13" height="13" rx="1" {...S} strokeDasharray="3 2" />
          <path d="M8.5 14.5 11 11.5l2 2 3.5-4.5" {...S} />
        </IconSvg>
      );

    case "pen":
      return (
        <IconSvg className={className}>
          <path
            d="M5 19.5c2.5-6.5 5.5-9.5 9-12.5l2.5 2.5c-3 3-6 6-9.5 12.5H5z"
            {...S}
            fill="color-mix(in srgb, currentColor 10%, transparent)"
          />
          <path d="M13.5 6.5 17.5 10.5" {...S} />
        </IconSvg>
      );

    case "line":
      return (
        <IconSvg className={className}>
          <path d="M6 18 18 6" {...S} strokeWidth="2" />
          <circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
        </IconSvg>
      );

    case "arrow":
      return (
        <IconSvg className={className}>
          <path d="M5 12h11" {...S} strokeWidth="2" />
          <path d="m13 8 5 4-5 4" {...S} strokeWidth="2" />
        </IconSvg>
      );

    case "shape":
      return (
        <IconSvg className={className}>
          <rect
            x="5.5"
            y="7"
            width="13"
            height="10"
            rx="1"
            {...S}
            fill="color-mix(in srgb, currentColor 8%, transparent)"
          />
        </IconSvg>
      );

    case "circle":
      return (
        <IconSvg className={className}>
          <circle
            cx="12"
            cy="12"
            r="7.25"
            {...S}
            fill="color-mix(in srgb, currentColor 8%, transparent)"
          />
        </IconSvg>
      );

    case "text":
      return (
        <IconSvg className={className}>
          <path d="M7 6.5h10M12 6.5V18" {...S} strokeWidth="2" />
          <path d="M9 18h6" {...S} />
        </IconSvg>
      );

    case "dungeon":
      return (
        <IconSvg className={className}>
          <path
            d="M4.5 8.5 12 4l7.5 4.5v9L12 22l-7.5-4.5v-9z"
            {...S}
            fill="color-mix(in srgb, currentColor 10%, transparent)"
          />
          <path d="M12 4v18M4.5 8.5 12 13l7.5-4.5M12 13v9" {...S} opacity="0.5" />
          <path d="M9.5 11.5h5v2.2h-5z" {...S} />
        </IconSvg>
      );

    case "zoom-in":
      return (
        <IconSvg className={className}>
          <path d="M12 8v8M8 12h8" {...S} strokeWidth="2" />
        </IconSvg>
      );

    case "zoom-out":
      return (
        <IconSvg className={className}>
          <path d="M8 12h8" {...S} strokeWidth="2" />
        </IconSvg>
      );

    case "reset-view":
      return (
        <IconSvg className={className}>
          <circle cx="12" cy="12" r="7.25" {...S} />
          <circle cx="12" cy="12" r="2" {...S} />
          <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" {...S} opacity="0.55" strokeWidth="1.3" />
        </IconSvg>
      );

    default:
      return null;
  }
}
