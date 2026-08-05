import type { BattleToken } from "@/lib/vtt/types";
import type { TorAttackResolution } from "./resolve-attack";

/**
 * Aplica o resultado de resolveTorAttack direto em vida/vidaMax/defeated/torCombat —
 * nunca usar patchTokenVitals/clampDeathTrackOnDamage/applyUnconsciousAtZeroHp
 * (lib/vtt/token-hp-display.ts, lib/combat/death-track.ts): injetam a condição
 * Eldarin "inconsciente" e um contador de morte de 10 rodadas que não existem
 * nas regras do Um Anel. Ver plano da Fase 4, risco #3.
 */
export function applyTorAttackResultToDefender(
  token: BattleToken,
  result: Pick<TorAttackResolution, "hit" | "enduranceLoss" | "wound" | "dying">
): BattleToken {
  if (!result.hit) return token;

  const currentVida = token.vida ?? token.vidaMax ?? 0;
  const nextVida = result.dying ? 0 : Math.max(0, currentVida - result.enduranceLoss);
  const defeated = nextVida <= 0;

  // Adversário: acumula Ferimentos. Quem decide se ESTE Ferimento abate é o motor
  // (resolveTorAttack, que conhece o Vigor e os Ferimentos anteriores) — aqui só
  // se conta e se aplica, pra não haver duas implementações da mesma regra.
  //
  // Resistência a zero continua retirando do combate independente do Vigor:
  // "Todos os adversários são retirados do combate se sua Resistência for
  // reduzida a zero" (08-mestre-e-adversarios.md).
  const isAdversary = token.torCombat?.kind === "adversary";
  const nextWounds = (token.torCombat?.wounds ?? 0) + (isAdversary && result.wound ? 1 : 0);

  const torCombat = token.torCombat
    ? {
        ...token.torCombat,
        wounded:
          token.torCombat.kind === "hero"
            ? token.torCombat.wounded || result.wound
            : token.torCombat.wounded,
        ...(isAdversary ? { wounds: nextWounds } : {}),
        eliminated: isAdversary
          ? token.torCombat.eliminated || result.dying || defeated
          : token.torCombat.eliminated,
      }
    : token.torCombat;

  return {
    ...token,
    vida: nextVida,
    defeated: defeated || undefined,
    torCombat,
  };
}
