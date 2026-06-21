"use client";

import type { RoomSyncStatus } from "@/hooks/useRoomSync";

type Props = {
  syncStatus: RoomSyncStatus;
  syncError: string | null;
  onRetry?: () => void;
};

const LABEL: Partial<Record<RoomSyncStatus, string>> = {
  loading: "Carregando…",
  polling: "Sincronizando…",
};

export function MesaSyncIndicator({ syncStatus, syncError, onRetry }: Props) {
  if (syncError) {
    return (
      <div className="mesa-sync-indicator mesa-sync-indicator--error" role="alert">
        <span className="mesa-sync-indicator__dot" aria-hidden />
        <span className="mesa-sync-indicator__text">{syncError}</span>
        {onRetry ? (
          <button type="button" className="mesa-sync-indicator__retry" onClick={onRetry}>
            Tentar de novo
          </button>
        ) : null}
      </div>
    );
  }

  const label = LABEL[syncStatus];
  if (!label) return null;

  return (
    <p
      className={`mesa-sync-indicator mesa-sync-indicator--${syncStatus}`}
      aria-live="polite"
      title="Estado da conexão ao vivo com a mesa"
    >
      <span className="mesa-sync-indicator__dot" aria-hidden />
      <span className="mesa-sync-indicator__text">{label}</span>
    </p>
  );
}
