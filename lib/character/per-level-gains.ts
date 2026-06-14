import { culinaryLabel, culinarySkillForLevel } from "@/lib/character/class-scales";
import type { CharacterSheet } from "@/lib/character/types";
import { racialMilestone, TALENT_LEVELS } from "@/lib/character/rules";
import { getSubclassTrack } from "@/lib/character/subclass-tracks";

/** Pequeno bônus mecânico a cada nível (além de HP / talentos nv 4·8·12·16). */
export function applyPerLevelBonuses(actor: CharacterSheet, newLevel: number): CharacterSheet {
  const culinary = { ...actor.culinary };
  const tactical = { ...actor.tactical };

  const skill = culinarySkillForLevel(actor.identity.classe, newLevel);
  culinary[skill] = (culinary[skill] ?? 0) + 1;

  if (newLevel % 3 === 0) {
    tactical.iniciativa = (tactical.iniciativa ?? 0) + 1;
  }

  return {
    ...actor,
    culinary,
    tactical,
  };
}

/** Texto exibido no preview de level-up para o nv alvo. */
export function perLevelGainLines(actor: CharacterSheet, newLevel: number): string[] {
  const lines: string[] = [];
  const skill = culinarySkillForLevel(actor.identity.classe, newLevel);
  lines.push(`Progressão: +1 ${culinaryLabel(skill)}`);

  if (newLevel % 3 === 0) {
    lines.push("Progressão: +1 Iniciativa");
  }

  const racial = racialMilestone(actor.identity.raca, newLevel, actor.identity.linhagem);
  if (racial) lines.push(`Marco racial: ${racial}`);

  const drip = racialDripPerk(actor.identity.raca, newLevel, actor.identity.linhagem);
  if (drip) lines.push(`Traço racial: ${drip}`);

  const sub = actor.identity.subclasse;
  const track = getSubclassTrack(sub);
  if (track && newLevel >= 3 && newLevel <= 19 && newLevel !== 2) {
    if (!TALENT_LEVELS.includes(newLevel as (typeof TALENT_LEVELS)[number])) {
      lines.push(`Caminho (${track.subclass}): ${subclassDripPerk(track.specialty, newLevel)}`);
    }
  }

  return lines;
}

function racialDripPerk(raceId: string, level: number, linhagem?: string | null): string | null {
  if (racialMilestone(raceId, level, linhagem)) return null;
  const drips: Record<string, string[]> = {
    Humano: [
      "Versatilidade +1",
      "Percepção apurada",
      "Resistência +1",
      "Foco tático",
      "Determinação crescente",
    ],
    Elfo: ["Harmonia +1", "Visão aguçada", "Transe leve", "Purificação menor"],
    Anão: ["Forja +1", "Resistência térmica menor", "Estômago de pedra", "Instinto de mina"],
    Halfling: ["Sorte menor", "Passo leve", "Faro atento", "Reflexo rápido"],
    Gnomo: ["Alquimia +1", "Pocião menor", "Foco arcano", "Estabilidade"],
    "Meio-Humano": ["Instinto bestial", "Olfato +1", "Corpo resistente", "Linhagem desperta"],
  };
  const list = raceId === "Meio-Humano" && linhagem ? drips["Meio-Humano"] : drips[raceId];
  if (!list?.length) return null;
  return list[(level - 1) % list.length] ?? null;
}

function subclassDripPerk(specialty: string, level: number): string {
  const templates = [
    `Afinidade com ${specialty.toLowerCase()} — bônus situacional`,
    "Domínio tático do caminho",
    "Refinamento da assimilação",
    "Técnica do especialista",
    "Instinto do caminho",
  ];
  return templates[(level - 1) % templates.length]!;
}
