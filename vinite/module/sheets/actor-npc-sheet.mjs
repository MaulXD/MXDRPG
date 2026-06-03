const { ActorSheet } = foundry.appv1.sheets;

/**
 * Ficha simplificada para NPCs.
 */
export class EldarinActorNpcSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vinite", "sheet", "actor", "npc"],
      template: "systems/vinite/templates/actor/npc-sheet.hbs",
      width: 560,
      height: 640,
      resizable: true,
      scrollY: [".vinite-sheet-body"],
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);
    context.system = this.actor.system;
    context.editable = this.isEditable;
    context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography ?? "", {
      async: true,
      relativeTo: this.actor,
    });
    return context;
  }
}
