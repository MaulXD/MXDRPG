import Link from "next/link";
import { MesaWorkspace } from "@/components/vtt/MesaWorkspace";
import { canAccessRoom, canManageRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { getRoom } from "@/lib/room/store";

type Props = { params: Promise<{ roomId: string }> };

export default async function MesaRoomPage({ params }: Props) {
  const { roomId } = await params;
  const session = await getSession();
  const room = getRoom(roomId);

  if (!room) {
    return (
      <div className="page-wrap">
        <p>
          Sala <code>{roomId}</code> não existe.
        </p>
        <Link href="/painel">Voltar ao painel</Link>
      </div>
    );
  }

  if (!canAccessRoom(room, session?.user ?? null)) {
    return (
      <div className="page-wrap">
        <p>Esta mesa é privada. Peça o código de convite ao mestre (dono da mesa).</p>
        {!session ? (
          <Link href={`/entrar?redirect=/mesa/${roomId}`} className="btn" style={{ marginTop: "1rem" }}>
            Entrar para participar
          </Link>
        ) : (
          <Link href="/painel" className="btn" style={{ marginTop: "1rem" }}>
            Inserir código no painel
          </Link>
        )}
      </div>
    );
  }

  const isRoomGm = canManageRoom(room, session?.user ?? null);
  const role = session?.user.role ?? null;
  const packs = getVisiblePacks(role, { isRoomGm });
  const compendium = Object.fromEntries(
    packs.map((p) => [
      p.id,
      getPackEntries(p.id, { role, isRoomGm }),
    ])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  const canEdit = Boolean(session);
  const defaultActorId =
    Object.values(room.actors).find((a) => a.ownerId === session?.user.id)?.id ??
    Object.keys(room.actors)[0];

  return (
    <div className="vtt-page">
      {isRoomGm && (
        <div
          className="glass-panel"
          style={{
            margin: "0.5rem 1rem",
            padding: "0.5rem 0.85rem",
            fontSize: "0.85rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong>Mestre desta mesa</strong> — convide com código:{" "}
            <code>{room.inviteCode}</code>
          </span>
          <Link href="/painel" style={{ marginLeft: "auto" }}>
            Painel
          </Link>
        </div>
      )}
      <MesaWorkspace
        roomId={roomId}
        scene={room.scene}
        canEdit={canEdit}
        canControlCombat={isRoomGm}
        session={session?.user ?? null}
        compendium={compendium}
        packs={packs}
        defaultActorId={defaultActorId}
      />
    </div>
  );
}
