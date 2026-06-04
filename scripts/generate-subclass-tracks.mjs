import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const raw = [
  ["Guerreiro", "Predador Voraz", "Feras e Bestiais", "Carne vermelha de feras: +2 FOR e regen 3 HP/turno por 4h", 4, "Corte Limpo", 8, "Maestria Voraz", 12, "Abate Perfeito", 16, "Sangue de Predador", 20, "Legado do Predador"],
  ["Guerreiro", "Quebra-Cascos", "Carapaças e Insetoides", "Artropodes: imune a críticos temporário e +2 CA por 8h", 4, "Percussão Penetrante", 8, "Estrutura Quitinosa", 12, "Esmagamento Total", 16, "Corpo de Crustáceo", 20, "Carapaça Viva"],
  ["Guerreiro", "Cavaleiro Dracônico", "Escamosos e Draconídeos", "Répteis/dracônicos: resistência elemental e baforada 2d6", 4, "Escama de Wyrm", 8, "Ira Dracônica", 12, "Herança de Sangue", 16, "Majestade do Dragão", 20, "Ascensão Dracônica"],
  ["Guerreiro", "Guerreiro das Profundezas", "Aquáticos e Anfíbios", "Aquáticos: respiração aquática, nado 12m", 4, "Combate Subaquático", 8, "Pele Anfíbia", 12, "Pressão das Profundezas", 16, "Mestre das Águas Negras", 20, "Forma Abissal"],
  ["Patrulheiro", "Caçador Celeste", "Aves e Voadores", "Aves: visão 36m e +9m alcance por 8h", 4, "Tiro de Precisão", 8, "Rastreio Aéreo", 12, "Olho de Falcão", 16, "Golpe Celeste", 20, "Ataque de Mergulho"],
  ["Patrulheiro", "Forrageiro dos Esporos", "Flora e Fungos", "Flora/fungos: imune controle mental", 4, "Identificação de Flora", 8, "Flechas de Esporo", 12, "Nuvem de Cura", 16, "Rede de Raízes", 20, "Florescimento Tóxico"],
  ["Patrulheiro", "Rastreador de Sangue Frio", "Répteis e Basiliscos", "Répteis: imune petrificação", 4, "Rastejamento Silencioso", 8, "Sentido Térmico", 12, "Escamas Adaptativas", 16, "Olhar Frio", 20, "Forma de Réptil"],
  ["Patrulheiro", "Guia de Enxame", "Pragas e Insetos", "Insetos: telepatia local", 4, "Sentido de Formigueiro", 8, "Direção de Enxame", 12, "Convocação de Insetos", 16, "Mente Coletiva", 20, "Infestação"],
  ["Ladino", "Degustador de Sombras", "Espirituais", "Ectoplasma: intangível 1 turno", 4, "Toque Fantasmal", 8, "Passo entre Sombras", 12, "Absorção de Éter", 16, "Forma Translúcida", 20, "Mente Morta"],
  ["Ladino", "Extrator de Geleias", "Amorfos e Slimes", "Slimes: elasticidade e resistência ácido", 4, "Flexibilidade Extrema", 8, "Absorção de Impacto", 12, "Forma Fluida", 16, "Corpo de Gel", 20, "Dissolução"],
  ["Ladino", "Ladrão de Glândulas", "Peçonhentos", "Veneno purificado: +1d4 veneno", 4, "Resistência a Veneno", 8, "Aplicação Rápida", 12, "Veneno Personalizado", 16, "Imunidade Total", 20, "Veneno Lendário"],
  ["Ladino", "Corsário de Cripta", "Ossos e Mortos-Vivos", "Ossos: fingir morte, resistência necrotico", 4, "Sussurro de Tumba", 8, "Aparência Cadavérica", 12, "Aura de Morte", 16, "Controle de Morto-Vivo", 20, "Senhor da Cripta"],
  ["Mago", "Piromante de Forno", "Calor e Assados", "Assados maximizam mana do grupo", 4, "Chama Controlada", 8, "Forno de Campo", 12, "Combustão Arcana", 16, "Brasas Persistentes", 20, "Coração do Forno"],
  ["Mago", "Criomante de Conservação", "Gelo e Dry-Aged", "Dry-aged: aura frio e +3 CA", 4, "Gelar Ingrediente", 8, "Câmara Fria Portátil", 12, "Escudo de Geada", 16, "Envelhecimento Instantâneo", 20, "Zero Absoluto"],
  ["Mago", "Mago Fermentador", "Fermentados", "Fermentados: imune ilusão", 4, "Fermentação Acelerada", 8, "Cultura Viva", 12, "Nuvem Bacteriana", 16, "Transmutação Enzimática", 20, "Grande Barril"],
  ["Mago", "Alquimista de Caldos", "Ácidos e Líquidos", "Sopas: ácido ou névoa venenosa", 4, "Caldo Corrosivo", 8, "Sopa de Resistência", 12, "Névoa de Caldeira", 16, "Extração Líquida", 20, "Maré Ácida"],
  ["Mago", "Mago Confeiteiro", "Doces Mágicos", "Glicose arcana: encantamento grátis", 4, "Doce Encantador", 8, "Banquete Mínimo", 12, "Açúcar Cristalizado", 16, "Festa Hipnótica", 20, "Império do Doce"],
  ["Clérigo", "Sacerdote da Purificação", "Amaldiçoados", "Carnes purificadas: +3 vs mal", 4, "Purificar Veneno", 8, "Lâminas Abençoadas", 12, "Purificação Abençoada", 16, "Aura Sagrada", 20, "Julgamento da Mesa"],
  ["Clérigo", "Monge do Jejum", "Energia Interna", "Jejum 8h+: +4 esquiva e radiante", 4, "Disciplina Vazia", 8, "Golpe do Jejum", 12, "Jejum Prolongado", 16, "Corpo Templo", 20, "Transfiguração pelo Vazio"],
  ["Clérigo", "Clérigo do Pão da Vida", "Flora Divina", "Pães: HP temp nv×3", 4, "Pão da Manhã", 8, "Fermento Sagrado", 12, "Mesa Abundante", 16, "Bênção do Forno", 20, "Milagre do Pão"],
  ["Clérigo", "Pastor de Quimeras", "Monstros Mistos", "Quimeras: aura animal", 4, "Ecologia Sagrada", 8, "Aura Dupla", 12, "Chamado do Rebanho", 16, "Sincretismo", 20, "Cordeiro e Leão"],
  ["Clérigo", "Clérigo do Limiar", "Mortos-vivos (Necromântica)", "Ossos: servos ignoram você como alvo", 4, "Domínio do Limiar", 8, "Colheita de Alma", 12, "Sacrifício Ritual", 16, "Senhor da Fronteira", 20, "Desejo do Limiar"],
  ["Bárbaro", "Devorador de Corações", "Órgãos Vitais", "Coração: traço instintivo 24h", 4, "Mordida do Coração", 8, "Instinto Roubado", 12, "Coração Duplo", 16, "Predador Alfa", 20, "Legião de Corações"],
  ["Bárbaro", "Mandíbula de Ferro", "Ossos e Carapaças", "Exoesqueletos: +1d6 perfurante", 4, "Mastigador", 8, "Ossos como Arma", 12, "Mandíbula de Ferro", 16, "Esmagar Crânio", 20, "Titereiro de Quitina"],
  ["Bárbaro", "Ruminante das Neves", "Gordura e Gigantes", "Gordura: imune frio", 4, "Reserva de Gordura", 8, "Avalanche", 12, "Hibernação de Combate", 16, "Pele de Mamute", 20, "Inverno Eterno"],
  ["Bárbaro", "Frenético do Açúcar", "Doces Mágicos", "Glicose: velocidade dobrada", 4, "Pico de Açúcar", 8, "Rush Doce", 12, "Metabolismo Queimado", 16, "Sobredose Controlada", 20, "Diabetes Arcano"],
  ["Bardo", "Sommelier de Masmorra", "Fermentados", "Bebidas maximizam cura", 4, "Harmonização de Taças", 8, "Menu de Expedição", 12, "Reserva Envelhecida", 16, "Brinde de Batalha", 20, "Grande Cru"],
  ["Bardo", "Bardo Cervejeiro", "Fungos e Levedura", "Cerveja: HP temp = Inspiração", 4, "Fermento de Masmorra", 8, "Ressaca Positiva", 12, "Canção Ébria", 16, "Barril Explosivo", 20, "Festa dos Fungos"],
  ["Bardo", "Dançarino das Facas", "Aves", "Aves: CAR para atacar", 4, "Arremesso Rítmico", 8, "Dança de Lâminas", 12, "Espectáculo Sangrento", 16, "Faca Volta", 20, "Finale das Facas"],
  ["Bardo", "Cantor das Especiarias", "Ervas", "Especiarias: +3 CD ilusão", 4, "Nota Picante", 8, "Refrão Queima", 12, "Sinfonia de Ervas", 16, "Encanto Culinário", 20, "Ode ao Wasabi"],
  ["Druida", "Círculo da Decomposição", "Fungos Necróticos", "Cogumelos: imune necrotico", 4, "Esporos Necróticos", 8, "Podridão Fertil", 12, "Toque de Bolor", 16, "Grande Decomposição", 20, "Ciclo da Podridem"],
  ["Druida", "Círculo do Superpredador", "Carne Crua de Feras", "Forma Selvagem: HP extra", 4, "Forma Aprimorada", 8, "Fusão Biomágica", 12, "Forma Monstruosa", 16, "Caça Alpha", 20, "Forma Lendária"],
  ["Druida", "Círculo da Simbiose", "Sementes Mágicas", "Vinhas: rebate 1d6 cortante", 4, "Semente Guardiã", 8, "Rede Simbiótica", 12, "Vinha Agarradora", 16, "Floresta em Miniatura", 20, "Corpo Bosque"],
  ["Druida", "Círculo do Solo Vivo", "Minerais e Terra", "Pedras: resistência contundente", 4, "Morder a Terra", 8, "Pele de Pedra", 12, "Tremor Leve", 16, "Golem Momentâneo", 20, "Montanha Viva"],
  ["Artífice", "Ferreiro de Utensílios", "Carapaças", "Panelas de exoesqueleto: +2 CA", 4, "Panela Viva", 8, "Armadura de Caldeirão", 12, "Reforço de Campo", 16, "Forja Rápida", 20, "Mestre de Utensílios"],
  ["Artífice", "Engenheiro de Fogareiros", "Inflamáveis", "Glandulas: resistência fogo, bombas +2d6", 4, "Fogareiro Portátil", 8, "Bomba de Glândula", 12, "Caldeira a Pressão", 16, "Motor de Vapor Menor", 20, "Inferno Controlado"],
  ["Artífice", "Biólogo Alquímico", "Ácidos e Venenos", "Micro-doses: imune veneno, +1d6 ácido", 4, "Seringa Básica", 8, "Catalisador", 12, "Laboratório de Campo", 16, "Mutágeno de Batalha", 20, "Mutação Direcionada"],
  ["Artífice", "Construtor de Armadilhas", "Caça Intacta", "Carne intacta: Vantagem INT/invenções", 4, "Armadilha Biológica", 8, "Extração Perfeita", 12, "Rede de Campo", 16, "Engenho de Caça", 20, "Arquiteto da Masmorra"],
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
fs.writeFileSync(out, JSON.stringify({ version: 1, tracks }, null, 2));
console.log("Wrote", tracks.length, "tracks to", out);
