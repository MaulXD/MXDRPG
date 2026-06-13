import Link from "next/link";
import { redirect } from "next/navigation";
import { CharacterCreationWizard } from "@/components/character/wizard/CharacterCreationWizard";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import {
  listCharactersForUser,
  MAX_CHARACTERS_PER_USER,
} from "@/lib/character/characters";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Novo personagem");

export default async function NovoPersonagemPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/personagem/novo"));

  const characters = await listCharactersForUser(session.user.id);
  const slotsLeft = MAX_CHARACTERS_PER_USER - characters.length;

  if (slotsLeft <= 0) {
    return (
      <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
        <h1 className="display-lg">Limite de fichas</h1>
        <p className="lead">
          Você já tem {MAX_CHARACTERS_PER_USER} personagens. Exclua uma ficha ou use o painel.
        </p>
        <Link href="/painel" className="btn">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      <MedievalFrame variant="celtic" page>
        <header className="page-header" style={{ paddingBottom: "1rem" }}>
          <p className="eyebrow">Criação de personagem</p>
          <h1 className="display-lg">Nova ficha Eldarin</h1>
          <p className="lead">
            Sete passos guiados — nome, raça, classe, atributos e mais. Para campanha, crie dentro
            da mesa pelo hub da aventura.
          </p>
        </header>
        <CharacterCreationWizard slotsLeft={slotsLeft} />
      </MedievalFrame>
    </div>
  );
}
