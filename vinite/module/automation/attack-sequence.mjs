import { clamp } from "../data/formulas.mjs";
import { isTargetInHexRange } from "./hex-utils.mjs";

/**
 * Executa ataque tático com validação hex, consumo de PA e VFX (Sequencer + Token Magic).
 * @param {object} options
 * @param {Token} options.attackerToken
 * @param {Token} options.targetToken
 * @param {Item} options.item
 * @param {Actor} options.actor
 */
export async function executeAttack({ attackerToken, targetToken, item, actor }) {
  if (!attackerToken || !targetToken) {
    ui.notifications.error(game.i18n.localize("ELDARIN.Attack.missingTokens"));
    return;
  }

  const rangeHex = item.system.tactical?.alcanceHex?.value ?? 1;
  const apCost = item.system.tactical?.custoPontosAcao?.value ?? 1;
  const pa = actor.system.resources.pontosAcao;

  if (!isTargetInHexRange(attackerToken, targetToken, rangeHex)) {
    ui.notifications.warn(
      game.i18n.format("ELDARIN.Attack.outOfRange", { range: rangeHex })
    );
    return;
  }

  if (pa.value < apCost) {
    ui.notifications.warn(game.i18n.localize("ELDARIN.Attack.notEnoughPA"));
    return;
  }

  const newPa = clamp(pa.value - apCost, pa.min ?? 0, pa.max ?? pa.value);
  await actor.update({ "system.resources.pontosAcao.value": newPa });

  const damageFormula = item.system.weapon?.dano?.formula ?? "1d6";
  const attackBonus = item.system.weapon?.ataque?.bonus ?? 0;
  const strMod = actor.system.attributes?.forca?.mod ?? 0;
  const rollFormula = `1d20 + ${attackBonus + strMod}`;

  await playAttackVfx(attackerToken, targetToken);

  const attackRoll = await new Roll(rollFormula, actor.getRollData()).evaluate();
  const damageRoll = await new Roll(damageFormula, actor.getRollData()).evaluate();

  await attackRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: game.i18n.format("ELDARIN.Attack.rollFlavor", { weapon: item.name, target: targetToken.name }),
  });

  await damageRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: game.i18n.localize("ELDARIN.Attack.damageFlavor"),
  });
}

/**
 * Sequencer + Token Magic FX (assets fictícios JB2A).
 * @param {Token} attacker
 * @param {Token} target
 */
async function playAttackVfx(attacker, target) {
  const sequencerActive = game.modules.get("sequencer")?.active;
  const tokenMagicActive = game.modules.get("tokenmagic")?.active;

  if (tokenMagicActive && typeof TokenMagic !== "undefined") {
    try {
      await TokenMagic.addFilters(attacker, [
        {
          filterType: "outline",
          filterId: "vinite-attack-glow",
          color: 0x00f5ff,
          thickness: 3,
          glowIntensity: 2,
          animated: { color: { active: true, loopDuration: 1200 } },
        },
      ]);
      setTimeout(() => TokenMagic.deleteFilters(attacker, "vinite-attack-glow"), 1800);
    } catch (err) {
      console.warn("Eldarin | Token Magic FX", err);
    }
  }

  if (!sequencerActive || typeof Sequence === "undefined") {
    ui.notifications.info(game.i18n.localize("ELDARIN.Attack.noSequencerFallback"));
    return;
  }

  const jb2aMelee = "jb2a.melee_generic.slashing.one_handed";
  const jb2aImpact = "jb2a.impact.melee_generic.slashing.one_handed";

  const origin = { x: attacker.document.x, y: attacker.document.y };

  try {
    await new Sequence()
      .effect()
      .file(jb2aMelee)
      .atLocation(attacker)
      .stretchTo(target)
      .scale(0.9)
      .playbackRate(1.2)
      .animation()
      .on(attacker)
      .moveTowards(target, { ease: "easeInOutCubic", duration: 450 })
      .rotateTowards(target)
      .waitUntilFinished(-150)
      .effect()
      .file(jb2aImpact)
      .atLocation(target)
      .scale(0.85)
      .playbackRate(1.1)
      .waitUntilFinished(200)
      .animation()
      .on(attacker)
      .teleportTo(origin)
      .play();
  } catch (err) {
    console.warn("Eldarin | Sequencer — verifique JB2A instalado.", err);
    ui.notifications.warn(game.i18n.localize("ELDARIN.Attack.sequencerFailed"));
  }
}
