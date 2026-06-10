"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MesaRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mesa] erro ao carregar:", error);
  }, [error]);

  return (
    <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2.5rem" }}>
      <h1 className="display-lg" style={{ fontSize: "1.35rem" }}>
        Não foi possível abrir a mesa
      </h1>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>
        Algo falhou ao carregar o mapa ou os painéis. Tente recarregar. Se acabou de criar a mesa,
        aguarde alguns segundos e abra de novo pelo hub da aventura.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem" }}>
        <button type="button" className="btn" onClick={() => reset()}>
          Tentar de novo
        </button>
        <Link href="/eldarin" className="btn btn-secondary">
          Suas mesas
        </Link>
      </div>
    </div>
  );
}
