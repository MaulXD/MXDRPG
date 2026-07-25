import type { TorCallingId } from "./types";

/**
 * Empreitadas da Fase de Companhia — extraídas de
 * livros/um-anel/07-fases-de-companhia-jornada.md ("Fellowship Phase Undertakings").
 * Numa Fase comum a Companhia escolhe 1 + 1 grátis (se tiver o Chamado
 * correspondente); numa Fase de Yule, cada jogador escolhe 1.
 */
export type TorUndertaking = {
  id: string;
  name: string;
  /** Só disponível numa Fase de Companhia de Yule (fim de ano). */
  yuleOnly?: boolean;
  /** Chamado que torna essa Empreitada grátis (além da escolha normal da Companhia). */
  freeForCallingId?: TorCallingId;
  description: string;
};

export const TOR_UNDERTAKINGS: TorUndertaking[] = [
  {
    id: "reunir-boatos",
    name: "Reunir Boatos",
    freeForCallingId: "guardiao",
    description: "Escolha essa Empreitada pra receber um boato do Mestre — uma história sobre um indivíduo, lugar ou evento vindouro que a Companhia pode explorar, prevenir ou almejar.",
  },
  {
    id: "curar-cicatrizes",
    name: "Curar Cicatrizes",
    yuleOnly: true,
    description: "Gaste 5 Pontos de Aventura e remova 1 Cicatriz de Sombra (ver regra de Fortalecer a Vontade).",
  },
  {
    id: "encontrar-patrono",
    name: "Encontrar Patrono",
    freeForCallingId: "mensageiro",
    description: "Escolha essa Empreitada pra encontrar um dos amigos e aliados da Companhia, se a Fase de Companhia acontecer onde esse Patrono possa ser encontrado e estiver disponível.",
  },
  {
    id: "contemplar-mapas",
    name: "Contemplar Mapas Ilustrados",
    freeForCallingId: "erudito",
    description: "Estude mapas e pergaminhos de saber pra aprender sobre os perigos que a Companhia pode enfrentar numa jornada. Até a próxima Fase de Companhia, aplique +1 em todas as rolagens de Dado de Proeza pra determinar a natureza de eventos durante uma Jornada.",
  },
  {
    id: "criar-herdeiro",
    name: "Criar um Herdeiro",
    yuleOnly: true,
    description: "Gaste até 5 de Tesouro e um número igual de Pontos de Aventura pra aumentar a reserva de Experiência Anterior inicial do seu herdeiro (1 ponto por Ponto de Aventura gasto). Na primeira vez, escolha e registre o nome do herdeiro.",
  },
  {
    id: "recontar-historia",
    name: "Recontar uma História",
    yuleOnly: true,
    description: "Substitua um dos seus Traços Distintivos por um novo, escolhendo uma qualidade que você demonstrou no episódio narrado.",
  },
  {
    id: "fortalecer-companhia",
    name: "Fortalecer a Companhia",
    freeForCallingId: "capitao",
    description: "Aumente o Nível de Companhia em +1 até a próxima Fase de Companhia.",
  },
  {
    id: "estudar-itens-magicos",
    name: "Estudar Itens Mágicos",
    freeForCallingId: "cacador-de-tesouros",
    description: "Aprenda tudo o que há pra descobrir sobre as qualidades de todos os Artefatos Maravilhosos e Itens Prodigiosos na posse da Companhia.",
  },
  {
    id: "compor-cancao",
    name: "Compor uma Canção",
    freeForCallingId: "campeao",
    description: "Componha uma canção — Balada (útil em Conselhos), Canção de Vitória (útil em Combate) ou Canção de Marcha (útil em Jornadas). A nova composição entra na lista de canções da Companhia; cada uma pode ser usada 1x por Fase de Aventura — uma rolagem de MÚSICA bem-sucedida ignora os efeitos de estar Exausto durante a empreitada.",
  },
];

export const TOR_UNDERTAKING_BY_ID: Record<string, TorUndertaking> = Object.fromEntries(
  TOR_UNDERTAKINGS.map((u) => [u.id, u])
);

/** Custo em Pontos de Perícia/Aventura por graduação — livro, "Experience Points Costs". */
export const TOR_EXPERIENCE_COSTS: { rank: number; cost: number }[] = [
  { rank: 1, cost: 4 },
  { rank: 2, cost: 8 },
  { rank: 3, cost: 12 },
  { rank: 4, cost: 20 },
  { rank: 5, cost: 26 },
  { rank: 6, cost: 30 },
];
