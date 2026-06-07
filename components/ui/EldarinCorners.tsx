/** Cantos decorativos — L dourado + ponto (estilo VTT / ficha). */
export function EldarinCorners({ className = "" }: { className?: string }) {
  const extra = className.trim();
  const corner = (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden>
      <path
        d="M2 2 L2 16 M2 2 L16 2"
        stroke="var(--eldarin-frame-accent, #c5a059)"
        strokeWidth="2"
      />
      <path
        d="M6 6 L6 14 M6 6 L14 6"
        stroke="var(--eldarin-frame-accent-dim, #8a6020)"
        strokeWidth="1"
      />
      <circle cx="6" cy="6" r="2" fill="var(--eldarin-frame-accent, #c5a059)" />
    </svg>
  );

  const corners = [
    "eldarin-corner--tl",
    "eldarin-corner--tr",
    "eldarin-corner--bl",
    "eldarin-corner--br",
  ] as const;

  return (
    <>
      {corners.map((pos) => {
        const suffix = pos.split("--").pop() ?? "tl";
        const legacy = extra ? `${extra} ${extra}--${suffix}` : "";
        return (
          <span key={pos} className={`eldarin-corner ${pos}${legacy ? ` ${legacy}` : ""}`} aria-hidden>
            {corner}
          </span>
        );
      })}
    </>
  );
}
