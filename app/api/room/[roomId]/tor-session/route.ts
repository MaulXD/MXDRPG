import { NextResponse } from "next/server";
import { requireRoomManage } from "@/lib/auth/authorize-room";
import { patchTorSession } from "@/lib/room/handlers/tor-session";
import type { TorSessionPatch } from "@/lib/combat/um-anel/session-state";

type Params = { params: Promise<{ roomId: string }> };

/**
 * Grava o estado de sessão do Um Anel (Jornada, Conselho, Fase de Companhia).
 *
 * Só o Mestre — `requireRoomManage`. A leitura é pelo snapshot da sala, que já
 * entrega `torSession` a todos os jogadores.
 *
 * A validação de forma acontece em `normalizeTorSession`, dentro do handler:
 * o corpo chega como JSON não confiável e cada campo é recortado lá (faixas,
 * enums, tamanho de lista). Aqui só distinguimos "não mexi" (campo ausente) de
 * "quero limpar" (`null`) — sem isso não haveria como encerrar uma jornada.
 */
export async function PATCH(req: Request, { params }: Params) {
  const { roomId } = await params;
  const auth = await requireRoomManage(roomId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const patch: TorSessionPatch = {};
  // `in` e não truthiness: `null` é significativo (apaga o trecho).
  if ("journey" in body) patch.journey = body.journey as TorSessionPatch["journey"];
  if ("council" in body) patch.council = body.council as TorSessionPatch["council"];
  if ("fellowship" in body) patch.fellowship = body.fellowship as TorSessionPatch["fellowship"];

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para salvar" }, { status: 400 });
  }

  const snapshot = await patchTorSession(roomId, auth.user, patch);
  if (!snapshot) {
    return NextResponse.json(
      { error: "Não foi possível salvar — mesa não é do Um Anel ou sem permissão" },
      { status: 400 }
    );
  }

  return NextResponse.json({ snapshot });
}
