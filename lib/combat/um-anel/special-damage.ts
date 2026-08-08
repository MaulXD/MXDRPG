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

/**
 * Quanto Aparar soma ao Bloqueio, por Proficiência (livro, §Aparar):
 * "+1 usando Machados e todas as armas de Briga, +2 usando Espadas, +3 usando
 * Lanças". Arcos não entram — Aparar é "qualquer arma de combate corpo a corpo".
 */
const PARRY_BY_PROFICIENCY: Record<TorCombatProficiencyId | "brawling", number> = {
  machados: 1,
  brawling: 1,
  espadas: 2,
  lancas: 3,
  arcos: 0,
};

export function heroParryBonus(proficiency: TorCombatProficiencyId | "brawling"): number {
  return PARRY_BY_PROFICIENCY[proficiency] ?? 0;
}

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
  /** Aparar — 1 ícone soma ao próprio Bloqueio pela rodada (só herói). */
  parry?: number;
  /** Investida de Escudo — 1 ícone e o alvo *perde (1d)* pela rodada (só herói com escudo). */
  shieldThrust?: number;
  /** Quebrar Escudo — 1 ícone tira o bônus de Bloqueio do escudo do alvo (só adversário). */
  breakShield?: number;
  /** Agarrar — 1 ícone prende o alvo (só adversário). */
  seize?: number;
  /**
   * Escapar de Agarrar — "heróis agarrados podem libertar-se gastando um ícone
   * de uma rolagem de ataque bem-sucedida". Não é Dano Especial, mas é gasto de
   * ícone e disputa os mesmos ícones, então mora aqui.
   */
  escape?: number;
};

export type TorSpecialDamageResolved = {
  heavyBlowUses: number;
  pierceUses: number;
  parryUses: number;
  shieldThrustUses: number;
  breakShieldUses: number;
  seizeUses: number;
  escapeUses: number;
  /** Resistência extra perdida pelo alvo. */
  extraEnduranceLoss: number;
  /** Soma ao resultado numérico do Dado de Proeza. */
  featDieBonus: number;
  /** Soma ao Bloqueio do atacante pela rodada (Aparar). */
  parryBonus: number;
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
  /** Bônus por uso de Aparar (0 quando a arma não apara, ex.: Arcos). */
  parryValue?: number;
  /** Investida de Escudo disponível: herói com escudo e FORÇA > Nível de Atributo do alvo. */
  canShieldThrust?: boolean;
  /** Quebrar Escudo disponível: o bloco lista a opção e o alvo tem escudo quebrável. */
  canBreakShield?: boolean;
  /** Agarrar disponível: o bloco lista a opção e o alvo ainda não está agarrado. */
  canSeize?: boolean;
  /** O atacante está agarrado e pode gastar 1 ícone para se libertar. */
  canEscape?: boolean;
}): TorSpecialDamageResolved {
  const available = Math.max(0, params.successIcons);
  const querer = (v: number | undefined) => Math.max(0, Math.floor(v ?? 0));

  let restante = available;
  /** Gasta o que foi pedido, até o que sobrou, e só se a opção estiver disponível. */
  const gastar = (pedido: number, disponivel: boolean, maximo = Infinity) => {
    if (!disponivel) return 0;
    const usos = Math.min(pedido, restante, maximo);
    restante -= usos;
    return usos;
  };

  /* Ordem de atendimento, quando os ícones não dão para tudo:
     1. Escapar — estar agarrado tranca o herói em Briga e postura Avançada; é a
        única opção que devolve o herói ao jogo;
     2. Perfurar — decide o Golpe Perfurante (pode levar um 9 a 10);
     3. Agarrar e Quebrar Escudo — mudam o estado do alvo além desta rodada;
     4. Aparar e Investida de Escudo — valem só a rodada;
     5. Golpe Pesado — só soma Resistência, então cede a vez. */
  const escapeUses = gastar(querer(params.plan?.escape), Boolean(params.canEscape), 1);
  const pierceUses = gastar(querer(params.plan?.pierce), (params.pierceValue ?? 0) > 0);
  const seizeUses = gastar(querer(params.plan?.seize), Boolean(params.canSeize), 1);
  const breakShieldUses = gastar(querer(params.plan?.breakShield), Boolean(params.canBreakShield), 1);
  const parryUses = gastar(querer(params.plan?.parry), (params.parryValue ?? 0) > 0);
  const shieldThrustUses = gastar(querer(params.plan?.shieldThrust), Boolean(params.canShieldThrust), 1);
  const heavyBlowUses = gastar(querer(params.plan?.heavyBlow), true);

  const heavyPerUse =
    Math.max(0, params.heavyBlowValue) +
    (params.twoHanded ? 1 : 0) +
    (params.steadyHand ? 1 : 0);
  const piercePerUse = params.pierceValue + (params.steadyHand ? 1 : 0);

  return {
    heavyBlowUses,
    pierceUses,
    parryUses,
    shieldThrustUses,
    breakShieldUses,
    seizeUses,
    escapeUses,
    extraEnduranceLoss: heavyBlowUses * heavyPerUse,
    featDieBonus: pierceUses * piercePerUse,
    parryBonus: parryUses * (params.parryValue ?? 0),
    iconsLeft: restante,
  };
}
