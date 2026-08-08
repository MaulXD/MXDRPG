import type { TorCombatProficiencyId } from "@/lib/character/um-anel/types";

/**
 * Dano Especial — gasto de ícones de Sucesso (ᛥ) de um ataque bem-sucedido.
 *
 * São DUAS listas diferentes, e confundi-las é fácil porque compartilham dois
 * nomes:
 *
 * - **herói** (06-fases-de-aventura-combate.md §Dano Especial): Golpe Pesado,
 *   Aparar, Perfurar, Investida de Escudo;
 * - **adversário** (08-mestre-e-adversarios.md §Opções de Dano Especial):
 *   Quebrar Escudo, Golpe Pesado, Perfurar, Agarrar.
 *
 * Aqui entram só as duas que se resolvem INTEIRAS dentro do ataque — Golpe
 * Pesado e Perfurar. Aparar (muda o Bloqueio pela rodada), Investida de Escudo
 * (*perde (1d)* pela rodada), Quebrar Escudo (tira o bônus do escudo) e Agarrar
 * (prende o alvo em Briga) precisam de estado que dura a rodada ou de mudança na
 * ficha, e ficam de fora até existir onde guardar.
 *
 * Não confundir **Perfurar** (Dano Especial: gasta ícone, soma no Dado de
 * Proeza) com **Golpe Perfurante** (resultado 10 ou Runa que obriga o Teste de
 * Proteção). São coisas distintas com nomes parecidos — e Perfurar existe
 * justamente para poder *provocar* um Golpe Perfurante empurrando um 9 para 10.
 */

/** Quanto Perfurar soma ao Dado de Proeza, por Proficiência (livro, §Perfurar). */
const PIERCE_BY_PROFICIENCY: Partial<Record<TorCombatProficiencyId, number>> = {
  espadas: 1,
  arcos: 2,
  lancas: 3,
};

/** +2 fixo — o bloco do adversário não distingue arma (08-mestre-e-adversarios.md). */
export const ADVERSARY_PIERCE_BONUS = 2;

/**
 * Perfurar só existe para Arcos, Lanças e Espadas. Machados e Briga ficam de
 * fora: o livro nomeia as três Proficiências, e devolver 0 aqui é o que impede
 * um Grande Machado de ganhar um bônus que ele não tem.
 */
export function heroPierceBonus(proficiency: TorCombatProficiencyId | "brawling"): number {
  if (proficiency === "brawling") return 0;
  return PIERCE_BY_PROFICIENCY[proficiency] ?? 0;
}

export type TorSpecialDamagePlan = {
  /** Ícones que o atacante quer gastar em Golpe Pesado. */
  heavyBlow?: number;
  /** Ícones que o atacante quer gastar em Perfurar. */
  pierce?: number;
};

export type TorSpecialDamageResolved = {
  heavyBlowUses: number;
  pierceUses: number;
  /** Resistência extra perdida pelo alvo. */
  extraEnduranceLoss: number;
  /** Soma ao resultado numérico do Dado de Proeza. */
  featDieBonus: number;
  /** Ícones que sobraram sem uso. */
  iconsLeft: number;
};

/**
 * Distribui os ícones disponíveis pelo plano declarado.
 *
 * O plano vem ANTES da rolagem porque o ataque é uma requisição só — o jogador
 * declara "quero gastar até N em Golpe Pesado" e o motor gasta o que os dados
 * realmente derem. Pedir mais ícones do que saiu não é erro: usa o que há.
 *
 * A ordem de atendimento é Perfurar primeiro. Perfurar pode levar um 9 a 10 e
 * disparar o Golpe Perfurante — a decisão mais consequente do gasto —, então ele
 * não pode ficar sem ícone porque o Golpe Pesado, que só soma Resistência,
 * consumiu todos.
 */
export function resolveTorSpecialDamage(params: {
  successIcons: number;
  plan?: TorSpecialDamagePlan;
  /** Bônus por uso de Golpe Pesado: FORÇA do herói ou Nível de Atributo do adversário. */
  heavyBlowValue: number;
  /** +1 por uso, com arma de 2 mãos (só herói). */
  twoHanded?: boolean;
  /** Bônus por uso de Perfurar. */
  pierceValue: number;
  /** Virtude Mão Firme: +1 na FORÇA do Golpe Pesado e +1 no Dado de Proeza ao Perfurar. */
  steadyHand?: boolean;
}): TorSpecialDamageResolved {
  const available = Math.max(0, params.successIcons);
  const wantPierce = Math.max(0, Math.floor(params.plan?.pierce ?? 0));
  const wantHeavy = Math.max(0, Math.floor(params.plan?.heavyBlow ?? 0));

  // Perfurar só consome ícone se a arma realmente perfura; senão o ícone volta
  // pro bolo em vez de sumir.
  const pierceUses = params.pierceValue > 0 ? Math.min(wantPierce, available) : 0;
  const heavyBlowUses = Math.min(wantHeavy, available - pierceUses);

  const heavyPerUse =
    Math.max(0, params.heavyBlowValue) +
    (params.twoHanded ? 1 : 0) +
    (params.steadyHand ? 1 : 0);
  const piercePerUse = params.pierceValue + (params.steadyHand ? 1 : 0);

  return {
    heavyBlowUses,
    pierceUses,
    extraEnduranceLoss: heavyBlowUses * heavyPerUse,
    featDieBonus: pierceUses * piercePerUse,
    iconsLeft: available - pierceUses - heavyBlowUses,
  };
}
