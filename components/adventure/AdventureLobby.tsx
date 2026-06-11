"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adventureRestoreDeadline } from "@/lib/adventure/lifecycle";
import { validateDisplayName } from "@/lib/moderation/display-name";

type AdventureRow = {
  adventureId: string;
  name: string;
  inviteCode: string;
  primaryRoomId: string;
  isOwner: boolean;
  deletedAt?: number | null;
};

function formatRestoreDeadline(deletedAt: number): string {
  const deadline = adventureRestoreDeadline({
    adventureId: "",
    ownerId: "",
    name: "",
    synopsis: "",
    rpgSystemId: "eldarin",
    accessMode: "public",
    inviteCode: "",
    memberIds: [],
    primaryRoomId: "",
    createdAt: 0,
    updatedAt: 0,
    deletedAt,
  });
  if (!deadline) return "";
  return new Date(deadline).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdventureLobby() {
  const router = useRouter();
  const [adventures, setAdventures] = useState<AdventureRow[]>([]);
  const [newName, setNewName] = useState("");
  const [accessMode, setAccessMode] = useState<"public" | "closed">("public");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/adventures?rpgSystem=eldarin");
    if (res.ok) {
      const data = await res.json();
      setAdventures(data.adventures ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = useMemo(() => adventures.filter((a) => !a.deletedAt), [adventures]);
  const asMaster = useMemo(() => active.filter((a) => a.isOwner), [active]);
  const asPlayer = useMemo(() => active.filter((a) => !a.isOwner), [active]);
  const trash = useMemo(
    () => adventures.filter((a) => a.deletedAt && a.isOwner),
    [adventures]
  );

  async function createAdventure(e: React.FormEvent) {
    e.preventDefault();
    if (creatingRef.current || loading) return;
    creatingRef.current = true;
    setLoading(true);
    setError("");
    const checked = validateDisplayName(newName);
    if (!checked.ok) {
      setError(checked.error);
      creatingRef.current = false;
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/adventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: checked.name, accessMode, rpgSystem: "eldarin" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        adventure?: { adventureId?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar mesa");
        return;
      }
      const adventureId = data.adventure?.adventureId;
      if (!adventureId) {
        setError("Resposta inválida do servidor ao criar a mesa.");
        return;
      }
      router.push(`/aventura/${adventureId}`);
    } catch {
      setError("Falha de conexão ao criar a mesa. Tente novamente.");
    } finally {
      creatingRef.current = false;
      setLoading(false);
    }
  }

  async function joinAdventure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/adventures/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        adventure?: { adventureId?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Código inválido");
        return;
      }
      const adventureId = data.adventure?.adventureId;
      if (!adventureId) {
        setError("Resposta inválida ao ingressar na mesa.");
        return;
      }
      router.push(`/aventura/${adventureId}?vinculado=1`);
    } catch {
      setError("Falha de conexão ao ingressar na mesa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMesa(adventureId: string, name: string) {
    if (
      !window.confirm(
        `Excluir a mesa "${name}"? Você tem 30 dias para restaurá-la antes que suma de vez.`
      )
    ) {
      return;
    }
    setActionId(adventureId);
    setError("");
    const res = await fetch(`/api/adventures/${adventureId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setActionId(null);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Falha ao excluir");
      return;
    }
    await load();
  }

  async function restoreMesa(adventureId: string) {
    setActionId(adventureId);
    setError("");
    const res = await fetch(`/api/adventures/${adventureId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    const data = await res.json().catch(() => ({}));
    setActionId(null);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Falha ao restaurar");
      return;
    }
    await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="grid-2">
        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Nova mesa (você será o mestre)</h3>
          <form onSubmit={createAdventure} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da mesa / campanha"
              required
              style={inputStyle}
            />
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>Tipo de acesso</legend>
              <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === "public"}
                  onChange={() => setAccessMode("public")}
                />
                Pública (padrão) — jogadores logados podem entrar na mesa
              </label>
              <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem" }}>
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === "closed"}
                  onChange={() => setAccessMode("closed")}
                />
                Fechada — só código do mestre, senha única ou aprovação
              </label>
            </fieldset>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Um código de convite de 10 caracteres é gerado automaticamente. Você copia e compartilha
              na página da mesa (painel <strong>Convite</strong>).
            </p>
            <button type="submit" className="btn" disabled={loading}>
              Criar mesa
            </button>
          </form>
        </section>

        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Ingressar com convite</h3>
          <form onSubmit={joinAdventure} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="Código do mestre (ex.: 10 caracteres)"
              required
              minLength={4}
              maxLength={16}
              style={inputStyle}
            />
            <button type="submit" className="btn btn-secondary" disabled={loading}>
              Entrar na mesa
            </button>
          </form>
          <p style={{ margin: "0.65rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            A mesa fica salva na sua conta após ingressar.
          </p>
        </section>
      </div>

      {error ? <p style={{ color: "#ff6b8a", margin: 0 }}>{error}</p> : null}

      {asMaster.length > 0 ? (
        <section>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Mesas que você mestreia</h3>
          <ul style={listStyle}>
            {asMaster.map((a) => (
              <li key={a.adventureId} className="glass-panel" style={{ padding: "0.85rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div>
                    <Link href={`/aventura/${a.adventureId}`} style={{ fontWeight: 600 }}>
                      {a.name}
                    </Link>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      convite <code>{a.inviteCode}</code>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={actionId === a.adventureId}
                    onClick={() => deleteMesa(a.adventureId, a.name)}
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    Excluir mesa
                  </button>
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

      {trash.length > 0 ? (
        <section>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Lixeira (30 dias para restaurar)</h3>
          <ul style={listStyle}>
            {trash.map((a) => (
              <li key={a.adventureId} className="glass-panel" style={{ padding: "0.85rem 1rem", opacity: 0.9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div>
                    <strong>{a.name}</strong>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      até {a.deletedAt ? formatRestoreDeadline(a.deletedAt) : "—"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={actionId === a.adventureId}
                    onClick={() => restoreMesa(a.adventureId)}
                  >
                    Restaurar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {active.length === 0 && trash.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          Nenhuma mesa ainda — crie uma ou entre com o código do mestre.
        </p>
      ) : null}

      <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
        Demo pública (sem conta)
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
