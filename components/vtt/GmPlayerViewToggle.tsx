"use client";

type Props = {
  playAsPlayer: boolean;
  onToggle: () => void;
};

export function GmPlayerViewToggle({ playAsPlayer, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`gm-player-view-toggle${playAsPlayer ? " gm-player-view-toggle--player" : ""}`}
      onClick={onToggle}
      aria-pressed={playAsPlayer}
      title={
        playAsPlayer
          ? "Visão de jogador ativa — clique para voltar à visão de mestre"
          : "Testar visão dos jogadores na mesa"
      }
    >
      <span className="gm-player-view-toggle__icon" aria-hidden>
        {playAsPlayer ? "👁" : "🎭"}
      </span>
      <span className="gm-player-view-toggle__label">
        {playAsPlayer ? "Visão jogador" : "Visão mestre"}
      </span>
    </button>
  );
}
