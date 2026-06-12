"use client";

type Props = {
  display: string;
  rolling: boolean;
};

/** Dado 2D — fallback quando WebGL indisponível ou tamanho sm/md (chat). */
export function Dice2DFallback({ display, rolling }: Props) {
  return (
    <div
      className={`dice-2d${rolling ? " dice-2d--rolling" : ""}`}
      aria-hidden
    >
      <div className="dice-2d__gem" />
      <span className="dice-2d__value">{display}</span>
    </div>
  );
}
