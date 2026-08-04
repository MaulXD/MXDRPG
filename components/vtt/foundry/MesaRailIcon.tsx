import type { ReactNode } from "react";

export type MesaRailIconName =
  | "actors"
  | "initiative"
  | "chat"
  | "dice"
  | "ficha"
  | "dungeon"
  | "whiteboard"
  | "gm"
  | "spawn"
  | "invite"
  | "status"
  | "compendium"
  | "torJourney";

type Props = {
  name: MesaRailIconName;
  className?: string;
};

const S = {
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function RailSvg({
  className = "foundry-icon-bar__icon",
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

/** Ícones traçados no estilo VTT (Foundry / Roll20). */
export function MesaRailIcon({ name, className = "foundry-icon-bar__icon" }: Props) {
  switch (name) {
    case "actors":
      return (
        <RailSvg className={className}>
          <circle cx="9" cy="8.5" r="3.25" {...S} fill="color-mix(in srgb, currentColor 12%, transparent)" />
          <circle cx="15.5" cy="10" r="2.75" {...S} fill="color-mix(in srgb, currentColor 8%, transparent)" />
          <path
            d="M5.5 18.5c0-2.6 2.2-4.5 5-4.5s5 1.9 5 4.5"
            {...S}
          />
          <path
            d="M14.5 17.5c1.4-.5 2.8-1.6 3.5-3.5"
            {...S}
            opacity="0.75"
          />
        </RailSvg>
      );

    case "initiative":
      return (
        <RailSvg className={className}>
          <circle cx="12" cy="12" r="8.25" {...S} />
          <path d="M12 7v5.2l3.2 2" {...S} />
          <path
            d="M12 4.2v1.2M12 18.6v1.2M4.2 12h1.2M18.6 12h1.2"
            {...S}
            opacity="0.45"
            strokeWidth="1.2"
          />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
        </RailSvg>
      );

    case "chat":
      return (
        <RailSvg className={className}>
          <path
            d="M5 5.5c0-1.4 1.1-2.5 2.5-2.5h9c1.4 0 2.5 1.1 2.5 2.5v6.2c0 1.4-1.1 2.5-2.5 2.5H11l-4.2 3.2V5.5z"
            {...S}
            fill="color-mix(in srgb, currentColor 10%, transparent)"
          />
          <path d="M8.2 9h7.6M8.2 11.8h5.2" {...S} opacity="0.85" />
        </RailSvg>
      );

    case "dice":
      return (
        <RailSvg className={className}>
          <path
            d="M12 3.2 19.2 7.4v9.2L12 20.8 4.8 16.6V7.4L12 3.2z"
            {...S}
            fill="color-mix(in srgb, currentColor 11%, transparent)"
          />
          <path d="M12 3.2v17.6M4.8 7.4l7.2 4.2 7.2-4.2M4.8 16.6l7.2-4.2 7.2 4.2" {...S} opacity="0.55" />
          <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
        </RailSvg>
      );

    case "ficha":
      return (
        <RailSvg className={className}>
          <path
            d="M8 3.5h6.8L18 6.7V20a1.5 1.5 0 0 1-1.5 1.5H7.5A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1.5-1.5z"
            {...S}
            fill="color-mix(in srgb, currentColor 9%, transparent)"
          />
          <path d="M14.8 3.8V7H18" {...S} opacity="0.7" />
          <circle cx="10.5" cy="11" r="1.6" {...S} />
          <path d="M13.8 10.2h3.2M13.8 12.2h2.4M8.8 15h6.4M8.8 17.2h4.2" {...S} opacity="0.8" />
        </RailSvg>
      );

    case "dungeon":
      return (
        <RailSvg className={className}>
          <path
            d="M4.5 8.5 12 4l7.5 4.5v9L12 22l-7.5-4.5v-9z"
            {...S}
            fill="color-mix(in srgb, currentColor 10%, transparent)"
          />
          <path d="M12 4v18M4.5 8.5 12 13l7.5-4.5M12 13v9" {...S} opacity="0.5" />
          <path d="M9.5 11.5h5v2.2h-5z" {...S} />
        </RailSvg>
      );

    case "whiteboard":
      return (
        <RailSvg className={className}>
          <rect
            x="4"
            y="5"
            width="16"
            height="12"
            rx="2"
            {...S}
            fill="color-mix(in srgb, currentColor 8%, transparent)"
          />
          <path d="M8.5 14.5 11 11.5l2.2 2.2L16.5 10" {...S} />
          <path d="M7 18.5h10" {...S} opacity="0.55" strokeWidth="2" />
        </RailSvg>
      );

    case "gm":
      return (
        <RailSvg className={className}>
          <path
            d="M5.5 9.2c0-2.8 2.9-4.7 6.5-4.7s6.5 1.9 6.5 4.7c0 3.6-2.8 6.8-6.5 9.3C8.3 16 5.5 12.8 5.5 9.2z"
            {...S}
            fill="color-mix(in srgb, currentColor 12%, transparent)"
          />
          <path
            d="M8.8 9.5c.6-1.2 1.6-1.9 3.2-1.9s2.6.7 3.2 1.9"
            {...S}
          />
          <path d="M9.2 12.2h5.6" {...S} opacity="0.75" />
          <path
            d="M12 3.8v1.6M7.2 5.3l1.1 1.3M16.8 5.3l-1.1 1.3"
            {...S}
            opacity="0.55"
            strokeWidth="1.3"
          />
        </RailSvg>
      );

    case "spawn":
      return (
        <RailSvg className={className}>
          <path
            d="M12 4.5c-3.2 0-5.5 2.4-5.5 5.6 0 2.2 1.2 4.1 3 5.1L8 19.5h8l-1.5-4.3c1.8-1 3-2.9 3-5.1 0-3.2-2.3-5.6-5.5-5.6z"
            {...S}
            fill="color-mix(in srgb, currentColor 11%, transparent)"
          />
          <circle cx="9.8" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.2" cy="11" r="1" fill="currentColor" stroke="none" />
          <path d="M10.2 14.2c.8.7 1.8 1.1 2.8 1.1s2-.4 2.8-1.1" {...S} />
          <path d="M9.5 7.8h5" {...S} opacity="0.45" />
        </RailSvg>
      );

    case "status":
      return (
        <RailSvg className={className}>
          <path
            d="M12 3.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L6.2 7.7l4-.6L12 3.5z"
            {...S}
            fill="color-mix(in srgb, currentColor 14%, transparent)"
          />
          <path d="M5 18.5h14" {...S} opacity="0.5" />
          <path d="M7.5 16v2.5M12 15.2v3.3M16.5 16v2.5" {...S} opacity="0.75" />
        </RailSvg>
      );

    case "invite":
      return (
        <RailSvg className={className}>
          <circle cx="5.5" cy="12" r="2.75" {...S} />
          <circle cx="18.5" cy="4.5" r="2.75" {...S} />
          <circle cx="18.5" cy="19.5" r="2.75" {...S} />
          <path d="M8.1 10.6 15.9 5.9" {...S} />
          <path d="M8.1 13.4 15.9 18.1" {...S} />
        </RailSvg>
      );

    case "compendium":
      return (
        <RailSvg className={className}>
          <path
            d="M12 6.2c-1.5-1.1-3.6-1.7-5.8-1.7-.9 0-1.7.1-2.2.3v13.4c.5-.2 1.3-.3 2.2-.3 2.2 0 4.3.6 5.8 1.7"
            {...S}
            fill="color-mix(in srgb, currentColor 9%, transparent)"
          />
          <path
            d="M12 6.2c1.5-1.1 3.6-1.7 5.8-1.7.9 0 1.7.1 2.2.3v13.4c-.5-.2-1.3-.3-2.2-.3-2.2 0-4.3.6-5.8 1.7"
            {...S}
            fill="color-mix(in srgb, currentColor 6%, transparent)"
          />
          <path d="M12 6.2V19.9" {...S} opacity="0.6" />
        </RailSvg>
      );

    /**
     * Jornada — glyph GENÉRICO provisório (trilha com dois pontos de parada),
     * na mesma linguagem geométrica dos demais. Não é arte final: substituir
     * pelo ícone real quando ele chegar, sem inventar ilustração no meio.
     */
    case "torJourney":
      return (
        <RailSvg className={className}>
          <path d="M6 18.5c0-3.5 3-4 6-4s6-.5 6-4" {...S} />
          <circle cx="6" cy="18.5" r="1.8" {...S} />
          <circle cx="18" cy="6.2" r="1.8" {...S} />
        </RailSvg>
      );

    default:
      return null;
  }
}
