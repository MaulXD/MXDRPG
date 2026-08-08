"use client";

import { useEffect, useState } from "react";
import { DismissibleMesaBanner } from "@/components/vtt/DismissibleMesaBanner";

type Health = {
  db?: boolean;
  persistence?: string;
  dbError?: string;
  dbUrlIssue?: string;
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
  const urlIssue = health?.dbUrlIssue?.trim();

  if (!memoryMode && !dbDown && !urlIssue) return null;

  return (
    <>
      {urlIssue ? (
        <DismissibleMesaBanner
          bannerId="persistence:url-issue"
          className="mesa-persistence-notice"
          role="status"
          aria-label="Configuração de banco inválida"
        >
          {/* Dizia "DATABASE_URL ignorada". O jogador na mesa precisa saber que
              nada está sendo salvo; o nome da variável de ambiente é do operador,
              e sai no /api/health, que é onde ele olha. */}
          <p>
            <strong>Configuração de banco inválida</strong> — {urlIssue}
          </p>
        </DismissibleMesaBanner>
      ) : null}
      {memoryMode && !urlIssue ? (
        <DismissibleMesaBanner
          bannerId="persistence:memory"
          className="mesa-persistence-notice"
          role="status"
          aria-label="Aviso de persistência"
        >
          {/* Saiu a receita de subir o banco local — o jogador na mesa não tem
              repositório. O aviso em si fica: nada está sendo salvo. */}
          <p>
            <strong>Sem banco de dados</strong> — nada do que acontecer nesta mesa fica salvo.
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
