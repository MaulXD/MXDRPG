const { NumberField, StringField, SchemaField } = foundry.data.fields;

/** DataModel v12 — personagem (espelha template.json) */
export class EldarinCharacterDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      biography: new StringField({ required: false, blank: true, initial: "" }),
      attributes: new SchemaField({
        forca: attributeSchema(),
        agilidade: attributeSchema(),
      }),
      resources: new SchemaField({
        vida: resourceSchema(10),
        pontosAcao: resourceSchema(4),
      }),
      movement: new SchemaField({
        hex: new SchemaField({
          walk: labeledValueSchema(4),
          run: labeledValueSchema(7),
          runActionPointCost: new NumberField({ integer: true, initial: 1, min: 0 }),
        }),
        mode: new StringField({ initial: "walk", choices: { walk: "walk", run: "run" } }),
      }),
      identity: new SchemaField({
        nivel: valueMinMaxSchema(1, 1, 20),
        raca: new StringField({ blank: true, initial: "" }),
        classe: new StringField({ blank: true, initial: "" }),
        antecedente: new StringField({ blank: true, initial: "" }),
      }),
      tactical: new SchemaField({
        iniciativa: new SchemaField({
          value: new NumberField({ integer: true, initial: 0 }),
          mod: new NumberField({ integer: true, initial: 0 }),
        }),
        defesa: valueMinSchema(10),
      }),
    };
  }
}

function attributeSchema() {
  return new SchemaField({
    value: new NumberField({ integer: true, initial: 10, min: 1, max: 30 }),
    min: new NumberField({ integer: true, initial: 1 }),
    max: new NumberField({ integer: true, initial: 30 }),
    mod: new NumberField({ integer: true, initial: 0 }),
  });
}

function resourceSchema(initialMax) {
  return new SchemaField({
    value: new NumberField({ integer: true, initial: initialMax, min: 0 }),
    min: new NumberField({ integer: true, initial: 0 }),
    max: new NumberField({ integer: true, initial: initialMax, min: 0 }),
  });
}

function labeledValueSchema(initial) {
  return new SchemaField({
    value: new NumberField({ integer: true, initial, min: 0 }),
    label: new StringField({ blank: true }),
  });
}

function valueMinMaxSchema(initial, min, max) {
  return new SchemaField({
    value: new NumberField({ integer: true, initial, min, max }),
    min: new NumberField({ integer: true, initial: min }),
    max: new NumberField({ integer: true, initial: max }),
  });
}

function valueMinSchema(initial) {
  return new SchemaField({
    value: new NumberField({ integer: true, initial, min: 0 }),
    min: new NumberField({ integer: true, initial: 0 }),
  });
}
