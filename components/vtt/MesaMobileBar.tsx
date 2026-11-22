"use client";

import { MesaRailIcon } from "@/components/vtt/foundry/MesaRailIcon";
import { TurnOrderChevronRightIcon } from "@/components/vtt/TurnOrderIcons";

type Props = {
  onOpenChat: () => void;
  onOpenInitiative: () => void;
  onOpenDice: () => void;
  onEndTurn?: () => void;
  canEndTurn: boolean;
  canRollDice: boolean;
  endTurnBusy?: boolean;
  /** Mensagens do chat ainda não lidas, mostradas no botão Chat. */
  chatNaoLidas?: number;
};

export function MesaMobileBar({
  onOpenChat,
  onOpenInitiative,
  onOpenDice,
  onEndTurn,
  canEndTurn,
  canRollDice,
  endTurnBusy = false,
  chatNaoLidas = 0,
}: Props) {
  return (
    <nav className="mesa-mobile-bar" aria-label="Atalhos mobile da mesa">
      <button
        type="button"
        className="mesa-mobile-bar__btn"
        onClick={onOpenChat}
        aria-label={
          chatNaoLidas > 0
            ? `Chat, ${chatNaoLidas} ${chatNaoLidas === 1 ? "mensagem nova" : "mensagens novas"}`
            : undefined
        }
      >
        <span className="mesa-mobile-bar__icon mesa-mobile-bar__icon--badge" aria-hidden>
          <MesaRailIcon name="chat" />
          {chatNaoLidas > 0 ? (
            <span className="mesa-chat-nao-lidas__badge">
              {chatNaoLidas > 99 ? "99+" : chatNaoLidas}
            </span>
          ) : null}
        </span>
        Chat
      </button>
      <button type="button" className="mesa-mobile-bar__btn" onClick={onOpenInitiative}>
        <span className="mesa-mobile-bar__icon" aria-hidden>
          <MesaRailIcon name="initiative" />
        </span>
        Turno
      </button>
      {canEndTurn ? (
        <button
          type="button"
          className="mesa-mobile-bar__btn mesa-mobile-bar__btn--accent"
          disabled={endTurnBusy}
          onClick={() => onEndTurn?.()}
        >
          <span className="mesa-mobile-bar__icon" aria-hidden>
            <TurnOrderChevronRightIcon size={20} />
          </span>
          {endTurnBusy ? "…" : "Passar"}
        </button>
      ) : (
        <button type="button" className="mesa-mobile-bar__btn" disabled aria-disabled>
          <span className="mesa-mobile-bar__icon" aria-hidden>
            <TurnOrderChevronRightIcon size={20} />
          </span>
          Passar
        </button>
      )}
      <button
        type="button"
        className="mesa-mobile-bar__btn"
        disabled={!canRollDice}
        onClick={onOpenDice}
        data-site-tip={canRollDice ? "Rolador de dados" : "Somente jogadores da mesa"}
      >
        <span className="mesa-mobile-bar__icon" aria-hidden>
          <MesaRailIcon name="dice" />
        </span>
        Dados
      </button>
    </nav>
  );
}
