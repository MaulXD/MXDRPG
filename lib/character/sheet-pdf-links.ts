import type { SheetSkillId } from "@/lib/character/sheet-skills";

export type PdfLinkAction = "roll" | "open";

export type SheetPdfDeepLinkParams = {
  characterId: string;
  action: PdfLinkAction;
  skill?: SheetSkillId;
};

export function buildSheetPdfLinkUrl(opts: {
  baseUrl: string;
  roomId?: string;
  characterId: string;
  action: PdfLinkAction;
  skill?: SheetSkillId;
}): string {
  const params = new URLSearchParams();
  params.set("sheetPdf", "1");
  params.set("characterId", opts.characterId);
  params.set("action", opts.action);
  if (opts.skill) params.set("skill", opts.skill);

  const base = opts.baseUrl.replace(/\/$/, "");
  const path = opts.roomId
    ? `/mesa/${encodeURIComponent(opts.roomId)}`
    : `/personagem/${encodeURIComponent(opts.characterId)}`;
  return `${base}${path}?${params.toString()}`;
}

export function parsePdfLinkAction(value: string): SheetPdfDeepLinkParams | null {
  if (value.startsWith("roll:")) {
    const skill = value.slice(5) as SheetSkillId;
    return { characterId: "", action: "roll", skill };
  }
  if (value === "open") return { characterId: "", action: "open" };
  return null;
}

const VALID_SKILLS = new Set<SheetSkillId>([
  "percepcao",
  "investigacao",
  "religiao",
  "iniciativa",
  "furtividade",
  "atletismo",
]);

export function parseSheetPdfSearchParams(
  search: string
): SheetPdfDeepLinkParams | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("sheetPdf") !== "1") return null;

  const characterId = params.get("characterId")?.trim();
  if (!characterId) return null;

  const actionRaw = params.get("action")?.trim();
  const action: PdfLinkAction = actionRaw === "open" ? "open" : "roll";

  const skillRaw = params.get("skill")?.trim();
  const skill =
    skillRaw && VALID_SKILLS.has(skillRaw as SheetSkillId)
      ? (skillRaw as SheetSkillId)
      : undefined;

  return { characterId, action, skill };
}

export function stripSheetPdfSearchParams(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  params.delete("sheetPdf");
  params.delete("characterId");
  params.delete("action");
  params.delete("skill");
  const next = params.toString();
  return next ? `?${next}` : "";
}
