import Link from "next/link";
import { redirect } from "next/navigation";
import { AdventureAccessPanel } from "@/components/adventure/AdventureAccessPanel";
import { MesaSetupClient } from "@/components/campaign/MesaSetupClient";
import { canManageAdventure } from "@/lib/auth/adventure-access";
import { getAdventure } from "@/lib/adventure/store";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { normalizeRoomSettings } from "@/lib/room/settings";
import { getRoom } from "@/lib/room/store";

type Props = { params: Promise<{ adventureId: string }> };

export default async function ConfigurarAventuraPage({ params }: Props) {
  const { adventureId } = await params;
  const session = await getSession();
  if (!session) redirect(signInPath(`/aventura/${adventureId}/configurar`));

  const adventure = await getAdventure(adventureId);
  if (!adventure) {
    return (
      <div className="page-wrap">
        <p>Aventura não encontrada.</p>
        <Link href="/painel">Painel</Link>
      </div>
    );
  }

  if (!canManageAdventure(adventure, session.user)) {
    return (
      <div className="page-wrap">
        <p>Só o mestre da aventura pode alterar as configurações.</p>
        <Link href={`/aventura/${adventureId}`} className="btn">
          Voltar
        </Link>
      </div>
    );
  }

  const room = await getRoom(adventure.primaryRoomId);
  if (!room) {
    return (
      <div className="page-wrap">
        <p>Mesa da aventura não encontrada.</p>
        <Link href="/painel">Painel</Link>
      </div>
    );
  }

  const settings = normalizeRoomSettings(room.settings);

  return (
    <div className="page-wrap" style={{ maxWidth: 640, paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <p className="eyebrow">Aventura · mestre</p>
        <h1 className="display-lg">Mesa: {adventure.name}</h1>
        <p className="lead">
          Nome da campanha, mapa, fog, visibilidade de HP dos monstros e convite. A capa da mesa pode ser
          alterada aqui pelo botão <strong>Alterar capa</strong>. A aventura também guarda as fichas dos
          jogadores.
        </p>
      </header>

      <AdventureAccessPanel adventureId={adventureId} accessMode={adventure.accessMode ?? "public"} />

      <div
        className="glass-panel"
        style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}
      >
        <MesaSetupClient
          roomId={adventure.primaryRoomId}
          roomName={adventure.name}
          inviteCode={adventure.inviteCode}
          settings={settings}
          scene={room.scene}
        />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
        <Link href={`/mesa/${adventure.primaryRoomId}`} className="btn">
          Abrir mesa ao vivo
        </Link>
        <Link href={`/aventura/${adventureId}`} className="btn btn-secondary">
          Hub da aventura
        </Link>
      </div>
    </div>
  );
}
