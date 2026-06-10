import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** [classe, subclasse, especialidade, passivo nv2, ...talentos] */
const raw = [
  ["Guerreiro", "Caçador de Feras", "Feras e Bestiais", "Assimilação de feras: +2 FOR e regen 3 HP/turno por 4h", 4, "Corte Limpo", 8, "Maestria Voraz", 12, "Abate Perfeito", 16, "Sangue de Predador", 20, "Legado do Predador"],
  ["Guerreiro", "Quebrador de Carapaças", "Carapaças e Insetoides", "Assimilação de artropodes: imune a críticos temporário e +2 CA por 8h", 4, "Percussão Penetrante", 8, "Estrutura Quitinosa", 12, "Esmagamento Total", 16, "Corpo de Crustáceo", 20, "Carapaça Viva"],
  ["Guerreiro", "Cavaleiro Dracônico", "Escamosos e Draconídeos", "Assimilação dracônica: resistência elemental e baforada 2d6", 4, "Escama de Wyrm", 8, "Ira Dracônica", 12, "Herança de Sangue", 16, "Majestade do Dragão", 20, "Ascensão Dracônica"],
  ["Guerreiro", "Sentinela das Profundezas", "Aquáticos e Anfíbios", "Assimilação aquática: respiração submersa, nado 12m", 4, "Combate Subaquático", 8, "Pele Anfíbia", 12, "Pressão das Profundezas", 16, "Mestre das Águas Negras", 20, "Forma Abissal"],
  ["Patrulheiro", "Caçador do Céu", "Aves e Voadores", "Assimilação de aves: visão 36m e +9m alcance por 8h", 4, "Tiro de Precisão", 8, "Rastreio Aéreo", 12, "Olho de Falcão", 16, "Golpe Celeste", 20, "Ataque de Mergulho"],
  ["Patrulheiro", "Explorador de Esporos", "Flora e Fungos", "Assimilação de flora: imune a controle mental", 4, "Identificação de Flora", 8, "Flechas de Esporo", 12, "Nuvem de Cura", 16, "Rede de Raízes", 20, "Florescimento Tóxico"],
  ["Patrulheiro", "Rastreador de Escamas", "Répteis e Basiliscos", "Assimilação de répteis: imune a petrificação", 4, "Rastejamento Silencioso", 8, "Sentido Térmico", 12, "Escamas Adaptativas", 16, "Olhar Frio", 20, "Forma de Réptil"],
  ["Patrulheiro", "Mestre de Enxame", "Pragas e Insetos", "Assimilação de insetos: telepatia local com enxames", 4, "Sentido de Formigueiro", 8, "Direção de Enxame", 12, "Convocação de Insetos", 16, "Mente Coletiva", 20, "Infestação"],
  ["Ladino", "Sombra Etérea", "Espirituais", "Assimilação ectoplásmica: intangível 1 turno", 4, "Toque Fantasmal", 8, "Passo entre Sombras", 12, "Absorção de Éter", 16, "Forma Translúcida", 20, "Mente Morta"],
  ["Ladino", "Forma Amorfa", "Amorfos e Slimes", "Assimilação de slimes: elasticidade e resistência a ácido", 4, "Flexibilidade Extrema", 8, "Absorção de Impacto", 12, "Forma Fluida", 16, "Corpo de Gel", 20, "Dissolução"],
  ["Ladino", "Assassino Venenoso", "Peçonhentos", "Assimilação venenosa: +1d4 dano de veneno em ataques", 4, "Resistência a Veneno", 8, "Aplicação Rápida", 12, "Veneno Personalizado", 16, "Imunidade Total", 20, "Veneno Lendário"],
  ["Ladino", "Corsário de Cripta", "Ossos e Mortos-Vivos", "Assimilação óssea: fingir morte, resistência a necrótico", 4, "Sussurro de Tumba", 8, "Aparência Cadavérica", 12, "Aura de Morte", 16, "Controle de Morto-Vivo", 20, "Senhor da Cripta"],
  ["Mago", "Piromante das Brasas", "Fogo e Calor", "Assimilação ígnea: feitiços de fogo +1d6 vs gelo/água", 4, "Chama Controlada", 8, "Forno de Campo", 12, "Combustão Arcana", 16, "Brasas Persistentes", 20, "Coração do Forno"],
  ["Mago", "Criomante do Gelo", "Gelo e Conservação", "Assimilação glacial: aura de frio e +3 CA", 4, "Gelar Ingrediente", 8, "Câmara Fria Portátil", 12, "Escudo de Geada", 16, "Envelhecimento Instantâneo", 20, "Zero Absoluto"],
  ["Mago", "Mago Alquímico", "Fermentados e Catalisadores", "Assimilação alquímica: imune a ilusão", 4, "Fermentação Acelerada", 8, "Cultura Viva", 12, "Nuvem Bacteriana", 16, "Transmutação Enzimática", 20, "Grande Barril"],
  ["Mago", "Alquimista Ácido", "Ácidos e Líquidos", "Assimilação ácida: névoa corrosiva e resistências", 4, "Caldo Corrosivo", 8, "Sopa de Resistência", 12, "Névoa de Caldeira", 16, "Extração Líquida", 20, "Maré Ácida"],
  ["Mago", "Mago dos Encantos", "Encantamento e Ilusão", "Assimilação arcana: encantamentos com vantagem", 4, "Doce Encantador", 8, "Banquete Mínimo", 12, "Açúcar Cristalizado", 16, "Festa Hipnótica", 20, "Império do Doce"],
  ["Clérigo", "Sacerdote Purificador", "Amaldiçoados", "Assimilação purificada: +3 em testes contra mal", 4, "Purificar Veneno", 8, "Lâminas Abençoadas", 12, "Purificação Abençoada", 16, "Aura Sagrada", 20, "Julgamento Final"],
  ["Clérigo", "Monge Ascético", "Energia Interna", "Jejum de masmorra 8h+: +4 esquiva e dano radiante", 4, "Disciplina Vazia", 8, "Golpe do Jejum", 12, "Jejum Prolongado", 16, "Corpo Templo", 20, "Transfiguração pelo Vazio"],
  ["Clérigo", "Clérigo do Sustento", "Flora Divina", "Assimilação divina: HP temporários nv×3 ao grupo", 4, "Pão da Manhã", 8, "Fermento Sagrado", 12, "Mesa Abundante", 16, "Bênção do Forno", 20, "Milagre do Sustento"],
  ["Clérigo", "Pastor de Quimeras", "Monstros Mistos", "Assimilação quimérica: aura animal aliada", 4, "Ecologia Sagrada", 8, "Aura Dupla", 12, "Chamado do Rebanho", 16, "Sincretismo", 20, "Cordeiro e Leão"],
  ["Clérigo", "Clérigo do Limiar", "Mortos-vivos", "Assimilação liminar: servos ignoram você como alvo", 4, "Domínio do Limiar", 8, "Colheita de Alma", 12, "Sacrifício Ritual", 16, "Senhor da Fronteira", 20, "Desejo do Limiar"],
  ["Bárbaro", "Devorador de Essência", "Órgãos Vitais", "Assimilação vital: traço instintivo 24h", 4, "Mordida do Coração", 8, "Instinto Roubado", 12, "Coração Duplo", 16, "Predador Alfa", 20, "Legião de Corações"],
  ["Bárbaro", "Mandíbula de Ferro", "Ossos e Carapaças", "Assimilação quitinosa: +1d6 perfurante", 4, "Mastigador", 8, "Ossos como Arma", 12, "Mandíbula de Ferro", 16, "Esmagar Crânio", 20, "Titereiro de Quitina"],
  ["Bárbaro", "Colosso do Gelo", "Gordura e Gigantes", "Assimilação glacial: imune a frio", 4, "Reserva de Gordura", 8, "Avalanche", 12, "Hibernação de Combate", 16, "Pele de Mamute", 20, "Inverno Eterno"],
  ["Bárbaro", "Berserker Veloz", "Metabolismo Acelerado", "Assimilação acelerada: velocidade dobrada em fúria", 4, "Pico de Açúcar", 8, "Rush Doce", 12, "Metabolismo Queimado", 16, "Sobredose Controlada", 20, "Fúria Incandescente"],
  ["Bardo", "Estratega de Masmorra", "Fermentados", "Assimilação tática: cura de magias do bardo maximizada", 4, "Harmonização de Taças", 8, "Menu de Expedição", 12, "Reserva Envelhecida", 16, "Brinde de Batalha", 20, "Grande Cru"],
  ["Bardo", "Bardo Fermentador", "Fungos e Levedura", "Assimilação fúngica: HP temp = Inspiração", 4, "Fermento de Masmorra", 8, "Ressaca Positiva", 12, "Canção Ébria", 16, "Barril Explosivo", 20, "Festa dos Fungos"],
  ["Bardo", "Dançarino das Lâminas", "Aves", "Assimilação aérea: CAR para atacar à distância", 4, "Arremesso Rítmico", 8, "Dança de Lâminas", 12, "Espectáculo Sangrento", 16, "Faca Volta", 20, "Finale das Facas"],
  ["Bardo", "Cantor dos Venenos", "Ervas e Toxinas", "Assimilação herbal: +3 CD de ilusão", 4, "Nota Picante", 8, "Refrão Queima", 12, "Sinfonia de Ervas", 16, "Encanto Culinário", 20, "Ode ao Veneno"],
  ["Druida", "Círculo da Podridão", "Fungos Necróticos", "Assimilação necrótica: imune a dano necrótico", 4, "Esporos Necróticos", 8, "Podridão Fertil", 12, "Toque de Bolor", 16, "Grande Decomposição", 20, "Ciclo da Podridem"],
  ["Druida", "Círculo do Predador", "Feras e Bestiais", "Forma selvagem: HP extra ao transformar", 4, "Forma Aprimorada", 8, "Fusão Biomágica", 12, "Forma Monstruosa", 16, "Caça Alpha", 20, "Forma Lendária"],
  ["Druida", "Círculo da Simbiose", "Sementes Mágicas", "Assimilação simbiótica: rebate 1d6 cortante", 4, "Semente Guardiã", 8, "Rede Simbiótica", 12, "Vinha Agarradora", 16, "Floresta em Miniatura", 20, "Corpo Bosque"],
  ["Druida", "Círculo da Terra", "Minerais e Terra", "Assimilação telúrica: resistência a contundente", 4, "Morder a Terra", 8, "Pele de Pedra", 12, "Tremor Leve", 16, "Golem Momentâneo", 20, "Montanha Viva"],
  ["Artífice", "Ferreiro de Campo", "Carapaças", "Assimilação de exoesqueletos: +2 CA em armadura improvisada", 4, "Panela Viva", 8, "Armadura de Caldeirão", 12, "Reforço de Campo", 16, "Forja Rápida", 20, "Mestre de Campo"],
  ["Artífice", "Engenheiro de Explosivos", "Inflamáveis", "Assimilação inflamável: bombas +2d6 fogo", 4, "Fogareiro Portátil", 8, "Bomba de Glândula", 12, "Caldeira a Pressão", 16, "Motor de Vapor Menor", 20, "Inferno Controlado"],
  ["Artífice", "Biólogo de Masmorra", "Ácidos e Venenos", "Assimilação tóxica: imune veneno, +1d6 ácido", 4, "Seringa Básica", 8, "Catalisador", 12, "Laboratório de Campo", 16, "Mutágeno de Batalha", 20, "Mutação Direcionada"],
  ["Artífice", "Construtor de Armadilhas", "Caça e Extração", "Assimilação de caça: vantagem em INT para armadilhas", 4, "Armadilha Biológica", 8, "Extração Perfeita", 12, "Rede de Campo", 16, "Engenho de Caça", 20, "Arquiteto da Masmorra"],
  ["Paladino", "Jurado do Sol", "Celestiais e Luminosos", "Assimilação solar: resistência radiante, visão 18m e +2 em saves vs medo por 8h", 4, "Luz Penitente", 8, "Escudo Solar", 12, "Julgamento Ardente", 16, "Coroa de Fogo", 20, "Avatar do Amanhecer"],
  ["Paladino", "Cavaleiro do Limiar", "Mortos-Vivos Sagrados", "Assimilação liminar sagrada: resistência necrótico; mortos-vivos têm desvantagem para escolhê-lo como alvo", 4, "Lâmina dos Sepulcros", 8, "Voto de Caça", 12, "Marca do Limiar", 16, "Processão Silenciosa", 20, "Cavaleiro Espectral"],
  ["Paladino", "Guardião da Gorge", "Bestas Sagradas e Quimeras", "Assimilação quimérica: +2 CON e aliados adjacentes +1 CA por 8h", 4, "Mordida do Voto", 8, "Fera Interior", 12, "Carga do Juramento", 16, "Pele de Quimera", 20, "Forma do Guardião"],
  ["Bruxo", "Filho da Voragem", "Aberrações e Tentáculos", "Assimilação aberrante: resistência psíquico e +3m alcance em magias de controle por 8h", 4, "Toque da Voragem", 8, "Olhar Entre Dimensões", 12, "Agarrão do Pacto", 16, "Mente Partida", 20, "Boca do Abismo"],
  ["Bruxo", "Herdeiro do Sangue", "Diabos e Sangue Amaldiçoado", "Assimilação infernal: resistência fogo; ao reduzir inimigo a 0 HP recupera HP temp = CAR", 4, "Contrato Ardente", 8, "Sangue do Patrono", 12, "Pacto de Ferro", 16, "Correntes Infernais", 20, "Tirano do Sangue"],
  ["Bruxo", "Voz das Profundezas", "Aquáticos Antigos e Lodo", "Assimilação abissal: respiração aquática e magias de encantamento +1 CD por 8h", 4, "Sussurro Salino", 8, "Corrente Mental", 12, "Manto de Bruma", 16, "Puxão Abissal", 20, "Hino das Profundezas"],
];

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const tracks = raw.map((row) => {
  const [classId, subclass, specialty, diet, ...rest] = row;
  const talents = [];
  for (let i = 0; i < rest.length; i += 2) {
    const level = rest[i];
    const name = rest[i + 1];
    const id = slug(name);
    const prevId = i >= 2 ? slug(rest[i - 1]) : null;
    talents.push({
      level,
      id,
      name,
      kind: level === 20 ? "ascension" : "talent",
      requires: level > 4 && level < 20 ? prevId : null,
    });
  }
  return { id: slug(subclass), classId, subclass, specialty, diet, talents };
});

const out = path.join(__dirname, "..", "data", "character", "subclass-tracks.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ version: 2, tracks }, null, 2));
console.log("Wrote", tracks.length, "tracks to", out);
