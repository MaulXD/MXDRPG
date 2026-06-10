/** Textos de apoio no wizard — o jogador vê o que ganha antes de confirmar. */

export type AntecedenteMeta = {
  id: string;
  title: string;
  summary: string;
  gains: string[];
};

export const ANTECEDENTE_META: AntecedenteMeta[] = [
  {
    id: "Explorador",
    title: "Explorador",
    summary: "Viveu em trilhas, ruínas e passagens estreitas.",
    gains: ["Percepção e Sobrevivência", "Kit de explorador", "Um idioma extra"],
  },
  {
    id: "Erudito",
    title: "Erudito",
    summary: "Estudou tomos, runas e bestiários antes de descer.",
    gains: ["Arcanismo e História", "Três idiomas", "Equipamento de escriba"],
  },
  {
    id: "Mercador",
    title: "Mercador",
    summary: "Negociou em feiras, caravanas e guildas.",
    gains: ["Persuasão e Intuição", "Kit de mercador", "Contatos em cidades"],
  },
  {
    id: "Soldado",
    title: "Soldado",
    summary: "Serviu em milícia, guarda ou companhia mercenária.",
    gains: ["Atletismo e Intimidação", "Insígnia militar", "Respeito entre soldados"],
  },
  {
    id: "Eremita",
    title: "Eremita",
    summary: "Isolou-se em ermos, cavernas ou mosteiros.",
    gains: ["Medicina e Religião", "Kit de herbalista", "Visão mística ocasional"],
  },
  {
    id: "Criminoso",
    title: "Criminoso",
    summary: "Aprendeu a sobreviver nas margens da lei.",
    gains: ["Furtividade e Enganação", "Contato no submundo", "Ferramentas de ladrão"],
  },
  {
    id: "Nobre",
    title: "Nobre",
    summary: "Criado entre cortes, castelos ou casas mercantes.",
    gains: ["História e Persuasão", "Traje fino", "Passagem em alta sociedade"],
  },
  {
    id: "Órfão da Masmorra",
    title: "Órfão da Masmorra",
    summary: "Cresceu ouviu eco de monstros — e aprendeu com isso.",
    gains: ["Percepção e Furtividade", "Mapa rabiscado", "Instinto contra emboscadas"],
  },
  {
    id: "Aventureiro",
    title: "Aventureiro",
    summary: "Já encarou perigo antes desta campanha.",
    gains: ["Uma perícia à escolha", "Equipamento inicial flexível", "Contato aventureiro"],
  },
];

export function antecedenteMeta(id: string): AntecedenteMeta | undefined {
  return ANTECEDENTE_META.find((a) => a.id === id);
}
