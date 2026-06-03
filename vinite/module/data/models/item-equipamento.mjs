const { NumberField, StringField, BooleanField, SchemaField } = foundry.data.fields;

export class EldarinEquipamentoDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ blank: true, initial: "" }),
      enabled: new BooleanField({ initial: true }),
      gear: new SchemaField({
        peso: new NumberField({ initial: 0, min: 0 }),
        equipado: new BooleanField({ initial: false }),
      }),
    };
  }
}
