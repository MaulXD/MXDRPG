/**
 * Macro de exemplo — Ataque tático Eldarin (Sequencer + alcance hex + PA).
 *
 * Uso: selecione 1 alvo (Target), tenha um token do atacante selecionado ou assignado,
 * e execute com um item de arma equipado na ficha (ou passe itemId no argumento).
 *
 * Argumento opcional: { itemId: "abc123" }
 */
(async () => {
  const attackerToken = canvas.tokens.controlled[0];
  if (!attackerToken?.actor) {
    ui.notifications.warn("Selecione o token do atacante.");
    return;
  }

  const targets = [...game.user.targets];
  if (targets.length !== 1) {
    ui.notifications.warn("Selecione exatamente 1 alvo.");
    return;
  }

  const actor = attackerToken.actor;
  let itemId = typeof args === "object" && args?.[0]?.itemId ? args[0].itemId : null;

  if (!itemId) {
    const weapons = actor.items.filter((i) => i.type === "arma");
    if (!weapons.length) {
      ui.notifications.warn("Nenhuma arma na ficha.");
      return;
    }
    itemId = weapons[0].id;
  }

  const item = actor.items.get(itemId);
  if (!item) {
    ui.notifications.warn("Item de arma não encontrado.");
    return;
  }

  await game.vinite.automation.executeAttack({
    attackerToken,
    targetToken: targets[0],
    item,
    actor,
  });
})();
