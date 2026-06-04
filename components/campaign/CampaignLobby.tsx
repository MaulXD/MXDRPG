"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type RoomRow = {
  roomId: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
};

export function CampaignLobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/campaigns");
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar mesa");
      return;
    }
    router.push(`/mesa/${data.room.roomId}`);
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/campaigns/join", {
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
    router.push(`/mesa/${data.room.roomId}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 720 }}>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
        Estilo Roll20: qualquer conta joga e também cria mesas. Você só é <strong>mestre</strong> nas
        mesas que <em>você</em> criou; nas outras entra como jogador pelo código de convite.
      </p>

      <div className="grid-2">
        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Criar mesa</h3>
          <form onSubmit={createRoom} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da campanha"
              required
              style={inputStyle}
            />
            <button type="submit" className="btn" disabled={loading}>
              Nova mesa
            </button>
          </form>
        </section>

        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Entrar com código</h3>
          <form onSubmit={joinRoom} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex: DEMOELDR"
              required
              style={inputStyle}
            />
            <button type="submit" className="btn btn-secondary" disabled={loading}>
              Entrar na mesa
            </button>
          </form>
        </section>
      </div>

      {error && <p style={{ color: "#ff6b8a", margin: 0 }}>{error}</p>}

      <section>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Suas mesas</h3>
        {rooms.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nenhuma mesa ainda — crie uma ou use o código de convite.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {rooms.map((r) => (
              <li key={r.roomId} className="glass-panel" style={{ padding: "0.85rem 1rem" }}>
                <Link href={`/mesa/${r.roomId}`} style={{ fontWeight: 600 }}>
                  {r.name}
                </Link>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {r.isOwner ? "· você é o mestre" : "· jogador"}
                  {r.isOwner && (
                    <>
                      {" "}
                      · código <code>{r.inviteCode}</code>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/mesa/demo" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Mesa demo pública
        </Link>
      </section>
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
