import Link from "next/link";
import { AvatarProfileForm } from "@/components/auth/AvatarProfileForm";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { NicknameForm } from "@/components/auth/NicknameForm";
import { FriendsChat } from "@/components/friends/FriendsChat";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { dbEnabled } from "@/lib/db/enabled";
import { listFriends } from "@/lib/friends/store";
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

  const friends = await listFriends(session.user.id);
  const displayName = session.user.nickname ?? session.user.name;

  return (
    <div className="page-wrap" style={{ maxWidth: 720, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href="/eldarin" style={{ color: "var(--text-muted)" }}>
            ← Mesas
          </Link>{" "}
          · Conta
        </p>
        <EldarinLogo variant="mark" href="/" />
        <h1 className="display-lg" style={{ marginTop: "0.75rem" }}>
          Seu perfil
        </h1>
        <p className="lead">
          Olá, <strong>{displayName}</strong>. Gerencie apelido e foto aqui. Para convites de mesa e
          lista completa de amigos, veja também{" "}
          <Link href="/eldarin#amigos">Amigos em Mesas</Link>.
        </p>
      </header>

      <MedievalFrame variant="iron" page>
        <h2 className="eyebrow" style={{ margin: "0 0 0.75rem" }}>
          Apelido
        </h2>
        <NicknameForm initialNickname={session.user.nickname ?? ""} />
      </MedievalFrame>

      <div style={{ marginTop: "1.25rem" }}>
        <MedievalFrame variant="iron" page>
          <AvatarProfileForm initialUser={session.user} />
        </MedievalFrame>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <MedievalFrame variant="royal" page>
          <h2 className="eyebrow" style={{ margin: "0 0 0.75rem" }}>
            Mensagens com amigos
          </h2>
          <FriendsChat friends={friends} selfUserId={session.user.id} />
        </MedievalFrame>
      </div>
    </div>
  );
}
