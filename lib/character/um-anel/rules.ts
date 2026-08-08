import { ARMOUR_BY_ID, CULTURE_BY_ID, SHIELD_BY_ID, WEAPON_BY_ID } from "./data";
import type {
  TorArmourLoadout,
  TorAttributes,
  TorCombatProficiencyRatings,
  TorCultureId,
  TorWarGearItem,
} from "./types";
import type { TorWeaponDef } from "./data";

/** NA (Número-Alvo) de um Atributo = 20 - valor do Atributo (Core Rules p.29). */
export function attributeTN(score: number): number {
  return 20 - score;
}

/**
 * Desfavorecido pela Sombra — condição SEPARADA de Arrasado.
 *
 * O livro trata as duas em parágrafos distintos (02-resolucao-de-acoes.md,
 * "Conditions" e o box "Ill-favoured Player-heroes"):
 *
 * - **Arrasado**: Sombra ≥ Esperança **atual**. Efeito único — o Olho de Sauron
 *   vira falha automática. Não faz rolar dois Dados de Proeza.
 * - **Desfavorecido**: Sombra ≥ Esperança **máxima**. Este sim rola dois Dados
 *   de Proeza e fica com o PIOR, em todas as rolagens.
 *
 * Tratar Arrasado como Desfavorecido aplica as duas penalidades de uma vez. Já
 * foi corrigido no Teste de Proteção (resolve-attack.ts) e nas rolagens de
 * Perícia/Proficiência (dice.ts) — este helper existe pra não haver uma
 * terceira cópia da fórmula divergindo.
 *
 * Cicatrizes de Sombra contam como Sombra normal para todos os efeitos.
 */
export function isTorIllFavouredByShadow(params: {
  shadow: number;
  shadowScars: number;
  hopeMax: number;
}): boolean {
  return params.shadow + params.shadowScars >= params.hopeMax;
}

/**
 * Graduação de um Ataque de Briga — desarmado, adaga, cacete, porrete ou arma
 * improvisada.
 *
 * Livro (quadro "Ataques de Briga", em `04-caracteristicas.md` e
 * `09-starter-set-regras-condensadas.md`): "role dados iguais à sua Proficiência
 * de Combate **mais alta**, mas *perca (1d)*".
 *
 * NÃO é zero. Brigar depende do treinamento marcial do herói: quem tem Espadas 3
 * se defende melhor de mãos vazias que quem nunca pegou arma. Zerar aqui deixava
 * o herói rolando só o Dado de Proeza, que sozinho vai no máximo a 10 e por isso
 * nunca alcança um NA de FORÇA típico (18 + Bloqueio) — a chance de acerto caía a
 * zero fora da Runa de Gandalf, e o herói também perdia qualquer chance de ícone
 * de Sucesso (logo, de Dano Especial).
 */
export function torBrawlingRank(proficiencies: TorCombatProficiencyRatings): number {
  const values = Object.values(proficiencies).filter((v) => Number.isFinite(v));
  const highest = values.length > 0 ? Math.max(...values) : 0;
  // O "perca (1d)" não pode virar rank negativo (02-resolucao-de-acoes.md:
  // penalidades descem "até um mínimo de zero Dados de Sucesso").
  return Math.max(0, highest - 1);
}

/**
 * Bônus FIXOS que Virtudes iniciais somam às estatísticas derivadas.
 *
 * O livro manda anotar a derivada já com o efeito da Virtude — as fichas do
 * Starter Set dizem "já contado no total" em cada uma delas
 * (11-personagens-exemplo.md). Antes a Virtude era gravada só como id numa lista
 * e nada somava o efeito: herói criado com Confiança ficava com Esperança máxima
 * 2 abaixo do livro, e o limiar de Desfavorecido (que usa hopeMax) saía errado
 * junto.
 *
 * Das Virtudes iniciais, só as três de valor fixo entram aqui. Proeza reduz o NA
 * de um Atributo, Maestria dá Perícias Favorecidas e Mão Firme age no Dano
 * Especial — nenhuma é estatística derivada.
 *
 * As Virtudes **Culturais** que dizem literalmente "Aumente em 1 ponto seu valor
 * máximo de Esperança" entram pelo mesmo motivo (05-valor-e-sabedoria.md). Alto
 * Destino também dá +2 de Esperança máxima, mas só *depois* de a Virtude salvar
 * o herói de uma Ferida mortal — é condicional e por isso fica de fora; somá-la
 * na criação daria o bônus antes do gatilho.
 */
const CULTURAL_HOPE_MAX_PLUS_1 = [
  "beleza-das-estrelas",
  "elbereth-gilthoniel",
  "espirito-indomavel",
  "poney-de-bri",
];

export function torVirtueDerivedBonus(virtueIds: readonly string[]): {
  enduranceMax: number;
  hopeMax: number;
  parry: number;
} {
  const has = (id: string) => virtueIds.includes(id);
  const culturalHope = CULTURAL_HOPE_MAX_PLUS_1.filter(has).length;
  return {
    enduranceMax: has("robustez") ? 2 : 0,
    hopeMax: (has("confianca") ? 2 : 0) + culturalHope,
    parry: has("agilidade-de-aparar") ? 1 : 0,
  };
}

export function computeDerivedStats(
  cultureId: TorCultureId,
  attributes: TorAttributes
): { enduranceMax: number; hopeMax: number; parry: number } {
  const culture = CULTURE_BY_ID[cultureId];
  return {
    enduranceMax: attributes.forca + culture.enduranceBonus,
    hopeMax: attributes.coracao + culture.hopeBonus,
    parry: attributes.argucia + culture.parryBonus,
  };
}

function parseLoadValue(load: number): number {
  return Number.isFinite(load) ? load : 0;
}

/** Carga total de Equipamento de Guerra + armadura/elmo/escudo carregados. */
export function computeLoad(
  warGear: TorWarGearItem[],
  armour: TorArmourLoadout,
  cultureId: TorCultureId
): number {
  const culture = CULTURE_BY_ID[cultureId];
  let total = 0;

  for (const item of warGear) {
    const weapon = WEAPON_BY_ID[item.weaponId];
    if (weapon) total += parseLoadValue(weapon.load);
  }

  if (armour.armourId) {
    const armourDef = ARMOUR_BY_ID[armour.armourId];
    if (armourDef) {
      const isDwarf = cultureId === "anoes";
      const load = parseLoadValue(armourDef.load);
      total += isDwarf ? Math.ceil(load / 2) : load;
    }
  }
  if (armour.helm) {
    const helmLoad = parseLoadValue(ARMOUR_BY_ID.elmo.load);
    total += cultureId === "anoes" ? Math.ceil(helmLoad / 2) : helmLoad;
  }
  if (armour.shieldId) {
    const shieldDef = SHIELD_BY_ID[armour.shieldId];
    if (shieldDef) total += parseLoadValue(shieldDef.load);
  }

  return total;
}

export function shieldParryBonus(shieldId?: string | null): number {
  if (!shieldId) return 0;
  return SHIELD_BY_ID[shieldId]?.parryModifier ?? 0;
}

function parseProtectionDice(value: string | undefined): number {
  const match = value?.match(/(\d+)d/);
  return match ? Number(match[1]) : 0;
}

/** Nº de Dados de Proteção (armadura + elmo) pro teste de Golpe Perfurante. */
export function computeProtectionDice(armour: TorArmourLoadout): number {
  let total = 0;
  if (armour.armourId) total += parseProtectionDice(ARMOUR_BY_ID[armour.armourId]?.protection);
  if (armour.helm) total += parseProtectionDice(ARMOUR_BY_ID.elmo.protection);
  return total;
}

/**
 * Ferimento (Injury) da arma pra TN do teste de Golpe Perfurante. `null` = arma
 * não pode causar Golpe Perfurante (ex.: Desarmado). Algumas armas têm valores
 * diferentes por empunhadura ("16 (1m) / 18 (2m)") — escolhe conforme `twoHanded`.
 */
export function resolveWeaponInjury(weapon: TorWeaponDef, twoHanded?: boolean): number | null {
  if (weapon.injury == null) return null;
  const dual = weapon.injury.match(/(\d+)\s*\(1m\)\s*\/\s*(\d+)\s*\(2m\)/);
  if (dual) return Number(dual[twoHanded ? 2 : 1]);
  const plain = weapon.injury.match(/^\d+$/);
  if (plain) return Number(weapon.injury);
  return null;
}
