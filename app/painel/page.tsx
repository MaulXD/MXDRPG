import Link from "next/link";
import { DeleteAccountButton } from "@/components/auth/DeleteAccountButton";
import { AdventureLobby } from "@/components/adventure/AdventureLobby";
import { DashboardCard } from "@/components/portal/DashboardCard";
import { listCharactersForUser, MAX_CHARACTERS_PER_USER } from "@/lib/character/characters";
import { dbEnabled } from "@/lib/db/enabled";
import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PainelPage() {
  const user = await requireSession();
  if (dbEnabled() && !user.nickname) {
    redirect("/entrar/apelido");
  }
  const characters = await listCharactersForUser(user.id);

  return (
    <>
      <h2 className="neon-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Olá, {user.name}
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Uma conta — joga e mestreia. Cada aventura tem mesa, fichas e registros próprios.
      </p>

      <AdventureLobby />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "2rem 0 0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h3 style={{ fontSize: "1rem", margin: 0 }}>Personagens</h3>
        {characters.length < MAX_CHARACTERS_PER_USER ? (
          <Link href="/personagem/novo" className="btn" style={{ fontSize: "0.85rem" }}>
            + Nova ficha
          </Link>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Limite {MAX_CHARACTERS_PER_USER} fichas
          </span>
        )}
      </div>
      <div className="grid-2">
        {characters.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            <Link href="/personagem/novo">Criar primeira ficha</Link>
          </p>
        ) : (
          characters.map((c) => (
            <DashboardCard
              key={c.id}
              title={c.name}
              description={`Nv ${c.identity.nivel} · ${c.identity.classe}${
                c.adventureId ? " · aventura vinculada" : ""
              }`}
              accent="magenta"
              href={`/personagem/${c.id}`}
            />
          ))
        )}
        <DashboardCard
          title="Compêndio"
          description="Armas, magias, habilidades."
          accent="lime"
          href="/biblioteca"
        />
      </div>

      {user.role === "admin" && (
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/admin">Administração</Link>
        </p>
      )}

      {dbEnabled() ? <DeleteAccountButton /> : null}
    </>
  );
}
