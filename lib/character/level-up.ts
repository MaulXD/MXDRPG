import type { CharacterSheet } from "@/lib/character/types";
import type { AttributeKey } from "@/lib/character/rules";
import {
  attributeMod,
  classLevelFeatures,
  computeCulinary,
  getClass,
  hpGainOnLevelUp,
  hpMaxFor,
  paMaxFor,
  proficiencyBonus,
  racialMilestone,
  SUBCLASS_PATH_LABEL,
  TALENT_LEVELS,
} from "@/lib/character/rules";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import {
  ASCENSION_LEVEL,
  getAscension,
  getAvailableTalents,
  getSubclassTrack,
  getTalentForLevel,
  parseCharacterTalents,
  validateTalentChoice,
  type CharacterTalent,
} from "@/lib/character/subclass-tracks";
import { applyPerLevelBonuses, perLevelGainLines } from "@/lib/character/per-level-gains";
import { syncCombatAbilitiesToInventory } from "@/lib/character/combat-inventory-sync";
import {
  canAdvanceLevel,
  formatXpProgress,
  MAX_LEVEL,
} from "@/lib/character/xp";

export type LevelUpChoices = {
  subclasse?: string;
  /** Humano nv4: +1 em dois atributos */
  asi?: Partial<Record<AttributeKey, number>>;
  /** id do talento na trilha de subclasse */
  talentoId?: string;
};

export type LevelUpRequirement =
  | { kind: "subclasse" }
  | { kind: "asi"; points: number }
  | { kind: "talento"; level: number; options: CharacterTalent[] }
  | { kind: "ascension"; name: string };

function ownedTalents(actor: CharacterSheet): CharacterTalent[] {
  return parseCharacterTalents(actor.identity.talentos);
}

/** Personagem sem vida — level-up não ressuscita. */
export function isCharacterDead(actor: CharacterSheet): boolean {
  return actor.resources.vida.value <= 0;
}

function hpValueAfterLevelUp(actor: CharacterSheet, newMax: number): number {
  if (isCharacterDead(actor)) return 0;
  return newMax;
}

export function canLevelUp(actor: CharacterSheet): boolean {
  const nivel = actor.identity.nivel;
  const xpTotal = actor.identity.xpTotal ?? 0;
  return canAdvanceLevel(nivel, xpTotal);
}

export function getLevelUpRequirements(actor: CharacterSheet): LevelUpRequirement[] {
  if (!canLevelUp(actor)) return [];
  const next = actor.identity.nivel + 1;
  const req: LevelUpRequirement[] = [];
  const owned = ownedTalents(actor);
  const track = getSubclassTrack(actor.identity.subclasse);

  if (next === 2 && !actor.identity.subclasse) {
    req.push({ kind: "subclasse" });
  }
  if (next === 4 && actor.identity.raca === "Humano") {
    req.push({ kind: "asi", points: 2 });
  }

  if (TALENT_LEVELS.includes(next as (typeof TALENT_LEVELS)[number])) {
    if (!track) {
      req.push({ kind: "subclasse" });
    } else {
      const options = getAvailableTalents(track, owned, next);
      const talent = getTalentForLevel(track, next);
      if (talent) {
        req.push({
          kind: "talento",
          level: next,
          options: options.map((t) => ({ level: t.level, id: t.id, name: t.name })),
        });
      }
    }
  }

  if (next === ASCENSION_LEVEL && track) {
    const asc = getAscension(track);
    if (asc) req.push({ kind: "ascension", name: asc.name });
  }

  return req;
}

export function validateLevelUpChoices(
  actor: CharacterSheet,
  choices: LevelUpChoices
): string | null {
  const reqs = getLevelUpRequirements(actor);
  const next = actor.identity.nivel + 1;
  const owned = ownedTalents(actor);

  for (const r of reqs) {
    if (r.kind === "subclasse" && !choices.subclasse && !actor.identity.subclasse) {
      return `Escolha um ${SUBCLASS_PATH_LABEL} (subclasse).`;
    }
    if (r.kind === "asi") {
      const total = Object.values(choices.asi ?? {}).reduce((s, v) => s + (v ?? 0), 0);
      if (total !== 2) return "Humano nv4: distribua +1 em dois atributos.";
    }
    if (r.kind === "talento") {
      if (!r.options.length) {
        return `Complete a trilha: falta talento nv ${r.level - 4} antes do nv ${r.level}.`;
      }
      if (!choices.talentoId) {
        const track = getSubclassTrack(choices.subclasse ?? actor.identity.subclasse);
        const needed = track ? getTalentForLevel(track, r.level) : null;
        if (needed?.requires) {
          const prev = track?.talents.find((t) => t.id === needed.requires);
          return `Escolha o talento nv ${r.level}${prev ? ` (${prev.name} → ${needed.name})` : ""}.`;
        }
        return `Escolha o talento do caminho (nv ${r.level}).`;
      }
      const err = validateTalentChoice(
        choices.subclasse ?? actor.identity.subclasse,
        owned,
        r.level,
        choices.talentoId
      );
      if (err) return err;
    }
  }

  if (choices.subclasse) {
    const cls = getClass(actor.identity.classe);
    if (cls && !cls.subclasses.includes(choices.subclasse)) {
      return "Subclasse inválida para esta classe.";
    }
  }

  if (choices.talentoId && next === ASCENSION_LEVEL) {
    return "Ascensão nv20 é automática — não escolha talento manual.";
  }

  return null;
}

export function previewLevelUp(actor: CharacterSheet, choices?: LevelUpChoices): string[] {
  if (!canLevelUp(actor)) {
    if (actor.identity.nivel >= MAX_LEVEL) return ["Nível máximo (20)."];
    return [`${formatXpProgress(actor.identity.nivel, actor.identity.xpTotal)} — falta XP`];
  }

  const next = actor.identity.nivel + 1;
  const conMod = attributeMod(actor.attributes.constituicao);
  const hpGain = hpGainOnLevelUp(actor.identity.classe, next, conMod);
  const lines = [
    `Nível ${next}`,
    `+${Math.max(1, hpGain)} HP (dado da classe + CON)`,
    isCharacterDead(actor)
      ? "Vida máxima sobe — personagem permanece morto/inconsciente"
      : "Cura total de vida",
    `Bônus de proficiência +${proficiencyBonus(next)}`,
  ];

  const oldPa = paMaxFor(actor.identity.nivel, actor.resources.pontosAcao.max);
  const newPa = paMaxFor(next, actor.resources.pontosAcao.max);
  if (newPa > oldPa) lines.push(`PA por turno: ${newPa}`);

  for (const f of classLevelFeatures(actor.identity.classe, next)) {
    lines.push(f);
  }

  for (const line of perLevelGainLines(actor, next)) {
    if (!lines.includes(line)) lines.push(line);
  }

  const sub = choices?.subclasse ?? actor.identity.subclasse;
  const track = getSubclassTrack(sub);
  if (next === 2 && track) lines.push(`${SUBCLASS_PATH_LABEL}: ${track.specialty}`);

  if (choices?.talentoId && track) {
    const t = track.talents.find((x) => x.id === choices.talentoId);
    if (t) lines.push(`Talento: ${t.name}`);
  }

  if (next === ASCENSION_LEVEL && track) {
    const asc = getAscension(track);
    if (asc) lines.push(`Ascensão: ${asc.name}`);
  }

  return lines;
}

export function levelUpPreview(actor: CharacterSheet): string {
  return previewLevelUp(actor).join(" · ");
}

export function applyLevelUp(actor: CharacterSheet, choices: LevelUpChoices = {}): CharacterSheet {
  if (!canLevelUp(actor)) return actor;

  const err = validateLevelUpChoices(actor, choices);
  if (err) throw new Error(err);

  const nivel = actor.identity.nivel + 1;
  let attributes = { ...actor.attributes };
  const subclasse = choices.subclasse ?? actor.identity.subclasse;
  const track = getSubclassTrack(subclasse);
  let talentos = [...ownedTalents(actor)];

  if (choices.asi) {
    for (const [k, v] of Object.entries(choices.asi) as [AttributeKey, number][]) {
      if (v) attributes[k] = Math.min(20, attributes[k] + v);
    }
  }

  if (choices.talentoId && track) {
    const t = track.talents.find((x) => x.id === choices.talentoId);
    if (t && t.kind === "talent") {
      talentos.push({ level: t.level, id: t.id, name: t.name });
    }
  }

  if (nivel === ASCENSION_LEVEL && track) {
    const asc = getAscension(track);
    if (asc && !talentos.some((t) => t.level === ASCENSION_LEVEL)) {
      talentos.push({ level: ASCENSION_LEVEL, id: asc.id, name: asc.name });
    }
  }

  const conMod = attributeMod(attributes.constituicao);
  const newMax = hpMaxFor(actor.identity.classe, nivel, conMod);
  const paMax = paMaxFor(nivel, actor.resources.pontosAcao.max);

  const culinary = computeCulinary(
    actor.identity.classe,
    actor.identity.raca,
    actor.identity.linhagem
  );
  if (nivel === 16 && actor.identity.raca === "Humano") {
    culinary.trinchar += 2;
    culinary.harmonizacao += 2;
    culinary.coccao += 2;
    culinary.estomagoDeFerro += 2;
  }

  const leveled = {
    ...actor,
    identity: {
      ...actor.identity,
      nivel,
      subclasse,
      talentos,
    },
    attributes,
    culinary,
    resources: {
      vida: { value: hpValueAfterLevelUp(actor, newMax), max: newMax },
      pontosAcao: { value: paMax, max: paMax },
    },
    tactical: {
      defesa: actor.armorLoadout?.entryId
        ? resolveActorDefesa({ ...actor, attributes })
        : 10 + attributeMod(attributes.destreza),
      iniciativa: actor.tactical.iniciativa ?? attributeMod(attributes.destreza),
    },
  };

  return syncCombatAbilitiesToInventory(applyPerLevelBonuses(leveled, nivel));
}
