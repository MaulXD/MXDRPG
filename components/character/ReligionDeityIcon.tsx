"use client";

import type { ReligionIconKind } from "@/lib/character/wizard-religion-icons";
import { religionIconColor, resolveReligionIcon } from "@/lib/character/wizard-religion-icons";

type Props = {
  religionId: string;
  size?: number;
  className?: string;
};

function DeityGlyph({ kind, size }: { kind: ReligionIconKind; size: number }) {
  const svg = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
  };

  switch (kind) {
    case "forge":
      return (
        <svg {...svg}>
          <path d="M5 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M9 17V10l3-4 3 4v7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 6v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "abyss":
      return (
        <svg {...svg}>
          <path
            d="M12 4c4 3 7 7 7 11a7 7 0 01-14 0c0-4 3-8 7-11z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
    case "eye":
      return (
        <svg {...svg}>
          <path
            d="M3.5 12s3.5-6.5 8.5-6.5S20.5 12 20.5 12s-3.5 6.5-8.5 6.5S3.5 12 3.5 12z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M12 9.5v5M10 12h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "tide":
      return (
        <svg {...svg}>
          <path d="M12 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="7" r="1.2" fill="currentColor" />
          <path
            d="M8 10h8l-1.5 10H9.5L8 10z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M6 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "torch":
      return (
        <svg {...svg}>
          <path d="M12 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M10 7c0-2 2-4 2-4s2 2 2 4c0 1.5-1 2.5-2 2.5s-2-1-2-2.5z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M11 11h2v10h-2z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...svg}>
          <path
            d="M12 3l7 2.5v5.5c0 4.2-2.8 8-7 9-4.2-1-7-4.8-7-9V5.5L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 7v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "veil":
      return (
        <svg {...svg}>
          <path
            d="M6 14a6 6 0 0112 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M12 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="9" r="1.2" fill="currentColor" />
        </svg>
      );
    case "flame":
      return (
        <svg {...svg}>
          <path
            d="M12 4c-2 3-4 4.5-4 7.5a4 4 0 008 0c0-3-2-4.5-4-7.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="color-mix(in srgb, currentColor 18%, transparent)"
          />
        </svg>
      );
    case "knife":
      return (
        <svg {...svg}>
          <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "swarm":
      return (
        <svg {...svg}>
          <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      );
    case "cauldron":
      return (
        <svg {...svg}>
          <path
            d="M6 11h12l-1.5 9H7.5L6 11z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M5 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="4" r="0.9" fill="currentColor" />
          <circle cx="14" cy="5" r="0.7" fill="currentColor" />
        </svg>
      );
    case "secular":
    default:
      return (
        <svg {...svg}>
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

/** Ícone do deus / devotion — distinto da perícia Religião (livro). */
export function ReligionDeityIcon({ religionId, size = 20, className }: Props) {
  const kind = resolveReligionIcon(religionId);
  const color = religionIconColor(religionId);
  return (
    <span
      className={className}
      style={{ color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <DeityGlyph kind={kind} size={size} />
    </span>
  );
}
