"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  roomId: string;
  adventureId: string;
  roomName: string;
};

const fetchOpts = { credentials: "same-origin" as const };

export function MesaClosedGate({ roomId, adventureId, roomName }: Props) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  async function joinWithInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/adventures/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...fetchOpts,
        body: JSON.stringify({ inviteCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Código inválido");
        return;
      }
      router.push(`/mesa/${roomId}?joined=1`);
      router.refresh();
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function joinWithToken(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/adventures/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...fetchOpts,
        body: JSON.stringify({ joinToken, adventureId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Senha inválida ou já usada");
        return;
      }
      router.push(`/mesa/${roomId}?joined=1`);
      router.refresh();
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function requestJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/adventures/${adventureId}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...fetchOpts,
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o pedido");
        return;
      }
      setRequestSent(true);
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap mesa-closed-gate" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <p className="eyebrow">Mesa fechada</p>
        <h1 className="display-lg" style={{ fontSize: "1.35rem" }}>
          {roomName}
        </h1>
        <p className="lead" style={{ fontSize: "0.95rem" }}>
          Esta mesa só aceita entrada com código do mestre, senha única ou aprovação do mestre.
        </p>
      </header>

      {error ? <p className="mesa-closed-gate__error">{error}</p> : null}

      <div className="glass-panel mesa-closed-gate__panel">
        <form onSubmit={joinWithInvite} className="mesa-closed-gate__form">
          <label className="mesa-closed-gate__label">
            Código do mestre
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="Ex.: ABCD123456"
              className="mesa-closed-gate__input"
            />
          </label>
          <button type="submit" className="btn" disabled={loading || !inviteCode.trim()}>
            Entrar com código
          </button>
        </form>

        <hr className="mesa-closed-gate__sep" />

        <form onSubmit={joinWithToken} className="mesa-closed-gate__form">
          <label className="mesa-closed-gate__label">
            Senha única
            <input
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="Senha de uso único"
              className="mesa-closed-gate__input"
            />
          </label>
          <button type="submit" className="btn btn-secondary" disabled={loading || !joinToken.trim()}>
            Usar senha
          </button>
        </form>

        <hr className="mesa-closed-gate__sep" />

        {requestSent ? (
          <p className="mesa-closed-gate__success">
            Pedido enviado! O mestre será notificado e pode aprovar sua entrada.
          </p>
        ) : (
          <form onSubmit={requestJoin} className="mesa-closed-gate__form">
            <label className="mesa-closed-gate__label">
              Mensagem ao mestre (opcional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="mesa-closed-gate__input"
                placeholder="Quem você é, personagem, etc."
              />
            </label>
            <button type="submit" className="btn btn-ghost" disabled={loading}>
              Solicitar entrada
            </button>
          </form>
        )}
      </div>

      <Link href="/eldarin" className="btn btn-ghost" style={{ marginTop: "1rem" }}>
        Voltar às mesas
      </Link>
    </div>
  );
}
