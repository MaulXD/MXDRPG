"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { validateDisplayName } from "@/lib/moderation/display-name";

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

  const asMaster = useMemo(() => rooms.filter((r) => r.isOwner), [rooms]);
  const asPlayer = useMemo(() => rooms.filter((r) => !r.isOwner), [rooms]);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const checked = validateDisplayName(newName);
    if (!checked.ok) {
      setError(checked.error);
      setLoading(false);
      return;
    }
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: checked.name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar mesa");
      return;
    }
    router.push(`/mesa/${data.room.roomId}/configurar`);
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
        Uma conta faz tudo: crie fichas no painel, <strong>mestreie</strong> suas mesas (cenário, monstros,
        configurações) e <strong>jogue</strong> nas mesas de outros com o código de convite — como no Roll20.
      </p>

      <div className="grid-2">
        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Criar mesa (você será o mestre)</h3>
          <form onSubmit={createRoom} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da campanha / cenário"
              required
              style={inputStyle}
            />
            <button type="submit" className="btn" disabled={loading}>
              Nova mesa
            </button>
          </form>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.5rem 0 0" }}>
            O código de convite é gerado automaticamente. Depois você configura mapa e visibilidade de HP.
          </p>
        </section>

        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Entrar como jogador</h3>
          <form onSubmit={joinRoom} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código do mestre"
              required
              style={inputStyle}
            />
            <button type="submit" className="btn btn-secondary" disabled={loading}>
              Entrar na mesa
            </button>
          </form>
        </section>
      </div>

      {error ? <p style={{ color: "#ff6b8a", margin: 0 }}>{error}</p> : null}

      {asMaster.length > 0 ? (
        <section>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Mesas que você mestreia</h3>
          <ul style={listStyle}>
            {asMaster.map((r) => (
              <li key={r.roomId} className="glass-panel" style={{ padding: "0.85rem 1rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                  <Link href={`/mesa/${r.roomId}`} style={{ fontWeight: 600 }}>
                    {r.name}
                  </Link>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    convite <code>{r.inviteCode}</code>
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <Link href={`/mesa/${r.roomId}/configurar`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
                    Configurar mesa
                  </Link>
                  <Link href={`/mesa/${r.roomId}`} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>
                    Abrir mesa
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {asPlayer.length > 0 ? (
        <section>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Mesas em que você joga</h3>
          <ul style={listStyle}>
            {asPlayer.map((r) => (
              <li key={r.roomId} className="glass-panel" style={{ padding: "0.85rem 1rem" }}>
                <Link href={`/mesa/${r.roomId}`} style={{ fontWeight: 600 }}>
                  {r.name}
                </Link>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  · jogador
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rooms.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          Nenhuma mesa ainda — crie uma campanha ou entre com o código de outro mestre.
        </p>
      ) : null}

      <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
        Mesa demo pública
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
