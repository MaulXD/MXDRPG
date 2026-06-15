import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  size?: number;
};

const defaultSize = 18;

const S = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none" as const,
};

function Svg({ className, size = defaultSize, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

/** D20 / rolar iniciativa */
export function TurnOrderRollIcon({ className = "vtt-turn-icon", size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M12 4.2 18.8 8.5v7L12 19.8 5.2 15.5v-7L12 4.2z"
        {...S}
        fill="color-mix(in srgb, currentColor 14%, transparent)"
      />
      <path d="M12 4.2v15.6M5.2 8.5l13.6 0M5.2 15.5l13.6 0M9 6.8l6 10.4M15 6.8L9 17.2" {...S} opacity={0.55} />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Alvo de ataque */
export function TurnOrderTargetIcon({ className = "vtt-turn-target-icon", size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="7.5" {...S} opacity={0.85} />
      <circle cx="12" cy="12" r="4.25" {...S} opacity={0.65} />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" {...S} strokeWidth={1.4} />
    </Svg>
  );
}

export function TurnOrderChevronLeftIcon({ className = "vtt-turn-icon", size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14.5 6.5 9.5 12l5 5.5" {...S} />
    </Svg>
  );
}

export function TurnOrderChevronRightIcon({ className = "vtt-turn-icon", size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9.5 6.5 14.5 12l-5 5.5" {...S} />
    </Svg>
  );
}

export function TurnOrderSettingsIcon({ className = "vtt-turn-icon", size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="2.75" {...S} />
      <path
        d="M12 3.8v2.1M12 18.1v2.1M4.2 12h2.1M17.7 12h2.1M6.4 6.4l1.5 1.5M16.1 16.1l1.5 1.5M17.6 6.4l-1.5 1.5M7.9 16.1l-1.5 1.5"
        {...S}
        strokeWidth={1.35}
        opacity={0.7}
      />
    </Svg>
  );
}

/** Definir como turno ativo */
export function TurnOrderPlayIcon({ className = "vtt-turn-icon", size = 14 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M9.5 7.2v9.6l7.2-4.8-7.2-4.8z"
        {...S}
        fill="color-mix(in srgb, currentColor 18%, transparent)"
      />
    </Svg>
  );
}

/** Restaurar PA */
export function TurnOrderPaIcon({ className = "vtt-turn-icon", size = 14 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M13.2 3.5 6.8 13.2H11l-1.2 7.3L17.2 10.5H13l.2-7z"
        {...S}
        fill="color-mix(in srgb, currentColor 16%, transparent)"
      />
    </Svg>
  );
}

/** Adiar para o fim da rodada */
export function TurnOrderDeferIcon({ className = "vtt-turn-icon", size = 14 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M8 6.5v9M16 6.5v9" {...S} />
      <path d="M6.5 15.5h11M12 9.5v6M9.8 12.2 12 14.5l2.2-2.3" {...S} />
    </Svg>
  );
}

/** Desfazer jogada */
export function TurnOrderUndoIcon({ className = "vtt-turn-icon", size = 14 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M8.5 8.5H5.5V5.5" {...S} />
      <path
        d="M6.2 8.5A6.5 6.5 0 1012 5.5"
        {...S}
        fill="color-mix(in srgb, currentColor 10%, transparent)"
      />
    </Svg>
  );
}

/** Arrastar para reordenar */
export function TurnOrderDragIcon({ className = "vtt-turn-icon", size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="9" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Restaurar ordem natural */
export function TurnOrderRestoreIcon({ className = "vtt-turn-icon", size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M7.5 7.5H5V5M5 9.5a7 7 0 101.2-4.9" {...S} />
      <path d="M12 8.5v7M9 13.5h6" {...S} strokeWidth={1.4} />
    </Svg>
  );
}

/** Iniciativa (badge) */
export function TurnOrderInitiativeIcon({ className = "vtt-turn-icon", size = 12 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M12 3.5 7.5 14h3.2l-.8 6.5L16.5 10H13l-1-6.5z"
        {...S}
        fill="color-mix(in srgb, currentColor 20%, transparent)"
      />
    </Svg>
  );
}

/** Rodada */
export function TurnOrderRoundIcon({ className = "vtt-turn-icon", size = 12 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="7.25" {...S} />
      <path d="M12 7.5v5l3.2 2" {...S} strokeWidth={1.5} />
    </Svg>
  );
}

/** Turno atual */
export function TurnOrderNowIcon({ className = "vtt-turn-icon", size = 11 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" opacity={0.9} />
      <circle cx="12" cy="12" r="7" {...S} opacity={0.55} />
    </Svg>
  );
}
