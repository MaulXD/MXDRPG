"use client";

import Link from "next/link";
import { useSheetEditRequest } from "@/hooks/useSheetEditRequest";
import { sheetEditStatusLabel } from "@/lib/character/sheet-edit-request";

type Props = {
  characterId: string;
  adventureId?: string;
  className?: string;
};

export function PlayerEditRequestNotice({ characterId, className }: Props) {
  const { request, refresh } = useSheetEditRequest(characterId, true);

  if (!request || request.status === "consumed") return null;

  const isActionable = request.status === "approved";
  const editHref = `/personagem/${characterId}/editar?requestId=${encodeURIComponent(request.id)}`;

  return (
    <div
      className={`player-edit-request-notice${isActionable ? " player-edit-request-notice--approved" : ""}${className ? ` ${className}` : ""}`}
      role="status"
    >
      <span>{sheetEditStatusLabel(request.status)}</span>
      {isActionable ? (
        <Link href={editHref} className="player-edit-request-notice__link" onClick={() => void refresh()}>
          Abrir edição
        </Link>
      ) : null}
      {request.status === "rejected" ? (
        <button type="button" className="player-edit-request-notice__dismiss" onClick={() => void refresh()}>
          OK
        </button>
      ) : null}
    </div>
  );
}
