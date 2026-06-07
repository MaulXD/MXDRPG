const S = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TurnOrderRollIcon({ className = "vtt-turn-compact-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 6v12M16 18V6" {...S} />
      <path d="M5.5 9 8 6l2.5 3M18.5 15 16 18l-2.5-3" {...S} />
    </svg>
  );
}

export function TurnOrderTargetIcon({ className = "vtt-turn-target-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="6.5" {...S} />
      <circle cx="12" cy="12" r="2.25" {...S} />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TurnOrderChevronLeftIcon({ className = "vtt-turn-compact-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.5 6 9.5 12l5 6" {...S} />
    </svg>
  );
}

export function TurnOrderChevronRightIcon({ className = "vtt-turn-compact-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 6 14.5 12l-5 6" {...S} />
    </svg>
  );
}

export function TurnOrderSettingsIcon({ className = "vtt-turn-compact-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.25" {...S} />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.55 1.55M16.35 16.35l1.55 1.55M17.9 6.1l-1.55 1.55M7.65 16.35 6.1 17.9"
        {...S}
        opacity="0.75"
        strokeWidth="1.4"
      />
    </svg>
  );
}
