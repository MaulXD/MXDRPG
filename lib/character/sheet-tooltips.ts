import {
  ATTRIBUTE_LABELS,
  CULINARY_LABELS,
  getClass,
  getRace,
  proficiencyBonus,
  type AttributeKey,
  type CulinaryKey,
} from "@/lib/character/rules";
import { formatXpProgressDetail, MAX_LEVEL, xpToNextLevel } from "@/lib/character/xp";
import { religionDisplayName } from "@/lib/character/pantheon";
import { religionBonusTooltip } from "@/lib/character/religion-tooltips";
import { getAscension, getSubclassTrack } from "@/lib/character/subclass-tracks";
import {
  subclassDietTooltip,
  subclassSpecialtyTooltip,
  subclassTalentTooltip,
} from "@/lib/character/subclass-wizard-tooltips";
import type { SheetQuickSkill, SheetSavingThrow } from "@/lib/character/sheet-skills";
import type { CharacterIdentity } from "@/lib/character/types";
import { entryTooltipText } from "@/lib/compendium/format";
import type { CompendiumEntry } from "@/lib/compendium/types";
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

const ATTRIBUTE_USE: Record<AttributeKey, string> = {
  forca: "Força bruta — empurrar, agarrar, escalar e ataques corpo a corpo.",
  destreza: "Agilidade — reflexos, furtividade, iniciativa e ataques à distância.",
  constituicao: "Vigor — resistência a venenos, fadiga e sustentação de PV.",
  inteligencia: "Raciocínio — magia arcana, investigação e conhecimento.",
  sabedoria: "Instinto — percepção, magia divina e resistir ilusões.",
  carisma: "Presença — persuasão, intimidação e magia carismática.",
};

const SAVE_USE: Record<AttributeKey, string> = {
  forca: "Resistir empurrão, agarrão, quedas e efeitos que exigem força física.",
  destreza: "Esquivar áreas, armadilhas, explosões e efeitos de reflexo.",
  constituicao: "Aguentar venenos, doenças, exaustão e dano direto ao corpo.",
  inteligencia: "Resistir ilusões, confusão mental e manipulação arcana.",
  sabedoria: "Resistir medo, possessão, encantamento e efeitos divinos sutis.",
  carisma: "Manter a vontade contra dominação, banimento e efeitos sociais mágicos.",
};

const SKILL_USE: Record<string, string> = {
  percepcao:
    "Notar perigos, emboscadas, criaturas ocultas, pistas visuais ou sonoras no ambiente.",
  investigacao:
    "Examinar uma cena, procurar compartimentos secretos, armadilhas ou deduzir o que aconteceu.",
  religiao:
    "Conhecimento sobre deuses, rituais, símbolos sagrados e tradições do panteão.",
  iniciativa:
    "Determina a ordem de turno no combate — quem age primeiro quando a luta começa.",
  furtividade:
    "Mover-se sem ser detectado, esconder-se ou surpreender inimigos desprevenidos.",
  atletismo:
    "Escalar, saltar, nadar, empurrar ou agarrar — força física bruta em situações de perigo.",
};

const CULINARY_USE: Record<CulinaryKey, string> = {
  trinchar:
    "Extração e processamento — desossa, limpeza de caça/pesca e aproveitamento de ingredientes brutos.",
  harmonizacao:
    "Forrageio e identificação — reconhecer plantas, frutos e recursos comestíveis no ambiente.",
  coccao:
    "Fabricação culinária — preparar refeições de viagem, caldos e itens de campo que sustentam o grupo.",
  estomagoDeFerro:
    "Fortitude alimentar — resistir venenos, comida estragada, jejum e efeitos de ingestão.",
};

export function levelTip(nivel: number, xpTotal: number): SheetTipContent {
  const xpDetail = formatXpProgressDetail(nivel, xpTotal);
  const lines = [
    `Nível ${nivel} de ${MAX_LEVEL} — define proficiência, PV, talentos e marcos de classe.`,
    xpDetail.secondary,
  ];
  if (nivel < MAX_LEVEL) {
    const falta = xpToNextLevel(nivel, xpTotal);
    if (falta > 0) {
      lines.push(`Próximo nível em ${falta.toLocaleString("pt-BR")} XP.`);
    } else {
      lines.push("XP suficiente — suba de nível na edição da ficha.");
    }
  }
  return { title: `Nível ${nivel}`, lines };
}

export function xpBarTip(nivel: number, xpTotal: number): SheetTipContent {
  const d = formatXpProgressDetail(nivel, xpTotal);
  const lines = [d.secondary];
  if (d.barLabel) lines.push(d.barLabel);
  if (nivel < MAX_LEVEL) {
    lines.push("XP vem de combates e marcos — o mestre distribui o pool da cena.");
  }
  return { title: "Experiência", lines: lines.filter(Boolean) };
}

export function culinaryTip(key: CulinaryKey, value: number): SheetTipContent {
  const label = CULINARY_LABELS[key];
  return {
    title: label,
    lines: [
      CULINARY_USE[key],
      "",
      `Bônus +${value} somado a testes de sobrevivência e culinária desta área.`,
      "Valores vêm da classe, raça e marcos raciais.",
    ],
  };
}

export function attributeTip(
  attr: AttributeKey,
  score: number,
  mod: number
): SheetTipContent {
  const sign = mod >= 0 ? `+${mod}` : `${mod}`;
  return {
    title: ATTRIBUTE_LABELS[attr],
    lines: [
      ATTRIBUTE_USE[attr],
      "",
      `Valor ${score} · modificador ${sign}`,
      "Modificador entra em perícias, salvaguardas e ataques ligados ao atributo.",
    ],
  };
}

export function savingThrowTip(save: SheetSavingThrow, nivel: number): SheetTipContent {
  const prof = save.trained ? proficiencyBonus(nivel) : 0;
  const base = save.mod - prof;
  const baseSign = base >= 0 ? `+${base}` : `${base}`;
  const lines: string[] = [
    SAVE_USE[save.attr],
    "",
    save.trained
      ? `Composição: ${save.label} ${baseSign} · prof +${prof}`
      : `Composição: ${save.label} ${baseSign} (sem proficiência de classe)`,
    `Total: ${save.display} · rolagem 1d20${save.mod >= 0 ? `+${save.mod}` : save.mod}`,
  ];
  if (save.trained) {
    lines.push("Proficiente — sua classe treina esta salvaguarda.");
  }
  return { title: `Salvaguarda de ${save.label}`, lines };
}

export function combatStatTip(
  kind: "iniciativa" | "movement" | "prof" | "ca" | "hp" | "pa",
  values: { iniciativa?: number; walk?: number; run?: number; prof?: number; ca?: number; hp?: string; pa?: string }
): SheetTipContent {
  switch (kind) {
    case "iniciativa":
      return {
        title: "Iniciativa",
        lines: [
          "Define sua posição na ordem de turno quando o combate começa.",
          `Modificador atual: ${values.iniciativa! >= 0 ? `+${values.iniciativa}` : values.iniciativa}`,
          "Baseado em DES, bônus de classe e equipamento.",
        ],
      };
    case "movement":
      return {
        title: "Deslocamento",
        lines: [
          `Caminhada ${values.walk} cél. · corrida ${values.run} cél. por turno.`,
          "Movimento gasta PA conforme as regras da mesa.",
          "Terreno difícil ou efeitos podem reduzir o deslocamento.",
        ],
      };
    case "prof":
      return {
        title: "Proficiência",
        lines: [
          `Bônus +${values.prof} somado a perícias e salvaguardas treinadas.`,
          "Escala com o nível do personagem.",
        ],
      };
    case "ca":
      return {
        title: "Classe de armadura",
        lines: [
          `CA ${values.ca} — dificuldade para acertar você com ataques.`,
          "Armadura, DES, escudo e talentos alteram este valor.",
        ],
      };
    case "hp":
      return {
        title: "Pontos de vida",
        lines: [
          `Reserva atual: ${values.hp}.`,
          "Ao chegar a 0 PV você fica inconsciente ou derrotado.",
        ],
      };
    case "pa":
      return {
        title: "Pontos de ação",
        lines: [
          `Disponíveis: ${values.pa}.`,
          "Gastos em ataques, magias, habilidades e movimento tático.",
          "Recarregam no início do seu turno (até o máximo da ficha).",
        ],
      };
  }
}

export function compendiumEntryTip(entry: CompendiumEntry): SheetTipContent {
  const text = entryTooltipText(entry.system, entry.type, entry.name);
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return { title: entry.name, lines: lines.length ? lines : ["Sem descrição no compêndio."] };
}

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
