import {
  ATTRIBUTE_LABELS,
  CULINARY_LABELS,
  getClass,
  getRace,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import { religionDisplayName } from "@/lib/character/pantheon";
import { religionBonusTooltip } from "@/lib/character/religion-tooltips";
import { getAscension, getSubclassTrack } from "@/lib/character/subclass-tracks";
import {
  subclassDietTooltip,
  subclassSpecialtyTooltip,
  subclassTalentTooltip,
} from "@/lib/character/subclass-wizard-tooltips";
import type { SheetQuickSkill } from "@/lib/character/sheet-skills";
import type { CharacterIdentity } from "@/lib/character/types";
import { antecedenteMeta } from "@/lib/character/wizard-meta";
import {
  antecedenteGainDescription,
  classFeaturesAtLevelOne,
  classSurvivalPassiveTooltip,
  linhagemTraitLines,
  racialTraitDescription,
} from "@/lib/character/wizard-tooltips";

export type SheetTipContent = {
  title?: string;
  lines: string[];
};

function formatAttrBonus(bonus: Partial<Record<AttributeKey, number>>): string {
  const parts = Object.entries(bonus).map(
    ([k, v]) => `${ATTRIBUTE_LABELS[k as AttributeKey]} +${v}`
  );
  return parts.length ? parts.join(", ") : "";
}

function formatCulinaryBonus(raceId: string): string | null {
  const race = getRace(raceId);
  if (!race?.culinaryBonus) return null;
  const parts = Object.entries(race.culinaryBonus).map(
    ([k, v]) => `${CULINARY_LABELS[k as keyof typeof CULINARY_LABELS]} +${v}`
  );
  return parts.length ? `Sobrevivência: ${parts.join(", ")}` : null;
}

export function raceChipTip(identity: CharacterIdentity): SheetTipContent {
  const race = getRace(identity.raca);
  if (!race) {
    return { title: identity.raca, lines: ["Raça não encontrada no compêndio."] };
  }

  const lines: string[] = [];
  const attrParts = [
    race.fixedBonus ? formatAttrBonus(race.fixedBonus) : null,
    formatAttrBonus(race.attributeBonus),
  ].filter(Boolean);
  if (attrParts.length) lines.push(`Bônus: ${attrParts.join(" · ")}`);

  const culinary = formatCulinaryBonus(identity.raca);
  if (culinary) lines.push(culinary);

  for (const trait of race.traits) {
    const desc = racialTraitDescription(trait);
    lines.push(desc ? `${trait} — ${desc}` : trait);
  }

  if (identity.raca === "Meio-Humano" && identity.linhagem) {
    const lin = race.linhagens?.find((l) => l.id === identity.linhagem);
    if (lin) {
      lines.push("");
      lines.push(`${lin.id}:`);
      lines.push(formatAttrBonus(lin.attributeBonus));
      for (const tr of linhagemTraitLines(lin.trait)) {
        lines.push(`${tr.name} — ${tr.description}`);
      }
    }
  }

  return { title: identity.raca, lines };
}

export function classChipTip(classId: string): SheetTipContent {
  const cls = getClass(classId);
  if (!cls) {
    return { title: classId, lines: ["Classe não encontrada."] };
  }

  const lines: string[] = [
    `d${cls.hpDie} PV · Atributo principal: ${cls.primary}`,
    `Proficiências: ${cls.proficiencies}`,
  ];

  const passive = classSurvivalPassiveTooltip(classId);
  if (passive) lines.push(`Passivo nv 1: ${passive}`);

  for (const feat of classFeaturesAtLevelOne(classId).filter((f) => !f.startsWith("Proficiências:"))) {
    lines.push(feat);
  }

  return { title: cls.id, lines };
}

export function subclassChipTip(classId: string, subclass: string, nivel: number): SheetTipContent {
  const track = getSubclassTrack(subclass);
  if (!track) {
    return {
      title: subclass,
      lines: ["Caminho de Assimilação escolhido no nv 2. Trilha não encontrada no compêndio."],
    };
  }

  const lines: string[] = [
    subclassSpecialtyTooltip(track.specialty),
    subclassDietTooltip(track),
  ];

  const combatTalents = track.talents.filter((t) => t.kind === "talent");
  const unlocked = combatTalents.filter((t) => t.level <= nivel);
  if (unlocked.length) {
    lines.push("");
    lines.push(nivel >= 4 ? "Talentos desbloqueados:" : "Próximos talentos:");
    for (const t of unlocked.length ? unlocked : combatTalents.slice(0, 1)) {
      lines.push(subclassTalentTooltip(track, t));
    }
  }

  const ascension = getAscension(track);
  if (ascension) {
    lines.push("");
    lines.push(subclassTalentTooltip(track, ascension));
  }

  return { title: track.subclass, lines };
}

export function backgroundChipTip(antecedente: string): SheetTipContent {
  const meta = antecedenteMeta(antecedente);
  if (!meta) {
    return { title: antecedente, lines: ["Antecedente não catalogado."] };
  }

  const lines = [meta.summary, "", "Ganhos:"];
  for (const g of meta.gains) {
    lines.push(`• ${antecedenteGainDescription(g)}`);
  }

  return { title: meta.title, lines };
}

export function deityChipTip(religiao: string | null | undefined): SheetTipContent {
  if (!religiao) {
    return {
      title: "Sem Deus",
      lines: [
        "Personagem sem devotion ativa — sem bônus ou penalidades de panteão.",
        "Escolha uma divindade na criação ou edição para ganhar bônus de devoção.",
      ],
    };
  }

  const name = religionDisplayName(religiao);
  const lines = religionBonusTooltip(religiao).split("\n").slice(1);

  return { title: name, lines: lines.length ? lines : ["Bônus de devoção ativos."] };
}

const SKILL_USE: Record<string, string> = {
  percepcao:
    "Notar perigos, emboscadas, criaturas ocultas, pistas visuais ou sonoras no ambiente.",
  investigacao:
    "Examinar uma cena, procurar compartimentos secretos, armadilhas ou deduzir o que aconteceu.",
  iniciativa:
    "Determina a ordem de turno no combate — quem age primeiro quando a luta começa.",
  furtividade:
    "Mover-se sem ser detectado, esconder-se ou surpreender inimigos desprevenidos.",
  atletismo:
    "Escalar, saltar, nadar, empurrar ou agarrar — força física bruta em situações de perigo.",
};

export function skillQuickActionTip(skill: SheetQuickSkill, nivel: number): SheetTipContent {
  const use = SKILL_USE[skill.def.id] ?? `Teste de ${skill.def.label}.`;
  const attrLabel = ATTRIBUTE_LABELS[skill.def.attr];
  const prof = skill.trained && skill.def.id !== "iniciativa" ? proficiencyBonus(nivel) : 0;
  const attrMod = skill.mod - prof;
  const attrSign = attrMod >= 0 ? `+${attrMod}` : `${attrMod}`;

  const lines: string[] = [use, ""];

  if (skill.def.id === "iniciativa") {
    lines.push(`Modificador: ${skill.display} (DES + bônus de classe/equipamento)`);
  } else {
    const parts = [`${attrLabel} ${attrSign}`];
    if (skill.trained) parts.push(`prof +${prof}`);
    lines.push(`Composição: ${parts.join(" · ")}`);
    lines.push(
      skill.trained
        ? "Perícia treinada (+ proficiência)"
        : "Sem treino — usa só o modificador de atributo"
    );
  }

  if (skill.passive != null) {
    lines.push("");
    lines.push(`Passiva ${skill.passive} (10 + modificador) — CD que NPCs precisam superar para passar despercebido.`);
    lines.push(`Rolagem ativa: ${skill.rollFormula}`);
  } else {
    lines.push(`Rolagem: ${skill.rollFormula}`);
  }

  return { title: skill.def.label, lines };
}
