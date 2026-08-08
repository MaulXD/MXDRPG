/**
 * As aventuras de *Tales from Wilderland* convertidas da 1ª para a 2ª edição.
 *
 * Por que existe: uma aventura convertida é onde a conversão pode dar errado sem
 * fazer barulho. Um nome de perícia antigo que sobrou, um NA fixo que ficou, um
 * adversário citado que não existe no bestiário — nada disso quebra build nem
 * tipo. Só quebra na mesa, com o Mestre procurando um bloco que não está lá.
 *
 * Um arquivo só para TODAS as aventuras, e não um teste por aventura: as
 * checagens são as mesmas, e sete cópias divergiriam na primeira vez que uma
 * delas fosse melhorada. Cada aventura entra na lista `AVENTURAS` com as
 * checagens próprias dela em `extra`.
 *
 * O que se amarra:
 * 1. **toda citação CVR-xxx aponta para uma entrada que existe** na tabela de
 *    conversão — referência quebrada é pior que ausência de referência;
 * 2. **todo adversário citado existe** em `lib/character/um-anel/adversaries.ts`,
 *    com o rótulo que o Mestre lê;
 * 3. **nenhum termo de 1ª edição sobreviveu**; os que aparecem para serem
 *    NEGADOS aparecem no contexto certo, nunca como instrução.
 *
 * Fonte: livros/um-anel/1x-wilderland-*.md e
 * livros/um-anel/compendio/conversao-primeira-edicao.md.
 */
import { readFileSync as rawReadFileSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const TABELA = readFileSync(
  root("livros", "um-anel", "compendio", "conversao-primeira-edicao.md"),
  "utf8"
);
const ADVERSARIES = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");

let pass = 0;
let fail = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Corpo de uma entrada `## CVR-0NN — …` até a próxima. */
function entradaTabela(id) {
  const i = TABELA.indexOf(`## ${id} —`);
  if (i < 0) return "";
  const rest = TABELA.slice(i + 3);
  const j = rest.indexOf("\n## ");
  return j < 0 ? rest : rest.slice(0, j);
}

/**
 * Bloco de um adversário no bestiário, do `id:` até o início do próximo bloco.
 *
 * Cortar por um número fixo de caracteres não serve: o Arqueiro Goblin tem duas
 * Habilidades Sinistras e a segunda ("Veneno de Orc") caía fora de uma janela de
 * 800 — a asserção passava a acusar ausência de algo que estava lá.
 */
function blocoAdversario(id) {
  const i = ADVERSARIES.indexOf(`id: "${id}"`);
  if (i < 0) return "";
  const rest = ADVERSARIES.slice(i);
  const j = rest.indexOf('\n    id: "');
  return j < 0 ? rest : rest.slice(0, j);
}

console.log("verify-um-anel-aventuras-wilderland: as conversões fecham com a régua e o bestiário");

/* ══════════════════════════════════════════════════════════════════════
   As aventuras convertidas até agora
   ══════════════════════════════════════════════════════════════════════ */

const AVENTURAS = [
  {
    arquivo: "15-wilderland-01-nao-desvie-da-trilha.md",
    titulo: "Não Desvie da Trilha",
    /* Entradas da régua que ESTA aventura tem obrigação de usar. Se alguém
       apagar a citação, a conversão perde justamente a armadilha. */
    cvrObrigatorias: {
      "CVR-004": "Ódio × Resolução — os bandidos se rendem, e matá-los pode ser Malfeitoria",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-020": "a Tolerância que vira Conselho",
      "CVR-024": "o teste de corrupção que vira Teste de Sombra",
      "CVR-028": "as Fontes de Dano, lidas ao contrário",
      "CVR-035": "o bloco de Aranha, agora que a lacuna fechou",
    },
    /* Rótulo lido pelo Mestre → id do bloco no bestiário. */
    adversarios: {
      Salteador: "batedor-de-bolsos",
      "Chefe dos Rufiões": "chefe-arruaceiro",
      "Ladrão de Estrada": "assaltante-de-estrada",
    },
    /* Quantos blocos de estatística em tabela a aventura pode ter. */
    blocosEsperados: 1,
    /* Tem aranhas em cena — a lacuna do bloco precisa estar declarada. */
    aranhas: true,
    extra(AV) {
      for (const [campo, valor] of [
        ["Nível de Atributo", "4"],
        ["Resistência", "45"],
        ["Vigor", "2"],
        ["Ódio", "6"],
        ["Bloqueio", "4"],
        ["Armadura", "3"],
      ]) {
        ok(
          `  Coisa do Fosso: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV)
        );
      }
      /* O Vigor é a única linha que a 1ª edição não tinha. Só pode ser afirmado
         porque o TEXTO da aventura diz "Ferida duas vezes" — e a justificativa
         tem de estar escrita, não subentendida. */
      ok(
        "  o Vigor 2 vem do texto, e a justificativa está escrita",
        /Ferida \*\*duas vezes\*\*/.test(AV) &&
          /Vigor é[\s>]*exatamente o número de Ferimentos/.test(AV),
        "sem a justificativa escrita, Vigor 2 seria estimativa disfarçada"
      );
      ok(
        "  Agarrar existe como Dano Especial no bestiário",
        /specialDamage: \["Agarrar"\]/.test(ADVERSARIES) && /\| Agarrar \|/.test(AV)
      );
      ok(
        "  Grande Tamanho virou criatura grande, que o motor conhece",
        /large: true/.test(ADVERSARIES) && /criatura grande para os limites de engajamento/.test(AV)
      );
      /* Bandidos são Homens Maus: Resolução, não Ódio. Se o bestiário mudar, o
         parágrafo sobre Malfeitoria vira mentira. */
      for (const id of ["batedor-de-bolsos", "chefe-arruaceiro", "assaltante-de-estrada"]) {
        ok(
          `  "${id}" tem Resolução, como a aventura afirma`,
          /hateKind: "resolve"/.test(blocoAdversario(id)),
          "a aventura diz que atacá-los pode ser Malfeitoria — isso só vale para Resolução"
        );
      }
    },
  },
  {
    arquivo: "16-wilderland-02-sobre-ervas-e-hobbits-cozidos.md",
    titulo: "Sobre Ervas e Hobbits Cozidos",
    cvrObrigatorias: {
      "CVR-004": "aqui os inimigos são de Ódio, ao contrário da aventura 1",
      "CVR-012": "as Habilidades Sinistras reaproveitadas do bestiário",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-019": "as ações prolongadas que viram Empreitada de Perícia",
      "CVR-020": "a Tolerância que vira Conselho",
      "CVR-021": "os testes de fadiga que viram Eventos de Jornada",
      "CVR-024": "o teste de corrupção que vira Teste de Sombra",
      "CVR-030": "as lacunas — Aranha e Prestígio",
    },
    adversarios: {
      "Arqueiro Goblin": "arqueiro-goblin",
      "Soldado Orc": "soldado-orc",
      "Guarda Orc": "guarda-orc",
      "Cacique Orc": "cacique-orc",
      Warg: "warg",
      "Troll das Cavernas Furtivo": "cave-troll-furtivo",
    },
    blocosEsperados: 1,
    /* Tem aranhas em cena — a lacuna do bloco precisa estar declarada. */
    aranhas: true,
    extra(AV) {
      for (const [campo, valor] of [
        ["Nível de Atributo", "4"],
        ["Resistência", "54"],
        ["Ódio", "8"],
        ["Bloqueio", "7"],
        ["Armadura", "4"],
      ]) {
        ok(
          `  Fantasma da Noite: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV)
        );
      }
      /* O contraste com a aventura 1: aqui o texto NÃO resolve o Vigor, então o
         campo fica declarado como lacuna em vez de receber um número. */
      ok(
        "  o Vigor do Fantasma fica em branco, declarado como lacuna",
        /\| Vigor \| \*\*lacuna/.test(AV) && !/\| Vigor \| \d+ \|/.test(AV),
        "o texto desta aventura não diz quantas Feridas o abatem — inventar seria estimativa"
      );
      ok(
        "  e a lacuna do Vigor está explicada no fim",
        /## Lacunas registradas/.test(AV) && /Vigor do Fantasma da Noite/.test(AV)
      );
      /* As quatro Habilidades Sinistras vêm do bestiário, com o nome de lá. */
      for (const hab of ["Medo do Fogo", "Habitante das Trevas", "Velocidade Serpentina", "Covarde"]) {
        ok(
          `  Habilidade Sinistra "${hab}" existe no bestiário com esse nome`,
          new RegExp(`name: "${hab}"`).test(ADVERSARIES) && AV.includes(hab)
        );
      }
      /* A diferença de ritmo do Medo do Fogo precisa estar avisada — usar a
         versão da 2ª edição muda a luta, e o Mestre tem de saber. */
      ok(
        "  a mudança de ritmo do Medo do Fogo está avisada",
        /Atenção à Medo do Fogo/.test(AV) && /1 por rodada/.test(AV)
      );
      /* O Arqueiro Goblin envenena, e a aventura amarra isso à regra de Veneno
         — inclusive dizendo que a flecha do pônei NÃO estava envenenada. */
      ok(
        "  o Arqueiro Goblin tem Veneno de Orc no bestiário",
        /name: "Veneno de Orc"/.test(blocoAdversario("arqueiro-goblin"))
      );
      ok(
        "  e a aventura usa a regra de Veneno da 2ª edição",
        /não pode descansar/.test(AV) && /Runa de Gandalf/.test(AV)
      );
      /* Orcs e Goblins são de ÓDIO — o oposto dos bandidos da aventura 1. */
      for (const id of ["arqueiro-goblin", "soldado-orc", "guarda-orc", "cacique-orc"]) {
        ok(
          `  "${id}" tem Ódio, como a aventura afirma`,
          /hateKind: "hate"/.test(blocoAdversario(id)),
          "a aventura diz que matá-los NÃO levanta Malfeitoria — isso só vale para Ódio"
        );
      }
    },
  },
  {
    arquivo: "17-wilderland-03-assassinato-e-mau-agouro.md",
    titulo: "Assassinato e Mau Agouro",
    cvrObrigatorias: {
      "CVR-004": "Ódio × Resolução — é o EIXO desta aventura, que termina num tribunal",
      "CVR-005": "o Bloqueio de Valter, somando o Grande Escudo",
      "CVR-006": "a Armadura de Valter, lida na tabela da 2ª edição",
      "CVR-012": "as Habilidades Sinistras reaproveitadas, e as que viraram lacuna",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-020": "as seis Tolerâncias que viram Conselho",
      "CVR-021": "a marcha forçada e os Eventos de Jornada",
      "CVR-030": "as lacunas — Vigor e Prestígio",
      "CVR-031": "comitiva → Companhia",
      "CVR-032": "Fase em Sociedade → Fase de Companhia",
    },
    adversarios: {
      "Campeão Sulista": "campeao-do-sul",
      Salteador: "batedor-de-bolsos",
      "Saqueador Sulista": "invasor-do-sul",
      Warg: "warg",
    },
    /* Valter e Oderic — os dois únicos blocos próprios. */
    blocosEsperados: 2,
    extra(AV) {
      for (const [quem, campo, valor] of [
        ["Valter", "Nível de Atributo", "5"],
        ["Valter", "Resistência", "19"],
        ["Valter", "Resolução", "4"],
        ["Valter", "Bloqueio", "8"],
        ["Valter", "Armadura", "4"],
        ["Oderic", "Nível de Atributo", "4"],
        ["Oderic", "Resistência", "18"],
        ["Oderic", "Resolução", "3"],
        ["Oderic", "Bloqueio", "5"],
        ["Oderic", "Armadura", "1"],
      ]) {
        ok(
          `  ${quem}: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV),
          "valor do bloco não bate"
        );
      }

      /* Os dois números derivados. Se as tabelas de equipamento mudarem, as
         contas escritas na aventura viram mentira — então a asserção lê os DOIS
         lados, tabela e texto. */
      const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
      ok(
        "  Bloqueio 8 = 5 + Grande Escudo (+3), e o escudo vale 3 na tabela",
        /id: "grande-escudo", label: "Grande Escudo", parryModifier: 3/.test(DATA) &&
          /\*\*Bloqueio 8\*\* = os 5 do bloco mais \*\*\+3 do Grande Escudo\*\*/.test(AV),
        "se o Grande Escudo mudar de valor, a conta escrita na aventura precisa mudar junto"
      );
      ok(
        "  Armadura 4 = Cota de Malha (3d) + Elmo (+1d), como manda a tabela",
        /label: "Cota de Malha", protection: "3d"/.test(DATA) &&
          /label: "Elmo",\s*\n\s*protection: "\+1d"/.test(DATA) &&
          /\*\*Armadura 4\*\* = \*\*Cota de Malha \(3d\) \+ Elmo \(\+1d\)\*\*/.test(AV)
      );

      /* NENHUM dos dois blocos pode ganhar Vigor: o texto não resolve, ao
         contrário da Coisa do Fosso da aventura 1. */
      const vigores = [...AV.matchAll(/\| Vigor \| ([^|]+) \|/g)].map((m) => m[1].trim());
      ok(
        "  os dois blocos declaram o Vigor como lacuna, e nenhum vira número",
        vigores.length === 2 && vigores.every((v) => v.startsWith("**lacuna")),
        `achei ${JSON.stringify(vigores)} — o texto desta aventura não diz quantas Feridas abatem`
      );
      ok(
        "  e a lacuna do Vigor está explicada no fim",
        /Vigor de Valter e de Oderic/.test(AV)
      );

      /* O eixo da aventura: TODO inimigo humano é de Resolução. */
      for (const id of ["campeao-do-sul", "batedor-de-bolsos", "invasor-do-sul"]) {
        ok(
          `  "${id}" tem Resolução, como a aventura afirma`,
          /hateKind: "resolve"/.test(blocoAdversario(id)),
          "numa aventura sobre julgamento, Resolução é o que põe Malfeitoria em jogo"
        );
      }
      ok(
        "  a aventura declara que todo inimigo humano é de Resolução",
        /Todo inimigo humano desta aventura tem RESOLUÇÃO, não Ódio/.test(AV)
      );
      ok(
        "  e amarra isso a Malfeitoria",
        /Malfeitoria/.test(AV) && /Oderic/.test(AV)
      );

      /* Grito de Triunfo substitui a "Voz de Comando" do original — mesma
         mecânica, nome do bestiário. */
      ok(
        "  Grito de Triunfo existe no bestiário e é usado por Valter",
        /name: "Grito de Triunfo"/.test(ADVERSARIES) && /Grito de Triunfo/.test(AV)
      );
      ok(
        "  Velocidade Serpentina existe no bestiário e cobre a habilidade de Faron",
        /name: "Velocidade Serpentina"/.test(ADVERSARIES) && /Velocidade Serpentina/.test(AV)
      );
      /* NEGATIVA: habilidades sem equivalente NÃO podem ter virado habilidade
         nova — CVR-012 manda registrar como lacuna. */
      ok(
        '  "Sem Trégua" e "Investida Selvagem" ficaram como lacuna, não viraram habilidade',
        /"Sem Trégua" e "Investida Selvagem"/.test(AV) &&
          !/name: "Sem Trégua"/.test(ADVERSARIES) &&
          !/name: "Investida Selvagem"/.test(ADVERSARIES),
        "o original só NOMEIA as duas, sem descrever efeito — inventar seria criar regra"
      );
    },
  },
  {
    arquivo: "18-wilderland-04-aqueles-que-nao-permanecem-mais.md",
    titulo: "Aqueles Que Não Permanecem Mais",
    cvrObrigatorias: {
      "CVR-004": "mortos-vivos são de Ódio; Orientais são Homens Maus, de Resolução",
      "CVR-012": "as Habilidades Sinistras do Tumulário reaproveitadas",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-018": "os graus de sucesso",
      "CVR-019": "a série prolongada de Cura que vira Empreitada de Perícia",
      "CVR-020": "as Tolerâncias que viram Conselho",
      "CVR-021": "os Eventos de Jornada",
      "CVR-024": "o teste de Medo e os testes de corrupção que viram Teste de Sombra",
      "CVR-031": "comitiva → Companhia",
    },
    adversarios: {
      "Guarda-costas Grande Orc": "guarda-costas-grande-orc",
      "Soldado Orc": "soldado-orc",
      "Arqueiro Goblin": "arqueiro-goblin",
      Tumulário: "barrow-wight",
      "Campeão Sulista": "campeao-do-sul",
    },
    /* Só os Guerreiros Mortos-Vivos ganham bloco próprio. */
    blocosEsperados: 1,
    extra(AV) {
      for (const [campo, valor] of [
        ["Nível de Atributo", "3"],
        ["Resistência", "15"],
        ["Ódio", "4"],
        ["Bloqueio", "3"],
        ["Armadura", "2"],
      ]) {
        ok(
          `  Guerreiros Mortos-Vivos: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV)
        );
      }
      ok(
        "  o Vigor fica declarado como lacuna, e não vira número",
        /\| Vigor \| \*\*lacuna/.test(AV) && !/\| Vigor \| \d+ \|/.test(AV),
        "o texto diz que feri-los nem sempre basta — isso é Imorredouro, não Vigor"
      );

      /* As duas habilidades do original já existem no Tumulário, com nome da 2ª
         edição. Se o bestiário perder qualquer uma, a conversão fica sem base. */
      const tumulario = blocoAdversario("barrow-wight");
      for (const hab of ["Infundir Medo", "Imorredouro"]) {
        ok(
          `  "${hab}" existe no bloco do Tumulário e é usada aqui`,
          new RegExp(`name: "${hab}"`).test(tumulario) && AV.includes(hab),
          "é de lá que a conversão tira a habilidade — CVR-012"
        );
      }

      /* O teste de MEDO da 1ª edição não tem equivalente próprio: vira Teste de
         Sombra (Pavor/VALOR), e o efeito descrito é o de estar Arrasado. */
      ok(
        "  o teste de Medo virou Teste de Sombra com VALOR, e o efeito é Arrasado",
        /Teste de Sombra \(VALOR\)/.test(AV) && /Arrasado/.test(AV),
        "a 2ª edição não tem teste de medo — tem Pavor resistido com VALOR"
      );
      ok(
        "  e a conversão do teste de Medo está explicada",
        /\*\*não tem teste de medo\*\*/.test(AV)
      );

      /* O sonho tem uma regra de fronteira: o que atravessa e o que não. */
      ok(
        "  a tabela do que sobrevive ao despertar existe",
        /\| Esperança gasta \| \*\*Sim\*\* \|/.test(AV) &&
          /\| Resistência perdida \| Não \|/.test(AV),
        "Esperança e Sombra atravessam; Resistência, Fadiga e Feridas não"
      );

      /* Ódio × Resolução: os dois lados, no mesmo arquivo. */
      ok(
        '  o Tumulário tem Ódio e o Campeão Sulista tem Resolução',
        /hateKind: "hate"/.test(tumulario) &&
          /hateKind: "resolve"/.test(blocoAdversario("campeao-do-sul")),
        "mortos-vivos são lacaios do Inimigo; Orientais são Homens Maus"
      );

      /* Duas lacunas próprias desta aventura. */
      ok(
        "  a lacuna do Troll da Colina está declarada",
        /Troll da Colina/.test(AV) && !/id: "troll-da-colina"/.test(ADVERSARIES),
        "o bestiário tem Trolls das Cavernas e de Pedra, não da Colina"
      );
      ok(
        '  a lacuna de "Foco de Companhia" está declarada',
        /Foco de Companhia/.test(AV)
      );
    },
  },
  {
    arquivo: "19-wilderland-05-a-escuridao-nos-pantanos.md",
    titulo: "A Escuridão nos Pântanos",
    cvrObrigatorias: {
      "CVR-004": "Orcs e Wargs são de Ódio; Magric é Homem Mau, de Resolução",
      "CVR-006": "a Armadura de Ghor, lida na tabela da 2ª edição",
      "CVR-012": "as Habilidades Sinistras reaproveitadas, e a que virou lacuna",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-018": "os graus de sucesso na Caçada",
      "CVR-019": "as ações prolongadas que viram Empreitada de Perícia",
      "CVR-020": "as Tolerâncias que viram Conselho",
      "CVR-021": "os Eventos de Jornada e a marcha forçada",
      "CVR-024": "os pontos de Sombra com fonte declarada",
      "CVR-028": "a tabela de queda, lida ao contrário",
      "CVR-030": "as lacunas — Vigor e Prestígio",
    },
    adversarios: {
      "Soldado Orc": "soldado-orc",
      "Arqueiro Goblin": "arqueiro-goblin",
      "Guarda-costas Grande Orc": "guarda-costas-grande-orc",
      "Chefe Grande Orc": "chefe-grande-orc",
      Warg: "warg",
    },
    /* Só Ghor ganha bloco próprio. */
    blocosEsperados: 1,
    extra(AV) {
      for (const [campo, valor] of [
        ["Nível de Atributo", "6"],
        ["Resistência", "35"],
        ["Ódio", "6"],
        ["Bloqueio", "5"],
        ["Armadura", "4"],
      ]) {
        ok(`  Ghor: ${campo} = ${valor}`, new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV));
      }
      ok(
        "  o Vigor de Ghor fica declarado como lacuna",
        /\| Vigor \| \*\*lacuna/.test(AV) && !/\| Vigor \| \d+ \|/.test(AV),
        "Ghor sobrevive para a sequência — o texto não diz quantas Feridas o abatem"
      );

      /* A Armadura 4 sai da MESMA derivação usada com Valter na aventura 3. Se a
         tabela de armaduras mudar, as duas contas escritas falham juntas. */
      const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
      ok(
        "  Armadura 4 = Cota de Malha (3d) + Elmo (+1d), como manda a tabela",
        /label: "Cota de Malha", protection: "3d"/.test(DATA) &&
          /label: "Elmo",\s*\n\s*protection: "\+1d"/.test(DATA) &&
          /\*\*Armadura 4\*\* = \*\*Cota de Malha \(3d\) \+ Elmo \(\+1d\)\*\*/.test(AV)
      );

      /* As três Habilidades Sinistras vêm do bestiário; a quarta é lacuna. */
      for (const hab of ["Grito de Triunfo", "Rijeza Hedionda", "Força Horrenda"]) {
        ok(
          `  "${hab}" existe no bestiário e é usada por Ghor`,
          new RegExp(`name: "${hab}"`).test(ADVERSARIES) && AV.includes(hab)
        );
      }
      ok(
        '  "Investida Selvagem" continua lacuna, e não virou habilidade nova',
        /Investida Selvagem/.test(AV) && !/name: "Investida Selvagem"/.test(ADVERSARIES),
        "o original só a NOMEIA — inventar o efeito seria criar regra"
      );

      /* O veneno da cobra amarra à regra do capítulo 8, que entrou no motor. */
      ok(
        "  o veneno da cobra usa a regra de Veneno da 2ª edição",
        /não pode descansar/.test(AV) && /Runa de Gandalf/.test(AV) && /Gravíssimo/.test(AV)
      );

      /* "Exausto" NÃO pode ser atribuído — o efeito descrito é o de Arrasado. */
      ok(
        "  o medo no templo virou Teste de Sombra, não Exausto atribuído",
        /Teste de Sombra \(Pavor, resistido com VALOR\)/.test(AV) &&
          /Exausto na 2ª\s*[\s>]*edição é derivado de Carga\+Fadiga e não se atribui/.test(AV),
        "o original dizia 'considerados Exaustos', e Exausto não se atribui"
      );

      /* A tabela de queda desta aventura é lida no mesmo sentido da de Fontes de
         Dano: a Runa salva e o Olho mata. */
      ok(
        "  a tabela de queda é lida com a Runa salvando e o Olho matando",
        /\*\*Runa salva\*\* e o \*\*Olho é o pior resultado\*\*/.test(AV)
      );

      /* Magric é o eixo social: Homem Mau, de Resolução, e precisa sobreviver. */
      ok(
        "  Magric é declarado Homem Mau com Resolução",
        /Magric é um Homem Mau, e tem Resolução/.test(AV)
      );
    },
  },
  {
    arquivo: "20-wilderland-06-a-travessia-do-celduin.md",
    titulo: "A Travessia do Celduin",
    cvrObrigatorias: {
      "CVR-004": "os PNJs heroicos trocam Esperança por Resolução; o espírito fica com Ódio",
      "CVR-005": "o Bloqueio de Elstan, somando o Grande Escudo",
      "CVR-006": "a Armadura de Elstan, lida na tabela",
      "CVR-010": "a Força Tremenda de Gerold, que já é o Golpe Pesado universal",
      "CVR-012": "as Habilidades Sinistras reaproveitadas, e as duas que viraram lacuna",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-018": "os graus de sucesso nos torneios",
      "CVR-019": "as ações prolongadas que viram Empreitada de Perícia",
      "CVR-020": "as Tolerâncias que viram Conselho, e as vitórias de torneio que viram atitude",
      "CVR-021": "os Eventos de Jornada",
      "CVR-024": "os Testes de Sombra com fonte declarada",
      "CVR-030": "as lacunas — Vigor e Prestígio",
    },
    adversarios: {
      "Soldado Orc": "soldado-orc",
      "Guarda Orc": "guarda-orc",
      "Arqueiro Goblin": "arqueiro-goblin",
      "Chefe Grande Orc": "chefe-grande-orc",
      "Chefe dos Lobos": "chefe-de-alcateia",
      Warg: "warg",
    },
    /* Gerold, Elstan e o Rei Enforcado. */
    blocosEsperados: 3,
    extra(AV) {
      for (const [quem, campo, valor] of [
        ["Gerold", "Nível de Atributo", "7"],
        ["Gerold", "Resistência", "20"],
        ["Gerold", "Resolução", "4"],
        ["Elstan", "Nível de Atributo", "6"],
        ["Elstan", "Resistência", "18"],
        ["Elstan", "Bloqueio", "6"],
        ["Elstan", "Armadura", "4"],
        ["Rei Enforcado", "Nível de Atributo", "8"],
        ["Rei Enforcado", "Resistência", "55"],
        ["Rei Enforcado", "Ódio", "8"],
      ]) {
        ok(
          `  ${quem}: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV)
        );
      }

      /* Os TRÊS blocos declaram lacuna de Vigor. */
      const vigores = [...AV.matchAll(/\| Vigor \| ([^|]+) \|/g)].map((m) => m[1].trim());
      ok(
        "  os três blocos declaram o Vigor como lacuna",
        vigores.length === 3 && vigores.every((v) => v.startsWith("**lacuna")),
        `achei ${JSON.stringify(vigores)}`
      );

      /* A troca de moeda: Esperança de PNJ heroico vira Resolução. */
      ok(
        "  a troca de Esperança por Resolução está explicada",
        /A 2ª edição não dá\s*[\s>]*Esperança a adversário/.test(AV),
        "é uma troca de moeda entre edições, não um detalhe de bloco"
      );

      /* A Força Tremenda de Gerold: o número do original BATE com o Nível de
         Atributo, e é isso que prova que já é o Golpe Pesado universal. */
      ok(
        "  a Força Tremenda de Gerold é reconhecida como Golpe Pesado",
        /Golpe Pesado/.test(AV) && /Nível de Atributo dele é \*\*7\*\*/.test(AV),
        "o original soma 7 de dano e o Nível de Atributo é 7 — é a mesma regra"
      );

      /* As derivações de escudo e armadura, lidas nos DOIS lados. */
      const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
      ok(
        "  Bloqueio 6 = 3 + Grande Escudo (+3), e o escudo vale 3 na tabela",
        /id: "grande-escudo", label: "Grande Escudo", parryModifier: 3/.test(DATA) &&
          /\*\*Bloqueio 6\*\* = os 3 do bloco mais \*\*\+3 do Grande Escudo\*\*/.test(AV)
      );
      ok(
        "  Armadura 4 = Cota de Malha (3d) + Elmo (+1d), como manda a tabela",
        /label: "Cota de Malha", protection: "3d"/.test(DATA) &&
          /\*\*Armadura 4\*\* = \*\*Cota de Malha \(3d\) \+ Elmo \(\+1d\)\*\*/.test(AV)
      );

      /* Grito de Triunfo vem do bestiário; as duas do Rei Enforcado, não. */
      ok(
        "  Grito de Triunfo existe no bestiário e é usado por Elstan",
        /name: "Grito de Triunfo"/.test(ADVERSARIES) && /Grito de Triunfo/.test(AV)
      );
      ok(
        '  "Desnortear" e "Encarnação do Horror" ficaram como lacuna',
        /"Desnortear"\*\* e \*\*"Encarnação do Horror"/.test(AV) &&
          !/name: "Desnortear"/.test(ADVERSARIES) &&
          !/name: "Encarnação do Horror"/.test(ADVERSARIES),
        "o original só as NOMEIA — inventar o efeito seria criar regra"
      );

      /* O veneno da festa amarra à regra do capítulo 8. */
      ok(
        "  o veneno da festa usa a regra de Veneno da 2ª edição",
        /não pode descansar/.test(AV) && /Runa de Gandalf/.test(AV)
      );

      /* A lacuna do Troll da Colina é a MESMA da aventura 4 — se um bloco
         aparecer, as duas seções precisam mudar juntas. */
      ok(
        "  a lacuna do Troll da Colina continua declarada",
        /Troll da Colina/.test(AV) && !/id: "troll-da-colina"/.test(ADVERSARIES)
      );
    },
  },
  {
    arquivo: "21-wilderland-07-a-torre-de-urzal-seco.md",
    titulo: "A Torre de Urzal Seco",
    cvrObrigatorias: {
      "CVR-004": "Trolls e o dragão são de Ódio",
      "CVR-006": "a Armadura de Raenar, com dois valores",
      "CVR-010": "Agarrar Vítima que virou Dano Especial",
      "CVR-012": "as Habilidades Sinistras reaproveitadas, e as que viraram lacuna",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-018": "os graus de sucesso",
      "CVR-019": "as ações prolongadas que viram Empreitada de Perícia",
      "CVR-020": "as Tolerâncias que viram Conselho — inclusive a do dragão",
      "CVR-021": "os Eventos de Jornada",
      "CVR-024": "os Testes de Sombra com fonte declarada",
      "CVR-028": "a tabela de queda, lida ao contrário",
      "CVR-030": "as lacunas de Vigor",
    },
    adversarios: {
      "Soldado Orc": "soldado-orc",
      "Arqueiro Goblin": "arqueiro-goblin",
      "Guarda-costas Grande Orc": "guarda-costas-grande-orc",
      "Grande Troll das Cavernas": "grande-troll-das-cavernas",
    },
    /* Troll da Neve e Raenar. */
    blocosEsperados: 2,
    extra(AV) {
      for (const [quem, campo, valor] of [
        ["Troll da Neve", "Nível de Atributo", "8"],
        ["Troll da Neve", "Resistência", "80"],
        ["Troll da Neve", "Ódio", "8"],
        ["Troll da Neve", "Bloqueio", "6"],
        ["Raenar", "Nível de Atributo", "10"],
        ["Raenar", "Resistência", "120"],
        ["Raenar", "Ódio", "12"],
        ["Raenar", "Bloqueio", "12"],
      ]) {
        ok(`  ${quem}: ${campo} = ${valor}`, new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV));
      }

      const vigores = [...AV.matchAll(/\| Vigor \| ([^|]+) \|/g)].map((m) => m[1].trim());
      ok(
        "  os dois blocos declaram o Vigor como lacuna",
        vigores.length === 2 && vigores.every((v) => v.startsWith("**lacuna")),
        `achei ${JSON.stringify(vigores)} — fugir ao ser ferido não é número de Ferimentos`
      );

      /* A Armadura de Raenar tem DOIS valores, e a habilidade Ponto Fraco é
         quem decide qual. Se a linha virar um número só, a regra some. */
      ok(
        "  a Armadura de Raenar guarda os dois valores",
        /\| Armadura \| 6 \(\*\*1\*\* no ponto fraco\) \|/.test(AV) && /Ponto Fraco/.test(AV),
        "o original escreve 6d/1d* — o asterisco é o ponto fraco"
      );

      /* Habilidades que vêm do bestiário. */
      for (const hab of ["Força Horrenda", "Infundir Medo", "Couro Grosso"]) {
        ok(
          `  "${hab}" existe no bestiário e é usada aqui`,
          new RegExp(`name: "${hab}"`).test(ADVERSARIES) && AV.includes(hab)
        );
      }
      /* "Agarrar Vítima" NÃO é habilidade na 2ª edição: é Dano Especial. */
      ok(
        "  Agarrar Vítima virou o Dano Especial Agarrar",
        /specialDamage: \["Agarrar"\]/.test(ADVERSARIES) && /\| Agarrar \|/.test(AV),
        "não é habilidade na 2ª edição — é opção gasta com ícone de Sucesso"
      );
      ok(
        '  "Investida Selvagem" e "Encarnação do Horror" continuam lacuna',
        /"Investida Selvagem"\*\* e \*\*"Encarnação do Horror"/.test(AV) &&
          !/name: "Investida Selvagem"/.test(ADVERSARIES) &&
          !/name: "Encarnação do Horror"/.test(ADVERSARIES)
      );

      /* O Conselho com um adversário — o mais estranho da campanha. */
      ok(
        "  a negociação com o dragão é declarada como Conselho",
        /Conselho com um dragão/.test(AV) && /a audiência é um adversário/.test(AV)
      );

      /* O teste de medo virou Teste de Sombra, como nas aventuras 4 e 6. */
      ok(
        "  o teste de medo virou Teste de Sombra, e o efeito é Arrasado",
        /a 2ª edição não tem teste de medo/.test(AV) && /Arrasado/.test(AV)
      );
    },
  },
];

/* ══════════════════════════════════════════════════════════════════════
   Checagens comuns a todas
   ══════════════════════════════════════════════════════════════════════ */

/* Termos que não podem aparecer NUNCA — nem para explicar. */
const PROIBIDOS = [
  ["Tiro Certeiro", "Dano Especial"],
  ["pontos? de tesouro", "ponto de Tesouro"],
];

/* Termos que PODEM aparecer, mas só dizendo no que viraram. Banir a palavra
   inteira falharia contra o próprio resumo da conversão — a mesma armadilha do
   "Parada" na tabela de conversão. Então se fixa o CONTEXTO. */
const SO_PARA_NEGAR = [
  ["[Cc]omitiva", "Companhia"],
  ["Tolerância", "Conselho"],
  ["[Tt]estes? de corrup[çc][ãa]o", "Teste de Sombra"],
  ["Fase em Sociedade", "Fase de Companhia"],
  ["Called Shot", "Dano Especial"],
];

for (const av of AVENTURAS) {
  console.log(`\n── ${av.titulo} ──`);
  const AV = readFileSync(root("livros", "um-anel", av.arquivo), "utf8");

  /* 1. Citações da régua ------------------------------------------------ */
  const citados = [...new Set([...AV.matchAll(/\bCVR-\d{3}\b/g)].map((m) => m[0]))].sort();
  ok(
    `cita a régua de conversão (${citados.length} entradas)`,
    citados.length >= 10,
    "conversão sem referência é conversão sem régua"
  );
  for (const id of citados) {
    ok(
      `  citação ${id} existe na tabela`,
      entradaTabela(id).length > 0,
      "referência quebrada manda o Mestre procurar o que não existe"
    );
  }
  for (const [id, porque] of Object.entries(av.cvrObrigatorias)) {
    ok(`  usa ${id} (${porque})`, AV.includes(id));
  }

  /* 2. Adversários ------------------------------------------------------ */
  for (const [rotulo, id] of Object.entries(av.adversarios)) {
    ok(
      `  adversário "${rotulo}" (${id}) existe no bestiário`,
      AV.includes(rotulo) &&
        AV.includes(`\`${id}\``) &&
        ADVERSARIES.includes(`name: "${rotulo}"`) &&
        ADVERSARIES.includes(`id: "${id}"`),
      "o id nunca aparece sozinho na tela — o Mestre lê o rótulo, e o id acha o bloco"
    );
  }

  /* 3. Termos de 1ª edição --------------------------------------------- */
  for (const [termo, viraram] of PROIBIDOS) {
    ok(
      `  "${termo}" não sobreviveu (virou ${viraram})`,
      !new RegExp(termo).test(AV),
      "sem exceção: nem no resumo esse termo precisa aparecer"
    );
  }
  /* Nem toda aventura precisa citar todo termo antigo — só quem converte aquilo.
     A regra é condicional: SE aparecer, tem de estar dizendo no que virou.

     A frase é delimitada por PONTO, não por quebra de linha: o markdown quebra
     no meio da frase, e `[^.\n]*` cortava "O `Called Shot`" da explicação que
     vinha na linha seguinte — acusando texto correto. */
  for (const [termo, viraram] of SO_PARA_NEGAR) {
    const frases = [...AV.matchAll(new RegExp(`[^.]*${termo}[^.]*`, "g"))].map((m) => m[0]);
    const soltas = frases.filter((f) => !/vir(ou|aram)|original/.test(f));
    ok(
      `  "${termo}" ${frases.length === 0 ? "não aparece" : `só aparece dizendo que virou ${viraram}`}`,
      soltas.length === 0,
      soltas.map((f) => f.replace(/\s+/g, " ").trim().slice(0, 90)).join(" | ")
    );
  }
  /* Teste de Sombra só é exigido de quem converte teste de corrupção — a
     aventura 3 não tem nenhum, e cobrar dela seria inventar uma regra que a
     fonte não pede. Quem tem, declara CVR-024 em `cvrObrigatorias`. */
  if (av.cvrObrigatorias["CVR-024"]) {
    ok("  o Teste de Sombra aparece no lugar da corrupção", /Teste de Sombra/.test(AV));
  }

  /* NA fixo: pode ser MENCIONADO ao explicar o original, nunca como instrução.
     Dois dígitos de propósito — "a 2ª edição rola contra o NA do Atributo" é a
     forma CERTA e não pode ser acusada por causa do "2ª".

     Delimitado por PONTO e não por quebra de linha: o markdown quebra no meio da
     frase, e "(CVR-017; o\noriginal subia o NA de 12 para 16)" ficava sem a
     palavra que a inocenta. Mesma lição de SO_PARA_NEGAR. */
  const mencoesNA = [...AV.matchAll(/[^.]*\bNA\b(?: de)? \d{2}[^.]*/g)].map((m) => m[0]);
  const semOriginal = mencoesNA.filter((f) => !/original/.test(f));
  ok(
    "  todo NA numérico só aparece explicando o ORIGINAL",
    semOriginal.length === 0,
    semOriginal.map((f) => f.replace(/\s+/g, " ").trim().slice(0, 90)).join(" | ")
  );

  /* 4. Lacunas e blocos inventados -------------------------------------- */
  ok("  tem seção de lacunas registradas", /## Lacunas registradas/.test(AV));
  /* A aventura que tem aranhas em cena precisa MANDAR USAR o bloco, agora que
     ele existe — e não pode continuar dizendo que o bestiário não traz nenhum.
     Ficar em silêncio sobre as duas coisas passaria nos dois testes anteriores. */
  if (av.aranhas) {
    ok(
      "  aponta as aranhas para o bloco do bestiário",
      /bloco de Aranha/i.test(AV) &&
        /`aranha-cacadora`/.test(AV) &&
        /lacuna FECHADA/.test(AV)
    );
    ok(
      "  e não afirma mais que o bestiário não traz bloco de Aranha",
      !/não tra[zg]\w*\s+bloco de Aranha/i.test(AV) ||
        /registrava (uma|a mesma) lacuna|Esta seção registrava/.test(AV),
      "se voltar a afirmar a ausência sem dizer que era o estado ANTERIOR, é claim errado"
    );
  }
  const blocos = [...AV.matchAll(/\| Nível de Atributo \| \d+ \|/g)];
  ok(
    `  só existem ${av.blocosEsperados} bloco(s) de estatística`,
    blocos.length === av.blocosEsperados,
    `achei ${blocos.length}; um bloco a mais seria estatística inventada`
  );

  /* 5. Checagens próprias da aventura ----------------------------------- */
  av.extra(AV);
}

/* ══════════════════════════════════════════════════════════════════════
   A lacuna das Aranhas FOI FECHADA — e os três lados têm de concordar
   ══════════════════════════════════════════════════════════════════════ */

/* Estas três asserções eram negativas ("continua sem bloco") e falharam de
   propósito no dia em que o apêndice de *The Darkening of Mirkwood* apareceu.
   Agora vigiam o outro lado: o bloco existe, a régua parou de listar a lacuna,
   e o texto da regra aponta pra entrada nova. Silenciar qualquer um dos três
   deixaria as aventuras mandando o Mestre buscar bloco fora do corpus. */

console.log("\n── lacunas ──");
ok(
  "o bestiário traduzido AGORA tem bloco de Aranha",
  /id: "aranha-cacadora"/.test(ADVERSARIES) && /name: "Aranha Caçadora"/.test(ADVERSARIES),
  "as seções das aventuras 1 e 2 mandam usar `aranha-cacadora`"
);
ok(
  "e a régua parou de listar Aranha como lacuna em CVR-030",
  !/bloco de Aranha\*\* —/.test(entradaTabela("CVR-030")) &&
    /FOI FECHADA/.test(entradaTabela("CVR-030"))
);
ok(
  "e CVR-035 registra onde a fonte apareceu",
  /apêndice/.test(entradaTabela("CVR-035")) &&
    /Darkening of Mirkwood/.test(entradaTabela("CVR-035")) &&
    /`aranha-cacadora`/.test(entradaTabela("CVR-035"))
);
/* As outras QUATRO lacunas de CVR-030 continuam de pé. Fechar uma não pode
   arrastar as outras junto. */
for (const restante of ["Vigor", "NA fixo", "Tolerância", "Prestígio"]) {
  ok(
    `  CVR-030 continua registrando a lacuna: ${restante}`,
    new RegExp(restante).test(entradaTabela("CVR-030"))
  );
}

console.log(`\nverify-um-anel-aventuras-wilderland: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
