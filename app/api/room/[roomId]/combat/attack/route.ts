import { NextResponse } from "next/server";
import { assertTokenControl, chatRoleForUser } from "@/lib/auth/authorize-room";
import { canBypassCombatTurn, canManageRoom } from "@/lib/auth/room-access";
import { effectiveBypassTurn } from "@/lib/combat/turn-guard";
import { getSession } from "@/lib/auth/session";
import { safeMutationDeltaResponse } from "@/lib/room/mutation-response";
import { toSnapshot } from "@/lib/room/internal/registry";
import { executeRoomAttack, executeRoomTorAttack, getRoom } from "@/lib/room/store";
import type { ChatMessage } from "@/lib/room/chat";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  attackerTokenId?: string;
  defenderTokenId?: string;
  defenderTokenIds?: string[];
  actionPack?: "armas" | "magias" | "habilidades";
  actionEntryId?: string;
  bypassTurn?: boolean;
  channelExtraPa?: number;
  /** O Um Anel — arma equipada (herói) ou ação do adversário. */
  torWeaponId?: string;
  torActionId?: string;
  /** O Um Anel — Mestre gasta 1 de Ódio/Resolução pro adversário ganhar (1d). */
  torSpendHate?: boolean;
  /** O Um Anel — ícones de Sucesso declarados pra Dano Especial. */
  torSpecialDamage?: Record<string, unknown>;
  /** O Um Anel — gasta 1 de Esperança na rolagem; Inspirado dobra. */
  torSpendHope?: boolean;
  torInspired?: boolean;
};

/** Campos aceitos no plano — o resto do corpo é ignorado. */
const SPECIAL_DAMAGE_KEYS = [
  "heavyBlow",
  "pierce",
  "parry",
  "shieldThrust",
  "breakShield",
  "seize",
  "escape",
] as const;

/** Recorta o plano de Dano Especial: o corpo da requisição não é confiável. */
function sanitizeSpecialDamage(raw: Body["torSpecialDamage"]) {
  if (!raw || typeof raw !== "object") return undefined;
  const clamp = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(6, Math.max(0, Math.floor(v))) : 0;
  const plan: Record<string, number> = {};
  let total = 0;
  for (const k of SPECIAL_DAMAGE_KEYS) {
    const n = clamp(raw[k]);
    if (n > 0) {
      plan[k] = n;
      total += n;
    }
  }
  return total > 0 ? plan : undefined;
}

function authorFromSession(
  session: Awaited<ReturnType<typeof getSession>>,
  room: Awaited<ReturnType<typeof getRoom>>
) {
  if (session && room) {
    return {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: chatRoleForUser(room, session.user),
    };
  }
  if (session) {
    return {
      authorId: session.user.id,
      authorName: session.user.nickname?.trim() || "Jogador",
      authorRole: "jogador" as const,
    };
  }
  return {
    authorId: "guest",
    authorName: "Visitante",
    authorRole: "guest" as const,
  };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    const body = (await req.json()) as Body;

    const attackerTokenId = body.attackerTokenId?.trim();
    const defenderTokenIds = body.defenderTokenIds?.map((id) => id.trim()).filter(Boolean);
    const defenderTokenId = body.defenderTokenId?.trim();

    if (!attackerTokenId) {
      return NextResponse.json({ error: "Conjurador inválido" }, { status: 400 });
    }
    if (!defenderTokenIds?.length && !defenderTokenId) {
      return NextResponse.json({ error: "Alvo inválido" }, { status: 400 });
    }

    const room = await getRoom(roomId, { skipAutoPass: true });
    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const author = authorFromSession(session, room);

    const attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
    const ctrl = assertTokenControl(room, session?.user ?? null, attacker);
    if (ctrl) {
      return NextResponse.json({ error: ctrl.error }, { status: ctrl.status });
    }

    const canBypass = canBypassCombatTurn(room, session?.user ?? null);
    const bypassTurn = Boolean(body.bypassTurn && attacker && effectiveBypassTurn(attacker, canBypass));

    const beforeSnap = toSnapshot(room);

    // O Um Anel nunca passa pelo motor d20/CA do Eldarin — dispatch antes de
    // qualquer lógica abaixo (early return), ver plano da Fase 4.
    const result =
      room.rpgSystemId === "um-anel"
        ? await executeRoomTorAttack(roomId, attackerTokenId, defenderTokenId ?? defenderTokenIds![0]!, author, {
            weaponId: body.torWeaponId?.trim(),
            actionId: body.torActionId?.trim(),
            // Gasto de Ódio/Resolução é ato do Mestre — só vale pra quem
            // gerencia a mesa. Sem isso um jogador esvaziaria o Ódio do
            // adversário chamando a rota direto. NÃO usar canBypassCombatTurn
            // aqui: hoje é um stub que devolve false sempre, e o gasto nunca
            // funcionaria.
            spendHate: body.torSpendHate === true && canManageRoom(room, session?.user ?? null),
            specialDamage: sanitizeSpecialDamage(body.torSpecialDamage),
            spendHope: body.torSpendHope === true,
            inspired: body.torInspired === true,
            room,
          })
        : await executeRoomAttack(
            roomId,
            attackerTokenId,
            defenderTokenId ?? defenderTokenIds![0]!,
            author,
            {
              packId: body.actionPack,
              entryId: body.actionEntryId?.trim(),
              bypassTurn,
              channelExtraPa: body.channelExtraPa,
              defenderTokenIds: defenderTokenIds?.length ? defenderTokenIds : undefined,
              room,
            }
          );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      safeMutationDeltaResponse(beforeSnap, result.snapshot, room, session?.user ?? null)
    );
  } catch (e) {
    console.error("[attack] erro interno:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro interno no ataque" },
      { status: 500 }
    );
  }
}
