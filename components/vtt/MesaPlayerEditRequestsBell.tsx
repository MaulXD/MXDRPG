"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePlayerEditRequests } from "@/hooks/useSheetEditRequest";
import {
  sheetEditScopeLabel,
  sheetEditStatusLabel,
  type SheetEditRequestStatus,
} from "@/lib/character/sheet-edit-request";
import { IconBell } from "@/components/ui/EldarinIcons";

type Props = {
  adventureId: string;
};

function statusTone(status: SheetEditRequestStatus): string {
  if (status === "approved") return "mesa-edit-requests-bell__status--ok";
  if (status === "rejected") return "mesa-edit-requests-bell__status--bad";
  return "mesa-edit-requests-bell__status--wait";
}

export function MesaPlayerEditRequestsBell({ adventureId }: Props) {
  const { requests, hasActive, refresh } = usePlayerEditRequests(adventureId, true);
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
      const res = await fetch(`/api/characters/${characterId}/edit-request/${requestId}`, {
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
    <div className="mesa-edit-requests-bell mesa-edit-requests-bell--player" ref={rootRef}>
      <button
        type="button"
        className="mesa-edit-requests-bell__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Solicitações de edição da sua ficha"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mesa-edit-requests-bell__icon" aria-hidden>
          <IconBell size={16} />
        </span>
        <span className="mesa-edit-requests-bell__badge">{requests.length}</span>
      </button>

      {open ? (
        <div
          className="mesa-edit-requests-bell__panel glass-panel"
          role="dialog"
          aria-label="Suas solicitações de edição"
        >
          <p className="mesa-edit-requests-bell__title">Sua ficha</p>
          <ul className="mesa-edit-requests-bell__list">
            {requests.map((r) => {
              const editHref = `/personagem/${r.characterId}/editar?requestId=${encodeURIComponent(r.id)}`;
              return (
                <li key={r.id} className="mesa-edit-requests-bell__item">
                  <div className="mesa-edit-requests-bell__item-head">
                    <strong>{r.characterName ?? "Personagem"}</strong>
                    <span className="mesa-edit-requests-bell__scope">{sheetEditScopeLabel(r.scope)}</span>
                    <span className={`mesa-edit-requests-bell__status ${statusTone(r.status)}`}>
                      {sheetEditStatusLabel(r.status)}
                    </span>
                  </div>
                  <div className="mesa-edit-requests-bell__actions">
                    {r.status === "rejected" ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => void dismiss(r.characterId, r.id)}
                      >
                        OK
                      </button>
                    ) : null}
                    {r.status === "approved" ? (
                      <Link
                        href={editHref}
                        className="btn btn-primary-cta btn-sm"
                        onClick={() => {
                          setOpen(false);
                          void refresh();
                        }}
                      >
                        Abrir edição
                      </Link>
                    ) : null}
                    {r.status === "pending" ? (
                      <span className="mesa-edit-requests-bell__hint">Aguardando o mestre</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
