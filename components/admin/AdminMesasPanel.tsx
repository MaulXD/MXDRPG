"use client";

import { useCallback, useEffect, useState } from "react";

type AdminMember = {
  userId: string;
  nickname: string | null;
  name: string;
  isOwner: boolean;
};

type AdminMesa = {
  adventureId: string;
  name: string;
  inviteCode: string;
  primaryRoomId: string;
  ownerId: string;
  ownerNickname: string | null;
  members: AdminMember[];
  updatedAt: number;
  deletedAt: number | null;
};

function memberLabel(m: AdminMember): string {
  if (m.nickname) return `@${m.nickname}`;
  return m.name;
}

export function AdminMesasPanel() {
  const [mesas, setMesas] = useState<AdminMesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = mesas.find((m) => m.adventureId === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/adventures");
      const data = (await res.json()) as { mesas?: AdminMesa[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar mesas");
      setMesas(data.mesas ?? []);
      if (!selectedId && data.mesas?.[0]) {
        setSelectedId(data.mesas[0].adventureId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: "add" | "remove" | "setOwner") {
    if (!selected || !nickname.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/adventures/${selected.adventureId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, nickname: nickname.trim() }),
      });
      const data = (await res.json()) as { mesa?: AdminMesa; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha na operação");
      if (data.mesa) {
        setMesas((prev) =>
          prev.map((m) => (m.adventureId === data.mesa!.adventureId ? data.mesa! : m))
        );
      } else {
        await load();
      }
      setNickname("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na operação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-mesas">
      <p className="vtt-combat-hint" style={{ marginBottom: "1rem" }}>
        Corrija mesas em que o criador ou jogadores aparecem como visitante. Atribua o mestre,
        adicione ou remova participantes pelo apelido.
      </p>

      {loading ? <p>Carregando mesas…</p> : null}
      {error ? <p className="vtt-error">{error}</p> : null}

      <div className="admin-mesas__grid">
        <aside className="glass admin-mesas__list">
          <h3 className="neon-title" style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
            Mesas ({mesas.length})
          </h3>
          <ul className="admin-mesas__items" role="list">
            {mesas.map((mesa) => (
              <li key={mesa.adventureId}>
                <button
                  type="button"
                  className={`admin-mesas__item${selectedId === mesa.adventureId ? " admin-mesas__item--active" : ""}`}
                  onClick={() => setSelectedId(mesa.adventureId)}
                >
                  <strong>{mesa.name}</strong>
                  <span>
                    {mesa.ownerNickname ? `@${mesa.ownerNickname}` : mesa.ownerId.slice(0, 8)} ·{" "}
                    {mesa.inviteCode}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selected ? (
          <section className="glass admin-mesas__detail">
            <h3 className="neon-title" style={{ fontSize: "1.1rem" }}>
              {selected.name}
            </h3>
            <p className="vtt-combat-hint">
              Sala <code>{selected.primaryRoomId}</code> · Convite{" "}
              <strong>{selected.inviteCode}</strong>
            </p>

            <h4 style={{ marginTop: "1rem" }}>Participantes</h4>
            <ul className="admin-mesas__members" role="list">
              {selected.members.map((m) => (
                <li key={m.userId}>
                  <span>{memberLabel(m)}</span>
                  <span className="vtt-combat-hint">
                    {m.isOwner ? "Mestre" : "Jogador"} · {m.userId}
                  </span>
                </li>
              ))}
            </ul>

            <div className="admin-mesas__actions">
              <label className="vtt-field">
                <span>Apelido do usuário</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ex: MaulXD"
                  disabled={busy}
                />
              </label>
              <div className="vtt-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || !nickname.trim()}
                  onClick={() => void runAction("add")}
                >
                  Adicionar jogador
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy || !nickname.trim()}
                  onClick={() => void runAction("remove")}
                >
                  Remover jogador
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || !nickname.trim()}
                  onClick={() => void runAction("setOwner")}
                >
                  Definir como mestre
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
