"use client";

import { useEffect, useState } from "react";
import { DismissibleMesaBanner } from "@/components/vtt/DismissibleMesaBanner";

type Health = {
  db?: boolean;
  persistence?: string;
  dbError?: string;
};

export function MesaPersistenceNotice() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: Health) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const memoryMode = health?.persistence === "memory";
  const dbDown = health?.persistence === "mariadb" && health.db === false;

  if (!memoryMode && !dbDown) return null;

  return (
    <>
      {memoryMode ? (
        <DismissibleMesaBanner
          bannerId="persistence:memory"
          className="mesa-persistence-notice"
          role="status"
          aria-label="Aviso de persistência"
        >
          <p>
            <strong>Sem banco de dados</strong> — nada fica salvo após reinício do servidor. Configure{" "}
            <code>DATABASE_URL</code> e rode <code>npm run db:setup</code>.
          </p>
        </DismissibleMesaBanner>
      ) : null}
      {dbDown ? (
        <DismissibleMesaBanner
          bannerId="persistence:db-down"
          className="mesa-persistence-notice"
          role="status"
          aria-label="Banco indisponível"
        >
          <p>
            <strong>Banco indisponível</strong>
            {health?.dbError ? ` — ${health.dbError}` : ""}. Dados podem não ser gravados.
          </p>
        </DismissibleMesaBanner>
      ) : null}
    </>
  );
}
