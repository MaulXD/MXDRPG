"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdventureRow = {
  adventureId: string;
  name: string;
  inviteCode: string;
  primaryRoomId: string;
  isOwner: boolean;
};

export function AdventureLobby() {
  const router = useRouter();
  const [adventures, setAdventures] = useState<AdventureRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newInviteCode, setNewInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/adventures");
    if (res.ok) {
      const data = await res.json();
      setAdventures(data.adventures ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const asMaster = useMemo(() => adventures.filter((a) => a.isOwner), [adventures]);
  const asPlayer = useMemo(() => adventures.filter((a) => !a.isOwner), [adventures]);

  async function createAdventure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/adventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        inviteCode: newInviteCode.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar");
      return;
    }
    router.push(`/aventura/${data.adventure.adventureId}`);
  }

  async function joinAdventure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/adventures/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Código inválido");
      return;
    }
    router.push(`/aventura/${data.adventure.adventureId}?vinculado=1`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 720 }}>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
        Uma <strong>aventura</strong> reúne a mesa ao vivo, as fichas dos jogadores, o convite e os
        registros da campanha. Você pode mestrear suas aventuras e jogar nas de outros.
      </p>

      <div className="grid-2">
        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Nova aventura (você será o mestre)</h3>
          <form onSubmit={createAdventure} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da aventura"
              required
              style={inputStyle}
            />
            <input
              value={newInviteCode}
              onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
              placeholder="Código de convite (opcional)"
              maxLength={16}
              style={inputStyle}
              aria-describedby="invite-hint-create"
            />
            <p id="invite-hint-create" style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              4–16 letras/números. Deixe vazio para gerar um código automático.
            </p>
            <button type="submit" className="btn" disabled={loading}>
              Criar aventura
            </button>
          </form>
        </section>

        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Entrar como jogador</h3>
          <form onSubmit={joinAdventure} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código do mestre"
              required
              style={inputStyle}
            />
            <button type="submit" className="btn btn-secondary" disabled={loading}>
              Entrar na aventura
            </button>
          </form>
        </section>
      </div>

      {error ? <p style={{ color: "#ff6b8a", margin: 0 }}>{error}</p> : null}
      {asMaster.length > 0 ? (
        <section>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Aventuras que você mestreia</h3>
          <ul style={listStyle}>
            {asMaster.map((a) => (
              <li key={a.adventureId} className="glass-panel" style={{ padding: "0.85rem 1rem" }}>
                <Link href={`/aventura/${a.adventureId}`} style={{ fontWeight: 600 }}>
                  {a.name}
                </Link>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  convite <code>{a.inviteCode}</code>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {asPlayer.length > 0 ? (
        <section>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Aventuras em que você joga</h3>
          <ul style={listStyle}>
            {asPlayer.map((a) => (
              <li key={a.adventureId} className="glass-panel" style={{ padding: "0.85rem 1rem" }}>
                <Link href={`/aventura/${a.adventureId}`} style={{ fontWeight: 600 }}>
                  {a.name}
                </Link>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  · jogador vinculado
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {adventures.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          Nenhuma aventura ainda — crie uma ou entre com o código do mestre.
        </p>
      ) : null}

      <Link href="/mesa/demo" className="btn btn-secondary">
        Demo pública
      </Link>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.65rem 0.85rem",
  borderRadius: 10,
  border: "1px solid var(--glass-border)",
  background: "rgba(0,0,0,0.35)",
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  width: "100%",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};
