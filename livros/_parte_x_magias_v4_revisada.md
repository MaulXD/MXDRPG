# PARTE X — MAGIAS DE ELDARIN

---

## CAPÍTULO 17 — SISTEMA DE MAGIA

### 17.1 Espacos de Magia

Classes conjuradoras: **Mago, Clérigo, Bardo, Druida, Artífice**. Possuem **Espacos de Magia** — reservatorios que se renovam após Descanso Longo.

| Nivel do Personagem | Espacos por Nivel de Magia disíponíveis |
|--------------------|----------------------------------------|
| 1 | Nivel 1: 2 |
| 2 | Nivel 1: 3 |
| 3 | Nivel 1: 4, Nivel 2: 2 |
| 5 | Nivel 1: 4, Nivel 2: 3, Nivel 3: 2 |
| 7 | + Nivel 4: 1 |
| 9 | + Nivel 5: 1 |
| 11 | + Nivel 6: 1 |
| 13 | + Nivel 7: 1 |
| 15 | + Nivel 8: 1 |
| 17 | + Nivel 9: 1 |
| 20 | Maximo completo de todos os niveis |

**Artífice:** Usa a mesma tabela de espacos. Prepara apenas magias da lista geral que incluam **Artífice** na linha de classes, mais magias exclusivas de subclasse de Artífice (Cap. 19).

**Gnomo:** Pode aprender magias marcadas com **Gnomo** como se fosse Mago (uma magia a mais por nivel de espaco, a escolha do jogador).

### 17.2 Lancando Magias

- **Acao:** A maioria das magias requer uma Acao.
- **Acao Bonus:** Algumas magias rapidas requerem Acao Bonus.
- **Reacao:** Magias de defesa e resposta.
- **Concentracao (C):** Ao sofrer dano, testa CON CD 10 ou metade do dano (o maior) ou a magia termina.
- **Rituais (R):** Lancadas sem gastar espaco se o conjurador gastar 10 minutos extras (onde indicado).

### 17.3 Escolas de Magia em Eldarin

| Escola | Foco |
|--------|------|
| Biomancia | DNA e biologia de monstros (exclusiva de Eldarin) |
| Necromancia | Morte, mortos-vivos, energia necrótica |
| Evocacao | Energia elemental bruta |
| Transmutação | Materia, culinaria arcana |
| Abjuracao | Protecao, purificacao, cura |
| Ilusao | Engano, disfarce, sentidos |
| Adivinhacao | Informacao, visao |
| Encantamento | Controle mental, charme |
| Conjuracao | Invocacao, teletransporte, criacao |

### 17.4 Grimorio e magias conhecidas

- **Mago / Artífice:** Escolhem magias da lista geral (Cap. 18) permitidas a sua classe. Mago inicia com 6 magias de nivel 1 + 2 truques; ganha 2 magias por nivel ao subir (nivel da magia <= nivel de espaco disponivel).
- **Clérigo / Druida:** Escolhem da lista geral permitida; tem acesso a todas as magias de nivel que possuem espaco (preparacao diaria: nivel + mod. SAB).
- **Bardo:** Lista geral permitida; aprende como Mago (menos magias de combaté direto, mais encantamento/adivinhacao).
- **Subclasse:** Magias do Cap. 19 somam-se ao grimorio; não contam no limite de “magias aprendidas” do Mago.

### 17.5 Variantes de subclasse

Algumas magias da lista geral possuem **variante** anotada no Cap. 19 (ex.: Piromante e `Bola de Fogo`). Lancar a variante gasta o **mesmo espaco** que a magia base; não e uma magia extra na contagem do grimorio.

### 17.6 Mesa digital (VTT) — custo em PA e recarga

Na **mesa digital**, o combate usa **Pontos de Acao (PA)** em vez de Acao/Ação Bonus do livro de mesa (`LIVRO-DO-JOGADOR.md`, §2.6 e §3.1). O **nivel de espaco** (§17.1) continua valendo para preparacao e descanso; o **PA** e o custo **por turno** no VTT.

| Faixa | PA | Exemplos |
|-------|-----|----------|
| Leve | **1** | Truques, Curar Ferimentos, Armadura Arcana, Forma Menor, Invisibilidade Maior |
| Moderado | **2** | Maos Gelidas, Onda de Trovao, Raios de Enfraquecimento, Sono, Ventania, Salto Dimensional |
| Pesado | **3** | Bola de Fogo, Relampago, Esfera Acida, Cura em Massa, Cone de Frio, Terremoto, Desejo de Morte |

**Canalizaveis (10):** antes de conjurar, +0 a +2 PA extras; cada PA extra soma **+1d6** ao dano (base nao reduzida por Afinidade Arcanica). Ver tabela em `LIVRO-DO-JOGADOR.md` §3.1.1.2.

**Recarga** (campo `spell.recarga` no JSON): **1/turno** limita uma conjuracao por turno; **1/combate** limita uma por combate. Sem tag = pode repetir no turno se houver PA.

| Magia | Nv espaco | PA (VTT) | Recarga |
|-------|-----------|----------|---------|
| Chama de Fogareiro | 0 | 1 | — |
| Detectar Veneno | 0 | 1 | — |
| Esporos Necroticos | 0 | 1 | — |
| Estabilizar | 0 | 1 | — |
| Lâmina de Espirito | 0 | 1 | — |
| Maos Firmes | 0 | 1 | — |
| Armadura Arcana | 1 | 1 | — |
| Crescimento Acelerado | 1 | 1 | — |
| Curar Ferimentos | 1 | 1 | — |
| Extracao Amplificada | 1 | 1 | — |
| Identificar Ingrediente | 1 | 1 | — |
| Purificar Veneno | 1 | 1 | — |
| Sussurro de Masmorra | 1 | 1 | — |
| Chama de Vinha | 1 | 2 | — |
| Doce Confuso | 1 | 2 | — |
| Maos Ardentes | 1 | 2 | — |
| Maos Gelidas | 1 | 2 | — |
| Onda de Trovao | 1 | 2 | — |
| Escudo Arcano | 2 | 1 | — |
| Forma Menor | 2 | 1 | — |
| Gelo de Conservacao | 2 | 1 | — |
| Ilusao Menor | 2 | 1 | — |
| Inspiracao Culinaria | 2 | 1 | — |
| Preservacao Perfeita | 2 | 1 | — |
| Aprimoramento Biomagico | 2 | 2 | — |
| Fermentacao Acelerada | 2 | 2 | — |
| Muralha de Energia | 2 | 2 | — |
| Raios de Enfraquecimento | 2 | 2 | — |
| Transmutacao de Carne | 2 | 2 | — |
| Esfera Acida de Monstro | 2 | 3 | — |
| Injecao Biomagica | 3 | 1 | — |
| Ler Mentes | 3 | 1 | — |
| Animacao de Mortos | 3 | 2 | — |
| Sono | 3 | 2 | 1/turno |
| Ventania | 3 | 2 | — |
| Bola de Fogo | 3 | 3 | — |
| Contagio Necrotico | 3 | 3 | 1/turno |
| Nova Arcana | 3 | 3 | — |
| Raio do Limiar | 3 | 3 | — |
| Relampago | 3 | 3 | — |
| Mutacao Forcada | 4 | 1 | — |
| Preservacao Anual | 4 | 1 | — |
| Purificacao Abencoada | 4 | 1 | — |
| Visao do Ecossistema | 4 | 2 | — |
| Cura em Massa | 4 | 3 | 1/turno |
| Murcha | 4 | 3 | 1/turno |
| Parede de Fogo | 4 | 3 | 1/turno |
| Salto Dimensional | 5 | 2 | 1/turno |
| Cone de Frio | 5 | 3 | 1/turno |
| Despertar | 5 | 3 | 1/combate |
| Grande Decomposicao | 5 | 3 | 1/turno |
| Grande Transmutacao Biomagica | 5 | 3 | — |
| Ressurreicao Incompleta | 5 | 3 | 1/combate |
| Restaurar Vigor | 5 | 3 | 1/turno |
| Cadeia de Relampago | 6 | 3 | 1/turno |
| Causar Praga | 6 | 3 | 1/turno |
| Desintegrar | 6 | 3 | 1/turno |
| Invisibilidade Maior | 7 | 1 | — |
| Regeneracao Biomagica | 7 | 2 | — |
| Forma de Monstro | 7 | 3 | 1/combate |
| Prisao de Gelo | 7 | 3 | 1/turno |
| Terremoto | 8 | 3 | — |
| Biomancia Suprema — Transcendencia | 9 | 3 | 1/combate |
| Desejo de Morte | 9 | 3 | 1/combate |

Fonte canonica do VTT: `data/compendiums/magias.json` (regenerar apos editar esta secao).

---

## CAPÍTULO 18 — LISTA DE MAGIAS (GRIMORIO DE ELDARIN)

> **Total:** 52 magias na lista geral (Cap. 18) + 8 exclusivas de subclasse (Cap. 19) = **60** feiticos no sistema.

### NIVEL 0 — TRUQUES (SEM CUSTO)

**Chama de Fogareiro** — Evocacao | Acao | Toque | Ate ser apagada | Mago, Clérigo, Bardo, Druida, Artífice
Chama pequena e controlável na ponta dos dedos; temperatura precisa. Uso culinário: dispensa fogareiro ou lenha.

**Lâmina de Espirito** — Transmutação | Acao Bonus | Pessoal | 1 minuto | Mago, Bardo, Artífice
Lâmina eterea (1d4 forca). +2 em testes de Extração com ela.

**Detectar Veneno** — Adivinhacao | Acao | Pessoal | 10 minutos | Mago, Clérigo, Bardo, Druida, Artífice
Em raio de 3m, detecta toxinas em comida, bebida ou ingrediente (aura avermelhada).

**Estabilizar** — Abjuracao | Acao | Toque | Instantanea | Clérigo, Druida
Criatura a 0 HP para de fazer falhas de morte; não cura HP.

**Maos Firmes** — Transmutação | Acao | Toque | 1 hora | Mago, Druida, Artífice
Alvo (você ou aliado) ganha +2 em Extração e não sofre -2 por falta de treinamento nesta hora.

---

### NIVEL 1

**Extracao Amplificada** — Biomancia | 1 minuto | Toque | Instantanea | Mago, Druida, Artífice
Monstro morto rende dobro de ingredientes; testes de Extração na proxima 1h tem +4.

**Maos Gelidas** — Evocacao | Acao | 4,5m | Instantanea | Mago
Cone 4,5m: 2d6 frio (CON CD ou dobro). Congela ingredientes.

**Crescimento Acelerado** — Transmutação (R) | 1 hora | Toque | Permanente | Druida, Clérigo
Semente vira planta adulta em 1h com propriedades do bioma.

**Purificar Veneno** — Abjuracao | Acao | Toque | Instantanea | Clérigo, Druida
Remove Envenenado em criatura ou torna ingrediente toxico seguro para processamento.

**Identificar Ingrediente** — Adivinhacao (R) | 1 minuto | Toque | Instantanea | Mago, Bardo, Artífice
Origem do monstro, propriedades biomágicas, preparo ideal e riscos.

**Armadura Arcana** — Abjuracao | Acao | Toque | 8 horas | Mago, Artífice
CA 13 + INT; não interfere com gestos de magia.

**Onda de Trovao** — Evocacao | Acao | Pessoal (cubo 4,5m) | Instantanea | Mago, Bardo, Druida
2d8 trovao (CON CD ou metade); falha empurra 3m.

**Curar Ferimentos** — Abjuracao | Acao | Toque | Instantanea | Clérigo, Druida, Bardo
Cura 1d8 + mod. de atributo de conjuracao (SAB ou CAR).

---

### NIVEL 2

**Aprimoramento Biomagico** — Biomancia | 10 minutos | Toque | 8 horas | Mago, Druida, Artífice
Proxima refeicao com esse ingrediente concede +1 habilidade de assimilação alem do d4.

**Raios de Enfraquecimento** — Necromancia | Acao | 18m | Concentracao até 1 minuto (C) | Mago, Clérigo
Tres raios: CON CD ou Desvantagem em ataques e FOR por 1 minuto.

**Esfera Acida de Monstro** — Evocacao | Acao | 18m | Concentracao até 1 minuto (C) | Mago, Artífice
Esfera 1m: 4d6 ácido (DES CD); -1 CA em armadura atingida.

**Transmutação de Carne** — Transmutação | 1 hora | Toque | Permanente | Mago, Gnomo, Artífice
Converte ingrediente em equivalente de mesma raridade (ex.: goblin -> grifo).

**Inspiracao Culinaria** — Encantamento | Acao Bonus | 9m | 1 hora | Bardo
+3 em Coccao e Forrageio; Prato Perfeito durante efeito da +1d6 HP temp por nivel do Bardo ao grupo.

**Preservação Perfeita** — Transmutação | Acao | Toque | 30 dias | Mago, Clérigo, Druida, Artífice
Ingrediente preservado 30 dias sem perder propriedades biomágicas.

**Forma Menor** — Transmutação | Acao | Pessoal | Concentracao até 1 hora (C) | Druida, Mago
Transforma-se em besta Minuscula ou Pequena; mantem INT, SAB, CAR; sem magia na forma.

**Escudo Arcano** — Abjuracao | Reacao | Pessoal | 1 rodada | Mago, Artífice
Quando atingido ou alvo de magia: +5 CA até inicio do próximo turno (inclui contra a magia que disparou).

**Ilusão Menor** — Ilusao | Acao | 18m | 1 minuto | Mago, Bardo
Som ou imagem estática em cubo 1,5m; não causa dano.

---

### NIVEL 3

**Animação de Mortos** — Necromancia | 1 minuto | 3m | 24 horas | Mago, Clérigo
Anima até 2 cadaveres Medios ou menores; podem Extração com proficiencia = metade do nivel do conjurador. Em espaco de nivel 5: 4 Medios ou 2 Grandes.

**Injecao Biomágica** — Biomancia | Acao | Toque | 12 horas | Mago, Artífice
Uma habilidade de assimilação do ingrediente usado, 12h, sem refeicao (ingrediente consumido).

**Bola de Fogo** — Evocacao | Acao | 45m | Instantanea | Mago
Raio 6m: 8d6 fogo (DES CD ou metade). *Variante Piromante: Cap. 19.*

**Contágio Necrótico** — Necromancia | Acao | Toque | 7 dias | Clérigo, Mago
CON CD ou Envenenado; progressao por falhas/sucessos diarios.

**Ventania** — Evocacao | Acao | Pessoal (linha 18m) | Concentracao até 1 minuto (C) | Mago, Druida
STR CD ou empurrao 4,5m; apaga chamas e dispersa gases/esporos.

**Ler Mentes** — Adivinhacao | Acao | 9m | Concentracao até 1 minuto (C) | Mago, Bardo
Pensamentos superficiais (SAB CD); INT 6+.

**Relâmpago** — Evocacao | Acao | 36m | Instantanea | Mago, Druida
Um alvo: 4d8 relâmpago (DES CD ou metade). Em ingredientes aquaticos congelados: preserva 24h.

**Sono** — Encantamento | Acao | 18m | 1 minuto | Mago, Bardo, Clérigo
Ate 5 criaturas com menos de 90 HP: SAB CD ou Inconsciente (dano acorda).

---

### NIVEL 4

**Visao do Ecossistema** — Adivinhacao (R) | 10 minutos | Pessoal | 1 hora | Druida, Mago
Ve atraves de criatura no mesmo bioma (SAB CD 15); troca alvo como ação bonus.

**Murcha** — Necromancia | Acao | 4,5m | Instantanea | Mago, Clérigo
8d8 necrótico (CON CD ou metade); conjurador cura metade do dano.

**Mutação Forcada** — Biomancia | Acao | 18m | Concentracao até 1 hora (C) | Mago
CON CD ou mutação negativa aleatoria 1h.

**Parede de Fogo** — Evocacao | Acao | 36m | Concentracao até 1 minuto (C) | Mago, Druida
Parede até 18m: 5d8 ao atravessar; 2d8 radiante a 3m por turno.

**Preservação Anual** — Transmutação | Acao | Toque | 1 ano | Mago, Clérigo, Druida, Artífice
Como Preservação Perfeita, mas duração 1 ano (requer espaco de nivel 4).

**Cura em Massa** — Abjuracao | Acao | 18m | Instantanea | Clérigo, Druida
Ate 6 criaturas em raio de 3m: 3d8 + mod. de conjuracao.

---

### NIVEL 5

**Ressurreicao Incompleta** — Necromancia | 1 hora | Toque | Permanente | Clérigo
Aliado morto ha menos de 10 dias volta com 1 HP e 1 Exaustao; corpo intacto; não se foi devorado.

**Grande Transmutação Biomágica** — Biomancia | 1 hora | Toque | 7 dias | Mago, Gnomo
Ingrediente de Boss concede mutação forte 7 dias (consumido).

**Cone de Frio** — Evocacao | Acao | Pessoal (cone 18m) | Instantanea | Mago
8d8 frio (CON CD ou metade); mortos por frio preservam ingredientes 72h.

**Despertar** — Transmutação | 8 horas | Toque | Permanente | Druida
Planta ou besta ganha INT 10 e linguagem.

**Salto Dimensional** — Conjuracao | Acao Bonus | Pessoal | Instantanea | Mago, Bardo, Artífice
Teletransporte até 18m para ponto visivel.

**Restaurar Vigor** — Abjuracao | 1 hora | Toque | Instantanea | Clérigo, Druida
Remove 1 nivel de Exaustao e uma doenca ou maldicao leve.

---

### NIVEL 6

**Causar Praga** — Necromancia | Acao | 18m | Concentracao até 1 minuto (C) | Clérigo, Mago
CON CD ou 10d6 veneno/necrótico + Envenenado 1 minuto.

**Disintegrar** — Transmutação | Acao | 18m | Instantanea | Mago
10d6+40 forca (DES CD ou metade); 0 HP = sem corpo para extracao.

**Cadeia de Relâmpago** — Evocacao | Acao | 45m | Instantanea | Mago, Druida
Primeiro alvo 10d8 relâmpago; salta até 3 alvos adicionais a 9m (metade do dano cada, DES CD).

---

### NIVEL 7

**Forma de Monstro (Polimorfismo Supremo)** — Biomancia / Transmutação | Acao | Toque | Concentracao até 1 hora (C) | Mago, Druida
Voluntario vira monstro do bestiário até nivel conjurador -2; inimigo SAB CD ou besta inofensiva CR 1.

**Prisao de Gelo** — Evocacao | Acao | 18m | Concentracao até 10 minutos (C) | Mago
STR CD ou Restringido no gelo; 5d6 frio por turno; preserva corpo para extracao.

**Regeneração Biomágica** — Biomancia | Acao | Toque | Concentracao até 1 hora (C) | Clérigo, Druida, Mago
Alvo recupera 4d8 + 15 HP no inicio de cada turno do conjurador; termina se alvo sofrer dano de fogo ou ácido.

**Invisibilidade Maior** — Ilusao | Acao | Toque | Concentracao até 1 hora (C) | Mago, Bardo
Ate 6 aliados invisiveis; termina ao atacar ou conjurar ofensivamente.

---

### NIVEL 8

**Terremoto** — Evocacao | Acao | 150m | Concentracao até 1 minuto (C) | Druida, Clérigo
Raio 30m: DES CD ou Prostrado; risco de colapso na masmorra.

---

### NIVEL 9

**Biomancia Suprema — Transcendência** — Biomancia | 1 hora | Pessoal | Permanente | Mago (Biomancia), Gnomo (Nivel 20)
Integra DNA de 3 Bosses; uma habilidade permanente de Banquete de cada (requer ingredientes).

**Desejo de Morte** — Conjuracao / Necromancia | Acao | Pessoal | Especial | Clérigo do Limiar (Ascensao nv. 20)
Condicao irrevogavel mata alvo quando satisfeita; preço 4d10 necrótico por nivel do alvo.

---

## CAPÍTULO 19 — SUBCLASSES: BONUS E MAGIAS EXCLUSIVAS

### 19.1 Bonus que NAO sao magias novas

Estes efeitos **não entram** na contagem de 60 feiticos:

| Subclasse | Bonus |
|-----------|--------|
| **Piromante das Brasas** | Conhece truque `Chama de Fogareiro` extra; feiticos de fogo +1d6 vs criaturas de gelo/agua; sem componentes de fogo |
| **Sacerdote da Purificacao** | `Purificar Veneno` 3x/dia sem gastar espaco de nivel 1 |
| **Mago dos Encantos** | 1 magia de Encantamento nv. 1–3 por dia sem gastar espaco (escolhida ao preparar) |
| **Clérigo do Pao da Vida** | Ritual `Pao da Manha` (R, 10 min): paes = nivel do Clérigo; quem come ao amanhecer ganha HP temp = nivel x3 |
| **Estratega de Masmorra** | Ao usar Inspiracao de Bardo em quem prepara refeicao, alvo ganha +1d6 em Coccao/Forrageio por 1h |
| **Alquimista Ácido** | 1x/descanso longo: expelir caldo (cone 4,5m 4d6 ácido ou nuvem 3m DES CD 13 Envenenado) após refeicao Gourmet própria |

### 19.2 Variantes (mesmo espaco que magia base)

| Subclasse | Base | Variante |
|-----------|------|----------|
| **Piromante das Brasas** | `Bola de Fogo` (nv. 3) | **Forno Arcano:** mesma área e dano; aliados na área sofrem metade ou nenhum dano (escolha do conjurador); não incendeia comida do grupo |

### 19.3 Magias exclusivas (8 — contam no total de 60)

**Piromante das Brasas — Maos Ardentes** — Evocacao | Acao | Toque | Instantanea | Nivel 1
Toque: 3d6 fogo (DES CD ou metade). Ingrediente tocado e selado e assado por dentro em 1 rodada.

**Criomante de Conservacao — Gelo de Conservação** — Transmutação | Acao | Toque | 8 horas | Nivel 2
Ingrediente fica em estase de gelo seco: propriedades biomágicas preservadas 8h sem recipiente; +2 CA temp ao conjurador enquanto segura o ingrediente.

**Mago Alquímico — Envelhecer Matéria** — Transmutação | Truque | Toque | Instantanea
Objeto orgânico inanimado envelhece visualmente (fermentacao aparente); não altera propriedades mágicas até conjurar `Fermentação Acelerada`.

**Mago Alquímico — Fermentação Acelerada** — Transmutação | 10 minutos | Toque | Instantanea | Nivel 2
Ingrediente fermenta em 1 minuto com efeito de 1 ano de cura natural; remove doenças leves não mágicas em quem consumir.

**Sacerdote da Purificacao — Purificacao Abencada** — Abjuracao | Acao | Toque | Instantanea | Nivel 4
Remove maldicao, veneno ou corrupcao mágica em criatura ou ingrediente.

**Druida, Circulo da Decomposicao — Esporos Necroticos** — Necromancia | Acao | Pessoal | Instantanea | Truque
Nuvem 1,5m: criaturas CON CD ou Envenenado 1 rodada; ingredientes necrofagos na nuvem ganham +1 na rolagem de assimilação.

**Druida, Circulo da Decomposicao — Grande Decomposicao** — Transmutação | Acao | 9m | Instantanea | Nivel 5
Organico em cubo 3m vira fertilizante seguro; decompoe carcaca para extracao automatica (como Extração CD 14 bem-sucedido).

**Bardo Confeiteiro — Doce Confuso** — Encantamento | Acao | 18m | Instantanea | Nivel 1
Um humanoide CON CD ou Amedrontado e Desvantagem em Percepção por 1 minuto (sabor de panico).

---

### Indice rapido por escola (lista geral, 52)

| Escola | Quantidade (aprox.) |
|--------|---------------------|
| Biomancia | 7 |
| Evocacao | 12 |
| Transmutação | 8 |
| Necromancia | 7 |
| Abjuracao | 8 |
| Adivinhacao | 5 |
| Encantamento | 2 |
| Ilusao | 2 |
| Conjuracao | 1 |

---
