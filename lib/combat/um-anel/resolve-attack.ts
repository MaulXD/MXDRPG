import { rollTorCheck, formatTorRollMessage, type TorRollOutcome } from "@/lib/character/um-anel/dice";
import {
  attackRankWithStance,
  canAttackFromStance,
  canBeTargetedBy,
  incomingRankWithStance,
  TOR_DEFAULT_STANCE,
  torStanceLabel,
  type TorStanceId,
} from "@/lib/combat/um-anel/stances";

/**
 * Resolução de ataque tático do Um Anel (livros/um-anel/06-fases-de-aventura-combate.md,
 * "Resolving Attacks"). Função pura — não sabe de BattleToken/TorCharacterSheet, só números,
 * pra ser testável isolada. O chamador (lib/room/handlers/tor-combat-attack.ts) resolve
 * quem é o atacante/defensor e monta este bundle.
 */

export type TorAttackParams = {
  attackerKind: "hero" | "adversary";
  /** Graduação da Proficiência de Combate usada no ataque (rank dos Dados de Sucesso). */
  attackerRank: number;
  /** Só kind:"hero" — TN de ataque = 20 - Força + Bloqueio do alvo. */
  attackerStrength?: number;
  attackerFavoured?: boolean;
  attackerIllFavoured?: boolean;
  attackerWeary?: boolean;
  attackerMiserable?: boolean;
  /** Bloqueio do alvo — TN puro quando o atacante é adversário. */
  defenderParry: number;
  weaponDamage: number;
  /** Ferimento (Injury) da arma — TN do teste de Proteção em caso de Golpe Perfurante. */
  weaponInjury: number;
  /** Desarmado não pode causar Golpe Perfurante (nota do livro). */
  weaponCanPierce?: boolean;
  defenderKind: "hero" | "adversary";
  defenderProtectionDice: number;
  /**
   * Exausto no momento do ataque. Precisa ser o estado **anterior** ao dano
   * deste golpe: "if the attack made the character Weary, the Protection Test
   * is made *before* the Weariness sets in" (livro, §Piercing Blows).
   */
  defenderWeary?: boolean;
  /** Arrasado — faz o Olho de Sauron virar falha automática. */
  defenderMiserable?: boolean;
  /**
   * Desfavorecido — condição SEPARADA de Arrasado, e pior: acontece quando a
   * Sombra alcança a Esperança **máxima**, ou por uma Falha que afete a rolagem
   * (livro §The Shadow e §Using Flaws). Estar Arrasado NÃO desfavorece por si.
   */
  defenderIllFavoured?: boolean;
  /** Só kind:"hero" — já tem 1 Ferida marcada (a próxima é fatal, sem rolar severidade). */
  defenderAlreadyWounded?: boolean;

  /* ── Posturas (D17) ──────────────────────────────────────────────────
     Adversários não escolhem postura (regra do livro: a mecânica retrata só o
     ponto de vista do herói), então estes campos são opcionais e caem em
     Aberta — que é neutra e não altera nada. */
  /** Postura do atacante, quando herói. */
  attackerStance?: TorStanceId;
  /** Postura do defensor, quando herói. */
  defenderStance?: TorStanceId;
  /** Ataque feito com arma à distância — decide Retaguarda e alcance. */
  attackIsRanged?: boolean;
  /** Quantos oponentes engajam o atacante (Defensiva perde 1d por cada). */
  attackerEngagedByCount?: number;
};

export type TorWoundSeverity =
  | { kind: "moderado" }
  | { kind: "grave"; days: number }
  | { kind: "grave-critico" };

export type TorAttackResolution = {
  attackRoll: TorRollOutcome;
  hit: boolean;
  /** Ataque barrado por postura (Retaguarda) — nem chega a rolar. */
  blocked?: string;
  /** Como a postura mexeu nos Dados de Sucesso, para exibir na mensagem. */
  stanceEffect?: {
    attackerStance: TorStanceId;
    defenderStance: TorStanceId;
    baseRank: number;
    finalRank: number;
  };
  enduranceLoss: number;
  piercingBlow: boolean;
  protectionRoll?: TorRollOutcome;
  protectionFailed?: boolean;
  /** Ferida sofrida (Golpe Perfurante penetrou a Proteção). */
  wound: boolean;
  /** Adversário eliminado, ou herói morrendo (2ª Ferida ou Olho na Severidade). */
  dying: boolean;
  severity?: TorWoundSeverity;
};

function attributeTN(strength: number): number {
  return 20 - strength;
}

/** Severidade da Ferida — 1 Dado de Proeza isolado, sem TN (livro, "Wound Severity"). */
function rollWoundSeverity(): TorWoundSeverity {
  const { featDie } = rollTorCheck({ rank: 0, tn: 0 });
  if (featDie.kind === "gandalf") return { kind: "moderado" };
  if (featDie.kind === "eye") return { kind: "grave-critico" };
  return { kind: "grave", days: featDie.numeric };
}

/** Rolagem vazia — para os casos barrados por postura, que não chegam a rolar. */
function noRoll(tn: number): TorRollOutcome {
  return {
    featDie: { kind: "number", numeric: 0, label: "—" },
    featDiceRolled: [],
    successDice: [],
    total: 0,
    tn,
    success: false,
    autoSuccess: false,
    autoFail: false,
    successIcons: 0,
    degree: "failure",
    favoured: false,
    illFavoured: false,
  };
}

export function resolveTorAttack(params: TorAttackParams): TorAttackResolution {
  const tn =
    params.attackerKind === "hero"
      ? attributeTN(params.attackerStrength ?? 0) + params.defenderParry
      : params.defenderParry;

  // Adversário não escolhe postura (regra do livro) — cai em Aberta, que é neutra.
  const attackerStance = params.attackerStance ?? TOR_DEFAULT_STANCE;
  const defenderStance = params.defenderStance ?? TOR_DEFAULT_STANCE;
  const attackIsRanged = Boolean(params.attackIsRanged);

  // Retaguarda restringe alcance nos dois sentidos — barra antes de rolar.
  const canAttack =
    params.attackerKind === "hero"
      ? canAttackFromStance(attackerStance, attackIsRanged)
      : ({ ok: true } as const);
  if (!canAttack.ok) {
    return {
      attackRoll: noRoll(tn),
      hit: false,
      blocked: canAttack.reason,
      enduranceLoss: 0,
      piercingBlow: false,
      wound: false,
      dying: false,
    };
  }

  const canTarget = canBeTargetedBy(defenderStance, attackIsRanged);
  if (!canTarget.ok) {
    return {
      attackRoll: noRoll(tn),
      hit: false,
      blocked: canTarget.reason,
      enduranceLoss: 0,
      piercingBlow: false,
      wound: false,
      dying: false,
    };
  }

  // Postura do atacante (Avançada +1d, Defensiva −1d por engajador), depois a do
  // defensor (Avançada facilita, Defensiva dificulta) sobre o mesmo rank.
  const afterAttacker =
    params.attackerKind === "hero"
      ? attackRankWithStance(params.attackerRank, attackerStance, params.attackerEngagedByCount ?? 0)
      : params.attackerRank;
  const finalRank =
    params.defenderKind === "hero"
      ? incomingRankWithStance(afterAttacker, defenderStance, attackIsRanged)
      : afterAttacker;

  const attackRoll = rollTorCheck({
    rank: finalRank,
    tn,
    favoured: params.attackerFavoured,
    illFavoured: params.attackerIllFavoured,
    weary: params.attackerWeary,
    miserable: params.attackerMiserable,
  });

  const stanceEffect = {
    attackerStance,
    defenderStance,
    baseRank: params.attackerRank,
    finalRank,
  };

  if (!attackRoll.success) {
    return {
      attackRoll,
      hit: false,
      stanceEffect,
      enduranceLoss: 0,
      piercingBlow: false,
      wound: false,
      dying: false,
    };
  }

  const enduranceLoss = params.weaponDamage;
  // Runa de Gandalf já é codificada como numeric:10 em rollOneFeatDie — cobre os dois casos.
  const piercingBlow = params.weaponCanPierce !== false && attackRoll.featDie.numeric === 10;

  if (!piercingBlow) {
    return {
      attackRoll,
      hit: true,
      stanceEffect,
      enduranceLoss,
      piercingBlow: false,
      wound: false,
      dying: false,
    };
  }

  const protectionRoll = rollTorCheck({
    rank: params.defenderProtectionDice,
    tn: params.weaponInjury,
    // `illFavoured` vinha de `defenderMiserable`, o que aplicava ao Teste de
    // Proteção uma penalidade que o livro não dá: Arrasado só faz o Olho virar
    // falha (o que o próprio `miserable` abaixo já faz). Desfavorecido é a
    // condição separada de Sombra no máximo, ou de uma Falha.
    illFavoured: params.defenderIllFavoured,
    weary: params.defenderWeary,
    miserable: params.defenderMiserable,
  });
  const protectionFailed = !protectionRoll.success;

  if (!protectionFailed) {
    return {
      attackRoll,
      hit: true,
      stanceEffect,
      enduranceLoss,
      piercingBlow: true,
      protectionRoll,
      protectionFailed: false,
      wound: false,
      dying: false,
    };
  }

  if (params.defenderKind === "adversary") {
    return {
      attackRoll,
      hit: true,
      stanceEffect,
      enduranceLoss,
      piercingBlow: true,
      protectionRoll,
      protectionFailed: true,
      wound: true,
      dying: true, // adversários são eliminados quando sofrem uma Ferida
    };
  }

  if (params.defenderAlreadyWounded) {
    return {
      attackRoll,
      hit: true,
      stanceEffect,
      enduranceLoss,
      piercingBlow: true,
      protectionRoll,
      protectionFailed: true,
      wound: true,
      dying: true, // 2ª Ferida — Resistência a 0, Morrendo, sem rolar severidade
    };
  }

  const severity = rollWoundSeverity();
  return {
    attackRoll,
    hit: true,
    stanceEffect,
    enduranceLoss,
    piercingBlow: true,
    protectionRoll,
    protectionFailed: true,
    wound: true,
    dying: severity.kind === "grave-critico",
    severity,
  };
}

const SEVERITY_LABEL: Record<TorWoundSeverity["kind"], string> = {
  moderado: "Ferimento Moderado — sem efeito duradouro",
  grave: "Ferimento Grave",
  "grave-critico": "Ferimento Gravíssimo — Morrendo",
};

export function formatTorAttackMessage(
  attackerName: string,
  defenderName: string,
  weaponLabel: string,
  result: TorAttackResolution
): string {
  // Barrado por postura: nem houve rolagem, então não formata dados.
  if (result.blocked) {
    return `${attackerName} não pode atacar ${defenderName} — ${result.blocked}`;
  }

  const stanceTxt = result.stanceEffect
    ? ` [${torStanceLabel(result.stanceEffect.attackerStance)}${
        result.stanceEffect.finalRank !== result.stanceEffect.baseRank
          ? ` ${result.stanceEffect.baseRank}d→${result.stanceEffect.finalRank}d`
          : ""
      }]`
    : "";

  const rollTxt = formatTorRollMessage(
    `${attackerName} ataca ${defenderName} (${weaponLabel})${stanceTxt}`,
    result.attackRoll
  );
  if (!result.hit) return rollTxt;

  const parts = [rollTxt, `${defenderName} perde ${result.enduranceLoss} de Resistência`];
  if (result.piercingBlow) {
    parts.push("GOLPE PERFURANTE!");
    if (result.protectionRoll) {
      parts.push(
        `Proteção: ${result.protectionRoll.total} vs Ferimento ${result.protectionRoll.tn} → ${
          result.protectionFailed ? "FALHA" : "resistiu"
        }`
      );
    }
    if (result.wound) {
      parts.push(
        result.severity
          ? `${defenderName} sofre uma Ferida — ${SEVERITY_LABEL[result.severity.kind]}${
              result.severity.kind === "grave" ? ` (${result.severity.days} dias)` : ""
            }`
          : `${defenderName} é eliminado`
      );
    }
  }
  return parts.join(" — ");
}
