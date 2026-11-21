import gerados from "@/lib/icons/icones-gerados.json";

/**
 * Ícones com arte (gerados e emoldurados por scripts/icones/compor.mjs) em public/icons/<categoria>/<id>.webp.
 * A lista vem de lib/icons/icones-gerados.json, reescrita pelo compor.mjs: só devolve URL de ícone que
 * existe, para a tela nunca pedir arquivo que falta. Sem arte, quem chama mostra o glifo de sempre.
 */
export type CategoriaIcone = "classes" | "habilidades" | "magias";

const disponiveis: Record<CategoriaIcone, ReadonlySet<string>> = {
  classes: new Set(gerados.classes),
  habilidades: new Set(gerados.habilidades),
  magias: new Set(gerados.magias),
};

export function iconeGeradoUrl(categoria: CategoriaIcone, id: string): string | null {
  return disponiveis[categoria].has(id) ? `/icons/${categoria}/${id}.webp` : null;
}

/** Id do ícone de classe: CLA-<nome sem acento, minúsculo> (igual ao docs/icones/prompts-classes.json). */
export function classeIconeId(classId: string): string {
  return `CLA-${classId.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}`;
}
