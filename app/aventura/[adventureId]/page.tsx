import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageAdventure, isAdventureMember } from "@/lib/auth/adventure-access";
import { getSession } from "@/lib/auth/session";
import {
  countCharactersForUserInAdventure,
  listCharactersForUserInAdventure,
  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
} from "@/lib/character/characters";
import { ensureAdventureMembership, getAdventure } from "@/lib/adventure/store";
import { getRoom } from "@/lib/room/store";

type Props = {
  params: Promise<{ adventureId: string }>;
  searchParams: Promise<{ vinculado?: string }>;
};

export default async function AventuraHubPage({ params, searchParams }: Props) {
  const { adventureId } = await params;
  const { vinculado } = await searchParams;
  const justJoined = vinculado === "1";
  const session = await getSession();
  if (!session) redirect(`/entrar?redirect=/aventura/${adventureId}`);

  let adventure = await getAdventure(adventureId);
  if (!adventure) {
    return (
      <div className="page-wrap">
        <p>Aventura não encontrada.</p>
        <Link href="/painel">Painel</Link>
      </div>
    );
  }

  if (
    !isAdventureMember(adventure, session.user.id) &&
    adventureId !== "demo"
  ) {
    adventure = (await ensureAdventureMembership(adventureId, session.user.id)) ?? adventure;
  }

  if (!isAdventureMember(adventure, session.user.id) && adventureId !== "demo") {
    return (
      <div className="page-wrap">
        <p>Entre na aventura com o código de convite no painel.</p>
        <Link href="/painel" className="btn">
          Painel
        </Link>
      </div>
    );
  }

  const isGm = canManageAdventure(adventure, session.user);
  const room = await getRoom(adventure.primaryRoomId);
  const myChars = await listCharactersForUserInAdventure(session.user.id, adventureId);
  const charCount = await countCharactersForUserInAdventure(session.user.id, adventureId);
  const canCreateChar = charCount < MAX_CHARACTERS_PER_USER_PER_ADVENTURE;

  return (
    <div className="page-wrap" style={{ maxWidth: 720, paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <p className="eyebrow">
          {isGm ? "Sua aventura · mestre" : "Aventura · você está vinculado"}
        </p>
        <h1 className="display-lg">{adventure.name}</h1>
        {adventure.synopsis ? <p className="lead">{adventure.synopsis}</p> : null}
      </header>

      {justJoined && !isGm ? (
        <div
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            borderColor: "var(--accent)",
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}
        >
          Você está <strong>vinculado</strong> a esta aventura. Ela permanece no seu painel — use a
          mesma conta para voltar, criar sua ficha e entrar na mesa.
        </div>
      ) : null}

      <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Código de convite
        </p>
        <code style={{ fontSize: "1.1rem" }}>{adventure.inviteCode}</code>
      </div>

      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Mesa ao vivo</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
          Tabuleiro hex, combate, mapa e chat da sessão ficam na mesa. Os registros de rolagens e
          eventos são o histórico do chat da mesa.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <Link href={`/mesa/${adventure.primaryRoomId}`} className="btn">
            Abrir mesa
          </Link>
          {isGm ? (
            <Link href={`/aventura/${adventureId}/configurar`} className="btn btn-secondary">
              Configurar mesa e regras
            </Link>
          ) : null}
        </div>
        {room ? (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
            {room.chat.length} mensagens no registro · rev. {room.revision}
          </p>
        ) : null}
      </section>

      <section className="glass-panel" style={{ padding: "1.25rem" }}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Fichas desta aventura</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
          Personagens criados aqui só existem nesta campanha (máx. {MAX_CHARACTERS_PER_USER_PER_ADVENTURE}{" "}
          por jogador).
        </p>

        {myChars.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
            {myChars.map((c) => (
              <li key={c.id} style={{ marginBottom: "0.35rem" }}>
                <Link href={`/personagem/${c.id}`}>
                  {c.name}
                </Link>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {" "}
                  · nv {c.identity.nivel} {c.identity.classe}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--text-muted)", margin: "0 0 1rem" }}>
            Você ainda não tem personagem nesta aventura.
          </p>
        )}

        {canCreateChar ? (
          <Link href={`/aventura/${adventureId}/personagem/novo`} className="btn btn-secondary">
            Criar personagem
          </Link>
        ) : null}
      </section>

      <Link href="/painel" className="btn btn-ghost" style={{ marginTop: "1.25rem" }}>
        Voltar ao painel
      </Link>
    </div>
  );
}
