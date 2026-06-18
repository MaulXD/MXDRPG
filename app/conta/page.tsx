import Link from "next/link";
import { AvatarProfileForm } from "@/components/auth/AvatarProfileForm";
import { RecoveryIdentityForm } from "@/components/auth/RecoveryIdentityForm";
import { NicknameForm } from "@/components/auth/NicknameForm";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { listCharactersForSessionUser } from "@/lib/character/characters";
import { getAdventure } from "@/lib/adventure/store";
import { dbEnabled } from "@/lib/db/enabled";
import { userHasRecoveryConfigured } from "@/lib/auth/password-recover";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";
import { redirect } from "next/navigation";

export const metadata = pageMetadata("Seu perfil");

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

  const accountUser = await materializeSessionUser(session.user);
  const hasRecovery = await userHasRecoveryConfigured(accountUser.id);
  const displayName = accountUser.nickname ?? accountUser.name;
  const myCharacters = await listCharactersForSessionUser(accountUser);

  return (
    <div className="page-wrap" style={{ maxWidth: 720, paddingTop: "1.75rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">
          <Link href="/eldarin" style={{ color: "var(--text-muted)" }}>
            ← Mesas
          </Link>{" "}
          · Conta
        </p>
        <h1 className="display-lg" style={{ marginTop: "0.75rem" }}>
          Seu perfil
        </h1>
        <p className="lead">
          Olá, <strong>{displayName}</strong>. Gerencie apelido e foto aqui. Amigos, mensagens e
          convites ficam em <Link href="/amigos">Amigos</Link>.
        </p>
      </header>

      <MedievalFrame variant="iron" page>
        <h2 className="eyebrow" style={{ margin: "0 0 0.75rem" }}>
          Apelido
        </h2>
        <NicknameForm initialNickname={accountUser.nickname ?? ""} />
      </MedievalFrame>

      <div style={{ marginTop: "1.25rem" }}>
        <MedievalFrame variant="iron" page>
          <h2 className="eyebrow" style={{ margin: "0 0 0.75rem" }}>
            Recuperação de senha
          </h2>
          <RecoveryIdentityForm initialHasRecovery={hasRecovery} />
        </MedievalFrame>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <MedievalFrame variant="iron" page>
          <AvatarProfileForm initialUser={accountUser} />
        </MedievalFrame>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <MedievalFrame variant="parchment" page>
          <h2 className="eyebrow" style={{ margin: "0 0 0.75rem" }}>
            Personagens da conta
          </h2>
          <p className="lead" style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
            Fichas vinculadas a <strong>{displayName}</strong> em todas as mesas.
          </p>
          {myCharacters.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Nenhum personagem ainda. Entre numa mesa e crie sua ficha na aventura.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {await Promise.all(
                myCharacters.map(async (c) => {
                  const advId = c.adventureId ?? c.campaignRoomId;
                  const adv = advId ? await getAdventure(advId) : null;
                  return (
                    <li
                      key={c.id}
                      style={{
                        padding: "0.65rem 0",
                        borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                      }}
                    >
                      <Link href={`/personagem/${c.id}`}>
                        <strong>{c.name}</strong>
                      </Link>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {" "}
                        · nv {c.identity.nivel} {c.identity.classe}
                        {adv ? (
                          <>
                            {" "}
                            ·{" "}
                            <Link href={`/aventura/${adv.adventureId}`} style={{ color: "inherit" }}>
                              {adv.name}
                            </Link>
                          </>
                        ) : null}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </MedievalFrame>
      </div>

    </div>
  );
}
