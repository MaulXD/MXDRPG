# Alcances em celulas x metros - levantamento completo

Somente leitura. Nenhum gerador, JSON ou livro foi alterado. Nenhum commit foi feito.

Referencia: commit af856e8 corrigiu quatro habilidades (Julgamento Ardente 9 m = 6, Puxao Abissal 9 m = 6, Carga do Juramento 12 m = 8, Mente Partida 18 m = 12). Esta varredura procura o mesmo tipo de divergencia em todas as entradas.

Regra aplicada: 1 celula = 1,5 m (`METERS_PER_CELL` em `lib/vtt/movement.ts`). Celulas esperadas = `floor(metros / 1,5)`.

Refinamento desta rodada: nem todo metro citado e alcance. So compete com `alcanceCells` o metro que indica DISTANCIA ATE O ALVO OU PONTO. Metro de area (raio, tamanho de cubo/cone/linha, tamanho de selo ou nevoa) compete com os campos `area` (`shape`, `radiusCells`, `lengthCells`, `cellCount`), nao com `alcanceCells`. A coluna "tipo" classifica cada uma das 26 linhas.

Fontes consultadas: `scripts/generate-compendium.mjs` (tabelas `SPELLS`, `ABILITY_CATALOG`, `CHI_ABILITY_CATALOG` e acoes de monstro), `data/compendiums/*.json`, `livros/_parte_x_magias_v4_revisada.md`, `livros/LIVRO-DO-JOGADOR.md` e `livros/CATALOGO-HABILIDADES-TATICAS.md`. Regra de area em `LIVRO-DO-JOGADOR.md` linhas 274-286.

Scripts de extracao (pasta scratchpad/balance): `extrair-alcances.mjs`, `alcances-definitivo.mjs`, `livro-vs-gerador.mjs`, `hab-livro-vs-gerador.mjs`, `frases-e-areas.mjs` e `areas-check.mjs`.

## Veredito sobre qual valor esta certo

Em todos os casos o livro manda (decisao D4 do guia do projeto): o valor em metros esta correto e o dado (alcanceCells ou campo de area) e que deve mudar. A unica excecao e Correntes Infernais, em que a propria tabela do catalogo tambem traz 3 celulas e precisa ser corrigida junto com o gerador.

## 1. Habilidades com metros no texto e celulas erradas

| id | nome | texto com metros | celulas no dado | celulas esperadas | tipo (alcance/area) | onde mudar |
|---|---|---|---|---|---|---|
| habilidades-correntes-infernais | Correntes Infernais | "Selo de sangue 3m" | 3 | 2 | area (superficie do selo, 3m; o texto do livro diz "velocidade −3m", efeito) | NAO e divergencia de alcance. O 3m e o tamanho da area, nao distancia ate o alvo. Se quiser corrigir a area, o gerador nao tem campo `area` nesta habilidade (linha 598); `CATALOGO-HABILIDADES-TATICAS.md` linha 76 traz Alc. 3, que e o campo de alcance e nao deve ser mexido por causa deste metro. |
| habilidades-manto-de-bruma | Manto de Bruma | "Nevoa 6m 1 min" | 3 | 4 | area (tamanho da nevoa salina, 6m) | NAO e divergencia de alcance. `LIVRO-DO-JOGADOR.md` linha 3130 diz "nevoa salina 6m". O gerador nao tem campo `area` nesta habilidade (linha 600). Nada a mudar em alcanceCells. |

Total de habilidades nesta secao: 2 (nenhuma e divergencia real de alcance).

Ja conferidos e corretos: Luz Penitente (3 m = 2), Julgamento Ardente (9 m = 6), Coroa de Fogo (4,5 m = 3), Carga do Juramento (12 m = 8), Agarrão do Pacto (9 m = 6), Mente Partida (18 m = 12) e Puxao Abissal (9 m = 6).

## 2. Magias com metros no texto e celulas erradas

Nestas entradas o trecho com metros esta na descricao gerada a partir do grimorio (`_parte_x_magias_v4_revisada.md`), que e o `bookRef` do pack. O livro traz o alcance em metros no terceiro campo do cabecalho da magia (`Escola | Acao | ALCANCE | Duracao | Classes`).

| id | nome | texto com metros | celulas no dado | celulas esperadas | tipo (alcance/area) | onde mudar |
|---|---|---|---|---|---|---|
| magias-raios-de-enfraquecimento | Raios de Enfraquecimento | "18m" (livro linha 176) | 6 | 12 | alcance (terceiro campo do cabecalho) | gerador linha 396 (6 para 12); livro mantem 18m |
| magias-ilusao-menor | Ilusão Menor | "18m" (livro linha 194); "cubo 1,5m" | 6 | 12 | alcance (18m) + area (cubo 1,5m) | gerador linha 408 (6 para 12). Area confere: `radiusCells: 1` = 1,5m. Livro mantem 18m. |
| magias-animacao-de-mortos | Animação de Mortos | "3m" (livro linha 201) | 3 | 2 | alcance (terceiro campo) | gerador linha 412 (3 para 2); livro mantem 3m |
| magias-bola-de-fogo | Bola de Fogo | "45m" (livro linha 207); "Raio 6m" | 10 | 30 | alcance (45m) + area (raio 6m) | gerador linha 414 (10 para 30). Area confere: `radiusCells: 4` = 6m, conforme tabela do jogador linha 280. Livro mantem 45m. |
| magias-ventania | Ventania | "Pessoal (linha 18m)" (livro linha 213); "empurrao 4,5m" | 6 | 12 | area (comprimento da linha 18m); alcance do cabecalho e "Pessoal" | NAO e divergencia de alcance pelo metro citado: 18m e o comprimento da linha, nao a distancia ate o alvo. `lengthCells: 12` = 18m, area confere (gerador linha 435). O empurrao 4,5m e efeito. Observacao a parte: o cabecalho diz "Pessoal", mas o dado traz `alcanceCells: 6`; se o campo deve refletir "Pessoal", isso e outro ajuste, fora do metro citado. |
| magias-ler-mentes | Ler Mentes | "9m" (livro linha 216) | 4 | 6 | alcance (terceiro campo) | gerador linha 437 (4 para 6); livro mantem 9m |
| magias-relampago | Relâmpago | "36m" (livro linha 219) | 8 | 24 | alcance (terceiro campo) | gerador linha 438 (8 para 24); livro mantem 36m. Corpo diz "Um alvo"; sem campo `area` no dado. |
| magias-sono | Sono | "18m" (livro linha 222) | 6 | 12 | alcance (terceiro campo) | gerador linha 444 (6 para 12); livro mantem 18m |
| magias-murcha | Murcha | "4,5m" (livro linha 232) | 2 | 3 | alcance (terceiro campo) | gerador linha 452 (2 para 3); livro mantem 4,5m |
| magias-parede-de-fogo | Parede de Fogo | "36m" (livro linha 238); "Parede ate 18m"; "a 3m" | 8 | 24 | alcance (36m) + area (parede 18m e dano a 3m) | gerador linha 460 (8 para 24). Area confere: `cellCount: 12` = 18m. Livro mantem 36m. |
| magias-cura-em-massa | Cura em Massa | "18m" (livro linha 241); "raio de 3m" | 6 | 12 | alcance (18m) + area (raio 3m) | gerador linha 467 (6 para 12). O raio de 3m nao tem campo `area` no dado. Livro mantem 18m. |
| magias-cone-de-frio | Cone de Frio | "Pessoal (cone 18m)" (livro linha 254) | 6 | 12 | area (comprimento do cone 18m); alcance do cabecalho e "Pessoal" | NAO e divergencia de alcance pelo metro citado: 18m e o tamanho do cone. `lengthCells: 12` = 18m, area confere (gerador linha 477). Observacao a parte: cabecalho "Pessoal" com `alcanceCells: 6` no dado. |
| magias-salto-dimensional | Salto Dimensional | "Teletransporte ate 18m para ponto visivel" (livro linha 261; cabecalho "Pessoal") | 6 | 12 | alcance (distancia ate o ponto de destino) | gerador linha 485 (6 para 12). Livro mantem 18m. Caso especial: o metro vem do corpo, nao do terceiro campo; e distancia ate um ponto, o que se enquadra em alcance. |
| magias-causar-praga | Causar Praga | "18m" (livro linha 270) | 6 | 12 | alcance (terceiro campo) | gerador linha 493 (6 para 12); livro mantem 18m |
| magias-cadeia-de-relampago | Cadeia de Relâmpago | "45m" (livro linha 276); "salta ate 3 alvos adicionais a 9m" | 10 | 30 | alcance (45m) + efeito (salto 9m) | gerador linha 505 (10 para 30). O salto de 9m e distancia entre alvos, nao alcance nem area do dado. Livro mantem 45m. |
| magias-terremoto | Terremoto | "150m" (livro linha 299); "Raio 30m" | 20 | 100 | alcance (150m) + area (raio 30m) | gerador linha 520: alcance 20 para 100. ATENCAO de area: `radiusCells: 10` = 15m, mas o livro diz raio 30m (esperado `radiusCells: 20`). Divergencia de area, fora da lista de alcance. Livro mantem 150m. |

Total de magias nesta secao: 16 (14 divergencias reais de alcance; 2 classificadas como area).

## 3. Armas e monstros

Armas: nenhuma entrada cita metros. O alcance e sempre escrito em celulas (exemplo: `Arco Longo de Vinha`, 21 celulas, `armas-arc-l01`). Nada a corrigir.

Monstros: as acoes de ataque (`Mordida`, `Garras`, `Investida`, `Ataque especial`) usam rotulo em celulas e nao citam metros. As centenas de metros encontradas nos `actions` de monstros pertencem as habilidades de assimilacao (`assim-*`), todas com `rangeCells: 0` e `selfTarget: true`, e descrevem bonuses ou areas da habilidade assimilada, nao o alcance de um ataque. Nao entram na contagem.

## 4. Achados adicionais: o livro cita metros, mas o texto do gerador/JSON nao cita

Estes casos ficam de fora da regra literal da tarefa, mas seguem o mesmo padrao do commit af856e8 (Mente Partida foi corrigido assim). Foram localizados cruzando os livros com o gerador.

| id | nome | texto com metros | celulas no dado | celulas esperadas | tipo (alcance/area) | onde mudar |
|---|---|---|---|---|---|---|
| habilidades-voto-de-caca | Voto de Caça | "sentir mortos-vivos em 18m" (`LIVRO-DO-JOGADOR.md` linha 3062) | 9 | 12 | alcance (distancia de deteccao ate o alvo) | gerador linha 586 (9 para 12); livro mantem 18m |
| habilidades-pacto-de-ferro | Pacto de Ferro | "correntes infernais 9m" (`LIVRO-DO-JOGADOR.md` linha 3114) | 5 | 6 | alcance (distancia das correntes ate o alvo) | gerador linha 597 (5 para 6); livro mantem 9m |
| habilidades-corrente-mental | Corrente Mental | "Telepatia 18m" (`LIVRO-DO-JOGADOR.md` linha 3128) | 6 | 12 | alcance (distancia ate o aliado) | gerador linha 599 (6 para 12). Observacao: o proprio livro diz que o eco mental usa "alcance original", entao o 18m e da telepatia da habilidade. |
| magias-maos-gelidas | Mãos Gelidas | "4,5m" (livro linha 154); corpo "Cone 4,5m" (linha 155) | 2 | 3 | alcance (4,5m do cabecalho) + area (cone 4,5m) | gerador linha 370 (2 para 3). Area confere: `lengthCells: 3` = 4,5m. Descricao JSON nao traz o lore porque o livro escreve "Maos Gelidas" sem acento. Livro mantem 4,5m. |
| magias-onda-de-trovao | Onda de Trovão | "Pessoal (cubo 4,5m)" (livro linha 166); corpo "empurra 3m" | 2 | 3 | area (tamanho do cubo 4,5m); alcance do cabecalho e "Pessoal" | NAO e divergencia de alcance pelo metro citado. ATENCAO de area: gerador linha 385 traz `radiusCells: 1` = 1,5m, mas o livro diz cubo 4,5m (esperado `radiusCells: 3`). O empurrao 3m e efeito. A descricao JSON nao traz o lore por causa do acento em "Trovao". |
| magias-esfera-acida-de-monstro | Esfera Ácida de Monstro | "18m" (livro linha 179); corpo "Esfera 1m" (linha 180) | 6 | 12 | alcance (18m) + area (esfera 1m) | gerador linha 397 (6 para 12). O livro escreve "Acida" sem acento. Livro mantem 18m. |
| magias-mutacao-forcada | Mutação Forçada | "18m" (livro linha 235) | 6 | 12 | alcance (terceiro campo) | gerador linha 459 (6 para 12); livro mantem 18m |
| magias-prisao-de-gelo | Prisão de Gelo | "18m" (livro linha 286) | 6 | 12 | alcance (terceiro campo) | gerador linha 513 (6 para 12). O livro escreve "Prisao" sem acento. Livro mantem 18m. |

Total nesta secao: 8 (7 divergencias reais de alcance; 1 classificada como area).

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

## 6. Divergencias reais de alcance (lista final)

Sao as linhas cujo metro citado e DISTANCIA ATE O ALVO OU PONTO e cujo `alcanceCells` nao bate com `floor(metros / 1,5)`. O livro manda em todas; a mudanca e sempre na coluna de alcance da chamada `spell(...)` ou da tupla em `ABILITY_CATALOG`, no gerador. Nenhuma linha do livro precisa mudar.

| id | nome | alcance no livro | dado | esperado | linha exata a mudar (gerador) |
|---|---|---|---|---|---|
| magias-maos-gelidas | Mãos Gelidas | 4,5m (livro linha 154) | 2 | 3 | linha 370: `spell("Mãos Gelidas", 1, "Evocação", 2, 2, ...)` → terceiro numero 2 para 3 |
| magias-raios-de-enfraquecimento | Raios de Enfraquecimento | 18m (livro linha 176) | 6 | 12 | linha 396: `spell("Raios de Enfraquecimento", 2, "Necromancia", 6, 2, ...)` → 6 para 12 |
| magias-esfera-acida-de-monstro | Esfera Ácida de Monstro | 18m (livro linha 179) | 6 | 12 | linha 397: `spell("Esfera Ácida de Monstro", 2, "Evocação", 6, 3, ...)` → 6 para 12 |
| magias-ilusao-menor | Ilusão Menor | 18m (livro linha 194) | 6 | 12 | linha 408: `spell("Ilusão Menor", 2, "Ilusão", 6, 1, ...)` → 6 para 12 |
| magias-animacao-de-mortos | Animação de Mortos | 3m (livro linha 201) | 3 | 2 | linha 412: `spell("Animação de Mortos", 3, "Necromancia", 3, 2, ...)` → 3 para 2 |
| magias-bola-de-fogo | Bola de Fogo | 45m (livro linha 207) | 10 | 30 | linha 414: `spell("Bola de Fogo", 3, "Evocação", 10, 3, ...)` → 10 para 30 |
| magias-ler-mentes | Ler Mentes | 9m (livro linha 216) | 4 | 6 | linha 437: `spell("Ler Mentes", 3, "Adivinhação", 4, 1, ...)` → 4 para 6 |
| magias-relampago | Relâmpago | 36m (livro linha 219) | 8 | 24 | linha 438: `spell("Relâmpago", 3, "Evocação", 8, 3, ...)` → 8 para 24 |
| magias-sono | Sono | 18m (livro linha 222) | 6 | 12 | linha 444: `spell("Sono", 3, "Encantamento", 6, 2, ...)` → 6 para 12 |
| magias-murcha | Murcha | 4,5m (livro linha 232) | 2 | 3 | linha 452: `spell("Murcha", 4, "Necromancia", 2, 3, ...)` → 2 para 3 |
| magias-mutacao-forcada | Mutação Forçada | 18m (livro linha 235) | 6 | 12 | linha 459: `spell("Mutação Forçada", 4, "Biomancia", 6, 1, ...)` → 6 para 12 |
| magias-parede-de-fogo | Parede de Fogo | 36m (livro linha 238) | 8 | 24 | linha 460: `spell("Parede de Fogo", 4, "Evocação", 8, 3, ...)` → 8 para 24 |
| magias-cura-em-massa | Cura em Massa | 18m (livro linha 241) | 6 | 12 | linha 467: `spell("Cura em Massa", 4, "Abjuração", 6, 3, ...)` → 6 para 12 |
| magias-salto-dimensional | Salto Dimensional | 18m ate ponto visivel (livro linha 261) | 6 | 12 | linha 485: `spell("Salto Dimensional", 5, "Conjuração", 6, 2, ...)` → 6 para 12 |
| magias-causar-praga | Causar Praga | 18m (livro linha 270) | 6 | 12 | linha 493: `spell("Causar Praga", 6, "Necromancia", 6, 3, ...)` → 6 para 12 |
| magias-cadeia-de-relampago | Cadeia de Relâmpago | 45m (livro linha 276) | 10 | 30 | linha 505: `spell("Cadeia de Relâmpago", 6, "Evocação", 10, 3, ...)` → 10 para 30 |
| magias-prisao-de-gelo | Prisão de Gelo | 18m (livro linha 286) | 6 | 12 | linha 513: `spell("Prisão de Gelo", 7, "Evocação", 6, 3, ...)` → 6 para 12 |
| magias-terremoto | Terremoto | 150m (livro linha 299) | 20 | 100 | linha 520: `spell("Terremoto", 8, "Evocação", 20, 3, ...)` → 20 para 100 |
| habilidades-voto-de-caca | Voto de Caça | 18m (`LIVRO-DO-JOGADOR.md` linha 3062) | 9 | 12 | linha 586: `["Voto de Caça", 9, 1, ...]` → 9 para 12 |
| habilidades-pacto-de-ferro | Pacto de Ferro | 9m (`LIVRO-DO-JOGADOR.md` linha 3114) | 5 | 6 | linha 597: `["Pacto de Ferro", 5, 2, ...]` → 5 para 6 |
| habilidades-corrente-mental | Corrente Mental | 18m (`LIVRO-DO-JOGADOR.md` linha 3128) | 6 | 12 | linha 599: `["Corrente Mental", 6, 1, ...]` → 6 para 12 |

Total de divergencias reais de alcance: **21** (18 magias e 3 habilidades).

## 7. Divergencias de area encontradas no cruzamento (fora da lista de alcance)

Estas apareceram ao conferir os campos `area`. Nao contam como divergencia de alcance e nao entram no total de 21.

| id | metro da area no livro | campo no dado | valor esperado | linha do gerador |
|---|---|---|---|---|
| magias-onda-de-trovao | cubo 4,5m (livro linha 166) | `radiusCells: 1` = 1,5m | `radiusCells: 3` = 4,5m | linha 385 |
| magias-terremoto | raio 30m (livro linha 300) | `radiusCells: 10` = 15m | `radiusCells: 20` = 30m | linha 524 |

Areas que conferem: Ilusão Menor (cubo 1,5m, linha 409), Bola de Fogo (raio 6m, linha 418), Ventania (linha 18m, linha 435), Parede de Fogo (parede 18m, linha 463), Cone de Frio (cone 18m, linha 477), Mãos Gelidas (cone 4,5m, linha 374).

## Total

Divergencias com metros no texto do gerador/JSON (rodada anterior): **18** (2 habilidades e 16 magias).

Achados adicionais so no livro (rodada anterior): **8** (3 habilidades e 5 magias).

Total bruto anterior: **26**.

Apos classificar tipo: 5 linhas sao AREA, nao alcance (Correntes Infernais, Manto de Bruma, Ventania, Cone de Frio, Onda de Trovão).

**Divergencias reais de alcance que sobraram: 21** (18 magias e 3 habilidades).

Alem disso, 2 divergencias de area (Onda de Trovão e Terremoto), listadas a parte na secao 7.

Por pack, considerando so alcance: habilidades 3, magias 18, armas 0, monstros 0.
