import { attributeModifier, clamp } from "../data/formulas.mjs";

/**
 * Documento Actor do sistema Eldarin.
 */
export class EldarinActor extends Actor {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const system = this.system;

    for (const key of Object.keys(system.attributes ?? {})) {
      const attr = system.attributes[key];
      if (!attr) continue;
      attr.mod = attributeModifier(attr.value);
      attr.value = clamp(attr.value, attr.min ?? 1, attr.max ?? 99);
    }

    if (system.tactical?.iniciativa) {
      system.tactical.iniciativa.mod = system.attributes?.agilidade?.mod ?? 0;
    }

    const vida = system.resources?.vida;
    if (vida) {
      vida.value = clamp(vida.value, vida.min ?? 0, vida.max ?? vida.value);
    }

    const pa = system.resources?.pontosAcao;
    if (pa) {
      pa.value = clamp(pa.value, pa.min ?? 0, pa.max ?? pa.max);
    }
  }
}
