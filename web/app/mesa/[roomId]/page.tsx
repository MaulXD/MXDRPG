import { MesaWorkspace } from "@/components/vtt/MesaWorkspace";
import { DEMO_SCENE } from "@/lib/vtt/demo-scene";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";

type Props = { params: Promise<{ roomId: string }> };

export default async function MesaRoomPage({ params }: Props) {
  const { roomId } = await params;
  const session = await getSession();

  if (roomId !== "demo") {
    return (
      <div className="page-wrap">
        <p>
          {" "}
          Sala <code>{roomId}</code> ainda não existe. Use a demo por enquanto.
        </p>
        <a href="/mesa/demo">Ir para demo</a>
      </div>
    );
  }

  const canEdit =
    !session ||
    session.user.role === "admin" ||
    session.user.role === "mestre" ||
    session.user.role === "jogador";

  const canControlCombat =
    session?.user.role === "admin" || session?.user.role === "mestre";

  const role = session?.user.role ?? null;
  const packs = getVisiblePacks(role);
  const compendium = Object.fromEntries(
    packs.map((p) => [p.id, getPackEntries(p.id, { role })])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  return (
    <div className="vtt-page">
      <MesaWorkspace
        roomId={roomId}
        scene={DEMO_SCENE}
        canEdit={canEdit}
        canControlCombat={canControlCombat}
        session={session?.user ?? null}
        compendium={compendium}
        packs={packs}
      />
    </div>
  );
}
