import Link from "next/link";
import { AvatarProfileForm } from "@/components/auth/AvatarProfileForm";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { dbEnabled } from "@/lib/db/enabled";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ContaPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?redirect=/conta");
  if (!dbEnabled()) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <p className="lead">Perfil requer banco Postgres configurado.</p>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href="/eldarin" style={{ color: "var(--text-muted)" }}>
            ← Mesas
          </Link>{" "}
          · Conta
        </p>
        <h1 className="display-lg">Seu perfil</h1>
        <p className="lead">
          Apelido: <strong>{session.user.nickname ?? session.user.name}</strong>
        </p>
      </header>

      <MedievalFrame variant="iron" page>
        <AvatarProfileForm initialUser={session.user} />
      </MedievalFrame>
    </div>
  );
}
