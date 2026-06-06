import Link from "next/link";
import { redirect } from "next/navigation";
import { CharacterCreationWizard } from "@/components/character/wizard/CharacterCreationWizard";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { getAdventure } from "@/lib/adventure/store";
import {
  countCharactersForUserInAdventure,
  listCharactersForUser,
  MAX_CHARACTERS_PER_USER,
  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
} from "@/lib/character/characters";
import { getSession } from "@/lib/auth/session";

type Props = { params: Promise<{ adventureId: string }> };

export default async function AventuraNovoPersonagemPage({ params }: Props) {
  const { adventureId } = await params;
  const session = await getSession();
  if (!session) redirect(`/entrar?redirect=/aventura/${adventureId}/personagem/novo`);

  const adventure = await getAdventure(adventureId);
  if (!adventure) {
    return (
      <div className="page-wrap">
        <p>Aventura não encontrada.</p>
        <Link href="/painel">Painel</Link>
      </div>
    );
  }

  if (!isAdventureMember(adventure, session.user.id)) {
    return (
      <div className="page-wrap">
        <p>Entre na aventura com o código de convite antes de criar o personagem.</p>
        <Link href="/painel" className="btn">
          Painel
        </Link>
      </div>
    );
  }

  const total = (await listCharactersForUser(session.user.id)).length;
  const inAdv = await countCharactersForUserInAdventure(session.user.id, adventureId);

  if (total >= MAX_CHARACTERS_PER_USER) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <h1 className="display-lg">Limite de fichas</h1>
        <p className="lead">Limite global de {MAX_CHARACTERS_PER_USER} fichas na conta.</p>
        <Link href="/painel" className="btn">
          Voltar
        </Link>
      </div>
    );
  }

  if (inAdv >= MAX_CHARACTERS_PER_USER_PER_ADVENTURE) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <h1 className="display-lg">Já tem personagem nesta aventura</h1>
        <p className="lead">
          Máximo de {MAX_CHARACTERS_PER_USER_PER_ADVENTURE} ficha por jogador por aventura.
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
