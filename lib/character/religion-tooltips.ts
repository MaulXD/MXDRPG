import type { ReligionDef } from "@/lib/character/pantheon";
import { getReligion } from "@/lib/character/pantheon";

export function religionCardTooltip(r: ReligionDef): string {
  const lines = [
    `${r.name} — ${r.epithet}`,
    `Domínio: ${r.domain}`,
    `Símbolo: ${r.symbol}`,
    r.summary,
    "",
    "Bônus de devoção:",
    ...r.bonuses.map((b) => `• ${b}`),
  ];
  if (r.penalties?.length) {
    lines.push("", "Limitações:", ...r.penalties.map((p) => `• ${p}`));
  }
  if (r.favoredClasses?.length) {
    lines.push("", `Comum entre: ${r.favoredClasses.join(", ")}`);
  }
  return lines.join("\n");
}

export function religionBonusTooltip(id: string): string {
  const r = getReligion(id);
  if (!r) return "";
  return religionCardTooltip(r);
}

export function religionLoreSnippet(id: string): string {
  const r = getReligion(id);
  if (!r) return "";
  const cults = r.cults.length ? `Cultos: ${r.cults.join(" · ")}.` : "";
  const places = r.sacredPlaces?.length
    ? `Lugares sagrados: ${r.sacredPlaces.join(", ")}.`
    : "";
  return [r.lore, cults, places].filter(Boolean).join(" ");
}

export function religionSheetSummary(id: string): { title: string; bonuses: string[]; penalties: string[] } | null {
  const r = getReligion(id);
  if (!r) return null;
  return {
    title: religionDisplayShort(r),
    bonuses: r.bonuses,
    penalties: r.penalties ?? [],
  };
}

function religionDisplayShort(r: ReligionDef): string {
  if (r.tier === "secular") return r.name;
  return `${r.name} (${r.epithet})`;
}
