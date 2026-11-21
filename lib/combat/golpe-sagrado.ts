/**
 * D13: dados do Golpe Sagrado do Paladino por nivel.
 * Livro (livros/LIVRO-DO-JOGADOR.md, tabela de progressao, linhas 1199 a 1203):
 * 2d8 no nivel 2, 3d8 no 5, 4d8 no 9, 5d8 no 13 e 6d8 no 17. Dano radiante.
 */
/** Tipo do dano do Golpe Sagrado: resiste como radiante, separado do tipo da arma (attack.ts). */
export const GOLPE_SAGRADO_TIPO_DANO = "radiante";

export function golpeSagradoDiceForLevel(nivel: number): string {
  if (nivel >= 17) return "6d8";
  if (nivel >= 13) return "5d8";
  if (nivel >= 9) return "4d8";
  if (nivel >= 5) return "3d8";
  return "2d8";
}
