# PARTE X — MAGIAS DE ELDARIN

---

## CAPÍTULO 17 — SISTEMA DE MAGIA

### 17.1 Espacos de Magia

Classes conjuradoras: **Mago, Clérigo, Bardo, Druida, Feiticeiro**. Possuem **Espacos de Magia** — reservatorios que se renovam após Descanso Longo.

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

**Feiticeiro:** Usa a mesma tabela de espacos. Conhece magias da **lista Arcano (inato)** (Cap. 17.7); não prepara — magias conhecidas conforme nível + CAR.

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

- **Mago:** Escolhem magias da lista **Arcano (estudo)** + truques comuns (Cap. 17.7). Inicia com 6 magias de nivel 1 + 2 truques; ganha 2 magias por nivel ao subir.
- **Feiticeiro:** Lista **Arcano (inato)**; conhece magias (não prepara). Truques iniciais: 4.
- **Clérigo / Druida:** Escolhem da lista geral permitida; tem acesso a todas as magias de nivel que possuem espaco (preparacao diaria: nivel + mod. SAB).
- **Bardo:** Lista geral permitida; aprende como Mago (menos magias de combaté direto, mais encantamento/adivinhacao).
- **Subclasse:** Magias do Cap. 19 somam-se ao grimorio; não contam no limite de “magias aprendidas” do Mago.

### 17.5 Variantes de subclasse

Algumas magias da lista geral possuem **variante** anotada no Cap. 19 (ex.: Piromante e `Bola de Fogo`). Lancar a variante gasta o **mesmo espaco** que a magia base; não e uma magia extra na contagem do grimorio.

### 17.7 Listas compartilhadas (mesa digital)

Cada classe conjuradora acessa **uma ou mais listas nomeadas**. Na ficha e no VTT, só aparecem magias **elegíveis** às listas da classe; pools **compartilhados** indicam magias que Mago e Feiticeiro (ou Clérigo e Paladino) podem escolher nas respectivas listas.

| Lista | Classes | Modo |
|-------|---------|------|
| **Truques comuns** + **Arcano (estudo)** | Mago | Aprender / preparar |
| **Arcano (inato)** | Feiticeiro | Conhecidas |
| **Divino** | Clérigo | Preparar |
| **Primal** | Druida | Preparar |
| **Performance e encanto** | Bardo | Aprender |
| **Pacto** | Bruxo | Conhecidas |
| **Juramento** | Paladino | Preparar (meio-conjurador) |

**Pools compartilhados:**
- **Grimório arcano (Mago + Feiticeiro):** *Chama de Vinha*, *Curar Ferimentos*, *Escudo Arcano*, *Esfera Ígnea*, *Relâmpago*, *Cone de Frio*.
- **Orações compartilhadas (Clérigo + Paladino):** *Curar Ferimentos*, *Purificar Veneno*, *Cura em Massa*, *Raio do Limiar*.

O arquivo `data/character/spell-lists.json` espelha estas listas para o compendio digital.

### 17.6 Classificacao por nivel e escola

**Circulos de poder (lista geral, 53 magias):**

| Nivel | Nome na mesa | Poder tipico | Qtd. | Quando o grupo costuma ver |
|------:|--------------|--------------|-----:|----------------------------|
| 0 | **Truque** | Luz, lâmina, toxina | 5 | Nv. 1+ (sem gastar espaco) |
| 1 | **1o circulo** | Cura, armadura, marca, dano | 9 | Nv. 1–3 |
| 2 | **2o circulo** | Controle, ácido, ilusao | 8 | Nv. 3–5 |
| 3 | **3o circulo** | Area, fogo, necromancia | 10 | Nv. 5–7 |
| 4 | **4o circulo** | Mutação, ecossistema, cura area | 5 | Nv. 7–9 |
| 5 | **5o circulo** | Teleporte, cone de frio, biomancia | 6 | Nv. 9–11 |
| 6 | **6o circulo** | Praga, desintegrar, cadeia | 3 | Nv. 11–13 |
| 7 | **7o circulo** | Polimorfismo, prisao de gelo, regeneração | 4 | Nv. 13–15 |
| 8 | **8o circulo** | Terremoto | 1 | Nv. 15–17 |
| 9 | **9o circulo / Lenda** | Transcendência, Desejo de Morte | 2 | Nv. 17–20 |

**+ 8 magias exclusivas de subclasse** (Cap. 19.3) — incluidas no compendio.

**Compendio completo (VTT):** **61** entradas em `data/compendiums/magias.json` (53 lista geral + 8 exclusivas). **Cozinha, preservação e identificação de ingrediente** são automáticas (Cap. 5.2.1 e itens Cap. 16.2) — não há magias de cozinha.

**Por escola (lista geral, 53):**

| Escola | Nv.0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Total |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Evocacao | 1 | 3 | 1 | 4 | 1 | 1 | 1 | 1 | 1 | 0 | 14 |
| Transmutação | 1 | 0 | 2 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 6 |
| Biomancia | 0 | 1 | 0 | 2 | 1 | 1 | 0 | 2 | 0 | 1 | 8 |
| Necromancia | 0 | 0 | 1 | 3 | 1 | 1 | 1 | 0 | 0 | 1 | 8 |
| Abjuracao | 1 | 3 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 7 |
| Adivinhacao | 1 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 4 |
| Encantamento | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| Ilusao | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 |
| Conjuracao | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |

*Biomancia inclui feiticos hibridos (ex.: Forma de Monstro). Dupla escola no texto da magia prevalece.*

**Tags de leitura rapida (cada entrada do Cap. 18):**

`[Escola] | Tempo | Alcance | Duracao | Classes | (C) concentracao | (R) ritual`

---

## CAPÍTULO 18 — LISTA DE MAGIAS (GRIMORIO DE ELDARIN)

> **Total:** **61 feitiços** no compendio (`data/compendiums/magias.json`): **53** na lista geral (Cap. 18) + **8** exclusivas (Cap. 19.3). Cozinha e preservação: **Cap. 5.2.1** e **Cap. 16.2** (sem magias).

### NIVEL 0 — TRUQUES (SEM CUSTO DE ESPACO)

**Brasa Espectral** — Evocacao | Acao | Pessoal | Concentração até 1 h
Luz fria em penumbra (6 células). Toque opcional: 1d4 fogo. **Não cozinha.** Proibida como chama aberta em biomas de gás (12, 10, 8, 4) — use Kit de Brasas.

**Lâmina de Espirito** — Transmutação | Acao Bonus | Pessoal | 1 minuto
Lâmina eterea (1d4 forca). +2 em Extração com ela.

**Sentir Toxina** — Adivinhacao | Acao | Pessoal | 1 rodada ou 10 min
Detecta veneno/doença em criaturas e objetos num raio de 3 células (aura avermelhada).

**Estabilizar** — Abjuracao | Acao | Toque | Instantanea | Clérigo, Druida
Criatura a 0 HP para de fazer falhas de morte; não cura HP.

**Maos Estaveis** — Transmutação | Acao | Toque | 1 hora | Mago, Druida, Feiticeiro
+2 em testes de Destreza (inclui Extração) por 1 hora; ignora −2 por falta de treinamento em Extração.

---

### NIVEL 1

**Marca da Caçada** — Biomancia | Acao Bonus | Pessoal | 1 hora | Mago, Druida, Feiticeiro
Próxima criatura morta por você ou aliado em 18 m: vantagem em Extração e +2 no teste de rendimento (não dobra loot).

**Maos Gelidas** — Evocacao | Acao | 4,5m | Instantanea | Mago
Cone 4,5m: 2d6 frio (CON CD ou dobro). Congela ingredientes.

**Crescimento Acelerado** — Transmutação (R) | 1 hora | Toque | Permanente | Druida, Clérigo
Semente vira planta adulta em 1h com propriedades do bioma.

**Purificar Veneno** — Abjuracao | Acao | Toque | Instantanea | Clérigo, Druida
Remove Envenenado em criatura ou torna ingrediente toxico seguro para processamento.

**Armadura Arcana** — Abjuracao | Acao | Toque | 8 horas | Mago, Feiticeiro
CA 13 + INT; não interfere com gestos de magia.

**Onda de Trovao** — Evocacao | Acao | Pessoal (cubo 4,5m) | Instantanea | Mago, Bardo, Druida
2d8 trovao (CON CD ou metade); falha empurra 3m.

**Curar Ferimentos** — Abjuracao | Acao | Toque | Instantanea | Clérigo, Druida, Bardo
Cura 1d8 + mod. de atributo de conjuracao (SAB ou CAR).

---

### NIVEL 2

**Raios de Enfraquecimento** — Necromancia | Acao | 18m | Concentracao até 1 minuto (C) | Mago, Clérigo
Tres raios: CON CD ou Desvantagem em ataques e FOR por 1 minuto.

**Esfera Acida de Monstro** — Evocacao | Acao | 18m | Concentracao até 1 minuto (C) | Mago, Feiticeiro
Esfera 1m: 4d6 ácido (DES CD); -1 CA em armadura atingida.

**Transmutação de Carne** — Transmutação | 1 hora | Toque | Permanente | Mago, Gnomo, Feiticeiro
*Só em descanso.* Converte ingrediente em equivalente de mesma raridade (ex.: goblin -> grifo).

**Ímpeto Inspirador** — Encantamento | Acao Bonus | 9m | 1 hora | Bardo
Aliado ganha +1d6 no próximo teste de atributo, ataque ou resistência em 1 h.

**Forma Menor** — Transmutação | Acao | Pessoal | Concentracao até 1 hora (C) | Druida, Mago
Transforma-se em besta Minuscula ou Pequena; mantem INT, SAB, CAR; sem magia na forma.

**Escudo Arcano** — Abjuracao | Reacao | Pessoal | 1 rodada | Mago, Feiticeiro
Quando atingido ou alvo de magia: +5 CA até inicio do próximo turno (inclui contra a magia que disparou).

**Ilusão Menor** — Ilusao | Acao | 18m | 1 minuto | Mago, Bardo
Som ou imagem estática em cubo 1,5m; não causa dano.

---

### NIVEL 3

**Animação de Mortos** — Necromancia | 1 minuto | 3m | 24 horas | Mago, Clérigo
Anima até 2 cadaveres Medios ou menores; podem Extração com proficiencia = metade do nivel do conjurador. Em espaco de nivel 5: 4 Medios ou 2 Grandes.

**Injecao Biomágica** — Biomancia | Acao | Toque | 12 horas | Mago, Feiticeiro
Uma habilidade de assimilação do ingrediente usado, 12h, sem refeicao (ingrediente consumido). **2 PA** no VTT.

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
CON CD ou mutação negativa aleatoria 1h. **2 PA** no VTT.

**Parede de Fogo** — Evocacao | Acao | 36m | Concentracao até 1 minuto (C) | Mago, Druida
Parede até 18m: 5d8 ao atravessar; 2d8 radiante a 3m por turno.

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

**Salto Dimensional** — Conjuracao | Acao Bonus | Pessoal | Instantanea | Mago, Bardo, Feiticeiro
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

Estes efeitos **não entram** na contagem de **61 feitiços** do compendio:

| Subclasse | Bonus |
|-----------|--------|
| **Piromante das Brasas** | Conhece truque `Brasa Espectral` extra; feiticos de fogo +1d6 vs criaturas de gelo/agua; sem componentes de fogo |
| **Sacerdote da Purificacao** | `Purificar Veneno` 3x/dia sem gastar espaco de nivel 1 |
| **Mago dos Encantos** | 1 magia de Encantamento nv. 1–3 por dia sem gastar espaco (escolhida ao preparar) |
| **Clérigo do Pao da Vida** | Ritual `Pao da Manha` (R, 10 min): paes = nivel do Clérigo; quem come ao amanhecer ganha HP temp = nivel x3 |
| **Estratega de Masmorra** | Ao usar Inspiracao de Bardo em quem prepara refeicao, alvo ganha +1d6 em Coccao/Forrageio por 1h |
| **Alquimista Ácido** | 1x/descanso longo: expelir caldo (cone 4,5m 4d6 ácido ou nuvem 3m DES CD 13 Envenenado) após refeicao Gourmet própria |
| **Criomante de Conservacao** | Dieta gelo: aura 1d4 frio em adjacentes; ver magia exclusiva Cap. 19.3 |
| **Alquimista Ácido (Mago)** | Sopas: regurgitar ácido 2d6 ou nevoa venenosa 1x/combaté |
| **Monge Ascético** | 8h sem comer: +4 esquiva e 3d8 radiante em área ao primeiro prato |
| **Pastor de Quimeras** | Dieta de quimera: aura de animal (ex. Leao) para aliados adjacentes |
| **Clérigo do Limiar** | `Toque do Limiar` (truque, 2x/descanso curto): 1d8 necrótico ou cura 1d4+SAB em morto-vivo aliado; servos da subclasse contam como aliados para alcance de toque |
| **Cantor dos Venenos** | +3 CD em Ilusao/Encantamento após ervas raras |
| **Dancarino das Facas** | Carne de ave: atacar com CAR; recuperar facas de trinchar |
| **Bardo Fermentador** | Inspiracao de Bardo concede HP temp = dado de Inspiracao atual |
| **Circulo do Superpredador** | Forma Selvagem +HP do ultimo monstro grande comido |
| **Circulo da Simbiose** | Sementes: armadura de vinhas, 1d6 cortante ao atacante |
| **Circulo do Solo Vivo** | Pedras elementais: resistência contundente enquanto dieta ativa |
| **Biologo Alquimico (Feiticeiro)** | Micro-doses: imunidade veneno; arma +1d6 ácido 1 min |
| **Engenheiro de Explosivos** | Glandulas de fogo: resistência Fogo; bombas +2d6 |
| **Ferreiro de Utensilios** | Prato em panela de exoesqueleto: +2 CA em armaduras proprias |
| **Construtor de Armadilhas** | Carne intacta: Vantagem INT e invencoes 24h |

### 19.4 Mapa — magia exclusiva por subclasse

| Subclasse | Magia exclusiva (Cap. 19.3) |
|-----------|----------------------------|
| Piromante das Brasas | Maos Ardentes |
| Criomante de Conservacao | Couraça de Gelo |
| Mago Alquímico | Envelhecer Matéria, Fermentação Acelerada |
| Sacerdote da Purificacao | Purificacao Abencada |
| Circulo da Decomposicao | Esporos Necroticos, Grande Decomposicao |
| Bardo Confeiteiro | Doce Confuso |
| Clérigo do Limiar | **Desejo de Morte** (nv. 9 — via Ascensao Cap. 12; fora dos 8 de 19.3) |

### 19.2 Variantes (mesmo espaco que magia base)

| Subclasse | Base | Variante |
|-----------|------|----------|
| **Piromante das Brasas** | `Bola de Fogo` (nv. 3) | **Forno Arcano:** mesma área e dano; aliados na área sofrem metade ou nenhum dano (escolha do conjurador); não incendeia comida do grupo |

### 19.3 Magias exclusivas (8 — no compendio)

**Piromante das Brasas — Maos Ardentes** — Evocacao | Acao | Toque | Instantanea | Nivel 1
Toque: 3d6 fogo (DES CD ou metade). Ingrediente tocado e selado e assado por dentro em 1 rodada.

**Criomante de Conservacao — Couraça de Gelo** — Abjuracao | Acao | Toque | 8 horas | Nivel 2
Toque: alvo ganha +2 CA temp (conjurador +3) por 8 h.

**Mago Alquímico — Envelhecer Matéria** — Transmutação | Truque | Toque | Instantanea
*Só em descanso/ritual (10 min).* Objeto orgânico inanimado envelhece visualmente até conjurar `Fermentação Acelerada`. *ID:* `magias-envelhecer-materia`.

**Mago Alquímico — Fermentação Acelerada** — Transmutação | 10 minutos | Toque | Instantanea | Nivel 2
*Só em descanso.* Ingrediente fermenta em 1 minuto; remove doenças leves não mágicas em quem consumir.

**Sacerdote da Purificacao — Purificacao Abencada** — Abjuracao | Acao | Toque | Instantanea | Nivel 4
Remove maldicao, veneno ou corrupcao mágica em criatura ou ingrediente.

**Druida, Circulo da Decomposicao — Esporos Necroticos** — Necromancia | Acao | Pessoal | Instantanea | Truque
Nuvem 1,5m: criaturas CON CD ou Envenenado 1 rodada; ingredientes necrofagos na nuvem ganham +1 na rolagem de assimilação.

**Druida, Circulo da Decomposicao — Grande Decomposicao** — Transmutação | Acao | 9m | Instantanea | Nivel 5
Organico em cubo 3m vira fertilizante seguro; decompoe carcaca para extracao automatica (como Extração CD 14 bem-sucedido).

**Bardo Confeiteiro — Doce Confuso** — Encantamento | Acao | 18m | Instantanea | Nivel 1
Um humanoide CON CD ou Amedrontado e Desvantagem em Percepção por 1 minuto (sabor de panico).

---

### Indice rapido por escola (lista geral, 53)

| Escola | Quantidade |
|--------|------------|
| Evocacao | 14 |
| Biomancia | 8 |
| Necromancia | 8 |
| Abjuracao | 7 |
| Transmutação | 6 |
| Adivinhacao | 4 |
| Encantamento | 2 |
| Ilusao | 2 |
| Conjuracao | 1 |

---
