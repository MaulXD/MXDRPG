import detailsData from "@/data/character/subclass-track-details.json";
import type { SubclassTalent, SubclassTrack } from "@/lib/character/subclass-tracks";

type TalentDetail = { name: string; summary: string };
type TrackDetail = { dietDetail: string; talents: Record<string, TalentDetail> };

const DETAILS = detailsData.details as Record<string, TrackDetail>;

export function subclassSpecialtyTooltip(specialty: string): string {
  return `Especialidade: ${specialty}. Refeições Comum ou melhor com ingredientes desse tipo ativam a Dieta Marcial (nv. 2). Outras refeições mantêm só o bônus de dieta base da classe.`;
}

export function subclassDietTooltip(track: SubclassTrack): string {
  const detail = DETAILS[track.id]?.dietDetail;
  const body = detail ?? track.diet;
  return `Dieta Marcial (nv. 2, após Refeição Comum+): ${body}`;
}

export function subclassTalentTooltip(
  track: SubclassTrack,
  talent: SubclassTalent
): string {
  const row = DETAILS[track.id]?.talents?.[String(talent.level)];
  const chain =
    talent.requires && talent.kind !== "ascension"
      ? "Requer o talento anterior da trilha. "
      : "";

  if (row) {
    const label =
      talent.kind === "ascension"
        ? `Ascensão nv. 20 — ${row.name}`
        : `Nv. ${talent.level} — ${row.name}`;
    return `${chain}${label}: ${row.summary}`;
  }

  if (talent.kind === "ascension") {
    return `${chain}Ascensão nv. 20 — ${talent.name}. Capstone da subclasse; não substitui os talentos de nv. 4/8/12/16.`;
  }

  return `${chain}Talento de trilha nv. ${talent.level} — ${talent.name}. Escolha obrigatória na subida de nível (cadeia com pré-requisito).`;
}

export function subclassTrackIntroTooltip(): string {
  return "No nv. 2 escolha uma subclasse. Ganha a Dieta Marcial passiva. Nos nv. 4, 8, 12 e 16 escolhe 1 talento da trilha (cada um exige o anterior). No nv. 20 recebe a Ascensão.";
}
