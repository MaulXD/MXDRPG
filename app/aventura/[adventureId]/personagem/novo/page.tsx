import Link from "next/link";
import { redirect } from "next/navigation";
import { CharacterCreationWizard } from "@/components/character/wizard/CharacterCreationWizard";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { ensureSessionAdventureAccess } from "@/lib/adventure/store";
import {
  listCharactersForSessionUser,
  listCharactersForSessionUserInAdventure,
  MAX_CHARACTERS_PER_USER,
  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
} from "@/lib/character/characters";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

type Props = {
  params: Promise<{ adventureId: string }>;
  searchParams: Promise<{ invite?: string }>;
};

export default async function AventuraNovoPersonagemPage({ params, searchParams }: Props) {
  const { adventureId } = await params;
  const { invite: inviteParam } = await searchParams;
  const inviteCode = inviteParam?.trim() || null;
  const session = await getSession();
  if (!session) {
    const dest = inviteCode
      ? `/aventura/${adventureId}/personagem/novo?invite=${encodeURIComponent(inviteCode)}`
      : `/aventura/${adventureId}/personagem/novo`;
    redirect(signInPath(dest));
  }

  const { adventure, accountUser } = await ensureSessionAdventureAccess(adventureId, session.user, {
    inviteCode,
  });

  if (!adventure) {
    return (
      <div className="page-wrap">
        <p>Aventura não encontrada.</p>
        <Link href="/eldarin">Suas mesas</Link>
      </div>
    );
  }

  if (!isAdventureMember(adventure, accountUser.id, accountUser.clerkId) && adventureId !== "demo") {
    return (
      <div className="page-wrap">
        <p>Entre na aventura com o código de convite antes de criar o personagem.</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Abra o link que o mestre enviou (com <code>?invite=</code>) ou cole o código em Suas mesas.
        </p>
        {adventure.primaryRoomId ? (
          <Link href={`/mesa/${adventure.primaryRoomId}`} className="btn" style={{ marginTop: "0.75rem" }}>
            Voltar à mesa
          </Link>
        ) : null}
        <Link href="/eldarin" className="btn btn--ghost" style={{ marginTop: "0.75rem", marginLeft: "0.5rem" }}>
          Suas mesas
        </Link>
      </div>
    );
  }

  const myChars = await listCharactersForSessionUser(accountUser);
  const inAdvChars = await listCharactersForSessionUserInAdventure(accountUser, adventureId);
  const total = myChars.length;
  const inAdv = inAdvChars.length;

  if (total >= MAX_CHARACTERS_PER_USER) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <h1 className="display-lg">Limite de fichas</h1>
        <p className="lead">Limite global de {MAX_CHARACTERS_PER_USER} fichas na conta.</p>
        <Link href={`/mesa/${adventure.primaryRoomId}`} className="btn">
          Voltar à mesa
        </Link>
      </div>
    );
  }

  if (inAdv >= MAX_CHARACTERS_PER_USER_PER_ADVENTURE) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <h1 className="display-lg">Limite de personagens nesta aventura</h1>
        <p className="lead">
          Máximo de {MAX_CHARACTERS_PER_USER_PER_ADVENTURE} fichas por jogador nesta aventura.
        </p>
        <Link href={`/aventura/${adventureId}`} className="btn">
          Hub da aventura
        </Link>
      </div>
    );
  }

  const slotsLeft = MAX_CHARACTERS_PER_USER - total;

  return (
    <div className="page-wrap" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      <MedievalFrame variant="celtic" page>
        <header className="page-header" style={{ paddingBottom: "1rem" }}>
          <p className="eyebrow">Aventura · {adventure.name}</p>
          <h1 className="display-lg">Novo personagem</h1>
          <p className="lead">
            Ficha exclusiva desta campanha — mesa, registros e progresso ficam aqui. Retrato é
            opcional; você pode pular e adicionar depois.
          </p>
        </header>
        <CharacterCreationWizard
          slotsLeft={slotsLeft}
          adventureId={adventureId}
          adventureName={adventure.name}
        />
      </MedievalFrame>
    </div>
  );
}
