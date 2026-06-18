"use client";

import Link from "next/link";
import { DismissibleMesaBanner } from "@/components/vtt/DismissibleMesaBanner";
import { entrarPath, mesaRoomPath } from "@/lib/auth/post-auth-redirect";

type Props = {
  roomId: string;
  inviteCode?: string | null;
  watchOnly?: boolean;
  isDemo?: boolean;
};

export function MesaVisitorNotice({ roomId, inviteCode, watchOnly = false, isDemo = false }: Props) {
  const bannerId = watchOnly ? `spectator:${roomId}` : `visitor:${roomId}`;

  return (
    <DismissibleMesaBanner
      bannerId={bannerId}
      className="glass-panel mesa-dismissible-banner--inline"
      aria-label={watchOnly ? "Modo espectador" : "Aviso de visitante"}
    >
      <p className="mesa-dismissible-banner__text">
        {watchOnly ? (
          <>
            Modo <strong>só assistir</strong> — mapa, iniciativa e chat em leitura.{" "}
            {!isDemo ? (
              <>
                Para jogar, use o link de jogador ou{" "}
                <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="text-link">
                  entre na conta
                </Link>
                .
              </>
            ) : null}
          </>
        ) : isDemo ? (
          <>
            Modo <strong>visitante</strong> na demo — pode mover o Aventureiro; sem chat.{" "}
            <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="text-link">
              Entrar na conta
            </Link>{" "}
            para o fluxo completo.
          </>
        ) : (
          <>
            Você está vendo esta mesa como <strong>visitante</strong> (convite válido, ainda não entrou).{" "}
            <Link href={entrarPath(mesaRoomPath(roomId, inviteCode))} className="text-link">
              Entrar na conta
            </Link>{" "}
            para participar.
          </>
        )}
      </p>
    </DismissibleMesaBanner>
  );
}
