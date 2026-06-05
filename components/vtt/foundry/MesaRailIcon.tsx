export type MesaRailIconName =
  | "actors"
  | "initiative"
  | "chat"
  | "dice"
  | "ficha"
  | "dungeon"
  | "whiteboard"
  | "gm"
  | "spawn";

type Props = {
  name: MesaRailIconName;
  className?: string;
};

/** Ícones sólidos monocromáticos (herdam `color` do botão). */
export function MesaRailIcon({ name, className = "foundry-icon-bar__icon" }: Props) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "actors":
      return (
        <svg {...common}>
          <path d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a6 6 0 0 1 12 0H2Zm11-3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-.5 3.5h6.5a4.5 4.5 0 0 0-9 0Z" />
        </svg>
      );
    case "initiative":
      return (
        <svg {...common}>
          <path d="M12 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a1 1 0 0 0-1 1v4.17l-2.59 2.59a1 1 0 1 0 1.41 1.41l2.88-2.88A1 1 0 0 0 13 12V7a1 1 0 0 0-1-1Z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M4 4.5A3.5 3.5 0 0 1 7.5 1h9A3.5 3.5 0 0 1 20 4.5v6A3.5 3.5 0 0 1 16.5 14H9.7L5.2 17.5A1 1 0 0 1 4 16.8V4.5Z" />
        </svg>
      );
    case "dice":
      return (
        <svg {...common}>
          <path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6Zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-3.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      );
    case "ficha":
      return (
        <svg {...common}>
          <path d="M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4a1 1 0 0 0-.3-.7L14.3 2.3A1 1 0 0 0 13.6 2H7Zm8 6h3.6L15 4.4V8ZM8 11h8v2H8v-2Zm0 4h5v2H8v-2Z" />
        </svg>
      );
    case "dungeon":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13ZM8 7h8v2H8V7Zm0 4h5v2H8v-2Z" />
        </svg>
      );
    case "whiteboard":
      return (
        <svg {...common}>
          <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h9A2.5 2.5 0 0 1 19 4.5v11A2.5 2.5 0 0 1 16.5 18h-9A2.5 2.5 0 0 1 5 15.5v-11ZM8 7.5l8 5-8 5v-10Z" />
        </svg>
      );
    case "gm":
      return (
        <svg {...common}>
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5ZM3.9 13.2a1 1 0 0 1 .3-1.37l1.1-.76a7.04 7.04 0 0 1 0-2.14l-1.1-.76a1 1 0 0 1 1.07-1.7l1.3.45a7.04 7.04 0 0 1 1.85-1.07l.2-1.36a1 1 0 0 1 1.98 0l.2 1.36a7.04 7.04 0 0 1 1.85 1.07l1.3-.45a1 1 0 1 1 1.07 1.7l-1.1.76c.04.36.06.72.06 1.07s-.02.71-.06 1.07l1.1.76a1 1 0 1 1-1.07 1.7l-1.3-.45a7.04 7.04 0 0 1-1.85 1.07l-.2 1.36a1 1 0 0 1-1.98 0l-.2-1.36a7.04 7.04 0 0 1-1.85-1.07l-1.3.45a1 1 0 0 1-1.37-.33Z" />
        </svg>
      );
    case "spawn":
      return (
        <svg {...common}>
          <path d="M12 2C8.5 2 6 4.8 6 8.2c0 2.1 1 3.9 2.5 5.1L7 18h10l-1.5-4.7C16.9 12.1 18 10.3 18 8.2 18 4.8 15.5 2 12 2Zm-2.2 6.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4.4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM8.5 14.5h7l.6 2h-8.2l.6-2Z" />
        </svg>
      );
    default:
      return null;
  }
}
