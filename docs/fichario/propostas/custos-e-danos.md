# Custos e danos: livro x dado gerado

Somente leitura. Nenhum gerador, JSON ou livro foi alterado. Nenhum commit foi feito.

Objetivo: comparar, para habilidades e magias, (1) custo em PA, (2) fórmula de dano, (3) tipo de dano e (4) CD de salvaguarda fixada no livro, entre o que o livro diz e o que o dado gerado traz.

Fontes consultadas: `data/compendiums/habilidades.json`, `data/compendiums/magias.json`, `scripts/generate-compendium.mjs`, `livros/LIVRO-DO-JOGADOR.md`, `livros/_parte_x_magias_v4_revisada.md` e `livros/CATALOGO-HABILIDADES-TATICAS.md`.

Regra aplicada: o livro manda (decisao D4 do guia do projeto). Quando ha divergencia, a mudanca e no gerador e, se a tabela do catalogo tambem traz o valor errado, no catalogo. Nenhuma linha do livro precisa mudar.

Scripts de extracao usados na pasta scratchpad/balance: `extrair-custos.mjs`, `cruza-dano.mjs`, `cruza-pa.mjs`, `cruza-pa-detalhe.mjs`, `dano-completo.mjs` e `linhas-por-nome.mjs`.

## Metodo

1. Extraí de `magias.json` e `habilidades.json` os campos `tactical.custoPontosAcao.value`, `weapon.dano.formula`, `weapon.dano.tipo`, `spell.save.attribute` e a descricao textual.
2. Cruzei o PA do JSON com as tres tabelas que fixam PA no livro: tabela de canalizaveis (`LIVRO-DO-JOGADOR.md` linhas 292-303), escala de PA (linhas 316-326) e tabela do catalogo de habilidades (`CATALOGO-HABILIDADES-TATICAS.md`, 25 entradas). Tambem verifiquei as duas citacoes explicitas de "PA no VTT" no grimorio (linhas 205 e 236).
3. Cruzei dano e tipo do JSON com a frase completa de cada magia no grimorio (`_parte_x_magias_v4_revisada.md`, Cap. 18 e 19.3) e com as descricoes das habilidades no livro do jogador (Cap. 12) e no catalogo.
4. Cruzei as CDs fixadas no livro com o campo `save` do JSON e com o texto da descricao gerada.

Resultado do cruzamento de PA: todas as 25 habilidades do catalogo e todas as 10 magias canalizaveis batem com o JSON. As duas divergencias de PA abaixo vieram das citacoes explicitas do grimorio.

## 1. Divergencias reais

### 1.1 Custo em PA

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar (linha do gerador) |
|---|---|---|---|---|---|
| magias-injecao-biomagica | Injeção Biomágica | `tactical.custoPontosAcao.value` | 1 | 2 (`_parte_x_magias_v4_revisada.md:205`: "2 PA no VTT") | linha 413: `spell("Injeção Biomágica", 3, "Biomancia", 1, 1, ...)` → quinto numero 1 para 2 |
| magias-mutacao-forcada | Mutação Forçada | `tactical.custoPontosAcao.value` | 1 | 2 (`_parte_x_magias_v4_revisada.md:236`: "2 PA no VTT") | linha 459: `spell("Mutação Forçada", 4, "Biomancia", 6, 1, ...)` → quinto numero 1 para 2 |

Total de divergencias reais de PA: 2.

### 1.2 Formula de dano

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar (linha do gerador) |
|---|---|---|---|---|---|
| magias-ventania | Ventania | `weapon.dano.formula` e `weapon.dano.tipo` | `2d6`, `contundente` | sem dano no livro (`_parte_x_magias_v4_revisada.md:213`: "STR CD ou empurrao 4,5m; apaga chamas e dispersa gases/esporos") | linhas 431-435: remover `dano: "2d6"` (432) e `tipo: "contundente"` (433); manter save FOR e area line 12 |
| magias-terremoto | Terremoto | `weapon.dano.formula` e `weapon.dano.tipo` | `6d6`, `contundente` | sem dano no livro (`_parte_x_magias_v4_revisada.md:299`: "Raio 30m: DES CD ou Prostrado; risco de colapso na masmorra") | linhas 520-524: remover `dano: "6d6"` (521) e `tipo: "contundente"` (522); manter save DES; area a parte na secao 3 |
| magias-parede-de-fogo | Parede de Fogo | `weapon.dano.formula` | so `5d8` | `5d8` ao atravessar e mais `2d8 radiante` a 3m por turno (`_parte_x_magias_v4_revisada.md:238`) | linhas 460-464: acrescentar o dano radiante de 2d8 por turno; o JSON nao tem campo para ele |
| magias-esporos-necroticos | Esporos Necróticos | `weapon.dano.formula` e `weapon.dano.tipo` | `1d6`, `necrótico` | sem dano no livro (`LIVRO-DO-JOGADOR.md:3853`: "Nuvem 1,5m: criaturas CON CD ou Envenenado 1 rodada") | linhas 536-540: remover `dano: "1d6"` (537) e `tipo: "necrótico"` (538); manter save CON e area burst 1 |

Total de divergencias reais de dano: 4.

### 1.3 Tipo de dano

Nenhuma divergencia real. Os tipos declarados no dado (fogo, frio, acidez, trovao, necrotico, radiante, contundente, forca, psiquico) batem com o livro nas entradas em que a frase fixa um tipo. A unica diferenca aparente, Causar Praga, esta na secao 2.

### 1.4 CD de salvaguarda

| id | nome | campo | valor no dado | valor no livro (arquivo:linha) | onde mudar (linha do gerador) |
|---|---|---|---|---|---|
| magias-visao-do-ecossistema | Visão do Ecossistema | `spell.save.attribute` | ausente | SAB CD 15 (`_parte_x_magias_v4_revisada.md:230`) | linha 451: acrescentar `save: "sabedoria"` nas opcoes da chamada `spell(...)` |
| magias-prisao-de-gelo | Prisão de Gelo | `spell.save.attribute` | ausente | FOR CD (`_parte_x_magias_v4_revisada.md:286`: "STR CD ou Restringido no gelo") | linhas 513-516: acrescentar `save: "forca"` nas opcoes da chamada `spell(...)` |
| habilidades-correntes-infernais | Correntes Infernais | CD na descricao | ausente | DES CD 16 (`LIVRO-DO-JOGADOR.md:3116`: "DES CD 16 evita metade e negativa lentidao") | linha 598: acrescentar "DES CD 16" ao texto da tupla; `CATALOGO-HABILIDADES-TATICAS.md:76` tambem nao traz a CD |
| habilidades-puxao-abissal | Puxão Abissal | CD na descricao | FOR CD 15 | FOR CD 16 (`LIVRO-DO-JOGADOR.md:3132`) | linha 601: "FOR CD 15" → "FOR CD 16"; `CATALOGO-HABILIDADES-TATICAS.md:77` traz FOR CD 15 e deve mudar junto |

Total de divergencias reais de CD: 4.

As demais CDs fixadas no livro conferem: Coroa de Fogo DES CD 15 (`LIVRO-DO-JOGADOR.md:3050`), Carga do Juramento FOR CD 14 (linha 3080), Agarrão do Pacto FOR CD 15 (linha 3098), Mente Partida INT CD 16 (linha 3100), Pacto de Ferro FOR CD 15 (linha 3114), Raio do Pacto Psiquico FOR CD 13 (linha 3094). Nas magias, conferem Mãos Gelidas CON, Onda de Trovao CON, Raios de Enfraquecimento CON, Esfera Acida de Monstro DES, Bola de Fogo DES, Contagio Necrotico CON, Ventania FOR, Relampago DES, Sono SAB, Murcha CON, Causar Praga CON e Cadeia de Relampago DES.

## 2. Diferencas de redacao (nao contam como divergencia)

| id | nome | campo | dado | livro (arquivo:linha) | motivo |
|---|---|---|---|---|---|
| magias-causar-praga | Causar Praga | tipo de dano | `veneno` | "10d6 veneno/necrótico" (`_parte_x_magias_v4_revisada.md:270`) | o livro oferece dois tipos; o dado escolheu um. Nao ha valor unico para confrontar |
| magias-parede-de-fogo | Parede de Fogo | tipo do 5d8 | `fogo` | "5d8 ao atravessar" (`_parte_x_magias_v4_revisada.md:238`) | o livro nao rotula o tipo do 5d8; "fogo" e dedutivel do nome. O 2d8 radiante ausente ja esta na secao 1.2 |
| magias-raios-de-enfraquecimento | Raios de Enfraquecimento | save | `constituicao` | "CON CD ou Desvantagem em ataques e FOR por 1 minuto" (`_parte_x_magias_v4_revisada.md:176`) | FOR e o atributo penalizado, nao o save. O save CON bate |
| habilidades-manto-de-bruma | Manto de Bruma | efeito | "aliados furtivos; inimigos −2 em ataques a distancia" | "aliados Vantagem em Furtividade; inimigos Desvantagem em Percepção e −2 em ataques a distancia" (`LIVRO-DO-JOGADOR.md:3130`) | resumo da descricao, sem valor numerico divergente |
| habilidades-voto-de-caca | Voto de Caça | efeito | "+3 dano" | "+3 dano contra esse tipo" (`LIVRO-DO-JOGADOR.md:3062`) | mesmo valor |
| habilidades-corrente-mental | Corrente Mental | efeito | "repete encantamento nv.1 sem slot" | "repete ultima magia de encantamento nv. 1 ou menor sem gastar slot (alcance original)" (`LIVRO-DO-JOGADOR.md:3128`) | mesmo valor, redação mais longa no livro |

## 3. Observacoes fora da contagem

- Na rodada anterior (`alcances.md`) ja foram registradas 2 divergencias de area: Onda de Trovao `radiusCells: 1` (esperado 3) e Terremoto `radiusCells: 10` (esperado 20). Elas nao entram nesta contagem de PA, dano, tipo ou CD.
- Cinco nomes no gerador sao grafados sem acento em relacao ao livro ("Maos Gelidas", "Onda de Trovao", "Esfera Acida de Monstro", "Prisao de Gelo", "Maos Ardentes"). O gerador monta a descricao com `SPELL_LORE[s.name]` (linha 647); quando o nome nao bate, o lore do grimorio nao e carregado e o JSON fica so com o texto curto do catalogo. Isso explica porque algumas divergencias de dano/CD so aparecem ao ler o livro direto.
- As magias exclusivas de subclasse Chama de Vinha, Nova Arcana, Raio do Limiar e Desintegrar nao tem descricao com dano no livro, apenas citacoes em tabelas de clase e listas. Por isso o dano declarado no JSON delas nao pode ser confrontado e nao entra na lista.
- O custo em PA de todas as habilidades do catalogo bate com o JSON. O custo das habilidades de trilha (tabela `ABILITY_CATALOG`, linhas 555-601) nao e fixado em PA no livro do jogador, apenas na tabela do gerador; por isso nao ha divergencia a apontar nesse grupo.

## Total

Divergencias reais: **10**.

- Custo em PA: 2 (Injeção Biomágica, Mutação Forçada).
- Formula de dano: 4 (Ventania, Terremoto, Parede de Fogo, Esporos Necróticos).
- Tipo de dano: 0.
- CD de salvaguarda: 4 (Visão do Ecossistema, Prisão de Gelo, Correntes Infernais, Puxão Abissal).

Por pack: magias 8, habilidades 2, armas 0, monstros 0.

Diferencas de redacao listadas a parte: 6. Nao entram no total.
