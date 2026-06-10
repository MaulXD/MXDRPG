"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { SendMesaInvitePicker } from "@/components/friends/SendMesaInvitePicker";
import { roomInviteUrl } from "@/lib/auth/room-access";

type Props = {
  adventureId: string;
  roomId: string;
  inviteCode: string;
  roomName: string;
  /** Mestre vê atalho para configurar a aventura. */
  showConfigure?: boolean;
  className?: string;
};

export function RoomInvitePanel({
  adventureId,
  roomId,
  inviteCode,
  roomName,
  showConfigure = false,
  className = "",
}: Props) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const magicLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/mesa/${roomId}?invite=${encodeURIComponent(inviteCode)}`
      : roomInviteUrl(roomId, inviteCode);

  const copy = useCallback(async (text: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className={`room-invite-panel${className ? ` ${className}` : ""}`}>
      <p className="room-invite-panel__eyebrow">Convite</p>
      <h3 className="room-invite-panel__title">{roomName}</h3>
      <p className="room-invite-panel__hint">
        Compartilhe o código ou o link para outros entrarem na mesa.
      </p>

      <div className="room-invite-panel__code-block">
        <span className="room-invite-panel__label">Código</span>
        <code className="room-invite-panel__code">{inviteCode}</code>
        <button
          type="button"
          className="vtt-btn vtt-btn--ghost vtt-btn--compact"
          onClick={() => void copy(inviteCode, "code")}
        >
          {copied === "code" ? "Copiado" : "Copiar"}
        </button>
      </div>

      <label className="room-invite-panel__link-field">
        <span className="room-invite-panel__label">Link</span>
        <input readOnly className="room-invite-panel__link" value={magicLink} aria-label="Link da mesa" />
        <button
          type="button"
          className="vtt-btn vtt-btn--ghost vtt-btn--compact"
          onClick={() => void copy(magicLink, "link")}
        >
          {copied === "link" ? "Copiado" : "Copiar"}
        </button>
      </label>

      <SendMesaInvitePicker adventureId={adventureId} />

      {showConfigure ? (
        <Link href={`/aventura/${adventureId}/configurar`} className="vtt-btn vtt-btn--ghost room-invite-panel__configure">
          Configurar aventura
        </Link>
      ) : null}
    </div>
  );
}
