"use client";

import { useEffect, useRef, useState } from "react";
import { useGmEditRequests } from "@/hooks/useSheetEditRequest";
import { sheetEditScopeLabel } from "@/lib/character/sheet-edit-request";

type Props = {
  adventureId: string;
  roomId?: string;
};

export function MesaEditRequestsBell({ adventureId, roomId }: Props) {
  const { requests, hasPending, refresh } = useGmEditRequests(adventureId, roomId, true);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!hasPending) return null;

  async function resolve(characterId: string, requestId: string, action: "approve" | "reject") {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/characters/${characterId}/edit-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Falha");
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mesa-edit-requests-bell" ref={rootRef}>
      <button
        type="button"
        className="mesa-edit-requests-bell__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Solicitações de edição de ficha"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mesa-edit-requests-bell__icon" aria-hidden>
          🔔
        </span>
        <span className="mesa-edit-requests-bell__badge">{requests.length}</span>
      </button>

      {open ? (
        <div className="mesa-edit-requests-bell__panel glass-panel" role="dialog" aria-label="Solicitações de edição">
          <p className="mesa-edit-requests-bell__title">Edição de fichas</p>
          <ul className="mesa-edit-requests-bell__list">
            {requests.map((r) => (
              <li key={r.id} className="mesa-edit-requests-bell__item">
                <div className="mesa-edit-requests-bell__item-head">
                  <strong>{r.characterName ?? "Personagem"}</strong>
                  <span className="mesa-edit-requests-bell__scope">{sheetEditScopeLabel(r.scope)}</span>
                </div>
                <div className="mesa-edit-requests-bell__actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void resolve(r.characterId, r.id, "reject")}
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-cta btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void resolve(r.characterId, r.id, "approve")}
                  >
                    {busyId === r.id ? "…" : "Aprovar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
