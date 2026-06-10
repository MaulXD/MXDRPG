import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FriendsPageClient } from "@/components/friends/FriendsPageClient";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AmigosPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/amigos"));
  const user = session.user;

  return (
    <div className="page-wrap friends-page-wrap" style={{ maxWidth: 1120, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href="/eldarin" style={{ color: "var(--text-muted)" }}>
            ← Mesas
          </Link>{" "}
          · Social
        </p>
        <h1 className="display-lg">Amigos e mensagens</h1>
        <p className="lead">
          Adicione jogadores pelo apelido, aceite pedidos, converse e veja o perfil de cada amigo.
        </p>
      </header>

      <MedievalFrame variant="royal" page>
        <Suspense fallback={<p className="friends-hub__sub">Carregando…</p>}>
          <FriendsPageClient selfUserId={user.id} />
        </Suspense>
      </MedievalFrame>
    </div>
  );
}
