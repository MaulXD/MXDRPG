import type { CharacterSheet, CharacterIdentity, CharacterAttributes } from "@/lib/character/types";
import type { AttributeKey } from "@/lib/character/rules";
import {
  attributeMod,
  computeCulinary,
  defaultAttributesForRace,
  getClass,
  getRace,
  hpMaxFor,
  paMaxFor,
} from "@/lib/character/rules";
import { normalizeCharacter } from "@/lib/character/normalize";
import { parseCharacterTalents } from "@/lib/character/subclass-tracks";

export type IdentityPatch = {
  raca?: string;
  classe?: string;
  subclasse?: string | null;
  linhagem?: string | null;
  antecedente?: string;
  attributes?: Partial<CharacterAttributes>;
  resetAttributes?: boolean;
};

export function applyIdentityPatch(actor: CharacterSheet, patch: IdentityPatch): CharacterSheet {
  const identity: CharacterIdentity = { ...actor.identity };

  if (patch.raca !== undefined) identity.raca = patch.raca;
  if (patch.classe !== undefined) identity.classe = patch.classe;
  if (patch.subclasse !== undefined) identity.subclasse = patch.subclasse;
  if (patch.linhagem !== undefined) identity.linhagem = patch.linhagem;
  if (patch.antecedente !== undefined) identity.antecedente = patch.antecedente;

  if (patch.classe && patch.classe !== actor.identity.classe) {
    const cls = getClass(patch.classe);
    if (cls && identity.subclasse && !cls.subclasses.includes(identity.subclasse)) {
      identity.subclasse = null;
      identity.talentos = [];
    }
  }

  if (patch.subclasse !== undefined && patch.subclasse !== actor.identity.subclasse) {
    identity.talentos = [];
  }

  let attributes = { ...actor.attributes };
  if (patch.resetAttributes) {
    attributes = defaultAttributesForRace(identity.raca, identity.linhagem);
  }
  if (patch.attributes) {
    for (const [k, v] of Object.entries(patch.attributes) as [AttributeKey, number][]) {
      if (typeof v === "number" && v >= 3 && v <= 20) attributes[k] = v;
    }
  }

  const conMod = attributeMod(attributes.constituicao);
  const hpMax = hpMaxFor(identity.classe, identity.nivel, conMod);
  const paMax = paMaxFor(identity.nivel, actor.resources.pontosAcao.max);
  const desMod = attributeMod(attributes.destreza);
  const culinary = computeCulinary(identity.classe, identity.raca, identity.linhagem);

  if (identity.nivel >= 16 && identity.raca === "Humano") {
    culinary.trinchar += 2;
    culinary.harmonizacao += 2;
    culinary.coccao += 2;
    culinary.estomagoDeFerro += 2;
  }

  return normalizeCharacter({
    ...actor,
    identity,
    attributes,
    culinary,
    resources: {
      vida: {
        max: hpMax,
        value: Math.min(actor.resources.vida.value, hpMax),
      },
      pontosAcao: {
        max: paMax,
        value: Math.min(actor.resources.pontosAcao.value, paMax),
      },
    },
    tactical: {
      defesa: 10 + desMod,
      iniciativa: desMod,
    },
  });
}

export function describeIdentity(actor: CharacterSheet): string[] {
  const race = getRace(actor.identity.raca);
  const cls = getClass(actor.identity.classe);
  const lines: string[] = [];

  if (cls) {
    lines.push(`${cls.id}: d${cls.hpDie} · ${cls.primary}`);
    lines.push(`Proficiências: ${cls.proficiencies}`);
    lines.push(`Dieta base: ${cls.dietBonus}`);
  }
  if (race) {
    lines.push(`Raça: ${race.traits.slice(0, 3).join(", ")}`);
    if (actor.identity.linhagem) lines.push(`Linhagem: ${actor.identity.linhagem}`);
  }
  if (actor.identity.subclasse) {
    lines.push(`Subclasse: ${actor.identity.subclasse}`);
  }
  return lines;
}
