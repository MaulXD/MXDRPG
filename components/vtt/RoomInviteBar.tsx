"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { roomInviteUrl } from "@/lib/auth/room-access";

type Props = {
  adventureId: string;
  roomId: string;
  inviteCode: string;
  roomName: string;
};

export function RoomInviteBar({ adventureId, roomId, inviteCode, roomName }: Props) {
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
    <div
      className="room-invite-bar"
      title="Jogadores: painel com o código. Espectadores: link (sem chat)."
    >
      <span className="room-invite-title">
        Convite · <span className="room-invite-room">{roomName}</span>
      </span>
      <code className="room-invite-code">{inviteCode}</code>
      <button
        type="button"
        className="btn btn-ghost room-invite-btn"
        onClick={() => copy(inviteCode, "code")}
      >
        {copied === "code" ? "OK" : "Código"}
      </button>
      <span className="room-invite-sep" aria-hidden />
      <input readOnly className="room-invite-link" value={magicLink} aria-label="Link da mesa" />
      <button
        type="button"
        className="btn btn-ghost room-invite-btn"
        onClick={() => copy(magicLink, "link")}
      >
        {copied === "link" ? "OK" : "Link"}
      </button>
      <Link
        href={`/aventura/${adventureId}/configurar`}
        className="btn btn-ghost room-invite-btn"
        style={{ marginLeft: "0.25rem" }}
      >
        Configurar
      </Link>
    </div>
  );
}
