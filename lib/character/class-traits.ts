import traitsData from "@/data/character/class-traits.json";

/** Traço de classe do livro (Cap. 4), só leitura. Gerado por scripts/generate-class-traits.mjs. */
export type ClassTrait = {
  nome: string;
  nivel: number;
  texto: string;
};

const classes = (traitsData as { classes: Record<string, ClassTrait[]> }).classes;

/** Traços da classe que o personagem já tem no nível dele (D-21, BV-056). */
export function classTraitsForLevel(classe: string, nivel: number): ClassTrait[] {
  return (classes[classe] ?? []).filter((t) => t.nivel <= Math.max(1, nivel));
}
