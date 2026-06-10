import Link from "next/link";
import { AdventureLobby } from "@/components/adventure/AdventureLobby";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";
import { redirect } from "next/navigation";

export default async function EldarinMesasPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/eldarin"));
  const user = session.user;
  if (dbEnabled() && !user.nickname) {
    redirect("/entrar/apelido?redirect=/eldarin");
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 760, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href="/mesas" style={{ color: "var(--text-muted)" }}>
            ← Mesas
          </Link>{" "}
          · Eldarin
        </p>
        <h1 className="display-lg">Suas mesas</h1>
        <p className="lead">
          Crie uma mesa como mestre ou entre com o código de convite. Mesas ingressadas ficam salvas
          na sua conta — só o mestre pode excluir (com 30 dias para restaurar).{" "}
          <Link href="/amigos">Amigos e mensagens</Link>
          {" · "}
          <Link href="/conta">Editar perfil</Link>
        </p>
      </header>

      <MedievalFrame variant="iron" page>
        <AdventureLobby />
      </MedievalFrame>

    </div>
  );
}
