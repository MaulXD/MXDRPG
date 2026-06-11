"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerInventoryNotifications } from "@/hooks/useInventoryItemRequest";
import {
  inventoryRequestLabel,
  inventoryRequestStatusLabel,
  type InventoryItemRequestStatus,
} from "@/lib/character/inventory-item-request";
import { IconFlask, IconHourglass } from "@/components/ui/EldarinIcons";

type Props = {
  adventureId: string;
};

function statusTone(status: InventoryItemRequestStatus): string {
  if (status === "approved") return "mesa-edit-requests-bell__status--ok";
  if (status === "rejected") return "mesa-edit-requests-bell__status--bad";
  return "mesa-edit-requests-bell__status--wait";
}

export function MesaPlayerInventoryRequestsBell({ adventureId }: Props) {
  const { requests, hasActive, refresh } = usePlayerInventoryNotifications(adventureId, true);
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

  if (!hasActive) return null;

  async function dismiss(characterId: string, requestId: string) {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/characters/${characterId}/inventory-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (!res.ok) return;
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className="mesa-edit-requests-bell mesa-edit-requests-bell--player mesa-edit-requests-bell--inventory"
      ref={rootRef}
    >
      <button
        type="button"
        className="mesa-edit-requests-bell__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Solicitações de itens do seu inventário"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mesa-edit-requests-bell__icon" aria-hidden>
          <IconFlask size={16} />
        </span>
        <span className="mesa-edit-requests-bell__badge">{requests.length}</span>
      </button>

      {open ? (
        <div
          className="mesa-edit-requests-bell__panel glass-panel"
          role="dialog"
          aria-label="Suas solicitações de inventário"
        >
          <p className="mesa-edit-requests-bell__title">Seu inventário</p>
          <ul className="mesa-edit-requests-bell__list">
            {requests.map((r) => (
              <li key={r.id} className="mesa-edit-requests-bell__item">
                <div className="mesa-edit-requests-bell__item-head">
                  <strong>{r.characterName ?? "Personagem"}</strong>
                  <span className="mesa-edit-requests-bell__scope">{inventoryRequestLabel(r)}</span>
                  <span className={`mesa-edit-requests-bell__status ${statusTone(r.status)}`}>
                    {inventoryRequestStatusLabel(r.status)}
                  </span>
                </div>
                <div className="mesa-edit-requests-bell__actions">
                  {r.status === "rejected" || r.status === "approved" ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busyId === r.id}
                      onClick={() => void dismiss(r.characterId, r.id)}
                    >
                      OK
                    </button>
                  ) : null}
                  {r.status === "pending" ? (
                    <span className="mesa-edit-requests-bell__hint">
                      <IconHourglass size={12} className="mesa-edit-requests-bell__inline-icon" />
                      Aguardando o mestre
                    </span>
                  ) : null}
                  {r.status === "approved" ? (
                    <span className="mesa-edit-requests-bell__hint">Item adicionado à ficha</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
