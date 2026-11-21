# Alcances em celulas x metros - levantamento completo

Somente leitura. Nenhum gerador, JSON ou livro foi alterado. Nenhum commit foi feito.

Referencia: commit a840d6d corrigiu quatro habilidades (Julgamento Ardente 9 m = 6, Puxao Abissal 9 m = 6, Carga do Juramento 12 m = 8, Mente Partida 18 m = 12). Esta varredura procura o mesmo tipo de divergencia em todas as entradas.

Regra aplicada: 1 celula = 1,5 m (`METERS_PER_CELL` em `lib/vtt/movement.ts`). Celulas esperadas = `floor(metros / 1,5)`.

Fontes consultadas: `scripts/generate-compendium.mjs` (tabelas `SPELLS`, `ABILITY_CATALOG`, `CHI_ABILITY_CATALOG` e acoes de monstro), `data/compendiums/*.json`, `livros/_parte_x_magias_v4_revisada.md`, `livros/LIVRO-DO-JOGADOR.md` e `livros/CATALOGO-HABILIDADES-TATICAS.md`.

Scripts de extracao (pasta scratchpad/balance): `extrair-alcances.mjs`, `alcances-definitivo.mjs`, `livro-vs-gerador.mjs` e `hab-livro-vs-gerador.mjs`.

## Veredito sobre qual valor esta certo

Em todos os casos abaixo o livro manda (decisao D4 do guia do projeto): o valor em metros esta correto e o `alcanceCells` do gerador e do JSON e que deve mudar. A unica excecao e Correntes Infernais, em que a propria tabela do catalogo tambem traz 3 celulas e precisa ser corrigida junto com o gerador.

## 1. Habilidades com metros no texto e celulas erradas

| id | nome | texto com metros | celulas no dado | celulas esperadas | onde mudar |
|---|---|---|---|---|---|
| habilidades-correntes-infernais | Correntes Infernais | "Selo de sangue 3m" | 3 | 2 | gerador linha 598 (3 para 2) e `livros/CATALOGO-HABILIDADES-TATICAS.md` linha 76 (Alc. 3 para 2). O texto "superficie 3m" de `LIVRO-DO-JOGADOR.md` linha 3116 esta certo e nao muda. |
| habilidades-manto-de-bruma | Manto de Bruma | "Nevoa 6m 1 min" | 3 | 4 | gerador linha 600 (3 para 4). `LIVRO-DO-JOGADOR.md` linha 3130 diz "nevoa salina 6m" e esta certo. Esta habilidade nao consta na tabela do catalogo. |

Total de habilidades nesta secao: 2.

Ja conferidos e corretos: Luz Penitente (3 m = 2), Julgamento Ardente (9 m = 6), Coroa de Fogo (4,5 m = 3), Carga do Juramento (12 m = 8), Agarrão do Pacto (9 m = 6), Mente Partida (18 m = 12) e Puxao Abissal (9 m = 6).

## 2. Magias com metros no texto e celulas erradas

Nestas entradas o trecho com metros esta na descricao gerada a partir do grimorio (`_parte_x_magias_v4_revisada.md`), que e o `bookRef` do pack. O livro traz o alcance em metros no cabecalho da magia.

| id | nome | texto com metros | celulas no dado | celulas esperadas | onde mudar |
|---|---|---|---|---|---|
| magias-raios-de-enfraquecimento | Raios de Enfraquecimento | "18m" (livro linha 176) | 6 | 12 | gerador linha 396 (6 para 12); livro mantem 18m |
| magias-ilusao-menor | Ilusão Menor | "18m" (livro linha 194); "cubo 1,5m" e area | 6 | 12 | gerador linha 408 (6 para 12); livro mantem 18m |
| magias-animacao-de-mortos | Animação de Mortos | "3m" (livro linha 201) | 3 | 2 | gerador linha 412 (3 para 2); livro mantem 3m |
| magias-bola-de-fogo | Bola de Fogo | "45m" (livro linha 207); "Raio 6m" e area | 10 | 30 | gerador linha 414 (10 para 30); livro mantem 45m |
| magias-ventania | Ventania | "Pessoal (linha 18m)" (livro linha 213); "empurrao 4,5m" e efeito | 6 | 12 | gerador linha 431 (6 para 12); livro mantem linha 18m |
| magias-ler-mentes | Ler Mentes | "9m" (livro linha 216) | 4 | 6 | gerador linha 437 (4 para 6); livro mantem 9m |
| magias-relampago | Relâmpago | "36m" (livro linha 219) | 8 | 24 | gerador linha 438 (8 para 24); livro mantem 36m |
| magias-sono | Sono | "18m" (livro linha 222) | 6 | 12 | gerador linha 444 (6 para 12); livro mantem 18m |
| magias-murcha | Murcha | "4,5m" (livro linha 232) | 2 | 3 | gerador linha 452 (2 para 3); livro mantem 4,5m |
| magias-parede-de-fogo | Parede de Fogo | "36m" (livro linha 238); "Parede ate 18m" e area | 8 | 24 | gerador linha 460 (8 para 24); livro mantem 36m |
| magias-cura-em-massa | Cura em Massa | "18m" (livro linha 241); "raio de 3m" e area | 6 | 12 | gerador linha 467 (6 para 12); livro mantem 18m |
| magias-cone-de-frio | Cone de Frio | "Pessoal (cone 18m)" (livro linha 254) | 6 | 12 | gerador linha 473 (6 para 12); livro mantem cone 18m |
| magias-salto-dimensional | Salto Dimensional | "Teletransporte ate 18m" (livro linha 261; alcance do cabecalho e "Pessoal") | 6 | 12 | gerador linha 485 (6 para 12); livro mantem 18m. Caso especial: o metro e a distancia do efeito, nao o alcance do cabecalho. |
| magias-causar-praga | Causar Praga | "18m" (livro linha 270) | 6 | 12 | gerador linha 493 (6 para 12); livro mantem 18m |
| magias-cadeia-de-relampago | Cadeia de Relâmpago | "45m" (livro linha 276); "salta ate 3 alvos adicionais a 9m" | 10 | 30 | gerador linha 505 (10 para 30); livro mantem 45m |
| magias-terremoto | Terremoto | "150m" (livro linha 299); "Raio 30m" e area | 20 | 100 | gerador linha 520 (20 para 100); livro mantem 150m |

Total de magias nesta secao: 16.

## 3. Armas e monstros

Armas: nenhuma entrada cita metros. O alcance e sempre escrito em celulas (exemplo: `Arco Longo de Vinha`, 21 celulas, `armas-arc-l01`). Nada a corrigir.

Monstros: as acoes de ataque (`Mordida`, `Garras`, `Investida`, `Ataque especial`) usam rotulo em celulas e nao citam metros. As centenas de metros encontradas nos `actions` de monstros pertencem as habilidades de assimilacao (`assim-*`), todas com `rangeCells: 0` e `selfTarget: true`, e descrevem bonuses ou areas da habilidade assimilada, nao o alcance de um ataque. Nao entram na contagem.

## 4. Achados adicionais: o livro cita metros, mas o texto do gerador/JSON nao cita

Estes casos ficam de fora da regra literal da tarefa, mas seguem o mesmo padrao do commit a840d6d (Mente Partida foi corrigido assim). Foram localizados cruzando os livros com o gerador.

| id | nome | texto com metros | celulas no dado | celulas esperadas | onde mudar |
|---|---|---|---|---|---|
| habilidades-voto-de-caca | Voto de Caça | "sentir mortos-vivos em 18m" (`LIVRO-DO-JOGADOR.md` linha 3062) | 9 | 12 | gerador linha 586 (9 para 12); livro mantem 18m |
| habilidades-pacto-de-ferro | Pacto de Ferro | "correntes infernais 9m" (`LIVRO-DO-JOGADOR.md` linha 3114) | 5 | 6 | gerador linha 597 (5 para 6); livro mantem 9m |
| habilidades-corrente-mental | Corrente Mental | "Telepatia 18m" (`LIVRO-DO-JOGADOR.md` linha 3128) | 6 | 12 | gerador linha 599 (6 para 12). Observacao: o proprio livro diz que o eco mental usa "alcance original", entao o 18m e da telepatia da habilidade. |
| magias-maos-gelidas | Mãos Gelidas | "4,5m" (livro linha 154) | 2 | 3 | gerador linha 370 (2 para 3). A descricao JSON nao traz o lore porque o livro escreve "Maos Gelidas" sem acento. |
| magias-onda-de-trovao | Onda de Trovão | "Pessoal (cubo 4,5m)" (livro linha 166) | 2 | 3 | gerador linha 381 (2 para 3). Mesmo problema de acento no nome. |
| magias-esfera-acida-de-monstro | Esfera Ácida de Monstro | "18m" (livro linha 179) | 6 | 12 | gerador linha 397 (6 para 12). O livro escreve "Acida" sem acento. |
| magias-mutacao-forcada | Mutação Forçada | "18m" (livro linha 235) | 6 | 12 | gerador linha 459 (6 para 12). |
| magias-prisao-de-gelo | Prisão de Gelo | "18m" (livro linha 286) | 6 | 12 | gerador linha 513 (6 para 12). O livro escreve "Prisao" sem acento. |

Total nesta secao: 8 (3 habilidades e 5 magias).

Nota sobre as cinco magias: o gerador monta a descricao com `SPELL_LORE[s.name]`. Quando o nome do livro difere por acento, o lore nao e carregado e o JSON fica so com o texto curto do catalogo. Isso e uma causa a parte das divergencias de celula e pode ser tratado junto.

## 5. Metros citados que nao sao alcance (nao contabilizados)

| entrada | trecho | motivo |
|---|---|---|
| habilidades-raio-do-pacto-psiquico | "empurra 1,5m em acerto" | distancia do empurrao; o alcance da habilidade e 6 celulas, conforme o proprio texto |
| habilidades-mordida-do-voto | "+3m movimento por 1 minuto" | bonus de movimento, nao alcance |
| magias-nova-arcana | "Explosão 3d6 fogo em área (raio 3 m)" | raio da area, nao alcance; a magia nao consta no grimorio, so em `TABELA-IDS-ELDARIN.md` |
| magias-muitas | "Raio 6m", "cubo 1,5m", "salta 9m", "Parede ate 18m", "a 3m", "Raio 30m" etc. | areas e efeitos internos; para comparar foi usado sempre o alcance do cabecalho do grimorio |
| habilidades-escudo-solar | "voce emite luz fraca 6m" (`LIVRO-DO-JOGADOR.md` linha 3046) | aura passive; a reacao da habilidade e contra aliado adjacente (1 celula) |
| habilidades-coroa-de-fogo | "Aura de Devoção passa a 6m" (linha 3050) | aura; o ataque da habilidade e a explosao de 4,5m, que ja bate com 3 celulas |
| habilidades-olhar-entre-dimensoes | "ver invisiveis e ilusoes falsas em 18m" (linha 3096) | visao passiva; a reacao da habilidade e contra alvo em 9m, que ja bate com 6 celulas |

## Total

Divergencias com metros no texto do gerador/JSON: **18** (2 habilidades e 16 magias).

Achados adicionais so no livro: **8** (3 habilidades e 5 magias).

Total geral: **26 divergencias**.

Por pack: habilidades 5, magias 21, armas 0, monstros 0.
