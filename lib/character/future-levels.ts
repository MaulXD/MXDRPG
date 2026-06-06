import type { CharacterSheet } from "@/lib/character/types";
import {
  classLevelFeatures,
  getClass,
  getRace,
  hpMaxFor,
  racialMilestone,
  TALENT_LEVELS,
  attributeMod,
} from "@/lib/character/rules";
import { perLevelGainLines } from "@/lib/character/per-level-gains";
import { getSubclassTrack } from "@/lib/character/subclass-tracks";

export type FutureLevelGain = {
  source: string;
  text: string;
};

export type FutureLevelEntry = {
  level: number;
  gains: FutureLevelGain[];
};

export function buildFutureLevelRoadmap(actor: CharacterSheet): FutureLevelEntry[] {
  const current = actor.identity.nivel;
  if (current >= 20) return [];

  const { raca, classe, linhagem, subclasse } = actor.identity;
  const cls = getClass(classe);
  const race = getRace(raca);
  const track = getSubclassTrack(subclasse);
  const entries: FutureLevelEntry[] = [];

  for (let lv = current + 1; lv <= 20; lv++) {
    const gains: FutureLevelGain[] = [];

    if (cls) {
      const conMod = attributeMod(actor.attributes.constituicao);
      const nextHp = hpMaxFor(classe, lv, conMod);
      const curHp = hpMaxFor(classe, current, conMod);
      const delta = nextHp - curHp;
      if (delta > 0) {
        gains.push({
          source: "Progressão",
          text: `+${delta} HP máximo (total ${nextHp})`,
        });
      }
    }

    for (const line of perLevelGainLines(actor, lv)) {
      if (line.toLowerCase().includes("dieta") || line.toLowerCase().includes("culinár")) continue;
      const source = line.startsWith("Marco racial")
        ? "Raça"
        : line.startsWith("Traço racial")
          ? "Raça"
          : line.startsWith("Caminho (")
            ? track?.subclass ?? "Subclasse"
            : line.startsWith("Progressão")
              ? "Progressão"
              : classe;
      gains.push({ source, text: line });
    }

    for (const f of classLevelFeatures(classe, lv)) {
      if (f.startsWith("Dieta base:")) continue;
      if (gains.some((g) => g.text === f)) continue;
      gains.push({ source: classe, text: f });
    }

    if (track) {
      if (lv === 2 && subclasse) {
        gains.push({ source: track.subclass, text: `Assimilação: ${track.specialty}` });
      }
      for (const t of track.talents) {
        if (t.level !== lv) continue;
        gains.push({
          source: track.subclass,
          text:
            t.kind === "ascension"
              ? `Ascensão nv20 — ${t.name}`
              : `Talento nv${lv} — ${t.name}`,
        });
      }
    } else if (race && Object.keys(race.milestones).length > 0 && lv >= 4) {
      const ms = racialMilestone(raca, lv, linhagem);
      if (!ms && !gains.some((g) => g.source === "Raça")) {
        gains.push({
          source: "Raça",
          text: "Aprimoramento racial menor (traço de progressão)",
        });
      }
    }

    if (!gains.length) {
      gains.push({ source: "Progressão", text: "Aprimoramento geral de especialização" });
    }

    entries.push({ level: lv, gains });
  }

  return entries;
}

/** Marcos raciais ainda não alcançados (para resumo rápido). */
export function upcomingRacialMilestones(actor: CharacterSheet): Array<{ level: number; name: string }> {
  const current = actor.identity.nivel;
  const race = getRace(actor.identity.raca);
  if (!race) return [];

  const milestones =
    actor.identity.raca === "Meio-Humano" && actor.identity.linhagem
      ? race.linhagens?.find((l) => l.id === actor.identity.linhagem)?.milestones ?? {}
      : race.milestones;

  return Object.entries(milestones)
    .map(([lvl, name]) => ({ level: Number(lvl), name }))
    .filter((m) => m.level > current)
    .sort((a, b) => a.level - b.level);
}

export function isTalentLevel(level: number): boolean {
  return TALENT_LEVELS.includes(level as (typeof TALENT_LEVELS)[number]);
}
