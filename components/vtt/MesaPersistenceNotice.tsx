"use client";

import { useEffect, useState } from "react";

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
  const dbDown = health?.persistence === "postgres" && health.db === false;

  if (!memoryMode && !dbDown) return null;

  return (
    <div className="mesa-persistence-notice" role="status">
      {memoryMode ? (
        <p>
          <strong>Sem banco de dados</strong> — nada fica salvo após reinício do servidor. Configure{" "}
          <code>DATABASE_URL</code> e rode <code>npm run db:setup</code>.
        </p>
      ) : null}
      {dbDown ? (
        <p>
          <strong>Banco indisponível</strong>
          {health?.dbError ? ` — ${health.dbError}` : ""}. Dados podem não ser gravados.
        </p>
      ) : null}
    </div>
  );
}
