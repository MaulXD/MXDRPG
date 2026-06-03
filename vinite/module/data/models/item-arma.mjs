const { NumberField, StringField, SchemaField, BooleanField } = foundry.data.fields;

export class EldarinArmaDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ blank: true, initial: "" }),
      enabled: new BooleanField({ initial: true }),
      tactical: tacticalSchema(),
      weapon: new SchemaField({
        dano: new SchemaField({
          formula: new StringField({ initial: "1d6" }),
          tipo: new StringField({ blank: true, initial: "" }),
        }),
        ataque: new SchemaField({
          bonus: new NumberField({ integer: true, initial: 0 }),
        }),
      }),
    };
  }
}

function tacticalSchema() {
  return new SchemaField({
    alcanceHex: new SchemaField({
      value: new NumberField({ integer: true, initial: 1, min: 0 }),
      min: new NumberField({ integer: true, initial: 0 }),
    }),
    custoPontosAcao: new SchemaField({
      value: new NumberField({ integer: true, initial: 1, min: 0 }),
      min: new NumberField({ integer: true, initial: 0 }),
    }),
  });
}
