const { ActorSheet } = foundry.appv1.sheets;

const INVENTORY_TYPES = [
  { type: "arma", labelKey: "ELDARIN.Item.types.arma" },
  { type: "habilidade", labelKey: "ELDARIN.Item.types.habilidade" },
  { type: "equipamento", labelKey: "ELDARIN.Item.types.equipamento" },
  { type: "efeito", labelKey: "ELDARIN.Item.types.efeito" },
];

/**
 * Ficha personagem — abas, inventário drag-drop, ataque.
 */
export class EldarinActorCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vinite", "sheet", "actor", "character"],
      template: "systems/vinite/templates/actor/character-sheet.hbs",
      width: 800,
      height: 860,
      resizable: true,
      scrollY: [".vinite-sheet-body", ".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "stats",
        },
      ],
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);
    const actor = this.actor;
    const system = actor.system;

    context.config = CONFIG.ELDARIN;
    context.system = system;
    context.editable = this.isEditable;

    context.attributes = Object.entries(system.attributes ?? {}).map(([key, data]) => ({
      key,
      label: game.i18n.localize(`ELDARIN.Attributes.${key}`),
      ...data,
    }));

    context.resources = {
      vida: {
        label: game.i18n.localize("ELDARIN.Resources.vida"),
        ...system.resources.vida,
        pct: this.#resourcePercent(system.resources.vida),
      },
      pontosAcao: {
        label: game.i18n.localize("ELDARIN.Resources.pontosAcao"),
        ...system.resources.pontosAcao,
        pct: this.#resourcePercent(system.resources.pontosAcao),
      },
    };

    context.movement = {
      walk: system.movement.hex.walk,
      run: system.movement.hex.run,
      runApCost: system.movement.hex.runActionPointCost,
      mode: system.movement.mode,
      isWalk: system.movement.mode === "walk",
      isRun: system.movement.mode === "run",
    };

    context.inventorySections = INVENTORY_TYPES.map((def) => ({
      type: def.type,
      label: game.i18n.localize(def.labelKey),
      items: actor.items
        .filter((i) => i.type === def.type)
        .map((item) => ({
          id: item.id,
          name: item.name,
          img: item.img,
          meta: this.#itemMeta(item),
          canAttack: item.type === "arma",
        })),
    }));

    context.flags = {
      sequencerReady: !!game.modules.get("sequencer")?.active,
      tokenMagicReady: !!game.modules.get("tokenmagic")?.active,
    };

    context.enrichedBiography = await TextEditor.enrichHTML(system.biography ?? "", {
      async: true,
      relativeTo: this.actor,
    });

    return context;
  }

  /** @param {Item} item */
  #itemMeta(item) {
    if (item.type === "arma") {
      const t = item.system.tactical;
      const w = item.system.weapon;
      return `${t?.alcanceHex?.value ?? 1} hex · PA ${t?.custoPontosAcao?.value ?? 1} · ${w?.dano?.formula ?? ""}`;
    }
    if (item.type === "habilidade") {
      return `${item.system.tactical?.alcanceHex?.value ?? 0} hex · PA ${item.system.tactical?.custoPontosAcao?.value ?? 0}`;
    }
    if (item.type === "equipamento") {
      return item.system.gear?.equipado ? game.i18n.localize("ELDARIN.Sheet.equipped") : "";
    }
    return "";
  }

  #resourcePercent(resource) {
    if (!resource?.max) return 0;
    return Math.round((resource.value / resource.max) * 100);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find("[data-action]").on("click", this.#onAction.bind(this));
    html.find(".movement-mode").on("click", this.#onMovementMode.bind(this));
    html.find(".rollable").on("click", this.#onRoll.bind(this));

    const dropZone = html.find(".items-drop-zone")[0];
    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
      });
      dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
      dropZone.addEventListener("drop", () => dropZone.classList.remove("drag-over"));
    }
  }

  /** @override */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type === "Item") {
      return this.#onDropItem(event, data);
    }
    return super._onDrop(event);
  }

  /** @param {DragEvent} event @param {object} data */
  async #onDropItem(event, data) {
    if (!this.actor.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    const itemData = item.toObject();
    delete itemData._id;

    const existing = this.actor.items.find((i) => i.name === itemData.name && i.type === itemData.type);
    if (existing && game.settings.get("core", "compendiumConfiguration")?.duplicateItems !== false) {
      return existing.sheet?.render?.(true);
    }

    await this.actor.createEmbeddedDocuments("Item", [itemData]);
    return false;
  }

  /** @param {JQuery.ClickEvent} event */
  async #onAction(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const action = el.dataset.action;

    switch (action) {
      case "attack":
        return this.#onAttack(el);
      case "rest-pa":
        return this.actor.update({
          "system.resources.pontosAcao.value": this.actor.system.resources.pontosAcao.max,
        });
      case "item-create":
        return this.#onItemCreate(el.dataset.type);
      case "item-edit":
        return this.actor.items.get(el.dataset.itemId)?.sheet?.render(true);
      case "item-delete": {
        const item = this.actor.items.get(el.dataset.itemId);
        if (!item) return;
        return Dialog.confirm({
          title: `${game.i18n.localize("ELDARIN.Sheet.deleteItem")}?`,
          content: `<p>${item.name}</p>`,
          yes: () => item.delete(),
        });
      }
      default:
        break;
    }
  }

  async #onItemCreate(type) {
    await Item.create(
      {
        name: game.i18n.localize(`ELDARIN.Item.types.${type}`),
        type,
      },
      { parent: this.actor }
    );
  }

  async #onAttack(button) {
    const item = this.actor.items.get(button.dataset.itemId);
    if (!item || item.type !== "arma") return;

    const targets = [...game.user.targets];
    if (targets.length !== 1) {
      ui.notifications.warn(game.i18n.localize("ELDARIN.Attack.selectOneTarget"));
      return;
    }

    const token = this.token ?? this.actor.getActiveTokens()[0];
    if (!token) {
      ui.notifications.warn(game.i18n.localize("ELDARIN.Attack.noToken"));
      return;
    }

    await game.vinite.automation.executeAttack({
      attackerToken: token,
      targetToken: targets[0],
      item,
      actor: this.actor,
    });
  }

  async #onMovementMode(event) {
    event.preventDefault();
    const mode = event.currentTarget.dataset.mode;
    if (!mode || mode === this.actor.system.movement.mode) return;
    await this.actor.update({ "system.movement.mode": mode });
  }

  async #onRoll(event) {
    event.preventDefault();
    if (event.currentTarget.dataset.roll === "iniciativa") {
      const mod = this.actor.system.tactical?.iniciativa?.mod ?? 0;
      await new Roll(`1d20 + ${mod}`, this.actor.getRollData()).toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: game.i18n.localize("ELDARIN.Rolls.initiative"),
      });
    }
  }

  /** @override */
  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    if (expanded.system?.attributes) {
      for (const key of Object.keys(expanded.system.attributes)) {
        const entry = expanded.system.attributes[key];
        if (entry?.value !== undefined) entry.value = Number(entry.value);
      }
    }
    return super._updateObject(event, foundry.utils.flattenObject(expanded));
  }
}
