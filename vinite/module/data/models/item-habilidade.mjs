const { NumberField, StringField, SchemaField, BooleanField } = foundry.data.fields;

export class EldarinHabilidadeDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ blank: true, initial: "" }),
      enabled: new BooleanField({ initial: true }),
      tactical: new SchemaField({
        alcanceCells: new SchemaField({
          value: new NumberField({ integer: true, initial: 1, min: 0 }),
          min: new NumberField({ integer: true, initial: 0 }),
        }),
        custoPontosAcao: new SchemaField({
          value: new NumberField({ integer: true, initial: 1, min: 0 }),
          min: new NumberField({ integer: true, initial: 0 }),
        }),
      }),
      ability: new SchemaField({
        tipo: new StringField({ initial: "ativa" }),
        recarga: new StringField({ blank: true, initial: "" }),
      }),
    };
  }
}
