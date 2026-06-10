"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdventureAccessMode } from "@/lib/adventure/access";
import type { JoinRequestSummary } from "@/lib/adventure/join-requests";
import "@/components/notifications/notifications.css";

type Props = {
  adventureId: string;
  accessMode: AdventureAccessMode;
};

const fetchOpts = { credentials: "same-origin" as const, cache: "no-store" as const };

export function AdventureAccessPanel({ adventureId, accessMode }: Props) {
  const [requests, setRequests] = useState<JoinRequestSummary[]>([]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    if (accessMode !== "closed") return;
    try {
      const res = await fetch(`/api/adventures/${adventureId}/join-requests`, fetchOpts);
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: JoinRequestSummary[] };
      setRequests(data.requests ?? []);
    } catch {
      /* ignore */
    }
  }, [adventureId, accessMode]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function generateToken() {
    setLoading(true);
    setError("");
    setGeneratedToken(null);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/join-tokens`, {
        method: "POST",
        ...fetchOpts,
      });
      const data = (await res.json()) as { error?: string; token?: string };
      if (!res.ok) {
        setError(data.error ?? "Falha ao gerar senha");
        return;
      }
      setGeneratedToken(data.token ?? null);
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function resolveRequest(requestId: string, action: "approve" | "reject") {
    setBusyId(requestId);
    setError("");
    try {
      const res = await fetch(
        `/api/adventures/${adventureId}/join-requests/${requestId}/${action}`,
        { method: "POST", ...fetchOpts }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Falha");
        return;
      }
      await loadRequests();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="adventure-access-panel glass-panel" style={{ padding: "1.25rem" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Acesso à mesa</h3>
      <div className="adventure-access-panel__mode">
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          Modo:{" "}
          <strong>{accessMode === "closed" ? "Fechada" : "Pública"}</strong>
        </p>
        {accessMode === "public" ? (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Qualquer jogador logado pode entrar pela mesa ao vivo. O código do mestre continua
            disponível no painel Convite.
          </p>
        ) : (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Entrada só com código do mestre, senha única gerada abaixo ou aprovação de pedidos.
          </p>
        )}
      </div>

      {accessMode === "closed" ? (
        <>
          <div>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
              Senha de uso único
            </p>
            <div className="adventure-access-panel__token-row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => void generateToken()}
              >
                Gerar senha
              </button>
              {generatedToken ? (
                <span className="adventure-access-panel__token-display">{generatedToken}</span>
              ) : null}
            </div>
            {generatedToken ? (
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "var(--accent)" }}>
                Copie agora — não será exibida de novo.
              </p>
            ) : null}
          </div>

          <div>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
              Pedidos de entrada ({requests.length})
            </p>
            {requests.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Nenhum pedido pendente.
              </p>
            ) : (
              <ul className="adventure-access-panel__requests">
                {requests.map((r) => (
                  <li key={r.id} className="adventure-access-panel__request">
                    <div>
                      <strong>{r.userDisplayName}</strong>
                      {r.message ? (
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {r.message}
                        </p>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => void resolveRequest(r.id, "approve")}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => void resolveRequest(r.id, "reject")}
                      >
                        Recusar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {error ? <p style={{ margin: 0, color: "#ff6b8a", fontSize: "0.85rem" }}>{error}</p> : null}
    </section>
  );
}
