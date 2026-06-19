import Link from "next/link";
import { AdventureLobby } from "@/components/adventure/AdventureLobby";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath, profileOnboardingPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { dbNicknameFlowEnabled } from "@/lib/db/enabled";
import { ELDARIN_MESAS_PATH, MESAS_HUB_PATH } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";
import { redirect } from "next/navigation";

export const metadata = pageMetadata("Eldarin — suas mesas");

export default async function EldarinMesasPage() {
  const session = await getSession();
  if (!session) redirect(signInPath(ELDARIN_MESAS_PATH));
  const user = session.user;
  if (dbNicknameFlowEnabled() && !user.nickname) {
    redirect(profileOnboardingPath(ELDARIN_MESAS_PATH));
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 920, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href={MESAS_HUB_PATH} style={{ color: "var(--text-muted)" }}>
            ← MXDRPG
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
