import { redirect } from "next/navigation";
import { getRoom } from "@/lib/room/store";

type Props = { params: Promise<{ roomId: string }> };

export default async function ConfigurarMesaRedirect({ params }: Props) {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  const adventureId = room?.adventureId ?? roomId;
  redirect(`/aventura/${adventureId}/configurar`);
}
