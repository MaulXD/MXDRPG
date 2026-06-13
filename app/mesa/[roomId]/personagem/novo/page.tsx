import { redirect } from "next/navigation";
import { getRoom } from "@/lib/room/store";

type Props = { params: Promise<{ roomId: string }> };

/** Abre o wizard de criação embutido na mesa (sem sair da sessão). */
export default async function MesaNovoPersonagemRedirect({ params }: Props) {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) {
    redirect("/mesas");
  }
  redirect(`/mesa/${encodeURIComponent(roomId)}?criar=personagem`);
}
