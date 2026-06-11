"use client";

import { useEffect, useRef, useState } from "react";
import { useGmInventoryRequests } from "@/hooks/useInventoryItemRequest";
import { useGmEditRequests } from "@/hooks/useSheetEditRequest";
import { inventoryRequestLabel } from "@/lib/character/inventory-item-request";
import { sheetEditScopeLabel } from "@/lib/character/sheet-edit-request";
import { IconBell } from "@/components/ui/EldarinIcons";

type Props = {
  adventureId: string;
  roomId?: string;
};

export function MesaEditRequestsBell({ adventureId, roomId }: Props) {
  const sheet = useGmEditRequests(adventureId, roomId, true);
  const inventory = useGmInventoryRequests(adventureId, roomId, true);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveAllBusy, setApproveAllBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const totalCount = sheet.requests.length + inventory.requests.length;
  const hasPending = totalCount > 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!hasPending) return null;

  async function refreshAll() {
    await Promise.all([sheet.refresh(), inventory.refresh()]);
  }

  async function resolveSheet(characterId: string, requestId: string, action: "approve" | "reject") {
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
      await refreshAll();
    } finally {
      setBusyId(null);
    }
  }

  async function resolveInventory(
    characterId: string,
    requestId: string,
    action: "approve" | "reject"
  ) {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/characters/${characterId}/inventory-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Falha");
      }
      await refreshAll();
    } finally {
      setBusyId(null);
    }
  }

  async function approveAllInventory() {
    setApproveAllBusy(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/inventory-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "approve_all" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Falha");
      }
      await refreshAll();
    } finally {
      setApproveAllBusy(false);
    }
  }

  return (
    <div className="mesa-edit-requests-bell" ref={rootRef}>
      <button
        type="button"
        className="mesa-edit-requests-bell__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Solicitações de ficha e inventário"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mesa-edit-requests-bell__icon" aria-hidden>
          <IconBell size={16} />
        </span>
        <span className="mesa-edit-requests-bell__badge">{totalCount}</span>
      </button>

      {open ? (
        <div
          className="mesa-edit-requests-bell__panel glass-panel"
          role="dialog"
          aria-label="Solicitações pendentes"
        >
          <p className="mesa-edit-requests-bell__title">Solicitações pendentes</p>

          {inventory.requests.length > 1 ? (
            <div className="mesa-edit-requests-bell__bulk">
              <button
                type="button"
                className="btn btn-primary-cta btn-sm"
                disabled={approveAllBusy}
                onClick={() => void approveAllInventory()}
              >
                {approveAllBusy ? "…" : "Aceitar todos os itens"}
              </button>
            </div>
          ) : null}

          <ul className="mesa-edit-requests-bell__list">
            {sheet.requests.map((r) => (
              <li key={r.id} className="mesa-edit-requests-bell__item">
                <div className="mesa-edit-requests-bell__item-head">
                  <strong>{r.characterName ?? "Personagem"}</strong>
                  <span className="mesa-edit-requests-bell__scope">
                    Ficha — {sheetEditScopeLabel(r.scope)}
                  </span>
                </div>
                <div className="mesa-edit-requests-bell__actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void resolveSheet(r.characterId, r.id, "reject")}
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-cta btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void resolveSheet(r.characterId, r.id, "approve")}
                  >
                    {busyId === r.id ? "…" : "Aprovar"}
                  </button>
                </div>
              </li>
            ))}

            {inventory.requests.map((r) => (
              <li key={r.id} className="mesa-edit-requests-bell__item">
                <div className="mesa-edit-requests-bell__item-head">
                  <strong>{r.characterName ?? "Personagem"}</strong>
                  <span className="mesa-edit-requests-bell__scope">
                    Inventário — {inventoryRequestLabel(r)}
                  </span>
                </div>
                <div className="mesa-edit-requests-bell__actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void resolveInventory(r.characterId, r.id, "reject")}
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-cta btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void resolveInventory(r.characterId, r.id, "approve")}
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
