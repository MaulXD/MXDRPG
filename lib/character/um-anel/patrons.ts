/**
 * Patronos — extraídos de livros/um-anel/13-apendice-patronos-e-ficha.md
 * ("Patrons"). Escolhidos como Patrono principal da Companhia via a
 * Empreitada Encontrar Patrono (lib/character/um-anel/undertakings.ts).
 */
export type TorPatron = {
  id: string;
  name: string;
  roles: string;
  distinctiveFeatures: string[];
  description: string;
  encountering: string;
  asPatron: string;
  fellowshipBonus: number;
  advantageName: string;
  advantageText: string;
};

export const TOR_PATRONS: TorPatron[] = [
  {
    id: "balin",
    name: "Balin, filho de Fundin",
    roles: "Aventureiro, Enviado",
    distinctiveFeatures: ["Ávido", "Honrado"],
    description: "Anão venerável de sangue real (descendente do Rei Náin II), sobrevivente de muitas perdas — lutou contra Orcs quando seu pai morreu defendendo Moria, esteve presente quando Thráin desapareceu em Trevamata, e viajou com a companhia de Thorin Escudo de Carvalho na missão que reconquistou Erebor e matou Smaug.",
    encountering: "Viaja com frequência por Terras Ásperas e Eriador como mensageiro de Dáin, ou com Gandalf. Visita o Condado (grande amigo de Bilbo Bolseiro) e trabalha com os Anões das Montanhas Azuis.",
    asPatron: "Genuinamente interessado em outros povos, especialmente afeiçoado a Hobbits; compartilha a preocupação de Gandalf com a Sombra crescente. Busca restaurar a força e presença Anã em Eriador; odeia Orcs e busca expulsá-los. Ávido por informações sobre fortalezas Anãs caídas ao Inimigo (particularmente interessado em Moria, onde seu pai morreu).",
    fellowshipBonus: 1,
    advantageName: "Conselho de Balin",
    advantageText: "Pode gastar pontos de Companhia pra tornar uma rolagem de combate Favorecida.",
  },
  {
    id: "bilbo",
    name: "Bilbo Bolseiro",
    roles: "Aventureiro aposentado, Arrombador",
    distinctiveFeatures: ["Bem-falante", "Astuto"],
    description: "Hobbit vigoroso de 75 anos. Sua jornada inesperada com a companhia de Thorin e um Dragão o mudou profundamente, dando-lhe gosto pela aventura e o afastando da sociedade comum do Condado. Voltou mais rico e passa o tempo com seu estilo de vida peculiar, a companhia de amigos (frequentemente Anões) e seus diários privados.",
    encountering: "Vive em Bolsão, Sobre-a-Colina, Hobbiton — provavelmente tomando chá ou fumando um cachimbo à porta. Às vezes fica fora de casa mais tempo do que a etiqueta do Condado permite.",
    asPatron: "Sabe muito sobre o mundo fora do Condado e seus perigos, mantido informado por cartas e boatos. Feliz em providenciar hospitalidade e financiar expedições em troca de uma boa história ou lembrança; cada vez mais isolado dos demais Hobbits, que o veem como um recluso excêntrico.",
    fellowshipBonus: 2,
    advantageName: "Hospitalidade de Bilbo",
    advantageText: "Ao escolher a Empreitada Encontrar Patrono pra visitar Bilbo, você também aumenta o Nível de Companhia em +1 até a próxima Fase de Companhia.",
  },
  {
    id: "cirdan",
    name: "Círdan, o Construtor de Naus",
    roles: "Emissário, Mestre do Saber",
    distinctiveFeatures: ["Cortês", "Senhorial", "Sábio"],
    description: "Talvez o Elfo mais antigo ainda na Terra-média, tendo testemunhado três eras do mundo. Conhecido como o Construtor de Naus e Senhor dos Portos Cinzentos; membro do Conselho Branco; outrora portador de Narya, o Anel de Fogo, antes de entregá-lo a Gandalf, o Cinzento.",
    encountering: "Habita em Mithlond, no Golfo de Lhûn; raramente deixa os Portos Cinzentos, mas acolhe todos que chegam em paz. Seu arauto Galdor dos Portos costuma viajar representando-o com autoridade plena.",
    asPatron: "Sabe que os Portos são vitais pra guerra contra a Sombra; os Portos Cinzentos servem como último refúgio pra quem deixa a Terra-média. Consulta-se com frequência com Elrond por meio de mensageiros na Estrada do Leste.",
    fellowshipBonus: 1,
    advantageName: "Presciência do Construtor de Naus",
    advantageText: "Pode gastar pontos de Companhia pra refazer qualquer rolagem. Ao escolher Encontrar Patrono pra visitar Círdan, você também recebe um boato do Mestre.",
  },
  {
    id: "gandalf",
    name: "Gandalf, o Cinzento",
    roles: "Aventureiro, Mago",
    distinctiveFeatures: ["Audaz", "Astuto", "Sábio"],
    description: "Pra Hobbits do Condado, Gandalf é só um peregrino errante que afirma ser Mago, conhecido principalmente por fogos de artifício. Em outros lugares é conhecido como Mithrandir (Elfos), Tharkûn (Anões), ou o \"Peregrino Cinzento\" (Homens do Sul). Na verdade é o maior inimigo de Sauron na Terceira Era — porta secretamente Narya, o Anel de Fogo, e empunha Glamdring em combate.",
    encountering: "Pode ser encontrado quase em qualquer lugar — cavalgando, andando sozinho ou acompanhado, ou dirigindo uma carroça. Tem afeição particular por Hobbits do Condado; em Eriador, prefere se encontrar na estalagem de Bri.",
    asPatron: "Inspira ação e coloca eventos em movimento. Diferente de Saruman (que lida com dispositivos de sua torre), Gandalf se move entre aqueles que se opõem a Sauron diretamente, ouvindo apelos e oferecendo ajuda — o que o torna bem-vindo em quase todo lugar, apesar de sua reputação como encrenqueiro.",
    fellowshipBonus: 2,
    advantageName: "Sabedoria do Peregrino Cinzento",
    advantageText: "Pode gastar pontos de Companhia pra tornar um Teste de Sombra Favorecido.",
  },
  {
    id: "gilraen",
    name: "Gilraen, a Bela",
    roles: "Conselheira, Vidente",
    distinctiveFeatures: ["Cautelosa", "Bela", "Firme"],
    description: "Mulher de nobre linhagem Dúnedain, mãe de Aragorn (atual chefe dos Rangers do Norte e Herdeiro de Isildur). Viúva jovem, pouco depois do nascimento de Aragorn; Elrond a levou com o recém-nascido pra Valfenda, criando Aragorn como filho próprio sob o nome \"Estel\" (Sindarin pra \"Esperança\") pra ocultar sua linhagem.",
    encountering: "Recebe grande respeito entre os Dúnedain de Eriador como viúva de Arathorn e conselheira vidente; muitos capitães Rangers buscam seu conselho. Pode ser encontrada com pequenos bandos de Rangers perto de Valfenda, ou nas Colinas do Tempo e Terras Setentrionais.",
    asPatron: "Tendo perdido o marido pra uma flecha Orc e o sogro Arador pra Trolls das Colinas, Gilraen sabe que os Dúnedain e todo Eriador nunca estarão seguros enquanto o mal vagar sem oposição. Na ausência do filho como chefe, garante que os Rangers não abandonem seu dever como guardiões da velha Arnor, das Terras de Bri e do Condado.",
    fellowshipBonus: 1,
    advantageName: "Povo de Gilraen",
    advantageText: "Enquanto estiver no antigo território de Arnor, todos os Eventos de Jornada são determinados como se você estivesse numa Terra Fronteiriça. Ao escolher Encontrar Patrono pra visitar Gilraen, você também recebe um boato do Mestre.",
  },
  {
    id: "tom-bombadil",
    name: "Tom Bombadil e Dama Baga de Ouro",
    roles: "O Mestre / Filha do Rio",
    distinctiveFeatures: ["Distraído", "Alegre", "Bela", "Bem-falante"],
    description: "O velho Tom Bombadil já vagou por todo Eriador, quando a Floresta Antiga se estendia bem mais ao sul. Criatura estranha e ancestral — pros Elfos, Iarwain Ben-adar (\"o mais velho e sem pai\") — mais antigo do que os Elfos de longa vida conseguem lembrar. Compartilha sua vida com Baga de Ouro, a filha da Mulher-do-Rio.",
    encountering: "A casa deles fica logo além da margem leste da Floresta Antiga, onde o Withywindle desce de sua nascente nos Montes dos Túmulos. Sob o teto de Tom, os hóspedes encontram corações contentes, sono tranquilo, boa companhia, canto alegre e prazeres simples.",
    asPatron: "Embora o poder de Tom seja tão profundo quanto a terra, é limitado à sua pequena terra; dentro dela é aparentemente inconquistável, mas não vai além dela por motivo algum. Aventureiros que conquistam a amizade dos dois descobrem que eles aparecem quase instantaneamente em qualquer lugar dentro de seu domínio quando chamados.",
    fellowshipBonus: 2,
    advantageName: "Senhores da Madeira, Água e Colina",
    advantageText: "Pode gastar toda a sua Companhia restante pra invocar a intervenção de Tom ou Baga de Ouro em qualquer lugar da terra de Tom.",
  },
];

export const TOR_PATRON_BY_ID: Record<string, TorPatron> = Object.fromEntries(
  TOR_PATRONS.map((p) => [p.id, p])
);
