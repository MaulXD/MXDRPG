import detailsData from "@/data/character/subclass-track-details.json";
import type { SubclassTalent, SubclassTrack } from "@/lib/character/subclass-tracks";

type TalentDetail = { name: string; summary: string };
type TrackDetail = { dietDetail: string; talents: Record<string, TalentDetail> };

const DETAILS = detailsData.details as Record<string, TrackDetail>;

export function subclassSpecialtyTooltip(specialty: string): string {
  return `Especialidade: ${specialty}. Assimilar espécimes desse tipo ativa o passivo do Caminho de Assimilação (nv. 2). Outros espécimes mantêm só o bônus passivo da classe.`;
}

export function subclassDietTooltip(track: SubclassTrack): string {
  const detail = DETAILS[track.id]?.dietDetail;
  const body = detail ?? track.diet;
  return `Caminho de Assimilação (nv. 2, passivo): ${body}`;
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
  return "No nv. 2 escolha um Caminho de Assimilação (subclasse). Ganha o passivo de sobrevivência do caminho. Nos nv. 4, 8, 12 e 16 escolhe 1 talento de combate da trilha. No nv. 20 recebe a Ascensão.";
}
