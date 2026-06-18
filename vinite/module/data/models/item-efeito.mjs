const { NumberField, StringField, BooleanField, SchemaField } = foundry.data.fields;

export class EldarinEfeitoDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ blank: true, initial: "" }),
      enabled: new BooleanField({ initial: true }),
      effect: new SchemaField({
        duracao: new StringField({ blank: true, initial: "" }),
        alcanceCells: new SchemaField({
          value: new NumberField({ integer: true, initial: 0, min: 0 }),
          min: new NumberField({ integer: true, initial: 0 }),
        }),
      }),
    };
  }
}
