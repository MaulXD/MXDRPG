# Bestiário Eldarin: livro x dado gerado

Somente leitura. Nenhum gerador, JSON, livro ou commit foi alterado.

Objetivo: comparar, espécime por espécime, vida, CA, PA, nível/ameaça, tamanho e cada ataque (dano, tipo e alcance em células) entre o bestiário do livro e `data/compendiums/monstros.json`.

## Escopo e método

- Bestiário do livro: `livros/LIVRO-DO-MESTRE.md`, fichas `## 001` a `## 080` (001-055 em tabela `Estatística | Valor`; 056-080 em tabela compacta `HP | CA | Dano | Tamanho | Biomas`). Fora de escopo: `livros/um-anel/`.
- Dado: `data/compendiums/monstros.json` (83 entradas). As 80 fichas casam por `system.catalogId` `MON-001` a `MON-080`. Os 3 aliases de spawn (`MON-SPAWN-*`: Goblin, Esqueleto de Guarda, Slime de Masmorra) não têm ficha numerada e ficam fora da comparação.
- Gerador: `scripts/generate-compendium.mjs` (tabela `MONSTERS`, linhas 223-307; `mob()`, linhas 181-216; `monsterActions()`, linhas 102-166). Curvas de HP/CA em `scripts/monster-balance.mjs:19-47`. Tamanho em `data/monster-tamanhos.json`, sincronizado por `scripts/sync-monster-book-tamanhos.mjs`.
- Regra: livro manda (decisão D4 em `docs/CLAUDE-PROJETO.md:495`). Quando há divergência, o valor do livro é o correto e a mudança vai no gerador.
- Conversão: **1 célula = 1,5 m** (`livros/LIVRO-DO-JOGADOR.md:360`). Células = `floor(metros / 1,5)`.
- PA segue a regra geral do livro, não uma ficha por monstro: comuns e mini-boss **6 PA** (`livros/LIVRO-DO-JOGADOR.md:220`), boss **9 PA** (`livros/LIVRO-DO-JOGADOR.md:221`).
- Scripts de extração (pasta `scratchpad/balance/`): `bestiario-explora.mjs`, `bestiario-compare.mjs`, `bestiario-doc.mjs`. Dados brutos em `bestiario-extracao.json`.

Achado estrutural: HP, CA, PA e ameaça no dado **não são lidos do livro**. O gerador calcula HP e CA por curva de `monster-balance.mjs`, PA por tier e ameaça pelo argumento `nivel` da chamada `mob`; os ataques saem do template `monsterActions()` por tier/nível. Daí o volume de divergências abaixo.

## 1. Divergências reais

### 1.1 Vida (77)

Onde mudar: linha da chamada `mob` indicada; se a ficha não usar flag `hp`/`hpDelta`, ajustar também a curva `defaultMonsterHp` em `scripts/monster-balance.mjs:19-33`.

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-esqueleto-armado | Esqueleto Armado | vida (HP) | 22 | 18 (livros/LIVRO-DO-MESTRE.md:594) | scripts/generate-compendium.mjs:225 |
| monstros-necrofago | Necrófago | vida (HP) | 28 | 36 (livros/LIVRO-DO-MESTRE.md:637) | scripts/generate-compendium.mjs:226 |
| monstros-espectro | Espectro | vida (HP) | 48 | 28 (livros/LIVRO-DO-MESTRE.md:679) | scripts/generate-compendium.mjs:227 |
| monstros-assombracao | Assombração | vida (HP) | 28 | 45 (livros/LIVRO-DO-MESTRE.md:767) | scripts/generate-compendium.mjs:229 |
| monstros-vampiro | Vampiro | vida (HP) | 166 | 144 (livros/LIVRO-DO-MESTRE.md:804) | scripts/generate-compendium.mjs:230 |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | vida (HP) | 56 | 68 (livros/LIVRO-DO-MESTRE.md:850) | scripts/generate-compendium.mjs:231 |
| monstros-mumia | Múmia | vida (HP) | 56 | 58 (livros/LIVRO-DO-MESTRE.md:888) | scripts/generate-compendium.mjs:232 |
| monstros-dragonete-de-magma | Dragonete de Magma | vida (HP) | 64 | 45 (livros/LIVRO-DO-MESTRE.md:932) | scripts/generate-compendium.mjs:233 |
| monstros-wyvern | Wyvern | vida (HP) | 88 | 110 (livros/LIVRO-DO-MESTRE.md:971) | scripts/generate-compendium.mjs:234 |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | vida (HP) | 210 | 178 (livros/LIVRO-DO-MESTRE.md:1015) | scripts/generate-compendium.mjs:235 |
| monstros-drake-de-pedra | Drake de Pedra | vida (HP) | 56 | 62 (livros/LIVRO-DO-MESTRE.md:1058) | scripts/generate-compendium.mjs:236 |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | vida (HP) | 300 | 546 (livros/LIVRO-DO-MESTRE.md:1095) | scripts/generate-compendium.mjs:237 |
| monstros-golem-de-pedra | Golem de Pedra | vida (HP) | 104 | 92 (livros/LIVRO-DO-MESTRE.md:1143) | scripts/generate-compendium.mjs:238 |
| monstros-armadura-animada | Armadura Animada | vida (HP) | 21 | 33 (livros/LIVRO-DO-MESTRE.md:1178) | scripts/generate-compendium.mjs:239 |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | vida (HP) | 125 | 152 (livros/LIVRO-DO-MESTRE.md:1212) | scripts/generate-compendium.mjs:240 |
| monstros-automato-de-genio | Autômato de Gênio | vida (HP) | 72 | 105 (livros/LIVRO-DO-MESTRE.md:1250) | scripts/generate-compendium.mjs:241 |
| monstros-minotauro | Minotauro | vida (HP) | 64 | 76 (livros/LIVRO-DO-MESTRE.md:1293) | scripts/generate-compendium.mjs:242 |
| monstros-basilisco | Basilisco | vida (HP) | 72 | 52 (livros/LIVRO-DO-MESTRE.md:1330) | scripts/generate-compendium.mjs:243 |
| monstros-manticora | Manticora | vida (HP) | 80 | 98 (livros/LIVRO-DO-MESTRE.md:1368) | scripts/generate-compendium.mjs:244 |
| monstros-grifo | Grifo | vida (HP) | 56 | 88 (livros/LIVRO-DO-MESTRE.md:1404) | scripts/generate-compendium.mjs:245 |
| monstros-cocatriz | Cocatriz | vida (HP) | 26 | 27 (livros/LIVRO-DO-MESTRE.md:1440) | scripts/generate-compendium.mjs:246 |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | vida (HP) | 22 | 26 (livros/LIVRO-DO-MESTRE.md:1482) | scripts/generate-compendium.mjs:247 |
| monstros-escorpiao-gigante | Escorpião Gigante | vida (HP) | 28 | 52 (livros/LIVRO-DO-MESTRE.md:1525) | scripts/generate-compendium.mjs:248 |
| monstros-centopeia-caustica | Centopeia Cáustica | vida (HP) | 34 | 65 (livros/LIVRO-DO-MESTRE.md:1562) | scripts/generate-compendium.mjs:249 |
| monstros-besouro-diamante | Besouro-Diamante | vida (HP) | 56 | 12 (livros/LIVRO-DO-MESTRE.md:1599) | scripts/generate-compendium.mjs:250 |
| monstros-sapo-engolidor | Sapo-Engolidor | vida (HP) | 64 | 75 (livros/LIVRO-DO-MESTRE.md:1638) | scripts/generate-compendium.mjs:251 |
| monstros-kraken-menor | Kraken Menor | vida (HP) | 196 | 135 (livros/LIVRO-DO-MESTRE.md:1675) | scripts/generate-compendium.mjs:252 |
| monstros-serpente-do-abismo | Serpente-do-Abismo | vida (HP) | 80 | 85 (livros/LIVRO-DO-MESTRE.md:1714) | scripts/generate-compendium.mjs:253 |
| monstros-tubarao-cego | Tubarão-Cego | vida (HP) | 56 | 58 (livros/LIVRO-DO-MESTRE.md:1752) | scripts/generate-compendium.mjs:254 |
| monstros-goblin-de-caverna | Goblin de Caverna | vida (HP) | 8 | 7 (livros/LIVRO-DO-MESTRE.md:1794) | scripts/generate-compendium.mjs:255 |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | vida (HP) | 28 | 11 (livros/LIVRO-DO-MESTRE.md:1832) | scripts/generate-compendium.mjs:256 |
| monstros-orc-de-masmorra | Orc de Masmorra | vida (HP) | 34 | 15 (livros/LIVRO-DO-MESTRE.md:1868) | scripts/generate-compendium.mjs:257 |
| monstros-cogumelo-rei | Cogumelo-Rei | vida (HP) | 72 | 68 (livros/LIVRO-DO-MESTRE.md:1909) | scripts/generate-compendium.mjs:258 |
| monstros-treant-podre | Treant Podre | vida (HP) | 114 | 105 (livros/LIVRO-DO-MESTRE.md:1946) | scripts/generate-compendium.mjs:259 |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | vida (HP) | 40 | 55 (livros/LIVRO-DO-MESTRE.md:1982) | scripts/generate-compendium.mjs:260 |
| monstros-slime-de-cristal | Slime de Cristal | vida (HP) | 28 | 38 (livros/LIVRO-DO-MESTRE.md:2060) | scripts/generate-compendium.mjs:262 |
| monstros-elemental-de-fogo | Elemental de Fogo | vida (HP) | 64 | 102 (livros/LIVRO-DO-MESTRE.md:2096) | scripts/generate-compendium.mjs:263 |
| monstros-elemental-de-gelo | Elemental de Gelo | vida (HP) | 64 | 114 (livros/LIVRO-DO-MESTRE.md:2132) | scripts/generate-compendium.mjs:264 |
| monstros-yeti-das-profundezas | Yeti das Profundezas | vida (HP) | 104 | 72 (livros/LIVRO-DO-MESTRE.md:2174) | scripts/generate-compendium.mjs:265 |
| monstros-lobo-do-inverno | Lobo do Inverno | vida (HP) | 28 | 75 (livros/LIVRO-DO-MESTRE.md:2212) | scripts/generate-compendium.mjs:266 |
| monstros-mimico-de-bau | Mímico de Baú | vida (HP) | 34 | 58 (livros/LIVRO-DO-MESTRE.md:2251) | scripts/generate-compendium.mjs:267 |
| monstros-metamorfo-dubio | Metamorfo Dúbio | vida (HP) | 56 | 52 (livros/LIVRO-DO-MESTRE.md:2290) | scripts/generate-compendium.mjs:268 |
| monstros-hidra-das-cavernas | Hidra das Cavernas | vida (HP) | 152 | 136 (livros/LIVRO-DO-MESTRE.md:2332) | scripts/generate-compendium.mjs:269 |
| monstros-quimera | Quimera | vida (HP) | 166 | 114 (livros/LIVRO-DO-MESTRE.md:2375) | scripts/generate-compendium.mjs:270 |
| monstros-anjo-caido | Anjo Caído | vida (HP) | 225 | 168 (livros/LIVRO-DO-MESTRE.md:2413) | scripts/generate-compendium.mjs:271 |
| monstros-gargula-de-cristal | Gárgula de Cristal | vida (HP) | 34 | 52 (livros/LIVRO-DO-MESTRE.md:2452) | scripts/generate-compendium.mjs:272 |
| monstros-aberracao-tentacular | Aberração Tentacular | vida (HP) | 80 | 112 (livros/LIVRO-DO-MESTRE.md:2488) | scripts/generate-compendium.mjs:273 |
| monstros-basilisco-de-magma | Basilisco de Magma | vida (HP) | 80 | 85 (livros/LIVRO-DO-MESTRE.md:2524) | scripts/generate-compendium.mjs:274 |
| monstros-sereia-das-profundezas | Sereia das Profundezas | vida (HP) | 64 | 65 (livros/LIVRO-DO-MESTRE.md:2562) | scripts/generate-compendium.mjs:275 |
| monstros-troll-de-pedra | Troll de Pedra | vida (HP) | 94 | 84 (livros/LIVRO-DO-MESTRE.md:2597) | scripts/generate-compendium.mjs:276 |
| monstros-ciclope | Ciclope | vida (HP) | 152 | 114 (livros/LIVRO-DO-MESTRE.md:2636) | scripts/generate-compendium.mjs:277 |
| monstros-harpia-de-caverna | Harpia de Caverna | vida (HP) | 34 | 38 (livros/LIVRO-DO-MESTRE.md:2672) | scripts/generate-compendium.mjs:278 |
| monstros-roper | Roper | vida (HP) | 73 | 93 (livros/LIVRO-DO-MESTRE.md:2702) | scripts/generate-compendium.mjs:279 |
| monstros-aboleth | Aboleth | vida (HP) | 255 | 195 (livros/LIVRO-DO-MESTRE.md:2723) | scripts/generate-compendium.mjs:280 |
| monstros-pudim-negro | Pudim Negro | vida (HP) | 72 | 85 (livros/LIVRO-DO-MESTRE.md:2744) | scripts/generate-compendium.mjs:281 |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | vida (HP) | 34 | 52 (livros/LIVRO-DO-MESTRE.md:2765) | scripts/generate-compendium.mjs:282 |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | vida (HP) | 94 | 88 (livros/LIVRO-DO-MESTRE.md:2786) | scripts/generate-compendium.mjs:283 |
| monstros-aranha-cavaleira | Aranha-Cavaleira | vida (HP) | 88 | 105 (livros/LIVRO-DO-MESTRE.md:2804) | scripts/generate-compendium.mjs:284 |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | vida (HP) | 11 | 8 (livros/LIVRO-DO-MESTRE.md:2822) | scripts/generate-compendium.mjs:285 |
| monstros-besouro-trovao | Besouro-Trovão | vida (HP) | 56 | 45 (livros/LIVRO-DO-MESTRE.md:2840) | scripts/generate-compendium.mjs:286 |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | vida (HP) | 166 | 142 (livros/LIVRO-DO-MESTRE.md:2858) | scripts/generate-compendium.mjs:287 |
| monstros-salamandra-gigante | Salamandra Gigante | vida (HP) | 64 | 65 (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:288 |
| monstros-behemoth-de-pedra | Behemoth de Pedra | vida (HP) | 293 | 230 (livros/LIVRO-DO-MESTRE.md:2895) | scripts/generate-compendium.mjs:289 |
| monstros-fera-da-sombra | Fera da Sombra | vida (HP) | 80 | 78 (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:290 |
| monstros-medusa | Medusa | vida (HP) | 72 | 75 (livros/LIVRO-DO-MESTRE.md:2933) | scripts/generate-compendium.mjs:291 |
| monstros-fenix-de-caverna | Fênix de Caverna | vida (HP) | 210 | 152 (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:292 |
| monstros-gigante-de-pedra | Gigante de Pedra | vida (HP) | 196 | 126 (livros/LIVRO-DO-MESTRE.md:2970) | scripts/generate-compendium.mjs:293 |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | vida (HP) | 80 | 82 (livros/LIVRO-DO-MESTRE.md:2988) | scripts/generate-compendium.mjs:294 |
| monstros-fera-seminal | Fera Seminal | vida (HP) | 181 | 108 (livros/LIVRO-DO-MESTRE.md:3006) | scripts/generate-compendium.mjs:295 |
| monstros-carnical-alado | Carniçal Alado | vida (HP) | 88 | 104 (livros/LIVRO-DO-MESTRE.md:3024) | scripts/generate-compendium.mjs:296 |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | vida (HP) | 300 | 262 (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:297 |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | vida (HP) | 11 | 24 (livros/LIVRO-DO-MESTRE.md:3063) | scripts/generate-compendium.mjs:298 |
| monstros-elemental-de-terra | Elemental de Terra | vida (HP) | 104 | 126 (livros/LIVRO-DO-MESTRE.md:3083) | scripts/generate-compendium.mjs:299 |
| monstros-banshee | Banshee | vida (HP) | 60 | 58 (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:300 |
| monstros-morcego-tirano | Morcego-Tirano | vida (HP) | 56 | 65 (livros/LIVRO-DO-MESTRE.md:3122) | scripts/generate-compendium.mjs:301 |
| monstros-ooze-ocular | Ooze Ocular | vida (HP) | 64 | 72 (livros/LIVRO-DO-MESTRE.md:3140) | scripts/generate-compendium.mjs:302 |
| monstros-devorador-anciao-filhote | Devorador Ancião (Filhote) | vida (HP) | 480 | 676 (livros/LIVRO-DO-MESTRE.md:3158) | scripts/generate-compendium.mjs:303 |

### 1.2 CA (66)

Onde mudar: linha da chamada `mob` indicada; se a ficha não usar flag `ca`/`caDelta`, ajustar também a curva `defaultMonsterCa` em `scripts/monster-balance.mjs:37-47`.

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | CA (defesa) | 12 | 8 (livros/LIVRO-DO-MESTRE.md:553) | scripts/generate-compendium.mjs:224 |
| monstros-espectro | Espectro | CA (defesa) | 14 | 12 (imaterial) (livros/LIVRO-DO-MESTRE.md:680) | scripts/generate-compendium.mjs:227 |
| monstros-necroarca-arquiliche | Necroarca (Arquiliche) | CA (defesa) | 22 | 17 (mantos de proteção arcana) (livros/LIVRO-DO-MESTRE.md:722) | scripts/generate-compendium.mjs:228 |
| monstros-assombracao | Assombração | CA (defesa) | 12 | 13 (livros/LIVRO-DO-MESTRE.md:768) | scripts/generate-compendium.mjs:229 |
| monstros-vampiro | Vampiro | CA (defesa) | 18 | 16 (livros/LIVRO-DO-MESTRE.md:805) | scripts/generate-compendium.mjs:230 |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | CA (defesa) | 16 | 18 (armadura espectral) (livros/LIVRO-DO-MESTRE.md:851) | scripts/generate-compendium.mjs:231 |
| monstros-mumia | Múmia | CA (defesa) | 15 | 11 (livros/LIVRO-DO-MESTRE.md:889) | scripts/generate-compendium.mjs:232 |
| monstros-dragonete-de-magma | Dragonete de Magma | CA (defesa) | 15 | 14 (livros/LIVRO-DO-MESTRE.md:933) | scripts/generate-compendium.mjs:233 |
| monstros-wyvern | Wyvern | CA (defesa) | 16 | 13 (livros/LIVRO-DO-MESTRE.md:972) | scripts/generate-compendium.mjs:234 |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | CA (defesa) | 19 | 18 (livros/LIVRO-DO-MESTRE.md:1016) | scripts/generate-compendium.mjs:235 |
| monstros-drake-de-pedra | Drake de Pedra | CA (defesa) | 16 | 17 (carapaça de pedra) (livros/LIVRO-DO-MESTRE.md:1059) | scripts/generate-compendium.mjs:236 |
| monstros-golem-de-pedra | Golem de Pedra | CA (defesa) | 18 | 17 (livros/LIVRO-DO-MESTRE.md:1144) | scripts/generate-compendium.mjs:238 |
| monstros-armadura-animada | Armadura Animada | CA (defesa) | 13 | 18 (livros/LIVRO-DO-MESTRE.md:1179) | scripts/generate-compendium.mjs:239 |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | CA (defesa) | 19 | 20 (livros/LIVRO-DO-MESTRE.md:1213) | scripts/generate-compendium.mjs:240 |
| monstros-automato-de-genio | Autômato de Gênio | CA (defesa) | 15 | 16 (livros/LIVRO-DO-MESTRE.md:1251) | scripts/generate-compendium.mjs:241 |
| monstros-minotauro | Minotauro | CA (defesa) | 15 | 14 (livros/LIVRO-DO-MESTRE.md:1294) | scripts/generate-compendium.mjs:242 |
| monstros-manticora | Manticora | CA (defesa) | 16 | 14 (livros/LIVRO-DO-MESTRE.md:1369) | scripts/generate-compendium.mjs:244 |
| monstros-grifo | Grifo | CA (defesa) | 14 | 12 (livros/LIVRO-DO-MESTRE.md:1405) | scripts/generate-compendium.mjs:245 |
| monstros-cocatriz | Cocatriz | CA (defesa) | 13 | 11 (livros/LIVRO-DO-MESTRE.md:1441) | scripts/generate-compendium.mjs:246 |
| monstros-escorpiao-gigante | Escorpião Gigante | CA (defesa) | 14 | 15 (livros/LIVRO-DO-MESTRE.md:1526) | scripts/generate-compendium.mjs:248 |
| monstros-besouro-diamante | Besouro-Diamante | CA (defesa) | 16 | 17 (exoesqueleto de diamante) (livros/LIVRO-DO-MESTRE.md:1600) | scripts/generate-compendium.mjs:250 |
| monstros-sapo-engolidor | Sapo-Engolidor | CA (defesa) | 15 | 11 (livros/LIVRO-DO-MESTRE.md:1639) | scripts/generate-compendium.mjs:251 |
| monstros-kraken-menor | Kraken Menor | CA (defesa) | 19 | 16 (livros/LIVRO-DO-MESTRE.md:1676) | scripts/generate-compendium.mjs:252 |
| monstros-serpente-do-abismo | Serpente-do-Abismo | CA (defesa) | 16 | 13 (livros/LIVRO-DO-MESTRE.md:1715) | scripts/generate-compendium.mjs:253 |
| monstros-tubarao-cego | Tubarão-Cego | CA (defesa) | 14 | 13 (livros/LIVRO-DO-MESTRE.md:1753) | scripts/generate-compendium.mjs:254 |
| monstros-goblin-de-caverna | Goblin de Caverna | CA (defesa) | 12 | 13 (livros/LIVRO-DO-MESTRE.md:1795) | scripts/generate-compendium.mjs:255 |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | CA (defesa) | 12 | 18 (armadura de placas) (livros/LIVRO-DO-MESTRE.md:1833) | scripts/generate-compendium.mjs:256 |
| monstros-cogumelo-rei | Cogumelo-Rei | CA (defesa) | 15 | 8 (livros/LIVRO-DO-MESTRE.md:1910) | scripts/generate-compendium.mjs:258 |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | CA (defesa) | 11 | 10 (livros/LIVRO-DO-MESTRE.md:1983) | scripts/generate-compendium.mjs:260 |
| monstros-slime-acido | Slime Ácido | CA (defesa) | 10 | 8 (livros/LIVRO-DO-MESTRE.md:2025) | scripts/generate-compendium.mjs:261 |
| monstros-slime-de-cristal | Slime de Cristal | CA (defesa) | 10 | 11 (livros/LIVRO-DO-MESTRE.md:2061) | scripts/generate-compendium.mjs:262 |
| monstros-elemental-de-fogo | Elemental de Fogo | CA (defesa) | 15 | 13 (livros/LIVRO-DO-MESTRE.md:2097) | scripts/generate-compendium.mjs:263 |
| monstros-yeti-das-profundezas | Yeti das Profundezas | CA (defesa) | 16 | 12 (livros/LIVRO-DO-MESTRE.md:2175) | scripts/generate-compendium.mjs:265 |
| monstros-lobo-do-inverno | Lobo do Inverno | CA (defesa) | 12 | 13 (livros/LIVRO-DO-MESTRE.md:2213) | scripts/generate-compendium.mjs:266 |
| monstros-mimico-de-bau | Mímico de Baú | CA (defesa) | 13 | 12 (livros/LIVRO-DO-MESTRE.md:2252) | scripts/generate-compendium.mjs:267 |
| monstros-hidra-das-cavernas | Hidra das Cavernas | CA (defesa) | 17 | 15 (livros/LIVRO-DO-MESTRE.md:2333) | scripts/generate-compendium.mjs:269 |
| monstros-quimera | Quimera | CA (defesa) | 18 | 14 (livros/LIVRO-DO-MESTRE.md:2376) | scripts/generate-compendium.mjs:270 |
| monstros-anjo-caido | Anjo Caído | CA (defesa) | 20 | 19 (livros/LIVRO-DO-MESTRE.md:2414) | scripts/generate-compendium.mjs:271 |
| monstros-aberracao-tentacular | Aberração Tentacular | CA (defesa) | 16 | 15 (livros/LIVRO-DO-MESTRE.md:2489) | scripts/generate-compendium.mjs:273 |
| monstros-basilisco-de-magma | Basilisco de Magma | CA (defesa) | 18 | 17 (escamas de obsidiana) (livros/LIVRO-DO-MESTRE.md:2525) | scripts/generate-compendium.mjs:274 |
| monstros-sereia-das-profundezas | Sereia das Profundezas | CA (defesa) | 15 | 12 (livros/LIVRO-DO-MESTRE.md:2563) | scripts/generate-compendium.mjs:275 |
| monstros-ciclope | Ciclope | CA (defesa) | 17 | 14 (livros/LIVRO-DO-MESTRE.md:2637) | scripts/generate-compendium.mjs:277 |
| monstros-harpia-de-caverna | Harpia de Caverna | CA (defesa) | 14 | 11 (livros/LIVRO-DO-MESTRE.md:2673) | scripts/generate-compendium.mjs:278 |
| monstros-roper | Roper | CA (defesa) | 15 | 20 (livros/LIVRO-DO-MESTRE.md:2702) | scripts/generate-compendium.mjs:279 |
| monstros-aboleth | Aboleth | CA (defesa) | 21 | 17 (livros/LIVRO-DO-MESTRE.md:2723) | scripts/generate-compendium.mjs:280 |
| monstros-pudim-negro | Pudim Negro | CA (defesa) | 13 | 7 (livros/LIVRO-DO-MESTRE.md:2744) | scripts/generate-compendium.mjs:281 |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | CA (defesa) | 15 | 16 (livros/LIVRO-DO-MESTRE.md:2765) | scripts/generate-compendium.mjs:282 |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | CA (defesa) | 17 | 18 (carapaça + casco de navio) (livros/LIVRO-DO-MESTRE.md:2786) | scripts/generate-compendium.mjs:283 |
| monstros-aranha-cavaleira | Aranha-Cavaleira | CA (defesa) | 16 | 14 (livros/LIVRO-DO-MESTRE.md:2804) | scripts/generate-compendium.mjs:284 |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | CA (defesa) | 12 | 11 (livros/LIVRO-DO-MESTRE.md:2822) | scripts/generate-compendium.mjs:285 |
| monstros-besouro-trovao | Besouro-Trovão | CA (defesa) | 16 | 15 (livros/LIVRO-DO-MESTRE.md:2840) | scripts/generate-compendium.mjs:286 |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | CA (defesa) | 20 | 18 (livros/LIVRO-DO-MESTRE.md:2858) | scripts/generate-compendium.mjs:287 |
| monstros-salamandra-gigante | Salamandra Gigante | CA (defesa) | 15 | 13 (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:288 |
| monstros-behemoth-de-pedra | Behemoth de Pedra | CA (defesa) | 20 | 19 (livros/LIVRO-DO-MESTRE.md:2895) | scripts/generate-compendium.mjs:289 |
| monstros-fera-da-sombra | Fera da Sombra | CA (defesa) | 16 | 14 (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:290 |
| monstros-fenix-de-caverna | Fênix de Caverna | CA (defesa) | 19 | 16 (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:292 |
| monstros-gigante-de-pedra | Gigante de Pedra | CA (defesa) | 19 | 17 (livros/LIVRO-DO-MESTRE.md:2970) | scripts/generate-compendium.mjs:293 |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | CA (defesa) | 16 | 17 (livros/LIVRO-DO-MESTRE.md:2988) | scripts/generate-compendium.mjs:294 |
| monstros-fera-seminal | Fera Seminal | CA (defesa) | 18 | 13 (livros/LIVRO-DO-MESTRE.md:3006) | scripts/generate-compendium.mjs:295 |
| monstros-carnical-alado | Carniçal Alado | CA (defesa) | 16 | 15 (livros/LIVRO-DO-MESTRE.md:3024) | scripts/generate-compendium.mjs:296 |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | CA (defesa) | 22 | 19 (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:297 |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | CA (defesa) | 12 | 10 (livros/LIVRO-DO-MESTRE.md:3063) | scripts/generate-compendium.mjs:298 |
| monstros-elemental-de-terra | Elemental de Terra | CA (defesa) | 18 | 17 (livros/LIVRO-DO-MESTRE.md:3083) | scripts/generate-compendium.mjs:299 |
| monstros-banshee | Banshee | CA (defesa) | 16 | 12 (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:300 |
| monstros-morcego-tirano | Morcego-Tirano | CA (defesa) | 14 | 12 (livros/LIVRO-DO-MESTRE.md:3122) | scripts/generate-compendium.mjs:301 |
| monstros-devorador-anciao-filhote | Devorador Ancião (Filhote) | CA (defesa) | 22 | 25 (livros/LIVRO-DO-MESTRE.md:3158) | scripts/generate-compendium.mjs:303 |

### 1.3 PA (4)

Os outros 76 espécimes batem com a regra de 6 PA (comum/mini) ou 9 PA (boss).

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | PA | 7 | 6 (livros/LIVRO-DO-JOGADOR.md:220, regra por tier) | scripts/generate-compendium.mjs:224, 6º argumento `pa` da chamada `mob` |
| monstros-esqueleto-armado | Esqueleto Armado | PA | 7 | 6 (livros/LIVRO-DO-JOGADOR.md:220, regra por tier) | scripts/generate-compendium.mjs:225, 6º argumento `pa` da chamada `mob` |
| monstros-necrofago | Necrófago | PA | 7 | 6 (livros/LIVRO-DO-JOGADOR.md:220, regra por tier) | scripts/generate-compendium.mjs:226, 6º argumento `pa` da chamada `mob` |
| monstros-goblin-de-caverna | Goblin de Caverna | PA | 3 | 6 (livros/LIVRO-DO-JOGADOR.md:220, regra por tier) | scripts/generate-compendium.mjs:255, 6º argumento `pa` da chamada `mob` |

### 1.4 Nível/ameaça (31)

`tactical.ameaca.value` no dado deve replicar o `**Nível:**` da ficha do livro.

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | nível/ameaça | 2 | 1 (livros/LIVRO-DO-MESTRE.md:539) | scripts/generate-compendium.mjs:224, 2º argumento `nivel` da chamada `mob` |
| monstros-assombracao | Assombração | nível/ameaça | 3 | 5 (livros/LIVRO-DO-MESTRE.md:752) | scripts/generate-compendium.mjs:229, 2º argumento `nivel` da chamada `mob` |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | nível/ameaça | 5 | 7 (livros/LIVRO-DO-MESTRE.md:836) | scripts/generate-compendium.mjs:231, 2º argumento `nivel` da chamada `mob` |
| monstros-mumia | Múmia | nível/ameaça | 5 | 6 (livros/LIVRO-DO-MESTRE.md:873) | scripts/generate-compendium.mjs:232, 2º argumento `nivel` da chamada `mob` |
| monstros-dragonete-de-magma | Dragonete de Magma | nível/ameaça | 6 | 3 (livros/LIVRO-DO-MESTRE.md:918) | scripts/generate-compendium.mjs:233, 2º argumento `nivel` da chamada `mob` |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | nível/ameaça | 19 | 20 (livros/LIVRO-DO-MESTRE.md:1081) | scripts/generate-compendium.mjs:237, 2º argumento `nivel` da chamada `mob` |
| monstros-armadura-animada | Armadura Animada | nível/ameaça | 1 | 4 (livros/LIVRO-DO-MESTRE.md:1166) | scripts/generate-compendium.mjs:239, 2º argumento `nivel` da chamada `mob` |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | nível/ameaça | 10 | 12 (livros/LIVRO-DO-MESTRE.md:1200) | scripts/generate-compendium.mjs:240, 2º argumento `nivel` da chamada `mob` |
| monstros-automato-de-genio | Autômato de Gênio | nível/ameaça | 7 | 10 (livros/LIVRO-DO-MESTRE.md:1235) | scripts/generate-compendium.mjs:241, 2º argumento `nivel` da chamada `mob` |
| monstros-minotauro | Minotauro | nível/ameaça | 6 | 5 (livros/LIVRO-DO-MESTRE.md:1279) | scripts/generate-compendium.mjs:242, 2º argumento `nivel` da chamada `mob` |
| monstros-basilisco | Basilisco | nível/ameaça | 7 | 6 (livros/LIVRO-DO-MESTRE.md:1317) | scripts/generate-compendium.mjs:243, 2º argumento `nivel` da chamada `mob` |
| monstros-grifo | Grifo | nível/ameaça | 5 | 7 (livros/LIVRO-DO-MESTRE.md:1392) | scripts/generate-compendium.mjs:245, 2º argumento `nivel` da chamada `mob` |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | nível/ameaça | 2 | 3 (livros/LIVRO-DO-MESTRE.md:1469) | scripts/generate-compendium.mjs:247, 2º argumento `nivel` da chamada `mob` |
| monstros-escorpiao-gigante | Escorpião Gigante | nível/ameaça | 3 | 4 (livros/LIVRO-DO-MESTRE.md:1512) | scripts/generate-compendium.mjs:248, 2º argumento `nivel` da chamada `mob` |
| monstros-centopeia-caustica | Centopeia Cáustica | nível/ameaça | 4 | 5 (livros/LIVRO-DO-MESTRE.md:1549) | scripts/generate-compendium.mjs:249, 2º argumento `nivel` da chamada `mob` |
| monstros-besouro-diamante | Besouro-Diamante | nível/ameaça | 5 | 2 (livros/LIVRO-DO-MESTRE.md:1586) | scripts/generate-compendium.mjs:250, 2º argumento `nivel` da chamada `mob` |
| monstros-kraken-menor | Kraken Menor | nível/ameaça | 12 | 11 (livros/LIVRO-DO-MESTRE.md:1662) | scripts/generate-compendium.mjs:252, 2º argumento `nivel` da chamada `mob` |
| monstros-serpente-do-abismo | Serpente-do-Abismo | nível/ameaça | 8 | 7 (livros/LIVRO-DO-MESTRE.md:1701) | scripts/generate-compendium.mjs:253, 2º argumento `nivel` da chamada `mob` |
| monstros-cogumelo-rei | Cogumelo-Rei | nível/ameaça | 7 | 6 (livros/LIVRO-DO-MESTRE.md:1896) | scripts/generate-compendium.mjs:258, 2º argumento `nivel` da chamada `mob` |
| monstros-treant-podre | Treant Podre | nível/ameaça | 9 | 8 (livros/LIVRO-DO-MESTRE.md:1933) | scripts/generate-compendium.mjs:259, 2º argumento `nivel` da chamada `mob` |
| monstros-slime-de-cristal | Slime de Cristal | nível/ameaça | 3 | 4 (livros/LIVRO-DO-MESTRE.md:2047) | scripts/generate-compendium.mjs:262, 2º argumento `nivel` da chamada `mob` |
| monstros-elemental-de-fogo | Elemental de Fogo | nível/ameaça | 6 | 7 (livros/LIVRO-DO-MESTRE.md:2082) | scripts/generate-compendium.mjs:263, 2º argumento `nivel` da chamada `mob` |
| monstros-elemental-de-gelo | Elemental de Gelo | nível/ameaça | 6 | 7 (livros/LIVRO-DO-MESTRE.md:2119) | scripts/generate-compendium.mjs:264, 2º argumento `nivel` da chamada `mob` |
| monstros-yeti-das-profundezas | Yeti das Profundezas | nível/ameaça | 8 | 5 (livros/LIVRO-DO-MESTRE.md:2159) | scripts/generate-compendium.mjs:265, 2º argumento `nivel` da chamada `mob` |
| monstros-lobo-do-inverno | Lobo do Inverno | nível/ameaça | 3 | 4 (livros/LIVRO-DO-MESTRE.md:2198) | scripts/generate-compendium.mjs:266, 2º argumento `nivel` da chamada `mob` |
| monstros-mimico-de-bau | Mímico de Baú | nível/ameaça | 4 | 3 (livros/LIVRO-DO-MESTRE.md:2239) | scripts/generate-compendium.mjs:267, 2º argumento `nivel` da chamada `mob` |
| monstros-metamorfo-dubio | Metamorfo Dúbio | nível/ameaça | 5 | 7 (livros/LIVRO-DO-MESTRE.md:2276) | scripts/generate-compendium.mjs:268, 2º argumento `nivel` da chamada `mob` |
| monstros-quimera | Quimera | nível/ameaça | 10 | 11 (livros/LIVRO-DO-MESTRE.md:2363) | scripts/generate-compendium.mjs:270, 2º argumento `nivel` da chamada `mob` |
| monstros-gargula-de-cristal | Gárgula de Cristal | nível/ameaça | 4 | 6 (livros/LIVRO-DO-MESTRE.md:2439) | scripts/generate-compendium.mjs:272, 2º argumento `nivel` da chamada `mob` |
| monstros-aberracao-tentacular | Aberração Tentacular | nível/ameaça | 8 | 10 (livros/LIVRO-DO-MESTRE.md:2475) | scripts/generate-compendium.mjs:273, 2º argumento `nivel` da chamada `mob` |
| monstros-troll-de-pedra | Troll de Pedra | nível/ameaça | 7 | 6 (livros/LIVRO-DO-MESTRE.md:2585) | scripts/generate-compendium.mjs:276, 2º argumento `nivel` da chamada `mob` |

### 1.5 Tamanho (0 divergências)

Nenhuma. Todos os 80 espécimes conferem: `tactical.tamanho` (small/medium/large/huge/gargantuan) bate com a categoria em português e com o grid da ficha (1x1, 2x2, 3x3, 4x4). Isso acontece porque `scripts/sync-monster-book-tamanhos.mjs` copia o valor do dado para o livro. Não há nada para mudar no gerador neste campo.

### 1.6 Ataques: dano (227)

Cada linha compara uma fórmula de `system.actions[].damageFormula` com a linha `Dano` da ficha. As fórmulas do template (`1d6`, `1d8`, `1d10`, `2d8`, `2d6`, `3d10`) não correspondem aos dados de dano escritos no bestiário, que usam bônus de atributo e ataques nomeados.

Onde mudar: `scripts/generate-compendium.mjs:102-166`, nos campos `damageFormula` das ações `Mordida` (linha 113), `Garras` (128), `Ataque especial` (143) e `Investida` (157). Como os ataques também mudam de nome e quantidade, a correção completa exige substituir `monsterActions()` por dados por espécime, não só trocar números.

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | ataque "Garras" dano | 1d8 | 1d6 (pancada) (livros/LIVRO-DO-MESTRE.md:554) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | ataque "Investida" dano | 1d10 | 1d6 (pancada) (livros/LIVRO-DO-MESTRE.md:554) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-esqueleto-armado | Esqueleto Armado | ataque "Investida" dano | 1d10 | 1d8 (espada enferrujada) ou 1d6 (arco de osso) (livros/LIVRO-DO-MESTRE.md:596) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necrofago | Necrófago | ataque "Mordida" dano | 1d6 | 1d6+2 (garras) + 1d4 (mordida paralisante) (livros/LIVRO-DO-MESTRE.md:639) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necrofago | Necrófago | ataque "Garras" dano | 1d8 | 1d6+2 (garras) + 1d4 (mordida paralisante) (livros/LIVRO-DO-MESTRE.md:639) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necrofago | Necrófago | ataque "Investida" dano | 1d10 | 1d6+2 (garras) + 1d4 (mordida paralisante) (livros/LIVRO-DO-MESTRE.md:639) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-espectro | Espectro | ataque "Mordida" dano | 1d10 | 2d6 necrótico (toque de vida) (livros/LIVRO-DO-MESTRE.md:681) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-espectro | Espectro | ataque "Garras" dano | 1d8 | 2d6 necrótico (toque de vida) (livros/LIVRO-DO-MESTRE.md:681) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-espectro | Espectro | ataque "Ataque especial" dano | 2d8 | 2d6 necrótico (toque de vida) (livros/LIVRO-DO-MESTRE.md:681) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necroarca-arquiliche | Necroarca (Arquiliche) | ataque "Mordida" dano | 2d8 | 4d8+8 necrótico (toque paralisante) ou 8d6 (Relâmpago) (livros/LIVRO-DO-MESTRE.md:723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necroarca-arquiliche | Necroarca (Arquiliche) | ataque "Garras" dano | 2d6 | 4d8+8 necrótico (toque paralisante) ou 8d6 (Relâmpago) (livros/LIVRO-DO-MESTRE.md:723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necroarca-arquiliche | Necroarca (Arquiliche) | ataque "Ataque especial" dano | 3d10 | 4d8+8 necrótico (toque paralisante) ou 8d6 (Relâmpago) (livros/LIVRO-DO-MESTRE.md:723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-assombracao | Assombração | ataque "Mordida" dano | 1d6 | 2d8+3 psíquico (livros/LIVRO-DO-MESTRE.md:769) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-assombracao | Assombração | ataque "Garras" dano | 1d8 | 2d8+3 psíquico (livros/LIVRO-DO-MESTRE.md:769) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-assombracao | Assombração | ataque "Investida" dano | 1d10 | 2d8+3 psíquico (livros/LIVRO-DO-MESTRE.md:769) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-vampiro | Vampiro | ataque "Mordida" dano | 2d8 | 1d8+5 (garras) + 2d6+4 necrótico e dreno (mordida) (livros/LIVRO-DO-MESTRE.md:806) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-vampiro | Vampiro | ataque "Garras" dano | 2d6 | 1d8+5 (garras) + 2d6+4 necrótico e dreno (mordida) (livros/LIVRO-DO-MESTRE.md:806) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-vampiro | Vampiro | ataque "Ataque especial" dano | 3d10 | 1d8+5 (garras) + 2d6+4 necrótico e dreno (mordida) (livros/LIVRO-DO-MESTRE.md:806) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | ataque "Mordida" dano | 1d10 | 2d8+4 (espada longa espectral) (livros/LIVRO-DO-MESTRE.md:852) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | ataque "Garras" dano | 1d8 | 2d8+4 (espada longa espectral) (livros/LIVRO-DO-MESTRE.md:852) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | ataque "Ataque especial" dano | 2d8 | 2d8+4 (espada longa espectral) (livros/LIVRO-DO-MESTRE.md:852) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mumia | Múmia | ataque "Mordida" dano | 1d10 | 2d6+3 (golpe) + Maldição da Múmia (livros/LIVRO-DO-MESTRE.md:890) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mumia | Múmia | ataque "Garras" dano | 1d8 | 2d6+3 (golpe) + Maldição da Múmia (livros/LIVRO-DO-MESTRE.md:890) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mumia | Múmia | ataque "Ataque especial" dano | 2d8 | 2d6+3 (golpe) + Maldição da Múmia (livros/LIVRO-DO-MESTRE.md:890) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragonete-de-magma | Dragonete de Magma | ataque "Mordida" dano | 1d10 | 1d8+3 (garras) + 1d6 (mordida) (livros/LIVRO-DO-MESTRE.md:934) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragonete-de-magma | Dragonete de Magma | ataque "Garras" dano | 1d8 | 1d8+3 (garras) + 1d6 (mordida) (livros/LIVRO-DO-MESTRE.md:934) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragonete-de-magma | Dragonete de Magma | ataque "Ataque especial" dano | 2d8 | 1d8+3 (garras) + 1d6 (mordida) (livros/LIVRO-DO-MESTRE.md:934) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-wyvern | Wyvern | ataque "Mordida" dano | 1d10 | 2d6+4 (mordida) + 2d6+4 (garras) + 2d8+4 veneno (ferrão) (livros/LIVRO-DO-MESTRE.md:973) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-wyvern | Wyvern | ataque "Garras" dano | 1d8 | 2d6+4 (mordida) + 2d6+4 (garras) + 2d8+4 veneno (ferrão) (livros/LIVRO-DO-MESTRE.md:973) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-wyvern | Wyvern | ataque "Ataque especial" dano | 2d8 | 2d6+4 (mordida) + 2d6+4 (garras) + 2d8+4 veneno (ferrão) (livros/LIVRO-DO-MESTRE.md:973) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | ataque "Mordida" dano | 2d8 | 2d10+7 (mordida) + 2d6+7 (garras) + 1d12+7 (cauda) (livros/LIVRO-DO-MESTRE.md:1017) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | ataque "Garras" dano | 2d6 | 2d10+7 (mordida) + 2d6+7 (garras) + 1d12+7 (cauda) (livros/LIVRO-DO-MESTRE.md:1017) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | ataque "Ataque especial" dano | 3d10 | 2d10+7 (mordida) + 2d6+7 (garras) + 1d12+7 (cauda) (livros/LIVRO-DO-MESTRE.md:1017) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-drake-de-pedra | Drake de Pedra | ataque "Mordida" dano | 1d10 | 2d6+4 (mordida) + 1d8+4 (cauda de pedra) (livros/LIVRO-DO-MESTRE.md:1060) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-drake-de-pedra | Drake de Pedra | ataque "Garras" dano | 1d8 | 2d6+4 (mordida) + 1d8+4 (cauda de pedra) (livros/LIVRO-DO-MESTRE.md:1060) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-drake-de-pedra | Drake de Pedra | ataque "Ataque especial" dano | 2d8 | 2d6+4 (mordida) + 1d8+4 (cauda de pedra) (livros/LIVRO-DO-MESTRE.md:1060) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | ataque "Mordida" dano | 2d8 | 3d10+10 (mordida) + 3d6+10 (garras) + 2d12+10 (cauda) (livros/LIVRO-DO-MESTRE.md:1097) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | ataque "Garras" dano | 2d6 | 3d10+10 (mordida) + 3d6+10 (garras) + 2d12+10 (cauda) (livros/LIVRO-DO-MESTRE.md:1097) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | ataque "Ataque especial" dano | 3d10 | 3d10+10 (mordida) + 3d6+10 (garras) + 2d12+10 (cauda) (livros/LIVRO-DO-MESTRE.md:1097) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-pedra | Golem de Pedra | ataque "Mordida" dano | 1d10 | 3d8+6 (soco de pedra) (livros/LIVRO-DO-MESTRE.md:1145) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-pedra | Golem de Pedra | ataque "Garras" dano | 1d8 | 3d8+6 (soco de pedra) (livros/LIVRO-DO-MESTRE.md:1145) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-pedra | Golem de Pedra | ataque "Ataque especial" dano | 2d8 | 3d8+6 (soco de pedra) (livros/LIVRO-DO-MESTRE.md:1145) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-armadura-animada | Armadura Animada | ataque "Mordida" dano | 1d6 | 1d8+3 (espada) (livros/LIVRO-DO-MESTRE.md:1180) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | ataque "Mordida" dano | 1d10 | 3d10+8 (soco de ferro) + 2d6 fogo automático em adjacência (livros/LIVRO-DO-MESTRE.md:1214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | ataque "Garras" dano | 1d8 | 3d10+8 (soco de ferro) + 2d6 fogo automático em adjacência (livros/LIVRO-DO-MESTRE.md:1214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | ataque "Ataque especial" dano | 2d8 | 3d10+8 (soco de ferro) + 2d6 fogo automático em adjacência (livros/LIVRO-DO-MESTRE.md:1214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-automato-de-genio | Autômato de Gênio | ataque "Mordida" dano | 1d10 | 2d8+4 (lâminas integradas) ou Magia variável (livros/LIVRO-DO-MESTRE.md:1252) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-automato-de-genio | Autômato de Gênio | ataque "Garras" dano | 1d8 | 2d8+4 (lâminas integradas) ou Magia variável (livros/LIVRO-DO-MESTRE.md:1252) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-automato-de-genio | Autômato de Gênio | ataque "Ataque especial" dano | 2d8 | 2d8+4 (lâminas integradas) ou Magia variável (livros/LIVRO-DO-MESTRE.md:1252) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-minotauro | Minotauro | ataque "Mordida" dano | 1d10 | 2d8+5 (machado) + 2d8 (chifrada) (livros/LIVRO-DO-MESTRE.md:1295) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-minotauro | Minotauro | ataque "Garras" dano | 1d8 | 2d8+5 (machado) + 2d8 (chifrada) (livros/LIVRO-DO-MESTRE.md:1295) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco | Basilisco | ataque "Mordida" dano | 1d10 | 2d6+3 (mordida petrificante) (livros/LIVRO-DO-MESTRE.md:1332) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco | Basilisco | ataque "Garras" dano | 1d8 | 2d6+3 (mordida petrificante) (livros/LIVRO-DO-MESTRE.md:1332) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco | Basilisco | ataque "Ataque especial" dano | 2d8 | 2d6+3 (mordida petrificante) (livros/LIVRO-DO-MESTRE.md:1332) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-manticora | Manticora | ataque "Mordida" dano | 1d10 | 2d6+5 (garras) + 2d8+5 (mordida) + 1d8+5 fogo por espinho (até 3/turno, alcance 45m) (livros/LIVRO-DO-MESTRE.md:1370) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-manticora | Manticora | ataque "Garras" dano | 1d8 | 2d6+5 (garras) + 2d8+5 (mordida) + 1d8+5 fogo por espinho (até 3/turno, alcance 45m) (livros/LIVRO-DO-MESTRE.md:1370) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-manticora | Manticora | ataque "Ataque especial" dano | 2d8 | 2d6+5 (garras) + 2d8+5 (mordida) + 1d8+5 fogo por espinho (até 3/turno, alcance 45m) (livros/LIVRO-DO-MESTRE.md:1370) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-grifo | Grifo | ataque "Mordida" dano | 1d10 | 2d8+4 (garras dianteiras) + 1d6+4 (mordida) (livros/LIVRO-DO-MESTRE.md:1406) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-grifo | Grifo | ataque "Garras" dano | 1d8 | 2d8+4 (garras dianteiras) + 1d6+4 (mordida) (livros/LIVRO-DO-MESTRE.md:1406) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-grifo | Grifo | ataque "Ataque especial" dano | 2d8 | 2d8+4 (garras dianteiras) + 1d6+4 (mordida) (livros/LIVRO-DO-MESTRE.md:1406) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cocatriz | Cocatriz | ataque "Mordida" dano | 1d6 | 1d4+1 (bico petrificante) (livros/LIVRO-DO-MESTRE.md:1442) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cocatriz | Cocatriz | ataque "Garras" dano | 1d8 | 1d4+1 (bico petrificante) (livros/LIVRO-DO-MESTRE.md:1442) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cocatriz | Cocatriz | ataque "Ataque especial" dano | 2d8 | 1d4+1 (bico petrificante) (livros/LIVRO-DO-MESTRE.md:1442) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | ataque "Mordida" dano | 1d6 | 1d8+3 (mordida envenenada) (livros/LIVRO-DO-MESTRE.md:1484) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | ataque "Garras" dano | 1d8 | 1d8+3 (mordida envenenada) (livros/LIVRO-DO-MESTRE.md:1484) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | ataque "Investida" dano | 1d10 | 1d8+3 (mordida envenenada) (livros/LIVRO-DO-MESTRE.md:1484) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-escorpiao-gigante | Escorpião Gigante | ataque "Mordida" dano | 1d6 | 1d8+3 (garras, agarramento automático) + 1d10+3 veneno (ferrão) (livros/LIVRO-DO-MESTRE.md:1527) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-escorpiao-gigante | Escorpião Gigante | ataque "Garras" dano | 1d8 | 1d8+3 (garras, agarramento automático) + 1d10+3 veneno (ferrão) (livros/LIVRO-DO-MESTRE.md:1527) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-escorpiao-gigante | Escorpião Gigante | ataque "Investida" dano | 1d10 | 1d8+3 (garras, agarramento automático) + 1d10+3 veneno (ferrão) (livros/LIVRO-DO-MESTRE.md:1527) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-centopeia-caustica | Centopeia Cáustica | ataque "Mordida" dano | 1d6 | 2d6+2 (mordida) + 2d4 ácido contínuo em contato (livros/LIVRO-DO-MESTRE.md:1564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-centopeia-caustica | Centopeia Cáustica | ataque "Garras" dano | 1d8 | 2d6+2 (mordida) + 2d4 ácido contínuo em contato (livros/LIVRO-DO-MESTRE.md:1564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-centopeia-caustica | Centopeia Cáustica | ataque "Ataque especial" dano | 2d8 | 2d6+2 (mordida) + 2d4 ácido contínuo em contato (livros/LIVRO-DO-MESTRE.md:1564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-diamante | Besouro-Diamante | ataque "Mordida" dano | 1d10 | 1d4 (mandíbulas) (livros/LIVRO-DO-MESTRE.md:1601) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-diamante | Besouro-Diamante | ataque "Garras" dano | 1d8 | 1d4 (mandíbulas) (livros/LIVRO-DO-MESTRE.md:1601) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-diamante | Besouro-Diamante | ataque "Ataque especial" dano | 2d8 | 1d4 (mandíbulas) (livros/LIVRO-DO-MESTRE.md:1601) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sapo-engolidor | Sapo-Engolidor | ataque "Mordida" dano | 1d10 | 2d6+4 (língua — puxão + Agarrado) ou 3d8+4 (mordida engolimento) (livros/LIVRO-DO-MESTRE.md:1640) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sapo-engolidor | Sapo-Engolidor | ataque "Garras" dano | 1d8 | 2d6+4 (língua — puxão + Agarrado) ou 3d8+4 (mordida engolimento) (livros/LIVRO-DO-MESTRE.md:1640) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sapo-engolidor | Sapo-Engolidor | ataque "Ataque especial" dano | 2d8 | 2d6+4 (língua — puxão + Agarrado) ou 3d8+4 (mordida engolimento) (livros/LIVRO-DO-MESTRE.md:1640) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-kraken-menor | Kraken Menor | ataque "Mordida" dano | 2d8 | 3d6+5 por tentáculo (agarramento automático) + 2d8+5 (mordida) (livros/LIVRO-DO-MESTRE.md:1677) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-kraken-menor | Kraken Menor | ataque "Garras" dano | 2d6 | 3d6+5 por tentáculo (agarramento automático) + 2d8+5 (mordida) (livros/LIVRO-DO-MESTRE.md:1677) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-kraken-menor | Kraken Menor | ataque "Ataque especial" dano | 3d10 | 3d6+5 por tentáculo (agarramento automático) + 2d8+5 (mordida) (livros/LIVRO-DO-MESTRE.md:1677) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-serpente-do-abismo | Serpente-do-Abismo | ataque "Mordida" dano | 1d10 | 1d8+4 (mordida venenosa) + 2d8+4/turno (constrição) (livros/LIVRO-DO-MESTRE.md:1716) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-serpente-do-abismo | Serpente-do-Abismo | ataque "Garras" dano | 1d8 | 1d8+4 (mordida venenosa) + 2d8+4/turno (constrição) (livros/LIVRO-DO-MESTRE.md:1716) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-serpente-do-abismo | Serpente-do-Abismo | ataque "Ataque especial" dano | 2d8 | 1d8+4 (mordida venenosa) + 2d8+4/turno (constrição) (livros/LIVRO-DO-MESTRE.md:1716) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-tubarao-cego | Tubarão-Cego | ataque "Mordida" dano | 1d10 | 2d8+4 (mordida) (livros/LIVRO-DO-MESTRE.md:1754) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-tubarao-cego | Tubarão-Cego | ataque "Garras" dano | 1d8 | 2d8+4 (mordida) (livros/LIVRO-DO-MESTRE.md:1754) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-tubarao-cego | Tubarão-Cego | ataque "Ataque especial" dano | 2d8 | 2d8+4 (mordida) (livros/LIVRO-DO-MESTRE.md:1754) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-goblin-de-caverna | Goblin de Caverna | ataque "Mordida" dano | 1d6 | 1d6+1 (facão enferrujado) ou 1d4 (arco pequeno) (livros/LIVRO-DO-MESTRE.md:1796) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | ataque "Mordida" dano | 1d6 | 2d6+2 (espada longa) (livros/LIVRO-DO-MESTRE.md:1834) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | ataque "Garras" dano | 1d8 | 2d6+2 (espada longa) (livros/LIVRO-DO-MESTRE.md:1834) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | ataque "Investida" dano | 1d10 | 2d6+2 (espada longa) (livros/LIVRO-DO-MESTRE.md:1834) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-orc-de-masmorra | Orc de Masmorra | ataque "Mordida" dano | 1d6 | 1d12+3 (machado grande) (livros/LIVRO-DO-MESTRE.md:1870) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-orc-de-masmorra | Orc de Masmorra | ataque "Garras" dano | 1d8 | 1d12+3 (machado grande) (livros/LIVRO-DO-MESTRE.md:1870) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-orc-de-masmorra | Orc de Masmorra | ataque "Ataque especial" dano | 2d8 | 1d12+3 (machado grande) (livros/LIVRO-DO-MESTRE.md:1870) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cogumelo-rei | Cogumelo-Rei | ataque "Mordida" dano | 1d10 | 2d6+2 (soco de hifa) + Esporos (área) (livros/LIVRO-DO-MESTRE.md:1911) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cogumelo-rei | Cogumelo-Rei | ataque "Garras" dano | 1d8 | 2d6+2 (soco de hifa) + Esporos (área) (livros/LIVRO-DO-MESTRE.md:1911) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cogumelo-rei | Cogumelo-Rei | ataque "Ataque especial" dano | 2d8 | 2d6+2 (soco de hifa) + Esporos (área) (livros/LIVRO-DO-MESTRE.md:1911) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-treant-podre | Treant Podre | ataque "Mordida" dano | 1d10 | 3d6+5 (galho) + 2d6 necrótico em área (gás) (livros/LIVRO-DO-MESTRE.md:1948) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-treant-podre | Treant Podre | ataque "Garras" dano | 1d8 | 3d6+5 (galho) + 2d6 necrótico em área (gás) (livros/LIVRO-DO-MESTRE.md:1948) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-treant-podre | Treant Podre | ataque "Ataque especial" dano | 2d8 | 3d6+5 (galho) + 2d6 necrótico em área (gás) (livros/LIVRO-DO-MESTRE.md:1948) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | ataque "Mordida" dano | 1d6 | 2d6+3 (gavinha agarrante) + 4d6 ácido/turno (estômago) (livros/LIVRO-DO-MESTRE.md:1984) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | ataque "Garras" dano | 1d8 | 2d6+3 (gavinha agarrante) + 4d6 ácido/turno (estômago) (livros/LIVRO-DO-MESTRE.md:1984) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | ataque "Ataque especial" dano | 2d8 | 2d6+3 (gavinha agarrante) + 4d6 ácido/turno (estômago) (livros/LIVRO-DO-MESTRE.md:1984) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-acido | Slime Ácido | ataque "Mordida" dano | 1d6 | 2d6 ácido (contato) (livros/LIVRO-DO-MESTRE.md:2026) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-acido | Slime Ácido | ataque "Garras" dano | 1d8 | 2d6 ácido (contato) (livros/LIVRO-DO-MESTRE.md:2026) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-acido | Slime Ácido | ataque "Investida" dano | 1d10 | 2d6 ácido (contato) (livros/LIVRO-DO-MESTRE.md:2026) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-de-cristal | Slime de Cristal | ataque "Garras" dano | 1d8 | 2d6 cortante (cristais) + 1d6 ácido (contato) (livros/LIVRO-DO-MESTRE.md:2062) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-de-cristal | Slime de Cristal | ataque "Investida" dano | 1d10 | 2d6 cortante (cristais) + 1d6 ácido (contato) (livros/LIVRO-DO-MESTRE.md:2062) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-fogo | Elemental de Fogo | ataque "Mordida" dano | 1d10 | 2d6+5 fogo (toque) + 2d8 fogo automático em adjacência (livros/LIVRO-DO-MESTRE.md:2098) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-fogo | Elemental de Fogo | ataque "Garras" dano | 1d8 | 2d6+5 fogo (toque) + 2d8 fogo automático em adjacência (livros/LIVRO-DO-MESTRE.md:2098) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-gelo | Elemental de Gelo | ataque "Mordida" dano | 1d10 | 2d8+5 frio (soco) + Lança de Gelo 3d6 frio (alcance 18m) (livros/LIVRO-DO-MESTRE.md:2134) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-gelo | Elemental de Gelo | ataque "Garras" dano | 1d8 | 2d8+5 frio (soco) + Lança de Gelo 3d6 frio (alcance 18m) (livros/LIVRO-DO-MESTRE.md:2134) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-gelo | Elemental de Gelo | ataque "Ataque especial" dano | 2d8 | 2d8+5 frio (soco) + Lança de Gelo 3d6 frio (alcance 18m) (livros/LIVRO-DO-MESTRE.md:2134) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-yeti-das-profundezas | Yeti das Profundezas | ataque "Mordida" dano | 1d10 | 2d6+5 (garras) + 1d8+5 (abraço congelante) (livros/LIVRO-DO-MESTRE.md:2176) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-yeti-das-profundezas | Yeti das Profundezas | ataque "Garras" dano | 1d8 | 2d6+5 (garras) + 1d8+5 (abraço congelante) (livros/LIVRO-DO-MESTRE.md:2176) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-yeti-das-profundezas | Yeti das Profundezas | ataque "Ataque especial" dano | 2d8 | 2d6+5 (garras) + 1d8+5 (abraço congelante) (livros/LIVRO-DO-MESTRE.md:2176) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lobo-do-inverno | Lobo do Inverno | ataque "Mordida" dano | 1d6 | 2d6+4 (mordida) + Sopro de Gelo (livros/LIVRO-DO-MESTRE.md:2214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lobo-do-inverno | Lobo do Inverno | ataque "Garras" dano | 1d8 | 2d6+4 (mordida) + Sopro de Gelo (livros/LIVRO-DO-MESTRE.md:2214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lobo-do-inverno | Lobo do Inverno | ataque "Investida" dano | 1d10 | 2d6+4 (mordida) + Sopro de Gelo (livros/LIVRO-DO-MESTRE.md:2214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mimico-de-bau | Mímico de Baú | ataque "Mordida" dano | 1d6 | 3d6+3 (mordida ácida) + Adesivo (livros/LIVRO-DO-MESTRE.md:2253) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mimico-de-bau | Mímico de Baú | ataque "Garras" dano | 1d8 | 3d6+3 (mordida ácida) + Adesivo (livros/LIVRO-DO-MESTRE.md:2253) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mimico-de-bau | Mímico de Baú | ataque "Ataque especial" dano | 2d8 | 3d6+3 (mordida ácida) + Adesivo (livros/LIVRO-DO-MESTRE.md:2253) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-metamorfo-dubio | Metamorfo Dúbio | ataque "Mordida" dano | 1d10 | 2d6+3 (golpes ou arma copiada) (livros/LIVRO-DO-MESTRE.md:2292) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-metamorfo-dubio | Metamorfo Dúbio | ataque "Garras" dano | 1d8 | 2d6+3 (golpes ou arma copiada) (livros/LIVRO-DO-MESTRE.md:2292) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-metamorfo-dubio | Metamorfo Dúbio | ataque "Ataque especial" dano | 2d8 | 2d6+3 (golpes ou arma copiada) (livros/LIVRO-DO-MESTRE.md:2292) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hidra-das-cavernas | Hidra das Cavernas | ataque "Mordida" dano | 2d8 | 2d6+5 por mordida (5 ataques, cada com efeito diferente) (livros/LIVRO-DO-MESTRE.md:2334) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hidra-das-cavernas | Hidra das Cavernas | ataque "Garras" dano | 2d6 | 2d6+5 por mordida (5 ataques, cada com efeito diferente) (livros/LIVRO-DO-MESTRE.md:2334) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hidra-das-cavernas | Hidra das Cavernas | ataque "Ataque especial" dano | 3d10 | 2d6+5 por mordida (5 ataques, cada com efeito diferente) (livros/LIVRO-DO-MESTRE.md:2334) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-quimera | Quimera | ataque "Mordida" dano | 2d8 | 2d6+5 (garras de leão) + 2d6+5 (mordida de dragão) + 2d6+5 (chifres de cabra) (livros/LIVRO-DO-MESTRE.md:2377) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-quimera | Quimera | ataque "Garras" dano | 2d6 | 2d6+5 (garras de leão) + 2d6+5 (mordida de dragão) + 2d6+5 (chifres de cabra) (livros/LIVRO-DO-MESTRE.md:2377) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-quimera | Quimera | ataque "Ataque especial" dano | 3d10 | 2d6+5 (garras de leão) + 2d6+5 (mordida de dragão) + 2d6+5 (chifres de cabra) (livros/LIVRO-DO-MESTRE.md:2377) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-anjo-caido | Anjo Caído | ataque "Mordida" dano | 2d8 | 3d8+6 sagrado/necrótico (espada flamejante) + 2d10 radiante (toque) (livros/LIVRO-DO-MESTRE.md:2415) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-anjo-caido | Anjo Caído | ataque "Garras" dano | 2d6 | 3d8+6 sagrado/necrótico (espada flamejante) + 2d10 radiante (toque) (livros/LIVRO-DO-MESTRE.md:2415) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-anjo-caido | Anjo Caído | ataque "Ataque especial" dano | 3d10 | 3d8+6 sagrado/necrótico (espada flamejante) + 2d10 radiante (toque) (livros/LIVRO-DO-MESTRE.md:2415) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gargula-de-cristal | Gárgula de Cristal | ataque "Mordida" dano | 1d6 | 1d6+3 (garras) + 1d6+3 (mordida) (livros/LIVRO-DO-MESTRE.md:2454) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gargula-de-cristal | Gárgula de Cristal | ataque "Garras" dano | 1d8 | 1d6+3 (garras) + 1d6+3 (mordida) (livros/LIVRO-DO-MESTRE.md:2454) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gargula-de-cristal | Gárgula de Cristal | ataque "Ataque especial" dano | 2d8 | 1d6+3 (garras) + 1d6+3 (mordida) (livros/LIVRO-DO-MESTRE.md:2454) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aberracao-tentacular | Aberração Tentacular | ataque "Mordida" dano | 1d10 | 2d6+4 psíquico (tentáculo mental) (livros/LIVRO-DO-MESTRE.md:2490) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aberracao-tentacular | Aberração Tentacular | ataque "Garras" dano | 1d8 | 2d6+4 psíquico (tentáculo mental) (livros/LIVRO-DO-MESTRE.md:2490) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aberracao-tentacular | Aberração Tentacular | ataque "Ataque especial" dano | 2d8 | 2d6+4 psíquico (tentáculo mental) (livros/LIVRO-DO-MESTRE.md:2490) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco-de-magma | Basilisco de Magma | ataque "Mordida" dano | 1d10 | 2d6+4 (mordida ígnea) (livros/LIVRO-DO-MESTRE.md:2526) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco-de-magma | Basilisco de Magma | ataque "Garras" dano | 1d8 | 2d6+4 (mordida ígnea) (livros/LIVRO-DO-MESTRE.md:2526) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco-de-magma | Basilisco de Magma | ataque "Ataque especial" dano | 2d8 | 2d6+4 (mordida ígnea) (livros/LIVRO-DO-MESTRE.md:2526) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sereia-das-profundezas | Sereia das Profundezas | ataque "Mordida" dano | 1d10 | 2d6+3 (garras) + Canto Encantador (livros/LIVRO-DO-MESTRE.md:2564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sereia-das-profundezas | Sereia das Profundezas | ataque "Garras" dano | 1d8 | 2d6+3 (garras) + Canto Encantador (livros/LIVRO-DO-MESTRE.md:2564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sereia-das-profundezas | Sereia das Profundezas | ataque "Ataque especial" dano | 2d8 | 2d6+3 (garras) + Canto Encantador (livros/LIVRO-DO-MESTRE.md:2564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-troll-de-pedra | Troll de Pedra | ataque "Mordida" dano | 1d10 | 1d6+5 (garras, 2 ataques) + 1d10+5 (mordida) (livros/LIVRO-DO-MESTRE.md:2599) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-troll-de-pedra | Troll de Pedra | ataque "Garras" dano | 1d8 | 1d6+5 (garras, 2 ataques) + 1d10+5 (mordida) (livros/LIVRO-DO-MESTRE.md:2599) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-troll-de-pedra | Troll de Pedra | ataque "Ataque especial" dano | 2d8 | 1d6+5 (garras, 2 ataques) + 1d10+5 (mordida) (livros/LIVRO-DO-MESTRE.md:2599) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ciclope | Ciclope | ataque "Mordida" dano | 2d8 | 2d10+7 (clava) (livros/LIVRO-DO-MESTRE.md:2638) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ciclope | Ciclope | ataque "Garras" dano | 2d6 | 2d10+7 (clava) (livros/LIVRO-DO-MESTRE.md:2638) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ciclope | Ciclope | ataque "Ataque especial" dano | 3d10 | 2d10+7 (clava) (livros/LIVRO-DO-MESTRE.md:2638) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-harpia-de-caverna | Harpia de Caverna | ataque "Garras" dano | 1d8 | 2d6 (garras) + 1d6 (mordida) (livros/LIVRO-DO-MESTRE.md:2674) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-harpia-de-caverna | Harpia de Caverna | ataque "Ataque especial" dano | 2d8 | 2d6 (garras) + 1d6 (mordida) (livros/LIVRO-DO-MESTRE.md:2674) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-roper | Roper | ataque "Mordida" dano | 1d10 | 4d6+4 (tentáculos agarrantes) + 1d8+4 (mordida) (livros/LIVRO-DO-MESTRE.md:2702) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-roper | Roper | ataque "Garras" dano | 1d8 | 4d6+4 (tentáculos agarrantes) + 1d8+4 (mordida) (livros/LIVRO-DO-MESTRE.md:2702) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-roper | Roper | ataque "Ataque especial" dano | 2d8 | 4d6+4 (tentáculos agarrantes) + 1d8+4 (mordida) (livros/LIVRO-DO-MESTRE.md:2702) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aboleth | Aboleth | ataque "Mordida" dano | 2d8 | 2d6+6 (tentáculo) × 3 ataques + Escravização Mental (livros/LIVRO-DO-MESTRE.md:2723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aboleth | Aboleth | ataque "Garras" dano | 2d6 | 2d6+6 (tentáculo) × 3 ataques + Escravização Mental (livros/LIVRO-DO-MESTRE.md:2723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aboleth | Aboleth | ataque "Ataque especial" dano | 3d10 | 2d6+6 (tentáculo) × 3 ataques + Escravização Mental (livros/LIVRO-DO-MESTRE.md:2723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-pudim-negro | Pudim Negro | ataque "Mordida" dano | 1d10 | 3d8 ácido (englobamento) (livros/LIVRO-DO-MESTRE.md:2744) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-pudim-negro | Pudim Negro | ataque "Garras" dano | 1d8 | 3d8 ácido (englobamento) (livros/LIVRO-DO-MESTRE.md:2744) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-pudim-negro | Pudim Negro | ataque "Ataque especial" dano | 2d8 | 3d8 ácido (englobamento) (livros/LIVRO-DO-MESTRE.md:2744) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | ataque "Mordida" dano | 1d6 | 2d8+3 (pinça) × 2 (livros/LIVRO-DO-MESTRE.md:2765) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | ataque "Garras" dano | 1d8 | 2d8+3 (pinça) × 2 (livros/LIVRO-DO-MESTRE.md:2765) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | ataque "Ataque especial" dano | 2d8 | 2d8+3 (pinça) × 2 (livros/LIVRO-DO-MESTRE.md:2765) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | ataque "Mordida" dano | 1d10 | 2d10+5 (garra) + 1d8+5 (segunda garra) (livros/LIVRO-DO-MESTRE.md:2786) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | ataque "Garras" dano | 1d8 | 2d10+5 (garra) + 1d8+5 (segunda garra) (livros/LIVRO-DO-MESTRE.md:2786) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | ataque "Ataque especial" dano | 2d8 | 2d10+5 (garra) + 1d8+5 (segunda garra) (livros/LIVRO-DO-MESTRE.md:2786) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-cavaleira | Aranha-Cavaleira | ataque "Mordida" dano | 1d10 | 2d8+4 (mordida venenosa) + Montaria (livros/LIVRO-DO-MESTRE.md:2804) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-cavaleira | Aranha-Cavaleira | ataque "Garras" dano | 1d8 | 2d8+4 (mordida venenosa) + Montaria (livros/LIVRO-DO-MESTRE.md:2804) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-cavaleira | Aranha-Cavaleira | ataque "Ataque especial" dano | 2d8 | 2d8+4 (mordida venenosa) + Montaria (livros/LIVRO-DO-MESTRE.md:2804) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | ataque "Mordida" dano | 1d6 | 1d4 (mordida) + Doença (livros/LIVRO-DO-MESTRE.md:2822) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | ataque "Garras" dano | 1d8 | 1d4 (mordida) + Doença (livros/LIVRO-DO-MESTRE.md:2822) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | ataque "Investida" dano | 1d10 | 1d4 (mordida) + Doença (livros/LIVRO-DO-MESTRE.md:2822) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-trovao | Besouro-Trovão | ataque "Garras" dano | 1d8 | 1d10 (chifres) + 2d8 elétrico (descarga) (livros/LIVRO-DO-MESTRE.md:2840) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | ataque "Mordida" dano | 2d8 | 3d8+8 (mordida triturante) + Engolimento (livros/LIVRO-DO-MESTRE.md:2858) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | ataque "Garras" dano | 2d6 | 3d8+8 (mordida triturante) + Engolimento (livros/LIVRO-DO-MESTRE.md:2858) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | ataque "Ataque especial" dano | 3d10 | 3d8+8 (mordida triturante) + Engolimento (livros/LIVRO-DO-MESTRE.md:2858) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-salamandra-gigante | Salamandra Gigante | ataque "Mordida" dano | 1d10 | 2d6+3 (mordida fervente) + 1d6 fogo passivo em adjacência (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-salamandra-gigante | Salamandra Gigante | ataque "Garras" dano | 1d8 | 2d6+3 (mordida fervente) + 1d6 fogo passivo em adjacência (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-salamandra-gigante | Salamandra Gigante | ataque "Ataque especial" dano | 2d8 | 2d6+3 (mordida fervente) + 1d6 fogo passivo em adjacência (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-behemoth-de-pedra | Behemoth de Pedra | ataque "Mordida" dano | 2d8 | 4d12+10 (pisão de área) + 2d10+10 (golpe de cauda) (livros/LIVRO-DO-MESTRE.md:2895) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-behemoth-de-pedra | Behemoth de Pedra | ataque "Garras" dano | 2d6 | 4d12+10 (pisão de área) + 2d10+10 (golpe de cauda) (livros/LIVRO-DO-MESTRE.md:2895) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-behemoth-de-pedra | Behemoth de Pedra | ataque "Ataque especial" dano | 3d10 | 4d12+10 (pisão de área) + 2d10+10 (golpe de cauda) (livros/LIVRO-DO-MESTRE.md:2895) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-da-sombra | Fera da Sombra | ataque "Mordida" dano | 1d10 | 2d6+4 necrótico (mordida de sombra) (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-da-sombra | Fera da Sombra | ataque "Garras" dano | 1d8 | 2d6+4 necrótico (mordida de sombra) (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-da-sombra | Fera da Sombra | ataque "Ataque especial" dano | 2d8 | 2d6+4 necrótico (mordida de sombra) (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-medusa | Medusa | ataque "Mordida" dano | 1d10 | 1d6+2 (serpentes da cabeça, venenosas) + Olhar (livros/LIVRO-DO-MESTRE.md:2933) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-medusa | Medusa | ataque "Garras" dano | 1d8 | 1d6+2 (serpentes da cabeça, venenosas) + Olhar (livros/LIVRO-DO-MESTRE.md:2933) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-medusa | Medusa | ataque "Ataque especial" dano | 2d8 | 1d6+2 (serpentes da cabeça, venenosas) + Olhar (livros/LIVRO-DO-MESTRE.md:2933) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fenix-de-caverna | Fênix de Caverna | ataque "Mordida" dano | 2d8 | 2d10+6 fogo (bico e garras) + 3d8 fogo passivo em adjacência (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fenix-de-caverna | Fênix de Caverna | ataque "Garras" dano | 2d6 | 2d10+6 fogo (bico e garras) + 3d8 fogo passivo em adjacência (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fenix-de-caverna | Fênix de Caverna | ataque "Ataque especial" dano | 3d10 | 2d10+6 fogo (bico e garras) + 3d8 fogo passivo em adjacência (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gigante-de-pedra | Gigante de Pedra | ataque "Mordida" dano | 2d8 | 3d8+8 (clava de pedra) + 4d10+8 (arremesso de pedra, 60m) (livros/LIVRO-DO-MESTRE.md:2970) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gigante-de-pedra | Gigante de Pedra | ataque "Garras" dano | 2d6 | 3d8+8 (clava de pedra) + 4d10+8 (arremesso de pedra, 60m) (livros/LIVRO-DO-MESTRE.md:2970) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gigante-de-pedra | Gigante de Pedra | ataque "Ataque especial" dano | 3d10 | 3d8+8 (clava de pedra) + 4d10+8 (arremesso de pedra, 60m) (livros/LIVRO-DO-MESTRE.md:2970) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | ataque "Mordida" dano | 1d10 | 3d8+3 (garras) ou Magia variável (livros/LIVRO-DO-MESTRE.md:2988) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | ataque "Garras" dano | 1d8 | 3d8+3 (garras) ou Magia variável (livros/LIVRO-DO-MESTRE.md:2988) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | ataque "Ataque especial" dano | 2d8 | 3d8+3 (garras) ou Magia variável (livros/LIVRO-DO-MESTRE.md:2988) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-seminal | Fera Seminal | ataque "Mordida" dano | 2d8 | 2d10+5 (mordida de anulação) (livros/LIVRO-DO-MESTRE.md:3006) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-seminal | Fera Seminal | ataque "Garras" dano | 2d6 | 2d10+5 (mordida de anulação) (livros/LIVRO-DO-MESTRE.md:3006) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-seminal | Fera Seminal | ataque "Ataque especial" dano | 3d10 | 2d10+5 (mordida de anulação) (livros/LIVRO-DO-MESTRE.md:3006) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-carnical-alado | Carniçal Alado | ataque "Mordida" dano | 1d10 | 2d6+5 (garras) + 1d6+5 (bico) (livros/LIVRO-DO-MESTRE.md:3024) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-carnical-alado | Carniçal Alado | ataque "Garras" dano | 1d8 | 2d6+5 (garras) + 1d6+5 (bico) (livros/LIVRO-DO-MESTRE.md:3024) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-carnical-alado | Carniçal Alado | ataque "Ataque especial" dano | 2d8 | 2d6+5 (garras) + 1d6+5 (bico) (livros/LIVRO-DO-MESTRE.md:3024) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | ataque "Mordida" dano | 2d8 | 3d6+12 fogo (espada vorpal) + 2d8+12 relâmpago (chicote de relâmpago) (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | ataque "Garras" dano | 2d6 | 3d6+12 fogo (espada vorpal) + 2d8+12 relâmpago (chicote de relâmpago) (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | ataque "Ataque especial" dano | 3d10 | 3d6+12 fogo (espada vorpal) + 2d8+12 relâmpago (chicote de relâmpago) (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | ataque "Mordida" dano | 1d6 | 2d6 (mordidas múltiplas em área de ocupação) (livros/LIVRO-DO-MESTRE.md:3063) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | ataque "Garras" dano | 1d8 | 2d6 (mordidas múltiplas em área de ocupação) (livros/LIVRO-DO-MESTRE.md:3063) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | ataque "Investida" dano | 1d10 | 2d6 (mordidas múltiplas em área de ocupação) (livros/LIVRO-DO-MESTRE.md:3063) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-terra | Elemental de Terra | ataque "Mordida" dano | 1d10 | 2d8+8 (socos de pedra) × 2 (livros/LIVRO-DO-MESTRE.md:3083) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-terra | Elemental de Terra | ataque "Garras" dano | 1d8 | 2d8+8 (socos de pedra) × 2 (livros/LIVRO-DO-MESTRE.md:3083) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-terra | Elemental de Terra | ataque "Ataque especial" dano | 2d8 | 2d8+8 (socos de pedra) × 2 (livros/LIVRO-DO-MESTRE.md:3083) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-banshee | Banshee | ataque "Mordida" dano | 1d10 | 3d6 psíquico (toque corrupto) (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-banshee | Banshee | ataque "Garras" dano | 1d8 | 3d6 psíquico (toque corrupto) (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-banshee | Banshee | ataque "Ataque especial" dano | 2d8 | 3d6 psíquico (toque corrupto) (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-morcego-tirano | Morcego-Tirano | ataque "Mordida" dano | 1d10 | 2d6+3 (mordida) + 1d8+3 (garras) (livros/LIVRO-DO-MESTRE.md:3122) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-morcego-tirano | Morcego-Tirano | ataque "Garras" dano | 1d8 | 2d6+3 (mordida) + 1d8+3 (garras) (livros/LIVRO-DO-MESTRE.md:3122) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-morcego-tirano | Morcego-Tirano | ataque "Ataque especial" dano | 2d8 | 2d6+3 (mordida) + 1d8+3 (garras) (livros/LIVRO-DO-MESTRE.md:3122) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ooze-ocular | Ooze Ocular | ataque "Mordida" dano | 1d10 | 1d8+3 mordida + Raios oculares (livros/LIVRO-DO-MESTRE.md:3140) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ooze-ocular | Ooze Ocular | ataque "Garras" dano | 1d8 | 1d8+3 mordida + Raios oculares (livros/LIVRO-DO-MESTRE.md:3140) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ooze-ocular | Ooze Ocular | ataque "Ataque especial" dano | 2d8 | 1d8+3 mordida + Raios oculares (livros/LIVRO-DO-MESTRE.md:3140) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-devorador-anciao-filhote | Devorador Ancião (Filhote) | ataque "Mordida" dano | 2d8 | 4d12+19 (mordida) + 4d8+19 (garras × 2) + 4d10+19 (chifres) + 4d12+19 (cauda) (livros/LIVRO-DO-MESTRE.md:3158) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-devorador-anciao-filhote | Devorador Ancião (Filhote) | ataque "Garras" dano | 2d6 | 4d12+19 (mordida) + 4d8+19 (garras × 2) + 4d10+19 (chifres) + 4d12+19 (cauda) (livros/LIVRO-DO-MESTRE.md:3158) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-devorador-anciao-filhote | Devorador Ancião (Filhote) | ataque "Ataque especial" dano | 3d10 | 4d12+19 (mordida) + 4d8+19 (garras × 2) + 4d10+19 (chifres) + 4d12+19 (cauda) (livros/LIVRO-DO-MESTRE.md:3158) | scripts/generate-compendium.mjs:102-166 (monsterActions) |

### 1.7 Ataques: tipo (20)

Uma linha por espécime. O livro rotula um ataque específico (ex.: "2d8+4 veneno (ferrão)"); o dado aplica tipos fixos do template a todos os ataques.

Onde mudar: `scripts/generate-compendium.mjs:102-166`, campos `damageType` das linhas 114, 129, 144 e 158.

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-espectro | Espectro | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | necrótico — "2d6 necrótico (toque de vida)" (livros/LIVRO-DO-MESTRE.md:681) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necroarca-arquiliche | Necroarca (Arquiliche) | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | necrótico — "4d8+8 necrótico (toque paralisante) ou 8d6 (Relâmpago)" (livros/LIVRO-DO-MESTRE.md:723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-assombracao | Assombração | tipo dos ataques | Mordida: perfurante,Garras: cortante,Investida: contundente | psíquico — "2d8+3 psíquico" (livros/LIVRO-DO-MESTRE.md:769) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-vampiro | Vampiro | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | necrótico — "1d8+5 (garras) + 2d6+4 necrótico e dreno (mordida)" (livros/LIVRO-DO-MESTRE.md:806) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-wyvern | Wyvern | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | veneno — "2d6+4 (mordida) + 2d6+4 (garras) + 2d8+4 veneno (ferrão)" (livros/LIVRO-DO-MESTRE.md:973) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | fogo — "3d10+8 (soco de ferro) + 2d6 fogo automático em adjacência" (livros/LIVRO-DO-MESTRE.md:1214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-manticora | Manticora | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | fogo — "2d6+5 (garras) + 2d8+5 (mordida) + 1d8+5 fogo por espinho (até 3/turno, alcance 45m)" (livros/LIVRO-DO-MESTRE.md:1370) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-escorpiao-gigante | Escorpião Gigante | tipo dos ataques | Mordida: perfurante,Garras: cortante,Investida: contundente | veneno — "1d8+3 (garras, agarramento automático) + 1d10+3 veneno (ferrão)" (livros/LIVRO-DO-MESTRE.md:1527) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-treant-podre | Treant Podre | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | necrótico — "3d6+5 (galho) + 2d6 necrótico em área (gás)" (livros/LIVRO-DO-MESTRE.md:1948) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-de-cristal | Slime de Cristal | tipo dos ataques | Mordida: perfurante,Investida: contundente | cortante — "2d6 cortante (cristais) + 1d6 ácido (contato)" (livros/LIVRO-DO-MESTRE.md:2062) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-fogo | Elemental de Fogo | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | fogo/fogo — "2d6+5 fogo (toque) + 2d8 fogo automático em adjacência" (livros/LIVRO-DO-MESTRE.md:2098) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-gelo | Elemental de Gelo | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | frio/frio — "2d8+5 frio (soco) + Lança de Gelo 3d6 frio (alcance 18m)" (livros/LIVRO-DO-MESTRE.md:2134) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-anjo-caido | Anjo Caído | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | sagrado/necrótico/radiante — "3d8+6 sagrado/necrótico (espada flamejante) + 2d10 radiante (toque)" (livros/LIVRO-DO-MESTRE.md:2415) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aberracao-tentacular | Aberração Tentacular | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | psíquico — "2d6+4 psíquico (tentáculo mental)" (livros/LIVRO-DO-MESTRE.md:2490) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-trovao | Besouro-Trovão | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | trovao — "1d10 (chifres) + 2d8 elétrico (descarga)" (livros/LIVRO-DO-MESTRE.md:2840) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-salamandra-gigante | Salamandra Gigante | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | fogo — "2d6+3 (mordida fervente) + 1d6 fogo passivo em adjacência" (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-da-sombra | Fera da Sombra | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | necrótico — "2d6+4 necrótico (mordida de sombra)" (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fenix-de-caverna | Fênix de Caverna | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | fogo/fogo — "2d10+6 fogo (bico e garras) + 3d8 fogo passivo em adjacência" (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | fogo — "3d6+12 fogo (espada vorpal) + 2d8+12 relâmpago (chicote de relâmpago)" (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-banshee | Banshee | tipo dos ataques | Mordida: perfurante,Garras: cortante,Ataque especial: mágico | psíquico — "3d6 psíquico (toque corrupto)" (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:102-166 (monsterActions) |

### 1.8 Ataques: alcance em células (82)

#### 1.8.1 Alcance inventado pelo template (77)

O livro não declara alcance para esses ataques: são corpo a corpo por omissão (1 cel = 1,5 m). O dado cria `Investida` com 2 cel (3,0 m) e `Ataque especial` com 4 cel (6,0 m) ou 6 cel (9,0 m), conforme tier/nível.

Onde mudar: `scripts/generate-compendium.mjs:102-166`, campos `rangeCells` das linhas 116, 131, 146 e 160 (e os rótulos `label` das linhas 118, 133, 148 e 162).

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d6 (pancada)" (livros/LIVRO-DO-MESTRE.md:554) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-esqueleto-armado | Esqueleto Armado | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8 (espada enferrujada) ou 1d6 (arco de osso)" (livros/LIVRO-DO-MESTRE.md:596) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necrofago | Necrófago | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d6+2 (garras) + 1d4 (mordida paralisante)" (livros/LIVRO-DO-MESTRE.md:639) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-espectro | Espectro | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6 necrótico (toque de vida)" (livros/LIVRO-DO-MESTRE.md:681) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-necroarca-arquiliche | Necroarca (Arquiliche) | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "4d8+8 necrótico (toque paralisante) ou 8d6 (Relâmpago)" (livros/LIVRO-DO-MESTRE.md:723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-assombracao | Assombração | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+3 psíquico" (livros/LIVRO-DO-MESTRE.md:769) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-vampiro | Vampiro | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8+5 (garras) + 2d6+4 necrótico e dreno (mordida)" (livros/LIVRO-DO-MESTRE.md:806) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+4 (espada longa espectral)" (livros/LIVRO-DO-MESTRE.md:852) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mumia | Múmia | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (golpe) + Maldição da Múmia" (livros/LIVRO-DO-MESTRE.md:890) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragonete-de-magma | Dragonete de Magma | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8+3 (garras) + 1d6 (mordida)" (livros/LIVRO-DO-MESTRE.md:934) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-wyvern | Wyvern | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+4 (mordida) + 2d6+4 (garras) + 2d8+4 veneno (ferrão)" (livros/LIVRO-DO-MESTRE.md:973) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d10+7 (mordida) + 2d6+7 (garras) + 1d12+7 (cauda)" (livros/LIVRO-DO-MESTRE.md:1017) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-drake-de-pedra | Drake de Pedra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+4 (mordida) + 1d8+4 (cauda de pedra)" (livros/LIVRO-DO-MESTRE.md:1060) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d10+10 (mordida) + 3d6+10 (garras) + 2d12+10 (cauda)" (livros/LIVRO-DO-MESTRE.md:1097) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-pedra | Golem de Pedra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d8+6 (soco de pedra)" (livros/LIVRO-DO-MESTRE.md:1145) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d10+8 (soco de ferro) + 2d6 fogo automático em adjacência" (livros/LIVRO-DO-MESTRE.md:1214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-automato-de-genio | Autômato de Gênio | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+4 (lâminas integradas) ou Magia variável" (livros/LIVRO-DO-MESTRE.md:1252) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-minotauro | Minotauro | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+5 (machado) + 2d8 (chifrada)" (livros/LIVRO-DO-MESTRE.md:1295) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco | Basilisco | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (mordida petrificante)" (livros/LIVRO-DO-MESTRE.md:1332) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-manticora | Manticora | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+5 (garras) + 2d8+5 (mordida) + 1d8+5 fogo por espinho (até 3/turno, alcance 45m)" (livros/LIVRO-DO-MESTRE.md:1370) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-grifo | Grifo | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+4 (garras dianteiras) + 1d6+4 (mordida)" (livros/LIVRO-DO-MESTRE.md:1406) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cocatriz | Cocatriz | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d4+1 (bico petrificante)" (livros/LIVRO-DO-MESTRE.md:1442) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8+3 (mordida envenenada)" (livros/LIVRO-DO-MESTRE.md:1484) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-escorpiao-gigante | Escorpião Gigante | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8+3 (garras, agarramento automático) + 1d10+3 veneno (ferrão)" (livros/LIVRO-DO-MESTRE.md:1527) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-centopeia-caustica | Centopeia Cáustica | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+2 (mordida) + 2d4 ácido contínuo em contato" (livros/LIVRO-DO-MESTRE.md:1564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-diamante | Besouro-Diamante | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d4 (mandíbulas)" (livros/LIVRO-DO-MESTRE.md:1601) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-kraken-menor | Kraken Menor | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d6+5 por tentáculo (agarramento automático) + 2d8+5 (mordida)" (livros/LIVRO-DO-MESTRE.md:1677) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-serpente-do-abismo | Serpente-do-Abismo | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8+4 (mordida venenosa) + 2d8+4/turno (constrição)" (livros/LIVRO-DO-MESTRE.md:1716) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-tubarao-cego | Tubarão-Cego | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+4 (mordida)" (livros/LIVRO-DO-MESTRE.md:1754) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+2 (espada longa)" (livros/LIVRO-DO-MESTRE.md:1834) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-orc-de-masmorra | Orc de Masmorra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d12+3 (machado grande)" (livros/LIVRO-DO-MESTRE.md:1870) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-cogumelo-rei | Cogumelo-Rei | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+2 (soco de hifa) + Esporos (área)" (livros/LIVRO-DO-MESTRE.md:1911) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-treant-podre | Treant Podre | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d6+5 (galho) + 2d6 necrótico em área (gás)" (livros/LIVRO-DO-MESTRE.md:1948) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (gavinha agarrante) + 4d6 ácido/turno (estômago)" (livros/LIVRO-DO-MESTRE.md:1984) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-acido | Slime Ácido | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6 ácido (contato)" (livros/LIVRO-DO-MESTRE.md:2026) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-slime-de-cristal | Slime de Cristal | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6 cortante (cristais) + 1d6 ácido (contato)" (livros/LIVRO-DO-MESTRE.md:2062) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-fogo | Elemental de Fogo | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+5 fogo (toque) + 2d8 fogo automático em adjacência" (livros/LIVRO-DO-MESTRE.md:2098) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-gelo | Elemental de Gelo | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+5 frio (soco) + Lança de Gelo 3d6 frio (alcance 18m)" (livros/LIVRO-DO-MESTRE.md:2134) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-yeti-das-profundezas | Yeti das Profundezas | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+5 (garras) + 1d8+5 (abraço congelante)" (livros/LIVRO-DO-MESTRE.md:2176) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lobo-do-inverno | Lobo do Inverno | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+4 (mordida) + Sopro de Gelo" (livros/LIVRO-DO-MESTRE.md:2214) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mimico-de-bau | Mímico de Baú | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d6+3 (mordida ácida) + Adesivo" (livros/LIVRO-DO-MESTRE.md:2253) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-metamorfo-dubio | Metamorfo Dúbio | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (golpes ou arma copiada)" (livros/LIVRO-DO-MESTRE.md:2292) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-hidra-das-cavernas | Hidra das Cavernas | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+5 por mordida (5 ataques, cada com efeito diferente)" (livros/LIVRO-DO-MESTRE.md:2334) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-quimera | Quimera | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+5 (garras de leão) + 2d6+5 (mordida de dragão) + 2d6+5 (chifres de cabra)" (livros/LIVRO-DO-MESTRE.md:2377) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-anjo-caido | Anjo Caído | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d8+6 sagrado/necrótico (espada flamejante) + 2d10 radiante (toque)" (livros/LIVRO-DO-MESTRE.md:2415) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gargula-de-cristal | Gárgula de Cristal | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d6+3 (garras) + 1d6+3 (mordida)" (livros/LIVRO-DO-MESTRE.md:2454) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aberracao-tentacular | Aberração Tentacular | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+4 psíquico (tentáculo mental)" (livros/LIVRO-DO-MESTRE.md:2490) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-basilisco-de-magma | Basilisco de Magma | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+4 (mordida ígnea)" (livros/LIVRO-DO-MESTRE.md:2526) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-sereia-das-profundezas | Sereia das Profundezas | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (garras) + Canto Encantador" (livros/LIVRO-DO-MESTRE.md:2564) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-troll-de-pedra | Troll de Pedra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d6+5 (garras, 2 ataques) + 1d10+5 (mordida)" (livros/LIVRO-DO-MESTRE.md:2599) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ciclope | Ciclope | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d10+7 (clava)" (livros/LIVRO-DO-MESTRE.md:2638) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-harpia-de-caverna | Harpia de Caverna | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6 (garras) + 1d6 (mordida)" (livros/LIVRO-DO-MESTRE.md:2674) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-roper | Roper | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "4d6+4 (tentáculos agarrantes) + 1d8+4 (mordida)" (livros/LIVRO-DO-MESTRE.md:2702) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aboleth | Aboleth | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+6 (tentáculo) × 3 ataques + Escravização Mental" (livros/LIVRO-DO-MESTRE.md:2723) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-pudim-negro | Pudim Negro | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d8 ácido (englobamento)" (livros/LIVRO-DO-MESTRE.md:2744) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+3 (pinça) × 2" (livros/LIVRO-DO-MESTRE.md:2765) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d10+5 (garra) + 1d8+5 (segunda garra)" (livros/LIVRO-DO-MESTRE.md:2786) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-cavaleira | Aranha-Cavaleira | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+4 (mordida venenosa) + Montaria" (livros/LIVRO-DO-MESTRE.md:2804) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d4 (mordida) + Doença" (livros/LIVRO-DO-MESTRE.md:2822) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-besouro-trovao | Besouro-Trovão | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d10 (chifres) + 2d8 elétrico (descarga)" (livros/LIVRO-DO-MESTRE.md:2840) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d8+8 (mordida triturante) + Engolimento" (livros/LIVRO-DO-MESTRE.md:2858) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-salamandra-gigante | Salamandra Gigante | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (mordida fervente) + 1d6 fogo passivo em adjacência" (livros/LIVRO-DO-MESTRE.md:2876) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-behemoth-de-pedra | Behemoth de Pedra | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "4d12+10 (pisão de área) + 2d10+10 (golpe de cauda)" (livros/LIVRO-DO-MESTRE.md:2895) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-da-sombra | Fera da Sombra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+4 necrótico (mordida de sombra)" (livros/LIVRO-DO-MESTRE.md:2914) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-medusa | Medusa | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d6+2 (serpentes da cabeça, venenosas) + Olhar" (livros/LIVRO-DO-MESTRE.md:2933) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fenix-de-caverna | Fênix de Caverna | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d10+6 fogo (bico e garras) + 3d8 fogo passivo em adjacência" (livros/LIVRO-DO-MESTRE.md:2951) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gigante-de-pedra | Gigante de Pedra | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d8+8 (clava de pedra) + 4d10+8 (arremesso de pedra, 60m)" (livros/LIVRO-DO-MESTRE.md:2970) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d8+3 (garras) ou Magia variável" (livros/LIVRO-DO-MESTRE.md:2988) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-fera-seminal | Fera Seminal | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d10+5 (mordida de anulação)" (livros/LIVRO-DO-MESTRE.md:3006) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-carnical-alado | Carniçal Alado | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+5 (garras) + 1d6+5 (bico)" (livros/LIVRO-DO-MESTRE.md:3024) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-arquidemonio-flamejante | Arquidemônio Flamejante | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d6+12 fogo (espada vorpal) + 2d8+12 relâmpago (chicote de relâmpago)" (livros/LIVRO-DO-MESTRE.md:3043) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | ataque "Investida" alcance | 2 cel (3,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6 (mordidas múltiplas em área de ocupação)" (livros/LIVRO-DO-MESTRE.md:3063) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-terra | Elemental de Terra | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d8+8 (socos de pedra) × 2" (livros/LIVRO-DO-MESTRE.md:3083) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-banshee | Banshee | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "3d6 psíquico (toque corrupto)" (livros/LIVRO-DO-MESTRE.md:3102) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-morcego-tirano | Morcego-Tirano | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "2d6+3 (mordida) + 1d8+3 (garras)" (livros/LIVRO-DO-MESTRE.md:3122) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ooze-ocular | Ooze Ocular | ataque "Ataque especial" alcance | 4 cel (6,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "1d8+3 mordida + Raios oculares" (livros/LIVRO-DO-MESTRE.md:3140) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-devorador-anciao-filhote | Devorador Ancião (Filhote) | ataque "Ataque especial" alcance | 6 cel (9,0 m) | sem alcance declarado; ataques do bestiário são corpo a corpo por omissão (1 cel) — "4d12+19 (mordida) + 4d8+19 (garras × 2) + 4d10+19 (chifres) + 4d12+19 (cauda)" (livros/LIVRO-DO-MESTRE.md:3158) | scripts/generate-compendium.mjs:102-166 (monsterActions) |

#### 1.8.2 Alcance declarado no livro sem ataque equivalente no dado (5)

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar |
|---|---|---|---|---|---|
| monstros-manticora | Manticora | alcance declarado no livro | Mordida 1 cel; Garras 1 cel; Ataque especial 4 cel | 45 m = 30 cel — "alcance 45m" (livros/LIVRO-DO-MESTRE.md:1370) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | alcance declarado no livro | Mordida 1 cel; Garras 1 cel; Investida 2 cel | 9 m = 6 cel — "alcance 9m" (livros/LIVRO-DO-MESTRE.md:1493) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-elemental-de-gelo | Elemental de Gelo | alcance declarado no livro | Mordida 1 cel; Garras 1 cel; Ataque especial 4 cel | 18 m = 12 cel — "alcance 18m" (livros/LIVRO-DO-MESTRE.md:2134) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-ciclope | Ciclope | alcance declarado no livro | Mordida 1 cel; Garras 1 cel; Ataque especial 6 cel | 3 m = 2 cel — "atacar criaturas a 3m" (livros/LIVRO-DO-MESTRE.md:2648) | scripts/generate-compendium.mjs:102-166 (monsterActions) |
| monstros-gigante-de-pedra | Gigante de Pedra | alcance declarado no livro | Mordida 1 cel; Garras 1 cel; Ataque especial 6 cel | 60 m = 40 cel — "alcance 60m" (livros/LIVRO-DO-MESTRE.md:2971) | scripts/generate-compendium.mjs:102-166 (monsterActions) |

## 2. Diferenças de redação (não contam como divergência)

1. **Grafia e extensão do nome.** 9 fichas têm o título grafado de forma diferente no livro e no dado. É diferença de título, não de estatística:

- `029` KRAKEN MENOR (TENTACULADO) no livro, Kraken Menor no dado (livros/LIVRO-DO-MESTRE.md:1661)
- `031` TUBARÃO-CEGO DAS CAVERNAS no livro, Tubarão-Cego no dado (livros/LIVRO-DO-MESTRE.md:1737)
- `035` COGUMELO-REI (MICÔNIDO ANCIÃO) no livro, Cogumelo-Rei no dado (livros/LIVRO-DO-MESTRE.md:1895)
- `044` MÍMICO DE BAÚL no livro, Mímico de Baú no dado (livros/LIVRO-DO-MESTRE.md:2238)
- `056` ROPER (TENTÁCULO-PEDRA) no livro, Roper no dado (livros/LIVRO-DO-MESTRE.md:2697)
- `061` ARANHA-CAVALEIRA (JINOBAKE) no livro, Aranha-Cavaleira no dado (livros/LIVRO-DO-MESTRE.md:2799)
- `071` BRUXA DA MASMORRA (HAG) no livro, Bruxa da Masmorra no dado (livros/LIVRO-DO-MESTRE.md:2983)
- `072` FERA SEMINAL (DESTIVORE) no livro, Fera Seminal no dado (livros/LIVRO-DO-MESTRE.md:3001)
- `079` OOZE OCULAR (OLHO FLUTUANTE) no livro, Ooze Ocular no dado (livros/LIVRO-DO-MESTRE.md:3135)

2. **Rótulos descritivos x tipo mecânico.** O livro escreve "1d6 (pancada)", "1d8 (espada enferrujada)", "2d6+3 (golpe)" etc.; o dado traz `damageType` mecânico. Quando o rótulo do livro não fixa tipo elementar (fogo, frio, ácido, veneno, necrótico, psíquico, radiante, sagrado, trovoa), a escolha "perfurante/cortante/contundente" é dedução do nome da arma e fica fora da seção 1.7.
3. **Leitura Mental do Metamorfo Dúbio.** O livro diz "Alcance 18m" (livros/LIVRO-DO-MESTRE.md:2302), mas é habilidade de ler pensamentos, não ataque. Não entra na contagem de alcance de ataque.
4. **Movimento em metros.** Várias fichas trazem "Movimento 6m/turno" etc.; o dado usa `movement.cells.walk/run`. Não é campo pedido nesta varredura e não entra nas tabelas.
5. **Aliases de spawn.** `monstros-goblin`, `monstros-esqueleto-de-guarda` e `monstros-slime-de-masmorra` existem só no dado (linhas 304-306 do gerador) e não têm ficha 001-080 para confrontar.

## Total

Divergências reais: **507**.

| Campo | Quantidade |
|---|---|
| Vida | 77 |
| CA | 66 |
| PA | 4 |
| Nível/ameaça | 31 |
| Tamanho | 0 |
| Dano de ataque | 227 |
| Tipo de ataque | 20 |
| Alcance de ataque (template) | 77 |
| Alcance de ataque (declarado no livro) | 5 |
| **Total** | **507** |

Espécimes afetados: 80 de 80. Espécimes sem nenhuma divergência nos campos comparados: 0.
