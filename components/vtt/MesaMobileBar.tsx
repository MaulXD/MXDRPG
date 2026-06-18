"use client";

type Props = {
  onOpenChat: () => void;
  onOpenInitiative: () => void;
  onOpenDice: () => void;
  onEndTurn?: () => void;
  canEndTurn: boolean;
  canRollDice: boolean;
  endTurnBusy?: boolean;
  combatActive: boolean;
};

export function MesaMobileBar({
  onOpenChat,
  onOpenInitiative,
  onOpenDice,
  onEndTurn,
  canEndTurn,
  canRollDice,
  endTurnBusy = false,
  combatActive,
}: Props) {
  return (
    <nav className="mesa-mobile-bar" aria-label="Atalhos mobile da mesa">
      <button type="button" className="mesa-mobile-bar__btn" onClick={onOpenChat}>
        <span className="mesa-mobile-bar__icon" aria-hidden>
          💬
        </span>
        Chat
      </button>
      <button type="button" className="mesa-mobile-bar__btn" onClick={onOpenInitiative}>
        <span className="mesa-mobile-bar__icon" aria-hidden>
          ⚔
        </span>
        {combatActive ? "Turno" : "Ordem"}
      </button>
      {canEndTurn ? (
        <button
          type="button"
          className="mesa-mobile-bar__btn mesa-mobile-bar__btn--accent"
          disabled={endTurnBusy}
          onClick={() => onEndTurn?.()}
        >
          <span className="mesa-mobile-bar__icon" aria-hidden>
            ⏭
          </span>
          {endTurnBusy ? "…" : "Passar"}
        </button>
      ) : (
        <button type="button" className="mesa-mobile-bar__btn" disabled aria-disabled>
          <span className="mesa-mobile-bar__icon" aria-hidden>
            ⏭
          </span>
          Passar
        </button>
      )}
      <button
        type="button"
        className="mesa-mobile-bar__btn"
        disabled={!canRollDice}
        onClick={onOpenDice}
        title={canRollDice ? "Rolador de dados" : "Somente jogadores da mesa"}
      >
        <span className="mesa-mobile-bar__icon" aria-hidden>
          🎲
        </span>
        Dados
      </button>
    </nav>
  );
}
