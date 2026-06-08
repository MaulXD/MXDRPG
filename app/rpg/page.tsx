import Link from "next/link";
import { redirect } from "next/navigation";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

const systems = [
  {
    id: "eldarin",
    name: "Eldarin",
    tagline: "Fantasia tática · grid hex · PA por turno",
    href: "/eldarin",
    available: true,
    accent: "var(--accent)",
  },
  {
    id: "sci-fi",
    name: "Sci-Fi",
    tagline: "Em breve",
    href: null,
    available: false,
    accent: "var(--text-muted)",
  },
  {
    id: "horror",
    name: "Horror",
    tagline: "Em breve",
    href: null,
    available: false,
    accent: "var(--text-muted)",
  },
] as const;

export default async function RpgSelectPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/rpg"));

  return (
    <div className="page-wrap" style={{ maxWidth: 880, paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.5rem" }}>
        <p className="eyebrow">Plataforma</p>
        <h1 className="display-lg">Escolha seu RPG</h1>
        <p className="lead">
          Cada sistema tem mesas, fichas e salas de jogo próprias. Comece por Eldarin — nosso VTT
          hexagonal completo.
        </p>
      </header>

      <MedievalFrame variant="royal" page>
        <div
          className="grid-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}
        >
          {systems.map((sys) =>
          sys.available && sys.href ? (
            <Link
              key={sys.id}
              href={sys.href}
              className="glass feature-card"
              style={{
                textDecoration: "none",
                color: "inherit",
                borderColor: sys.accent,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div className="feature-icon" style={{ color: sys.accent }}>
                ⬡
              </div>
              <h3 style={{ margin: "0 0 0.35rem" }}>{sys.name}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {sys.tagline}
              </p>
              <span className="btn btn-sm" style={{ marginTop: "1rem" }}>
                Entrar em Eldarin →
              </span>
            </Link>
          ) : (
            <article
              key={sys.id}
              className="glass feature-card"
              style={{ opacity: 0.55, cursor: "not-allowed" }}
              aria-disabled
            >
              <div className="feature-icon">{sys.id === "sci-fi" ? "◎" : "◈"}</div>
              <h3 style={{ margin: "0 0 0.35rem" }}>{sys.name}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {sys.tagline}
              </p>
            </article>
          )
          )}
        </div>

        <p style={{ marginTop: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 0 }}>
          <Link href="/mesa/demo" prefetch={false}>
            Experimentar demo pública
          </Link>{" "}
          sem criar mesa.
        </p>
      </MedievalFrame>
    </div>
  );
}
