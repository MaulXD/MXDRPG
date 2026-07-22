import Link from "next/link";
import { AdventureLobby } from "@/components/adventure/AdventureLobby";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath, profileOnboardingPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { dbNicknameFlowEnabled } from "@/lib/db/enabled";
import { UM_ANEL_MESAS_PATH } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";
import { redirect } from "next/navigation";

export const metadata = pageMetadata("O Um Anel — suas mesas");

export default async function UmAnelMesasPage() {
  const session = await getSession();
  if (!session) redirect(signInPath(UM_ANEL_MESAS_PATH));
  const user = session.user;
  if (dbNicknameFlowEnabled() && !user.nickname) {
    redirect(profileOnboardingPath(UM_ANEL_MESAS_PATH));
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 920, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">O Um Anel · suas mesas</p>
        <h1 className="display-lg">Mesas</h1>
        <p className="lead">
          Crie uma mesa como mestre ou entre com o código de convite.{" "}
          <Link href="/amigos">Amigos</Link>
          {" · "}
          <Link href="/conta">Perfil</Link>
        </p>
      </header>

      <MedievalFrame variant="iron" page>
        <AdventureLobby rpgSystemId="um-anel" />
      </MedievalFrame>
    </div>
  );
}
