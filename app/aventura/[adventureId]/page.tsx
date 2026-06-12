import Link from "next/link";

import { redirect } from "next/navigation";

import { canManageAdventure, isAdventureMember } from "@/lib/auth/adventure-access";

import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

import {

  canRestoreAdventure,

  isAdventureDeleted,

} from "@/lib/adventure/lifecycle";

import {

  listCharactersForUserInAdventure,

  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,

} from "@/lib/character/characters";

import { ensureAdventureMembership, getAdventure, joinAdventureByInvite } from "@/lib/adventure/store";

import { getRoom } from "@/lib/room/store";

import type { RoomActor } from "@/lib/room/types";
import { AdventureCoverManager } from "@/components/adventure/AdventureCoverManager";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { normalizeRoomSettings } from "@/lib/room/settings";



type Props = {

  params: Promise<{ adventureId: string }>;

  searchParams: Promise<{
    vinculado?: string;
    personagem?: string;
    char?: string;
    mesa?: string;
    invite?: string;
  }>;

};



function playerActors(actors: Record<string, RoomActor>): RoomActor[] {

  return Object.values(actors)

    .filter((a) => !a.gmAuthored)

    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

}



export default async function AventuraHubPage({ params, searchParams }: Props) {

  const { adventureId } = await params;

  const {
    vinculado,
    personagem,
    char: newCharId,
    mesa: mesaFromQuery,
    invite: inviteParam,
  } = await searchParams;
  const inviteCode = inviteParam?.trim() || null;

  const justJoined = vinculado === "1";

  const personagemCriado = personagem === "criado";

  const session = await getSession();

  if (!session) redirect(signInPath(`/aventura/${adventureId}`));



  let adventure = await getAdventure(adventureId);

  if (!adventure) {

    return (

      <div className="page-wrap">

        <p>Mesa não encontrada ou prazo de restauração expirou.</p>

        <Link href="/eldarin">Suas mesas</Link>

      </div>

    );

  }



  const isGm = canManageAdventure(adventure, session.user);



  if (isAdventureDeleted(adventure)) {

    if (!isGm || !canRestoreAdventure(adventure)) {

      return (

        <div className="page-wrap">

          <p>Esta mesa foi encerrada pelo mestre.</p>

          <Link href="/eldarin" className="btn">

            Voltar às mesas

          </Link>

        </div>

      );

    }

    return (

      <div className="page-wrap" style={{ maxWidth: 560, paddingTop: "2rem" }}>

        <h1 className="display-lg">{adventure.name}</h1>

        <p className="lead">Mesa na lixeira — restaure em até 30 dias para reativar.</p>

        <Link href="/eldarin" className="btn">

          Restaurar em Suas mesas

        </Link>

      </div>

    );

  }



  if (
    !isAdventureMember(adventure, session.user.id, session.user.clerkId) &&
    inviteCode
  ) {
    const joined = await joinAdventureByInvite(inviteCode, session.user.id);
    if (joined) adventure = joined;
  }

  if (
    !isAdventureMember(adventure, session.user.id, session.user.clerkId) &&
    adventureId !== "demo"
  ) {
    adventure = (await ensureAdventureMembership(adventureId, session.user.id)) ?? adventure;
  }

  if (!isAdventureMember(adventure, session.user.id, session.user.clerkId) && adventureId !== "demo") {
    return (
      <div className="page-wrap">
        <p>Entre na mesa com o código de convite.</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Use o link do mestre (com <code>?invite=</code>) ou cole o código em Suas mesas.
        </p>
        <Link href="/eldarin" className="btn">
          Suas mesas
        </Link>
      </div>
    );
  }



  let room = await getRoom(adventure.primaryRoomId);
  if (!room && adventure.primaryRoomId) {
    const { getAdventure: reloadAdv } = await import("@/lib/adventure/store");
    const fresh = await reloadAdv(adventureId);
    if (fresh) room = await getRoom(fresh.primaryRoomId);
  }

  let myChars: Awaited<ReturnType<typeof listCharactersForUserInAdventure>> = [];

  try {

    myChars = await listCharactersForUserInAdventure(session.user.id, adventureId);

  } catch (e) {

    console.error("[aventura] falha ao listar fichas:", e);

  }

  const charCount = myChars.length;

  const canCreateChar = charCount < MAX_CHARACTERS_PER_USER_PER_ADVENTURE;

  const allPlayerChars = room ? playerActors(room.actors) : [];

  const mesaId = mesaFromQuery ?? adventure.primaryRoomId;



  return (

    <div className="page-wrap" style={{ maxWidth: 720, paddingTop: "1.5rem", paddingBottom: "3rem" }}>

      <MedievalFrame variant="parchment" page>

      <header className="page-header" style={{ paddingBottom: "1rem" }}>

        <p className="eyebrow">

          <Link href="/eldarin" style={{ color: "var(--text-muted)" }}>

            ← Mesas Eldarin

          </Link>

          {" · "}

          {isGm ? "Visão do mestre" : "Sua mesa"}

        </p>

        <h1 className="display-lg">{adventure.name}</h1>

        {adventure.synopsis ? <p className="lead">{adventure.synopsis}</p> : null}

      </header>



      {personagemCriado ? (

        <div

          className="glass-panel"

          style={{

            padding: "1rem 1.25rem",

            marginBottom: "1rem",

            borderColor: "var(--accent-success, var(--accent))",

            fontSize: "0.9rem",

            lineHeight: 1.5,

          }}

        >

          <strong>Personagem criado.</strong>{" "}

          {newCharId ? (

            <Link href={`/personagem/${newCharId}`}>Abrir ficha</Link>

          ) : (

            "Veja na lista abaixo"

          )}{" "}

          ou{" "}

          <Link href={`/mesa/${mesaId}`} className="btn btn-sm" style={{ marginTop: "0.5rem" }}>

            Entrar na sala HEX

          </Link>

        </div>

      ) : null}



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

          Você ingressou nesta mesa. Ela permanece salva em{" "}

          <Link href="/eldarin">Suas mesas</Link> — crie seu personagem e entre na sala HEX.

        </div>

      ) : null}



      {!isGm ? (

        <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>

          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Sala de jogo (HEX)</h2>

          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>

            Tabuleiro ao vivo: tokens, combate, mapa e chat da sessão.

          </p>

          <Link href={`/mesa/${adventure.primaryRoomId}`} className="btn">

            Entrar na sala HEX

          </Link>

        </section>

      ) : null}



      {isGm ? (

        <>

          {room ? (
            <AdventureCoverManager
              roomId={adventure.primaryRoomId}
              settings={normalizeRoomSettings(room.settings)}
            />
          ) : null}

          <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>

            <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>

              Visão geral · convite

            </p>

            <code style={{ fontSize: "1.1rem" }}>{adventure.inviteCode}</code>

            {room ? (

              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>

                {room.chat.length} registros no chat · {allPlayerChars.length} fichas de jogadores

              </p>

            ) : null}

          </div>



          <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>

            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Fichas dos jogadores</h2>

            {allPlayerChars.length > 0 ? (

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>

                {allPlayerChars.map((a) => (

                  <li key={a.id} style={{ marginBottom: "0.35rem" }}>

                    <Link href={`/personagem/${a.id}`}>{a.name}</Link>

                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>

                      {" "}

                      · nv {a.identity?.nivel ?? "?"} {a.identity?.classe ?? ""}

                    </span>

                  </li>

                ))}

              </ul>

            ) : (

              <p style={{ color: "var(--text-muted)", margin: "0 0 1rem" }}>

                Nenhuma ficha de jogador ainda — eles criam na sala HEX ou aqui.

              </p>

            )}

          </section>



          <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>

            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Sala HEX (mestre)</h2>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>

              <Link href={`/mesa/${adventure.primaryRoomId}`} className="btn">

                Abrir sala HEX

              </Link>

              <Link href={`/aventura/${adventureId}/configurar`} className="btn btn-secondary">

                Configurar mesa

              </Link>

            </div>

          </section>

        </>

      ) : null}



      <section className="glass-panel" style={{ padding: "1.25rem" }}>

        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>

          {isGm ? "Seu personagem (mestre)" : "Seus personagens"}

        </h2>

        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>

          Máx. {MAX_CHARACTERS_PER_USER_PER_ADVENTURE} por jogador nesta mesa. Crie na sala HEX ou aqui.

        </p>



        {myChars.length > 0 ? (

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>

            {myChars.map((c) => (

              <li key={c.id} style={{ marginBottom: "0.35rem" }}>

                <Link href={`/personagem/${c.id}`}>{c.name}</Link>

                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>

                  {" "}

                  · nv {c.identity?.nivel ?? "?"} {c.identity?.classe ?? ""}

                </span>

              </li>

            ))}

          </ul>

        ) : (

          <p style={{ color: "var(--text-muted)", margin: "0 0 1rem" }}>

            Você ainda não tem personagem nesta mesa.

          </p>

        )}



        {canCreateChar ? (

          <Link href={`/aventura/${adventureId}/personagem/novo`} className="btn btn-secondary">

            Criar personagem

          </Link>

        ) : null}

      </section>



      <Link href="/eldarin" className="btn btn-ghost" style={{ marginTop: "1.25rem" }}>

        Voltar às mesas

      </Link>

      </MedievalFrame>

    </div>

  );

}

