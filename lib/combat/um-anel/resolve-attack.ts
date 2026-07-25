import { rollTorCheck, formatTorRollMessage, type TorRollOutcome } from "@/lib/character/um-anel/dice";

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
  defenderWeary?: boolean;
  defenderMiserable?: boolean;
  /** Só kind:"hero" — já tem 1 Ferida marcada (a próxima é fatal, sem rolar severidade). */
  defenderAlreadyWounded?: boolean;
};

export type TorWoundSeverity =
  | { kind: "moderado" }
  | { kind: "grave"; days: number }
  | { kind: "grave-critico" };

export type TorAttackResolution = {
  attackRoll: TorRollOutcome;
  hit: boolean;
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

export function resolveTorAttack(params: TorAttackParams): TorAttackResolution {
  const tn =
    params.attackerKind === "hero"
      ? attributeTN(params.attackerStrength ?? 0) + params.defenderParry
      : params.defenderParry;

  const attackRoll = rollTorCheck({
    rank: params.attackerRank,
    tn,
    favoured: params.attackerFavoured,
    illFavoured: params.attackerIllFavoured,
    weary: params.attackerWeary,
    miserable: params.attackerMiserable,
  });

  if (!attackRoll.success) {
    return { attackRoll, hit: false, enduranceLoss: 0, piercingBlow: false, wound: false, dying: false };
  }

  const enduranceLoss = params.weaponDamage;
  // Runa de Gandalf já é codificada como numeric:10 em rollOneFeatDie — cobre os dois casos.
  const piercingBlow = params.weaponCanPierce !== false && attackRoll.featDie.numeric === 10;

  if (!piercingBlow) {
    return { attackRoll, hit: true, enduranceLoss, piercingBlow: false, wound: false, dying: false };
  }

  const protectionRoll = rollTorCheck({
    rank: params.defenderProtectionDice,
    tn: params.weaponInjury,
    illFavoured: params.defenderMiserable,
    weary: params.defenderWeary,
    miserable: params.defenderMiserable,
  });
  const protectionFailed = !protectionRoll.success;

  if (!protectionFailed) {
    return {
      attackRoll,
      hit: true,
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
  const rollTxt = formatTorRollMessage(`${attackerName} ataca ${defenderName} (${weaponLabel})`, result.attackRoll);
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
