import Link from "next/link";
import { CampaignLobby } from "@/components/campaign/CampaignLobby";
import { DashboardCard } from "@/components/portal/DashboardCard";
import { listCharactersForUser } from "@/lib/character/characters";
import { requireSession } from "@/lib/auth/session";

export default async function PainelPage() {
  const user = await requireSession();
  const characters = listCharactersForUser(user.id);

  return (
    <>
      <h2 className="neon-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Olá, {user.name}
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Uma conta — joga e mestreia. Poderes de mestre só na sua mesa.
      </p>

      <CampaignLobby />

      <h3 style={{ fontSize: "1rem", margin: "2rem 0 0.75rem" }}>Personagens</h3>
      <div className="grid-2">
        {characters.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Crie uma ficha em breve pelo painel.</p>
        ) : (
          characters.map((c) => (
            <DashboardCard
              key={c.id}
              title={c.name}
              description={`Nv ${c.identity.nivel} · ${c.identity.classe}`}
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
    </>
  );
}
