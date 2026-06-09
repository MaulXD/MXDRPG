import Link from "next/link";
import { AdventureLobby } from "@/components/adventure/AdventureLobby";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { requireSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";
import { redirect } from "next/navigation";

export default async function EldarinMesasPage() {
  const user = await requireSession();
  if (dbEnabled() && !user.nickname) {
    redirect("/entrar/apelido?redirect=/eldarin");
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 760, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href="/rpg" style={{ color: "var(--text-muted)" }}>
            ← RPGs
          </Link>{" "}
          · Eldarin
        </p>
        <h1 className="display-lg">Suas mesas</h1>
        <p className="lead">
          Crie uma mesa como mestre ou entre com o código de convite. Mesas ingressadas ficam salvas
          na sua conta — só o mestre pode excluir (com 30 dias para restaurar).{" "}
          <Link href="/conta">Editar foto de perfil</Link>
        </p>
      </header>

      <MedievalFrame variant="iron" page>
        <AdventureLobby />
      </MedievalFrame>
    </div>
  );
}
