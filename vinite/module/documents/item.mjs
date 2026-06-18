/**
 * Documento Item Eldarin.
 */
export class EldarinItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const system = this.system;

    if (system.tactical?.alcanceCells) {
      const a = system.tactical.alcanceCells;
      a.value = Math.max(a.min ?? 0, Number(a.value) || 0);
    }
    if (system.tactical?.custoPontosAcao) {
      const c = system.tactical.custoPontosAcao;
      c.value = Math.max(c.min ?? 0, Number(c.value) || 0);
    }
  }
}
