/**
 * PNJs Notáveis de Valfenda — extraídos de livros/um-anel/10-rivendell.md
 * ("Notable NPCs of Rivendell"). Diferente dos Patronos, não têm bônus de
 * Companhia formal (exceto Elrond, já listado em patrons.ts) — são
 * referência de mesa pro Mestre interpretar esses PNJs.
 */
export type TorNotableNpc = {
  id: string;
  name: string;
  roles: string;
  distinctiveFeatures: string[];
  description: string;
  specialRule?: string;
};

export const TOR_NOTABLE_NPCS: TorNotableNpc[] = [
  {
    id: "arwen",
    name: "Arwen Undómiel",
    roles: "Curandeira, Tecelã",
    distinctiveFeatures: ["Bela", "Generosa", "Senhorial"],
    description: "Filha de Elrond e Celebrían. Os Elfos de Valfenda dizem que sua beleza é a semelhança de Lúthien renascida, e por isso é chamada Undómiel, a Estrela da Tarde — sinal de que os dias dos Elfos estão chegando ao fim.",
    specialRule: "Na primeira vez que um herói mortal vê Arwen, recupera 1 ponto de Esperança. Um herói Élfico pode ainda converter uma Cicatriz de Sombra em um ponto de Sombra comum.",
  },
  {
    id: "elladan-e-elrohir",
    name: "Elladan e Elrohir",
    roles: "Batedores, Guerreiros",
    distinctiveFeatures: ["Olhos Aguçados", "Velozes", "Altos"],
    description: "Os filhos gêmeos de Elrond, contados entre os mais valentes senhores de Valfenda. Compartilham um ódio ao Inimigo afiado pelo destino que acometeu sua mãe. Frequentemente servem como mensageiros e caçam adversários que ousam se aproximar de Valfenda.",
  },
  {
    id: "erestor",
    name: "Erestor",
    roles: "Conselheiro, Escriba",
    distinctiveFeatures: ["Astuto", "Fiel", "Reservado"],
    description: "O amigo mais próximo de Elrond e seu conselheiro mais sábio, ao seu lado há muitos milênios. Hábil escriba e ilustrador de manuscritos, mas seu talento mais reconhecido é preparar o miruvor, o cordial de Valfenda — processo conhecido só por ele.",
    specialRule: "Cordial de Viagem: quem bebe ganha (1d) numa rolagem de Perícia pra resolver um evento de jornada. Tônico Medicinal: heróis feridos que bebem reduzem à metade (arredondando pra cima) os dias necessários pra curar uma Ferida.",
  },
  {
    id: "glorfindel",
    name: "Glorfindel",
    roles: "Arauto, Herói Errante",
    distinctiveFeatures: ["Belo", "Bem-falante", "Senhorial"],
    description: "Um príncipe dos Elfos, retornado do Oeste pra servir como defensor de Valfenda, o lugar-tenente e arauto escolhido por Elrond. Um dos mais poderosos dos Primogênitos — tanto sábio quanto Élfico quanto poderoso o bastante pra cavalgar abertamente contra os mais terríveis servos de Sauron. Monta o corcel Élfico Asfaloth.",
  },
];

export const TOR_NOTABLE_NPC_BY_ID: Record<string, TorNotableNpc> = Object.fromEntries(
  TOR_NOTABLE_NPCS.map((n) => [n.id, n])
);
