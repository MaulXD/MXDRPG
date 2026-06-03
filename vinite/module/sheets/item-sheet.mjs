const { ItemSheet } = foundry.appv1.sheets;

/**
 * Ficha base de item — template por tipo (arma, habilidade, …).
 */
export class EldarinItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vinite", "sheet", "item"],
      width: 520,
      height: 580,
      resizable: true,
      scrollY: [".vinite-sheet-body"],
    });
  }

  /** @override */
  get template() {
    const type = this.item.type;
    return `systems/vinite/templates/item/${type}-sheet.hbs`;
  }

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);
    context.system = this.item.system;
    context.editable = this.isEditable;
    context.isArma = this.item.type === "arma";
    context.isCombativel = ["arma", "habilidade"].includes(this.item.type);
    context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description ?? "", {
      async: true,
      relativeTo: this.item,
    });
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find("[data-action='attack-preview']").on("click", this.#onAttackPreview.bind(this));
  }

  /** @param {JQuery.ClickEvent} event */
  async #onAttackPreview(event) {
    event.preventDefault();
    const actor = this.item.actor;
    if (!actor) {
      ui.notifications.warn(game.i18n.localize("ELDARIN.Item.needsActor"));
      return;
    }
    const token = actor.getActiveTokens()[0];
    const targets = [...game.user.targets];
    if (!token || targets.length !== 1) {
      ui.notifications.warn(game.i18n.localize("ELDARIN.Attack.selectOneTarget"));
      return;
    }
    await game.vinite.automation.executeAttack({
      attackerToken: token,
      targetToken: targets[0],
      item: this.item,
      actor,
    });
  }
}
