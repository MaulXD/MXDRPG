"use client";

import Link from "next/link";
import { DismissibleMesaBanner } from "@/components/vtt/DismissibleMesaBanner";
import { entrarPath, mesaRoomPath } from "@/lib/auth/post-auth-redirect";

type Props = {
  roomId: string;
  inviteCode?: string | null;
};

export function MesaVisitorNotice({ roomId, inviteCode }: Props) {
  return (
    <DismissibleMesaBanner
      bannerId={`visitor:${roomId}`}
      className="glass-panel mesa-dismissible-banner--inline"
      aria-label="Aviso de visitante"
    >
      <p className="mesa-dismissible-banner__text">
        Modo <strong>visitante</strong> na demo — pode jogar o Aventureiro; sem chat.{" "}
        <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="text-link">
          Entrar na conta
        </Link>{" "}
        para jogar.
      </p>
    </DismissibleMesaBanner>
  );
}
