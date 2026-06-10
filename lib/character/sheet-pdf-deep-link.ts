import { postRoomChat } from "@/hooks/useRoomSync";
import {
  parseSheetPdfSearchParams,
  stripSheetPdfSearchParams,
  type SheetPdfDeepLinkParams,
} from "@/lib/character/sheet-pdf-links";
import { resolveSheetSkillRoll, type SheetSkillId } from "@/lib/character/sheet-skills";
import type { CharacterSheet } from "@/lib/character/types";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import { canActOnCombatTurn } from "@/lib/combat/turn-guard";
import type { BattleToken } from "@/lib/vtt/types";

export function readSheetPdfDeepLinkFromLocation(): SheetPdfDeepLinkParams | null {
  if (typeof window === "undefined") return null;
  return parseSheetPdfSearchParams(window.location.search);
}

export function clearSheetPdfDeepLinkFromUrl(): void {
  if (typeof window === "undefined") return;
  const nextSearch = stripSheetPdfSearchParams(window.location.search);
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export async function postSheetSkillRoll(
  roomId: string,
  actor: CharacterSheet,
  skillId: SheetSkillId
): Promise<boolean> {
  const skill = resolveSheetSkillRoll(actor, skillId);
  if (!skill) return false;

  const label =
    skill.passive != null ? `${skill.def.label} (passiva ${skill.passive})` : skill.def.label;

  await postRoomChat(roomId, {
    kind: "roll",
    formula: skill.rollFormula,
    text: `${actor.name} — ${label}`,
  });
  return true;
}

export type SheetPdfDeepLinkContext = {
  roomId?: string;
  combat?: CombatTrack | null;
  tokens?: BattleToken[];
  actors?: Record<string, CharacterSheet>;
  bypassTurn?: boolean;
};

export async function handleSheetPdfDeepLink(
  params: SheetPdfDeepLinkParams,
  ctx: SheetPdfDeepLinkContext,
  opts: {
    openSheet: (characterId: string) => void;
    onRolled?: () => void;
  }
): Promise<void> {
  opts.openSheet(params.characterId);

  if (params.action !== "roll" || !params.skill || !ctx.roomId) return;

  const actor = ctx.actors?.[params.characterId];
  if (!actor) return;

  const token = ctx.tokens?.find((t) => t.linked && t.actorId === params.characterId);
  if (!token) return;

  const activeId = ctx.combat ? activeTokenId(ctx.combat) : null;
  const mayRoll = canActOnCombatTurn(token.id, {
    combat: ctx.combat,
    activeTokenId: activeId,
    bypassTurn: ctx.bypassTurn,
  });

  if (!mayRoll) return;

  await postSheetSkillRoll(ctx.roomId, actor, params.skill);
  opts.onRolled?.();
}
