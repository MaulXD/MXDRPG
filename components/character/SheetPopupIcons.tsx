type IconProps = { className?: string; size?: number };

const defaultSize = 20;

export function IconShield({ className, size = defaultSize }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 2.5l7.5 3v6.2c0 4.8-3.2 9.2-7.5 10.3C7.7 20.9 4.5 16.5 4.5 11.7V5.5L12 2.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="color-mix(in srgb, currentColor 12%, transparent)"
      />
      <path
        d="M12 6.5v11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function IconBoot({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 14.5c0-3.5 2.2-6.5 5.5-7.5l1-2.5h4l1 2.5c3.3 1 5.5 4 5.5 7.5v2.5H5v-2.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="color-mix(in srgb, currentColor 10%, transparent)"
      />
      <path d="M8 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconLightning({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L5 14h6l-1 8 9-13h-6l0-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="color-mix(in srgb, currentColor 14%, transparent)"
      />
    </svg>
  );
}

export function IconStar({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5l2.4 5.5 5.9.5-4.5 3.9 1.4 5.8L12 16.8 6.8 19.2l1.4-5.8-4.5-3.9 5.9-.5L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="color-mix(in srgb, currentColor 12%, transparent)"
      />
    </svg>
  );
}

export function IconEye({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function IconSearch({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Perícia Religião (conhecimento) — não confundir com devotion/deus. */
export function IconBook({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5h6.5a2 2 0 012 2V20H5V5.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="color-mix(in srgb, currentColor 10%, transparent)"
      />
      <path
        d="M11.5 7.5H18a2 2 0 012 2V20h-8.5V7.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="color-mix(in srgb, currentColor 8%, transparent)"
      />
      <path d="M8 9h2M14 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeart({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.6-7-10a4 4 0 017-2.2A4 4 0 0119 10c0 5.4-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="color-mix(in srgb, currentColor 14%, transparent)"
      />
    </svg>
  );
}

export function IconSword({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20l5-5M14 4l6 6M9 9l6 6M16 3l5 5-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconArmor({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l6 2v5c0 4-2.5 7.5-6 8.5-3.5-1-6-4.5-6-8.5V5l6-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="color-mix(in srgb, currentColor 10%, transparent)"
      />
      <path d="M9 10h6M12 7v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 20c.8-3.5 3.2-5.5 6.5-5.5s5.7 2 6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBackpack({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 10V8.5a3.5 3.5 0 117 0V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 10h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="color-mix(in srgb, currentColor 10%, transparent)"
      />
      <path d="M9.5 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCoins({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="9" cy="10" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 10v4.5c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <ellipse cx="15" cy="13" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 13v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2v-4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function IconWand({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20l10-10M14 6l4-4M16 4l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 17.5l1.5 1.5M9 15l1 1M11.5 12.5l1 1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function IconBestiary({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4.5h12a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 18V6A1.5 1.5 0 016 4.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="color-mix(in srgb, currentColor 8%, transparent)"
      />
      <path
        d="M8.5 8.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7 16c.8-1.6 2-2.5 5-2.5s4.2.9 5 2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M9 6.5V4M15 6.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconGear({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCamera({ className, size = defaultSize }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h3l1.5-2h7L17 8h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
