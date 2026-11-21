# Balanceamento Eldarin v4 - classes e personagens

Escopo: calculo por classe. Este arquivo esta sendo montado em etapas.
Etapa 1 (esta) = tabela-base do nivel 1. Etapas 2 e 3 (subclasses, niveis 5/10/max, turnos contra bestiario) ainda nao feitas.

Fontes lidas: livros/LIVRO-DO-JOGADOR.md (Cap. 4, linhas 916-1115), lib/character/rules.ts (HP e atributo primario), lib/character/starter-kits.ts (kit padrao = primeiro kit de cada classe), data/compendiums/armas.json e equipamentos.json (dano, custo PA, CA base). Script: scratchpad/balance/etapa1-kits.js e etapa1-tabela.js.

## 1. Nivel 1

### 1.1 Premissas do calculo (fato calculado, pelo que o codigo e o compendio dizem)

- Kit padrao = primeiro kit de `CLASS_STARTER_KITS` (getDefaultStarterKitId).
- Ataque basico com arma: custo do compendio = **2 PA** para todas as armas do kit padrao (`custoPontosAcao: 2`).
- Turno com 5 PA = 2 ataques (2 x 2 PA = 4 PA; sobra 1 PA). Reserva cheia de 9 PA = 4 ataques (sobra 1 PA).
- Dano medio por ataque = media do dado da arma (1d6 = 3,5; 1d8 = 4,5; 2d6 = 7; 1d12 = 6,5; 1d4 = 2,5), mais o dano extra de efeito `onHit` quando existe (Druida: veneno 1d4 = +2,5).
- NAO entram: modificador de atributo (FOR, DES, CON), chance de acerto contra CA do alvo, critico, efeito de comida, talentos.
- Vida = dado de vida maximo da classe (rules.ts `hpDie`), sem CON. (CORRIGIDO na secao 2.0: a vida inclui CON.)
- Defesa = CA base da armadura do kit padrao (leve 11, media 13 ou 14). NAO soma DES. (ERRADO: o codigo e o livro somam DES; ver secao 2.0.)
- Alcance = celulas da arma do kit (1 = corpo a corpo; 11 = arco/besta).

### 1.2 Tabela

| Classe | Arma do kit padrao | Dado | Dano medio por ataque | Dano com 5 PA | Dano com 9 PA | Dano por PA | Alcance (celulas) | Vida (dado max) | Defesa (CA base) |
|---|---|---|---|---|---|---|---|---|---|
| Guerreiro | Lamina de Vinha | 1d6 | 3,5 | 7 | 14 | 1,75 | 1 | 10 | 11 |
| Patrulheiro | Arco Curto de Cacador | 1d6 | 3,5 | 7 | 14 | 1,75 | 11 | 10 | 11 |
| Ladino | Rapieira | 1d8 | 4,5 | 9 | 18 | 2,25 | 1 | 8 | 11 |
| Mago | Besta Leve | 1d8 | 4,5 | 9 | 18 | 2,25 | 11 | 6 | 11 |
| Clerigo | Maca de Guerra | 2d6 | 7,0 | 14 | 28 | 3,50 | 1 | 8 | 14 |
| Barbaro | Machado Grande | 1d12 | 6,5 | 13 | 26 | 3,25 | 1 | 12 | 11 |
| Bardo | Rapieira | 1d8 | 4,5 | 9 | 18 | 2,25 | 1 | 8 | 11 |
| Druida | Cimitarra de Grimwald | 1d6 + veneno 1d4 | 6,0 | 12 | 24 | 3,00 | 1 | 8 | 11 |
| Feiticeiro | sem arma-padrao (magia) | - | N/D | N/D | N/D | N/D | N/D | 6 | 11 |
| Espiritualista | sem arma-padrao (Chi) | - | N/D | N/D | N/D | N/D | N/D | 8 | 11 |
| Paladino | Espada Longa | 1d8 | 4,5 | 9 | 18 | 2,25 | 1 | 10 | 13 |
| Bruxo | Adaga de Masmorra | 1d4 | 2,5 | 5 | 10 | 1,25 | 1 | 8 | 11 |

Feiticeiro e Espiritualista ficam como N/D: o kit padrao nao tem arma (combatLoadout nulo). O dano deles depende de magia (PA e dano de magias) e de Chi, que entram na Etapa 2.

### 1.3 Medianas (10 classes com dano; 12 com vida)

- Dano com 5 PA: mediana = **9**.
- Dano por PA: mediana = **2,25**.
- Vida: mediana = **8**.

### 1.4 Fora da curva (mais de 25 por cento acima ou abaixo da mediana)

Limites: dano com 5 PA acima de 11,25 ou abaixo de 6,75; vida acima de 10 ou abaixo de 6. Conta do limite em cada caso: 9 x 1,25 = 11,25 e 9 x 0,75 = 6,75; 8 x 1,25 = 10 e 8 x 0,75 = 6.

| Classe | Metrica | Valor | Mediana | Desvio | Conta |
|---|---|---|---|---|---|
| Clerigo | Dano com 5 PA | 14 | 9 | +56% | 14 / 9 = 1,56 |
| Barbaro | Dano com 5 PA | 13 | 9 | +44% | 13 / 9 = 1,44 |
| Druida | Dano com 5 PA | 12 | 9 | +33% | 12 / 9 = 1,33 (efeito onHit conta) |
| Bruxo | Dano com 5 PA | 5 | 9 | -44% | 5 / 9 = 0,56 |
| Barbaro | Vida | 12 | 8 | +50% | 12 / 8 = 1,50 |

Quem esta na linha, sem passar de 25 por cento (nao entra como fora da curva): Guerreiro e Patrulheiro com dano 7 (-22%); Guerreiro e Paladino com vida 10 (+25%, exatamente no limite); Mago e Feiticeiro com vida 6 (-25%, exatamente no limite).

Observacao de fato: Clerigo com 14 de dano e CA 14 e o unico com as duas coisas acima da media. Isso e calculo; se o dano maior compensa a CA, e opiniao e fica para a Etapa 2.

### 1.5 Divergencias livro x codigo (nivel 1, so o que apareceu nesta etapa)

Estas entram como bug na pagina "06 Bugs ao vivo" depois que a conta estiver fechada. Ainda nao foram registradas la.

1. **Guerreiro, HP.** Livro: 10+CON no nivel 1. Codigo (rules.ts `hpDie: 10`): dado maximo 10 e o CON entra na formula de `hpMaxFor`. Esta etapa nao verificou `hpMaxFor` com CON; fica para conferir.
2. **Guerreiro, custo do golpe.** Livro (Cap. 4, linha 944): nivel 5+ cada golpe custa 1 PA. Compendio: ataque basico custa 2 PA. Isso e nivel 5, entao sai da Etapa 1; fica anotado para a Etapa 2.
3. **Feiticeiro e Espiritualista sem arma no kit padrao.** Livro diz que Espiritualista usa Chi (10/combate, maximo 2 por turno). O kit padrao nao tem arma. Nao e divergencia de calculo, e lacuna de dados para a Etapa 2.

### 1.6 Fato x opiniao

- Fato calculado: tudo nas tabelas 1.2 a 1.4 (dados do compendio, custo 2 PA, medianas, linhas de 25 por cento).
- Opiniao: qualquer leitura de que o Clerigo ou o Barbaro "esta forte demais" ou "deve cair" depende de incluir acerto, CA do alvo e atributo. Isso so se resolve nas Etapas 2 e 3.

## 2. Nivel 1 com atributos, acerto e magia (Etapa 2)

Script: scratchpad/balance/etapa2-calc-v2.js (CA alvo 12). Sensibilidade a CA 10 e 14: etapa2-ca10.js e etapa2-ca14.js (mesmo script). Feiticeiro entra com o dano esperado do salvo, calculado a mao (ver 2.1).

### 2.0 Correcoes da Etapa 1

- Kit do Mago: o script da Etapa 1 pegou a primeira arma de combatLoadout dentro de 45 linhas, e isso trocou o kit 1 pelo kit 2. O kit padrao do Mago (primeiro kit de starter-kits.ts) tem como combatLoadout a Lamina de Espirito (magia). A linha "Mago, Besta Leve" da tabela 1.2 nao vale mais; ela fica como referencia na 2.2.
- Defesa: a premissa "NAO soma DES" estava errada. lib/character/armor-defense.ts soma DES (leve: DES inteiro; media: DES ate +2; sem armadura: 10 + DES), e o livro (secao 2.3, CA) diz o mesmo. Por isso a defesa das armaduras leves sobe de 11 para 13.
- Vida: a premissa "sem CON" tambem caiu. lib/character/rules.ts hpMaxFor = dado maximo + CON no nivel 1, igual ao livro (Passo 4). A vida mediana passa de 8 para 10. Isso fecha o item 1.5.1: nao e divergencia.
- Confirmado: o dano alto do Clerigo e do Druida vem da arma do kit (ver 2.4).

### 2.1 Premissas (fato do livro e do codigo, salvo onde esta marcado)

- Atributos: distribuicao padrao do livro (Passo 3, 27 pontos, sem bonus racial), igual a suggestedPointBuyForClass (lib/character/point-buy.ts). Modificador = (atributo - 10) / 2, arredondado para baixo (livro, Cap. 1).
- Resultado FOR / DES / CON / INT / SAB / CAR: Guerreiro 15/15/15/8/8/8; Patrulheiro 8/15/15/8/15/8; Ladino 8/15/15/15/8/8; Mago 8/15/15/15/8/8; Clerigo 8/8/15/8/15/15; Barbaro 15/15/15/8/8/8; Bardo 8/15/15/8/8/15; Druida 8/15/15/8/15/8; Feiticeiro 8/15/15/8/8/15; Espiritualista 8/15/15/8/15/8; Paladino 15/8/15/8/8/15; Bruxo 8/15/15/8/8/15.
- Acerto: 1d20 + modificador do atributo + bonus de proficiencia (+2 no nivel 1) se proficiente. Atributo: FOR no corpo a corpo, DES a distancia (alcance maior que 1), atributo de conjuracao na magia (lib/combat/attack.ts, linhas 494 a 496). Proficiencia: regra de isProficient (attack.ts, linhas 511 a 521), que le a string de rules.ts.
- CA alvo = 12: mediana da CA dos 11 monstros de ameaca 1 a 2 em data/compendiums/monstros.json (faixa 10 a 14). A sensibilidade esta na 2.6.
- Critico (20 natural): o codigo rola os dados de novo e soma o modificador uma vez (attack.ts, rollActionDamage). O livro diz "dano dobrado" (linha 421). Divergencia menor, ver D7.
- Dano por ataque = esperanca do ataque (acerto, falha e critico ja somados). Efeito onHit de dano (veneno 1d4 do Druida) entra. Cura (Vampirico do Guerreiro) nao entra.
- Feiticeiro, Mao Gelidas: 2d6 frio, 2 PA, cone 3 celulas, salvo CON. Canal: +1d6 por PA extra, ate 2 PA extra (livro e compendio). Quem passa no salvo leva metade (action-tooltip.ts, linha 106). Premissa: alvo com mod CON 0, por isso falha em 40% (CD 9 = 8 + prof 2 + INT -1, como o codigo calcula; ver D6). Dano esperado por conjuracao de n PA: 0,4 x dano cheio + 0,6 x metade.
- Espiritualista, Golpe de Chi: 1 PA + 1 Chi. Limite de 2 Chi por turno (livro; ability.ts, linha 1052). Pool de 10 Chi por combate (livro). Ataque com FOR -1 + prof 2 = +1 (desarmado conta como proficiente em isProficient). Acerto: 1d4 + FOR -1, mais bonus 1d8 + DES +2 (compendium-actions.ts, linhas 11 a 14). Premissa minha: o efeito melee_attack_bonus soma o bonus ao desarmado 1d4. O codigo nao confirma essa soma.
- Ataque desarmado (2 PA, 1d4 + FOR -1, acerto +1): entra no 5 e 9 PA do Espiritualista, porque o Chi acaba em 2 golpes por turno.
- Kit padrao: primeiro kit de starter-kits.ts (arma e armadura desse kit).

### 2.2 Tabela do nivel 1 (kit padrao, codigo)

| Classe | Arma ou acao do kit | Acerto vs CA 12 | Dano por ataque | Dano 5 PA | Dano 9 PA | Dano por PA (9 PA / 9) | Alcance | Vida | Defesa |
|---|---|---|---|---|---|---|---|---|---|
| Guerreiro | Lamina de Vinha, 1d6 | 55% | 3,2 (2 PA) | 6,4 | 12,8 | 1,42 | 1 | 12 | 13 |
| Patrulheiro | Arco Curto de Cacador, 1d6 | 65% | 3,75 (2 PA) | 7,5 | 15,0 | 1,67 | 11 | 12 | 13 |
| Ladino | Rapieira, 1d8 | 40% | 1,63 (2 PA) | 3,25 | 6,5 | 0,72 | 1 | 10 | 13 |
| Mago (kit 1) | Lamina de Espirito, magia 1d4, 1 PA, max 2 por turno | 65% | 3,05 (1 PA) | 6,1 | 6,1 | 0,68 | 1 | 8 | 12 |
| Clerigo | Maca de Guerra, 2d6 | 50% | 3,35 (2 PA) | 6,7 | 13,4 | 1,49 | 1 | 10 | 13 |
| Barbaro | Machado Grande, 1d12 | 65% | 5,85 (2 PA) | 11,7 | 23,4 | 2,60 | 1 | 14 | 13 |
| Bardo | Rapieira, 1d8 | 50% | 1,98 (2 PA) | 3,95 | 7,9 | 0,88 | 1 | 10 | 13 |
| Druida | Cimitarra de Grimwald, 1d6 + veneno 1d4 | 50% | 2,80 (2 PA) | 5,6 | 11,2 | 1,24 | 1 | 10 | 13 |
| Feiticeiro | Mao Gelidas, 2d6 frio, salvo CON (esperado) | falha no salvo 40% | 4,9 (2 PA) | 12,25 | 22,05 | 2,45 | 2 | 8 | 13 |
| Espiritualista | Golpe de Chi (max 2 por turno) + desarmado | 50% | 4,35 (1 PA) | 9,57 | 11,32 | 1,26 | 1 | 10 | 13 |
| Paladino | Espada Longa, 1d8 | 65% | 4,45 (2 PA) | 8,9 | 17,8 | 1,98 | 1 | 12 | 12 |
| Bruxo | Adaga de Masmorra, 1d4 | 50% | 0,88 (2 PA) | 1,75 | 3,5 | 0,39 | 1 | 10 | 13 |

Referencia (fora das medianas): Mago kit 2, Besta Leve: 3,8 por ataque, 7,6 em 5 PA (prof do codigo = 0, D3), vida 8, defesa 13. Clerigo com a Maca simples do livro (1d6): 2,85 em 5 PA (ver 2.4).

Como ler: dano 5 PA = 2 ataques de 2 PA (sobra 1 PA). Dano 9 PA = 4 ataques (sobra 1 PA). Mago: 2 Lamina por turno (limite de estribilho), por isso 5 PA e 9 PA dao o mesmo. Feiticeiro: 5 PA = 2 PA + 3 PA (salvo CON, alvo com mod 0); 9 PA = 2 + 3 + 4 PA. Espiritualista: 5 PA = 2 golpes + 1 desarmado (sobra 1 PA); 9 PA = 2 golpes + 3 desarmados (sobra 1 PA).

### 2.3 Medianas e fora da curva (12 linhas principais)

Entram as 12 linhas da tabela 2.2, sem o kit 2 do Mago nem a Maca simples do livro.
- Medianas: dano 5 PA = **6,55**; dano por PA (9 PA) = **1,34**; vida = **10**; defesa = **13**.
- Limites de 25 por cento: dano 5 PA entre 4,91 e 8,19 (6,55 x 0,75 e x 1,25); dano por PA entre 1,01 e 1,68; vida entre 7,5 e 12,5.

Fora da curva:

| Classe | Metrica | Valor | Mediana | Desvio | Conta |
|---|---|---|---|---|---|
| Barbaro | Dano 5 PA | 11,7 | 6,55 | +79% | 11,7 / 6,55 = 1,79 |
| Barbaro | Dano por PA | 2,60 | 1,34 | +94% | 2,60 / 1,34 = 1,94 |
| Barbaro | Vida | 14 | 10 | +40% | 14 / 10 = 1,40 |
| Feiticeiro | Dano 5 PA | 12,25 | 6,55 | +87% | 12,25 / 6,55 = 1,87 (com alvo que falha no salvo: 17,5 = +167%) |
| Feiticeiro | Dano por PA | 2,45 | 1,34 | +83% | 2,45 / 1,34 = 1,83 |
| Espiritualista | Dano 5 PA | 9,57 | 6,55 | +46% | 9,57 / 6,55 = 1,46 |
| Paladino | Dano 5 PA | 8,9 | 6,55 | +36% | 8,9 / 6,55 = 1,36 |
| Paladino | Dano por PA | 1,98 | 1,34 | +48% | 1,98 / 1,34 = 1,48 |
| Mago (kit 1) | Dano por PA | 0,68 | 1,34 | -49% | 0,68 / 1,34 = 0,51 (PA sobra por causa do limite de 2 estribilhos) |
| Ladino | Dano 5 PA | 3,25 | 6,55 | -50% | 3,25 / 6,55 = 0,50 |
| Ladino | Dano por PA | 0,72 | 1,34 | -46% | 0,72 / 1,34 = 0,54 |
| Bardo | Dano 5 PA | 3,95 | 6,55 | -40% | 3,95 / 6,55 = 0,60 |
| Bardo | Dano por PA | 0,88 | 1,34 | -34% | 0,88 / 1,34 = 0,66 |
| Bruxo | Dano 5 PA | 1,75 | 6,55 | -73% | 1,75 / 6,55 = 0,27 |
| Bruxo | Dano por PA | 0,39 | 1,34 | -71% | 0,39 / 1,34 = 0,29 |

Dentro da faixa: Guerreiro (6,4; -2%; por PA 1,42, +6%), Patrulheiro (7,5; +15%; por PA 1,67, +25%, no limite, nao entra), Clerigo (6,7; +2%; por PA 1,49, +11%), Druida (5,6; -15%; por PA 1,24, -7%), Espiritualista (por PA 1,26, -6%), Mago (5 PA 6,1, -7%). Vida: so o Barbaro sai da faixa (Mago e Feiticeiro ficam em 8, -20%). Defesa: 12 a 13 em todas as classes.

O que mudou em relacao a Etapa 1:
- Clerigo: saiu da faixa (era +56%, agora +2%). Motivo: acerto de 50% e FOR -1. O dano do kit continua alto por causa da arma marcial (2.4).
- Druida: saiu da faixa (era +33%, agora -15%). Motivo: acerto de 50%, FOR -1 e o veneno so entra no acerto.
- Barbaro: continua fora, agora +79% (era +44%). A mediana caiu de 9 para 6,55.
- Bruxo: continua fora, agora -73% (era -44%).
- Ladino e Bardo: entram fora (-50% e -40%). Na Etapa 1 estavam em 9, a mediana; sem acerto, nao apareciam.
- Paladino: entra fora (+36%, era 9).
- Mago: kit corrigido (Besta Leve saiu do kit padrao). Dano 5 PA de 9 para 6,1. Dano por PA fica fora (-49%) por causa do limite de 2 estribilhos.
- Feiticeiro e Espiritualista: saem de N/D para +87% e +46%, ambos fora.
- Mediana de dano 5 PA: de 9 para 6,55. Mediana de vida: de 8 para 10 (agora com CON).

### 2.4 Clerigo e Druida: a arma do kit confere com o livro?

- Clerigo: o codigo da a Maca de Guerra (WPN-O05, 2d6 contundente, arma marcial, Cap. 14.4 do livro). O kit 1 do livro (linha 2106) e "Maca + meia-armadura + cura", e a Maca do livro e simples (Cap. 14.2, 1d6 contundente, Esmagadora). O livro da ao Clerigo so armas simples (linha 1036). O codigo, em isProficient, trata "armas simples" como proficiencia em todas as armas, entao da +2 numa arma marcial. Com a Maca do livro (1d6, simples), o Clerigo daria 2,85 em 5 PA (-56%). Conclusao: o dano alto do Clerigo vem da arma marcial de 2d6 mais a proficiencia que o codigo concede. Nao vem da classe.
- Druida: a Cimitarra de Grimwald (WPN-S07, 1d6 cortante, veneno 1d4 no acerto) esta no kit 1 do livro (linha 2109), mas nao aparece nas tabelas de armas do Cap. 14, e o livro nao diz se e metalica. Por isso nao da para confirmar proficiencia nem dano pelo livro. Pendencia do livro, nao bug de codigo. O Druida nao esta alto (5,6 em 5 PA, -15%).

### 2.5 Divergencias livro x codigo (nivel 1; vao para "06 Bugs ao vivo")

- D1. Guerreiro, proficiencia em armas. Livro: "todas as armas" (linha 927). Codigo: a string "Todas armaduras, escudos e armas" nao contem "todas armas", entao isProficient da falso. Efeito: a Lamina de Vinha fica em 3,2 por ataque no codigo e 3,75 pelo livro (-15%).
- D2. Ladino, proficiencia em Rapieira. Livro: rapiers (linha 988). Codigo: a string "Armaduras leves, armas fines" tem o typo "fines", nao "finas", e nao contem nenhum dos termos aceitos. Efeito: 1,63 por ataque no codigo e 1,98 pelo livro.
- D3. Mago e Feiticeiro, proficiencia em armas. Livro: Mago tem bestas leves (linha 1011); Feiticeiro tem adagas e bestas leves (linha 1136). Codigo: a string do Mago ("Adagas, dardos, fundas, cajados, bestas leves") e a do Feiticeiro nao contem "armas simples", "todas armas" nem "armas marciais", entao isProficient da falso para qualquer arma. Efeito: Besta Leve do Mago 3,8 por ataque no codigo e 4,45 pelo livro (-15%). A adaga do Feiticeiro tambem fica sem bonus.
- D4. Proficiencia por categoria. Codigo: "armas simples" libera todas as armas (isProficient nao separa simples de marcial). Livro: Clerigo e Druida tem so armas simples; Bardo tem algumas marciais. Efeito: Maca de Guerra do Clerigo com +2 indevido: 3,35 por ataque no codigo e 2,75 pelo livro (+22%).
- D5. Kit padrao do Clerigo. Codigo: Maca de Guerra, 2d6 (marcial). Livro: Maca simples, 1d6 (kit 1, linha 2106). Efeito: 6,7 em 5 PA no codigo e 2,85 com a arma do livro. Decisao de design: o kit do codigo segue o livro, ou o livro libera a Maca de Guerra. O livro nao escolhe sozinho.
- D6. Atributo de conjuracao do Feiticeiro. Livro: atributo primario do Feiticeiro e Carisma (rules.ts, linha 248; Cap. 4). Codigo: spellcastingAttribute retorna INT para o Feiticeiro (attack.ts, linhas 477 a 488). O point-buy do codigo poe CAR 15 e INT 8, entao o Feiticeiro conjura com o atributo mais baixo. Efeito: CD do salvo de Mao Gelidas 9 no codigo (8 + 2 - 1) e 12 pelo livro (8 + 2 + 2). Falha no salvo 40% no codigo e 55% pelo livro. Dano esperado em 5 PA: 12,25 no codigo e 13,6 pelo livro. A Lamina de Espirito do Feiticeiro tambem: ataque +1 no codigo e +4 pelo livro. A rolagem de ataque de magia usa spellcastingAttribute. A CD do salvo nao foi rastreada no codigo: a conferir se usa o mesmo atributo.
- D7. Critico. Livro: "dano dobrado" (linha 421). Codigo: rola os dados de novo e soma o modificador uma vez. Efeito: Barbaro perde 2 de dano por critico (cerca de 0,1 por ataque). Menor.
- Nao e divergencia: vida (livro Passo 4, dado maximo + CON, igual a rules.ts hpMaxFor); Golpe de Chi com limite de 2 Chi por turno (livro e ability.ts, linha 1052); estribilho com limite de 2 iguais por turno (livro e estribilho.ts, linha 5).
- Pendencia do livro, nao do codigo: Cimitarra de Grimwald fora das tabelas do Cap. 14 (ver 2.4).

### 2.6 Sensibilidade a CA alvo (mesmo script, so muda a CA)

- CA 10 (mediana de dano 5 PA = 7,7): Barbaro +74%; Espiritualista +47%; Paladino +32%; Ladino -49%; Bardo -40%; Bruxo -73%. Patrulheiro (+12%) e Guerreiro (-3%) ficam dentro.
- CA 14 (mediana = 5,4): Barbaro +85%; Espiritualista +45%; Paladino +41%; Patrulheiro +19% (dentro); Ladino -53%; Bardo -40%; Bruxo -73%.
- Feiticeiro nao muda com a CA: o salvo usa CD e nao a CA do alvo. Com CA 10 ou 14, ele continua em 12,25 (mediana 7,7 ou 5,4). Fora da curva, portanto, nas tres CA.
- Estavel nos tres cenarios: Barbaro, Feiticeiro, Espiritualista e Paladino acima; Ladino, Bardo e Bruxo abaixo. Patrulheiro e Guerreiro ficam na borda.

### 2.7 Fato x opiniao

- Fato calculado: tabelas 2.2 e 2.3, medianas, limites, sensibilidade 2.6, e as contas de D1 a D7.
- Premissas que mexem nos numeros: CA alvo 12 (faixa 10 a 14); alvo com mod CON 0 no salvo do Feiticeiro; base de 1d4 no Golpe de Chi (nao confirmada no codigo); cone do Feiticeiro contado como um alvo; critico (codigo dobra dados; livro diz dano dobrado).
- Opiniao: que Barbaro, Feiticeiro, Espiritualista e Paladino "estao fortes demais" depende de quanto a mesa vale alcance, controle e area. O Feiticeiro pode ter area (cone) que este calculo nao conta. O Mago com limite de estribilho pode ser desenho e nao bug. Isso fica para a Etapa 3 e para a mesa decidir.

## 3. Niveis 5 e 10

Script: `scratchpad/balance/etapa3-calc.js`. Contagem e CA dos monstros: `etapa3-distribuicao-ca.js`. Nada aqui foi aplicado a `livros/`, `data/` ou `lib/`.

### 3.1 Premissas (fato do livro e do codigo, salvo onde marcado)

- Atributos: os mesmos da secao 2.1. O livro da talentos de subclasse nos niveis 4, 8, 12 e 16 (linha 2063), sem aumento de atributo. No codigo, so o Humano nv. 4 recebe +1 em dois atributos (level-up.ts, linhas 38 e 130). Sem aumento, os modificadores nao mudam entre os niveis 1, 5 e 10.
- Bonus de proficiencia: +3 no nivel 5 e +4 no nivel 10. Tabela do livro (linhas 81 a 87) e `proficiencyBonus` (rules.ts, linhas 509 a 515) concordam.
- CA alvo: mediana da CA dos monstros de ameca igual ao nivel em `data/compendiums/monstros.json`. Nivel 5: 15, de 11 monstros com CA entre 11 e 16. Nivel 10: 18,5, de 4 monstros (18, 18, 19, 20). Mesmo criterio da secao 2, que usou a mediana de ameca 1 e 2. A media aritmetica e 14,64 no nivel 5 e 18,75 no nivel 10. Sensibilidade em 3.5.
- Ataque e critico: mesmas regras da secao 2. Arma custa 2 PA (`PA_DEFAULT_ACTION_COST`, pa-economy.ts, linha 19), 5 PA dao 2 golpes e 9 PA dao 4. Critico rola o dado de novo e soma o modificador uma vez (`rollActionDamage`, attack.ts, linhas 534 a 548).
- Ataque Extra do Guerreiro: o codigo conta 2 golpes por acao no nivel 5 (`extraAttackCount`, rules.ts, linhas 647 a 653), mas `totalAttackPaCost` (pa-cost-reduce.ts, linhas 184 a 208) soma 2 PA por golpe, porque `CLASS_PA_FEATURES` nao tem economia marcial para o Guerreiro. Por isso o dano por PA nao muda. A divergencia com o livro esta em D8.
- Vida: `hpMaxFor` (rules.ts, linhas 521 a 526), dado maximo + CON no nivel 1 e dado medio + CON em cada nivel seguinte. Arma e armadura continuam as do kit padrao, sem upgrade.
- Defesa: mesma conta da secao 2 (armor-defense.ts). Nao muda com o nivel.
- Mago: Lamina de Espirito, 1 PA, limite de 2 conjuracoes do mesmo truque por turno. 5 PA e 9 PA dao o mesmo dano.
- Feiticeiro: primeira magia de 2+ PA por turno custa 1 PA a menos no nivel 5 (`CLASS_PA_FEATURES`, pa-modifiers.json, linhas 72 a 96). Canal de +1d6 por PA extra, ate 2 PA extra. Alvo com CON 0: CD 10 no nivel 5 e 11 no nivel 10 (8 + prof + INT -1, com INT -1 do point-buy). Dano esperado = fracao que falha no salvo vezes dano cheio, mais fracao que passa vezes metade. Cada PA extra vira 1d6, entao qualquer distribuicao entre conjuracoes da o mesmo total: 6d6 com 5 PA (21 de dano cheio) e 10d6 com 9 PA (35 de dano cheio).
- Espiritualista: teto de 2 Chi por turno (`chi-economy.ts`, linha 8), sem desconto de Fluxo Marcial no codigo. 5 PA = 2 golpes de Chi e 1 desarmado. 9 PA = 2 golpes de Chi e 3 desarmados.
- Fora da conta principal: Golpe Oportunista do Ladino, Golpe Sagrado do Paladino, Inspiracao do Bardo, talentos de subclasse e efeitos de comida. Dependem de situacao de mesa ou de escolha de subclasse, mesma premissa da secao 2.

### 3.2 Tabela do nivel 5 (CA 15, prof +3)

| Classe | Acao do kit | Acerto vs CA 15 | Dano por ataque | Dano 5 PA | Dano 9 PA | Dano/PA (9 PA) | Vida | Defesa |
|---|---|---|---|---|---|---|---|---|
| Guerreiro | Lamina de Vinha 1d6 | 45% | 2,65 | 5,3 | 10,6 | 1,18 | 44 | 13 |
| Patrulheiro | Arco Curto de Cacador 1d6 | 55% | 3,20 | 6,4 | 12,8 | 1,42 | 44 | 13 |
| Ladino | Rapieira 1d8 | 30% | 1,27 | 2,55 | 5,1 | 0,57 | 38 | 13 |
| Mago | Lamina de Espirito 1d4, 1 PA | 55% | 2,60 | 5,2 | 5,2 | 0,58 | 32 | 12 |
| Clerigo | Maca de Guerra 2d6 | 40% | 2,75 | 5,5 | 11,0 | 1,22 | 38 | 13 |
| Barbaro | Machado Grande 1d12 | 55% | 5,00 | 10,0 | 20,0 | 2,22 | 50 | 13 |
| Bardo | Rapieira 1d8 | 40% | 1,63 | 3,25 | 6,5 | 0,72 | 38 | 13 |
| Druida | Cimitarra 1d6 + veneno 1d4 | 40% | 2,30 | 4,6 | 9,2 | 1,02 | 38 | 13 |
| Feiticeiro | Maos Geladas, salvo CON (CD 10) | falha 45% | 21 cheio em 5 PA | 15,23 | 25,38 | 2,82 | 32 | 13 |
| Espiritualista | Golpe de Chi + desarmado | 40% | 3,55 | 7,82 | 9,27 | 1,03 | 38 | 13 |
| Paladino | Espada Longa 1d8 | 55% | 3,80 | 7,6 | 15,2 | 1,69 | 44 | 12 |
| Bruxo | Adaga de Masmorra 1d4 | 40% | 0,72 | 1,45 | 2,9 | 0,32 | 38 | 13 |

Como ler: os numeros de dano ja incluem acerto, falha e critico. Feiticeiro nao rola ataque, usa salvo, e o dano da coluna e o esperado com metade do dano quando o alvo passa. Espiritualista: 5 PA = 2 golpes de Chi e 1 desarmado; 9 PA = 2 golpes de Chi e 3 desarmados. Mago: limite de 2 truques iguais por turno, entao 5 PA e 9 PA dao o mesmo.

### 3.3 Tabela do nivel 10 (CA 18,5, prof +4)

| Classe | Acao do kit | Acerto vs CA 18,5 | Dano por ataque | Dano 5 PA | Dano 9 PA | Dano/PA (9 PA) | Vida | Defesa |
|---|---|---|---|---|---|---|---|---|
| Guerreiro | Lamina de Vinha 1d6 | 30% | 1,82 | 3,65 | 7,3 | 0,81 | 84 | 13 |
| Patrulheiro | Arco Curto de Cacador 1d6 | 40% | 2,38 | 4,75 | 9,5 | 1,06 | 84 | 13 |
| Ladino | Rapieira 1d8 | 15% | 0,75 | 1,5 | 3,0 | 0,33 | 73 | 13 |
| Mago | Lamina de Espirito 1d4, 1 PA | 40% | 1,93 | 3,85 | 3,85 | 0,43 | 62 | 12 |
| Clerigo | Maca de Guerra 2d6 | 25% | 1,85 | 3,7 | 7,4 | 0,82 | 73 | 13 |
| Barbaro | Machado Grande 1d12 | 40% | 3,73 | 7,45 | 14,9 | 1,66 | 95 | 13 |
| Bardo | Rapieira 1d8 | 25% | 1,10 | 2,2 | 4,4 | 0,49 | 73 | 13 |
| Druida | Cimitarra 1d6 + veneno 1d4 | 25% | 1,55 | 3,1 | 6,2 | 0,69 | 73 | 13 |
| Feiticeiro | Maos Geladas, salvo CON (CD 11) | falha 50% | 21 cheio em 5 PA | 15,75 | 26,25 | 2,92 | 62 | 13 |
| Espiritualista | Golpe de Chi + desarmado | 25% | 2,35 | 5,2 | 6,2 | 0,69 | 73 | 13 |
| Paladino | Espada Longa 1d8 | 40% | 2,83 | 5,65 | 11,3 | 1,26 | 84 | 12 |
| Bruxo | Adaga de Masmorra 1d4 | 25% | 0,50 | 1,0 | 2,0 | 0,22 | 73 | 13 |

### 3.4 Medianas e fora da curva

Nivel 5:
- Medianas: dano 5 PA = **5,4**; dano 9 PA = **9,94**; dano por PA = **1,11**; vida = **38**; defesa = **13**.
- Limites de 25 por cento: dano 5 PA entre 4,05 e 6,75; dano 9 PA entre 7,45 e 12,42; dano por PA entre 0,83 e 1,38; vida entre 28,5 e 47,5.

Fora da curva no dano com 5 PA:

| Classe | Valor | Mediana | Desvio |
|---|---|---|---|
| Feiticeiro | 15,23 | 5,4 | +182% |
| Barbaro | 10,0 | 5,4 | +85% |
| Espiritualista | 7,82 | 5,4 | +45% |
| Paladino | 7,6 | 5,4 | +41% |
| Bruxo | 1,45 | 5,4 | -73% |
| Ladino | 2,55 | 5,4 | -53% |
| Bardo | 3,25 | 5,4 | -40% |

No dano com 9 PA e no dano por PA, as mesmas classes entram ou saem da faixa conforme o valor. Patrulheiro entra acima (12,8 em 9 PA, +29%; 1,42 por PA, +29%). Mago entra abaixo (5,2 em 9 PA e 0,58 por PA, -48% nos dois), por causa do limite de 2 truques. Em vida, so o Barbaro sai (50, +32%). Em defesa, ninguem sai: 12 ou 13 em todas as classes.

Nivel 10:
- Medianas: dano 5 PA = **3,78**; dano 9 PA = **6,75**; dano por PA = **0,75**; vida = **73**; defesa = **13**.
- Limites de 25 por cento: dano 5 PA entre 2,83 e 4,72; dano 9 PA entre 5,06 e 8,44; dano por PA entre 0,56 e 0,94; vida entre 54,75 e 91,25.

Fora da curva no dano com 5 PA:

| Classe | Valor | Mediana | Desvio |
|---|---|---|---|
| Feiticeiro | 15,75 | 3,78 | +317% |
| Barbaro | 7,45 | 3,78 | +97% |
| Paladino | 5,65 | 3,78 | +50% |
| Espiritualista | 5,2 | 3,78 | +38% |
| Patrulheiro | 4,75 | 3,78 | +26% |
| Bruxo | 1,0 | 3,78 | -74% |
| Ladino | 1,5 | 3,78 | -60% |
| Bardo | 2,2 | 3,78 | -42% |

No dano com 9 PA e no dano por PA, Patrulheiro sobe para +41% e entra tambem nessas duas colunas. Mago entra abaixo (3,85 em 9 PA e 0,43 por PA, -43%). Em vida, so o Barbaro sai (95, +30%). Em defesa, ninguem sai.

### 3.5 O que mudou em relacao ao nivel 1

- Medianas de dano caem. Dano 5 PA: 6,55 no nivel 1, 5,4 no 5, 3,78 no 10. Dano 9 PA: 12,06, 9,94 e 6,75. Dano por PA: 1,34, 1,11 e 0,75. Motivo: a CA dos monstros vai de 12 para 15 e 18,5, enquanto a proficiencia sobe so de +2 para +3 e +4. Sem upgrade de arma, o acerto cai mais do que o bonus sobe.
- Vida sobe. Mediana: 10, 38 e 73. A conta do codigo da 4 HP a mais que a conta rapida do livro nas classes de d10, 3 nas de d8, 2 nas de d6 e 5 nas de d12 (D10).
- Barbaro continua no topo de dano e de vida. Desvio de dano 5 PA: +79%, +85%, +97%. Desvio de vida: +40%, +32%, +30%, porque a mediana sobe junto.
- Feiticeiro se afasta. Desvio de dano 5 PA: +87%, +182%, +317%. Dois motivos: a CD do salvo sobe de 9 para 10 e 11, e a primeira magia ganha desconto de 1 PA a partir do nivel 5.
- Paladino sobe: +36%, +41%, +50%. A arma de 1d8 com FOR +2 sente menos a subida de CA do que as armas fracas.
- Espiritualista continua fora, mas o desvio encolhe: +46%, +45%, +38%. O desarmado perde acerto mais rapido que o golpe de Chi.
- Patrulheiro entra na faixa ruim no nivel 10: +15%, +19%, +26% no dano 5 PA. No dano 9 PA ja estava na borda no nivel 1 (+24%) e entra fora no 5 (+29%) e no 10 (+41%). O alcance 11 e a DES +2 mantem o acerto enquanto os corpos a corpo caem.
- Mago fica dentro no dano 5 PA (-7%, -4%, +2%), mas continua fora no dano por PA (-49%, -48%, -43%) pelo limite de 2 truques por turno.
- Ladino, Bardo e Bruxo pioram e continuam fora. Ladino: -50%, -53%, -60%. Bardo: -40%, -40%, -42%. Bruxo: -73%, -73%, -74%. Todos com FOR -1 e arma de d8 ou d4.
- Clerigo, Druida e Guerreiro ficam dentro nos tres niveis. Clerigo: +2%, +2%, -2%. Druida: -15%, -15%, -18%. Guerreiro: -2%, -2%, -3%. O Ataque Extra do Guerreiro nao muda o dano por PA no codigo.
- Defesa: 12 ou 13 em todas as classes nos tres niveis. Nenhuma fora da curva.

Sensibilidade a CA (mesmo script, so troca a CA alvo): com CA 14,64 no nivel 5, a media aritmetica, nenhum numero muda, porque os limiares inteiros de acerto caem no mesmo lugar. Com CA 18 no nivel 10, que e a mediana de ameca 10 e 11 juntos, Patrulheiro volta para 5,3 em 5 PA (+23%, dentro), Mago e Clerigo ficam em 4,3 (0%), e o Barbaro sobe para 8,3 (+93%). Feiticeiro nao muda, porque o salvo usa CD e nao a CA. O conjunto de classes fora da curva so perde o Patrulheiro no dano 5 PA e mantem ele fora no dano 9 PA (+36%).

### 3.6 Divergencias livro x codigo (D8 em diante)

Estas continuam a serie D1 a D7 da secao 2.5 e tambem entram em "06 Bugs ao vivo" depois que a conta fechar.

- D8. Guerreiro, PA por golpe no nivel 5. Livro Cap. 4 (linha 944) diz 1 PA por golpe; livro Cap. 3.1.1 (linha 267) diz 2 PA, igual ao codigo (`warriorFlatWeaponPaPerHit` retorna false, pa-cost-reduce.ts, linha 136). Ha contradicao dentro do livro. Efeito: se valer 1 PA, o Guerreiro da 5 golpes com 5 PA e 9 com 9 PA. O dano 5 PA passa de 5,3 para 13,25 no nivel 5 e de 3,65 para 9,1 no nivel 10.
- D9. Guerreiro, "+1 PA max" no nivel 5. Tabela de progressao do Guerreiro (linha 939) promete +1 de PA maximo. Cap. 3.1.1 (linha 259) diz recuperacao fixa de 5 PA. Codigo: `paRecoveryPerTurn` ignora o nivel (pa-economy.ts, linhas 45 a 48). Esta secao usou 5 e 9 PA como pedido; se valer o +1, o turno comum passa a 6 PA.
- D10. Vida por nivel. Livro (linha 92): dado medio vezes nivel, mais MOD CON vezes nivel. Codigo (`hpMaxFor`, rules.ts, linhas 521 a 526): dado maximo no nivel 1 e dado medio nos seguintes. Diferenca constante de maximo menos medio: 4 nas classes de d10, 3 nas de d8, 2 nas de d6 e 5 nas de d12. No nivel 10, Barbaro fica em 95 no codigo e 90 no livro; Mago, 62 e 60.
- D11. Ladino, Golpe Oportunista. Livro (linha 994) chama o recurso de Ataque Furtivo e escala de 1d6 para 10d6 no nivel 20; no nivel 5 sao 3d6 e no 10, 5d6, numeros repetidos em `classLevelFeatures` (rules.ts, linhas 590 a 595). No codigo, o unico furtivo implementado esta em `resolveMonsterAttack` (attack.ts, linhas 848 a 859) e so vale para monstro goblin (`isGoblinMonster`). O `resolveAttack` do jogador (attack.ts, linhas 1035 a 1047) nao aplica furtivo. Por isso a tabela nao inclui furtivo. O impacto depende de quantas vezes por turno o furtivo vale, regra que o codigo nao resolve para jogador.
- D12. Espiritualista, Fluxo Marcial. `classLevelFeatures` (rules.ts, linha 608 na epoca) anunciava no nivel 5 que a primeira tecnica de Chi custa 1 Chi a menos. O livro nao tem essa regra. `chi-economy.ts` mantem o teto de 2 Chi por turno (linha 8) e nao implementa desconto. A tabela por isso mantem 2 golpes de Chi no 5 e no 10. Se o desconto valesse, seriam 3 golpes (0 + 1 + 1 Chi) e o dano 5 PA subiria de 7,82 para 11,38 no nivel 5 e de 5,2 para 7,55 no nivel 10. Corrigido no commit 7f9e371: a linha do Fluxo Marcial saiu de `lib/character/rules.ts` e o teste `scripts/verify-d12-chi-sem-fluxo.mjs` entrou no mesmo commit. A analise acima fica como registro do estado anterior.
- D13. Paladino, Golpe Sagrado. Livro (linhas 1199 a 1203) chama de Golpe Sagrado e da 2d8 no nivel 2, 3d8 no 5, 4d8 no 9. Codigo (`classLevelFeatures`, rules.ts, linhas 617 a 624) chama de Golpe do Juramento e usa os mesmos dados. A habilidade `habilidades-golpe-sagrado` existe e e concedida ao Paladino a partir do nivel 2 (class-vtt.ts, linha 12), mas resolve como buff de +2 no ataque (ability.ts, linhas 472 a 490), nao como +2d8 radiante. A tabela considera so a Espada Longa. O extra nao escala com o nivel e nao dobra contra morto-vivo.

Nao e divergencia nesta etapa: Afinidade da primeira magia de 2+ PA (livro linha 268 e `CLASS_PA_FEATURES`, pa-modifiers.json, linhas 72 a 96, batem, inclusive o limite de uma vez por turno); teto de 2 Chi por turno (livro linha 1167 e chi-economy.ts, linha 8); limite de 2 truques iguais por turno (livro linha 269).

### 3.7 Fato x opiniao

- Fato calculado: tabelas 3.2 e 3.3, medianas e limites de 3.4, comparacoes de 3.5, sensibilidade de 3.5 e as contas de D8 a D13.
- Premissas que mexem nos numeros: CA 15 e 18,5; sem upgrade de arma ou armadura; sem talentos e sem subclasse; alvo com CON 0 no salvo do Feiticeiro; um alvo por magia de area; 2 PA por golpe do Guerreiro; furtivo e Golpe Sagrado fora da conta.
- Opiniao: a queda das medianas e o desvio do Feiticeiro podem ser desenho para pagar area e controle, ou podem mostrar que a CA sobe rapido demais para quem ataca com arma. O calculo nao decide isso. Falta comparar com turnos contra bestiario real e com subclasses, que e o restante da Etapa 3.

## 4. Plano para D11, D12 e D13

So leitura de codigo e do livro. Nada foi mudado em `lib/`, `data/`, `livros/` nem em `scripts/`. Os numeros de linha abaixo foram conferidos em 20/11/2026. As entradas D11 e D13 da secao 3.6 foram ajustadas onde a localizacao estava errada: o furtivo do goblin fica em `resolveMonsterAttack`, e o Golpe Sagrado existe como habilidade, mas resolve como +2 no ataque em vez de dano.

### 4.1 D11, Ataque Furtivo do Ladino

**O que o livro manda.** `livros/LIVRO-DO-JOGADOR.md`, linha 994:

> **Ataque Furtivo:** Causa dano bônus (1d6 no nivel 1, crescendo até 10d6 no nivel 20) ao atacar com Vantagem ou quando um aliado esta adjacente ao alvo.

O nome no livro e Ataque Furtivo. O texto fixa 1d6 no nivel 1 e 10d6 no nivel 20, mas nao da a cadencia dos niveis do meio. A linha 2332 reforca que o furtivo escala normalmente e que talentos de subclasse podem mudar o tipo de dano. Fora isso, so aparece em detalhes de subclasse (linhas 2482 a 2520), todos fora da conta basica.

**O que o codigo faz hoje.**

- `lib/character/rules.ts`, linhas 590 a 595: `classLevelFeatures` devolve so o texto `Golpe Oportunista - X d6`, com `dice = min(10, 1 + floor((nivel - 1) / 2))`. A formula resulta em 1d6 no 1, 3d6 no 5, 5d6 no 10 e 10d6 no 20. O nome e diferente do livro e a cadencia de 2 em 2 niveis e inferencia do codigo.
- `lib/combat/attack.ts`, linhas 848 a 859: unico calculo de furtivo implementado, dentro de `resolveMonsterAttack`, condicionado a `isGoblinMonster(attackerToken.monsterEntryId)`. Nao vale para token de jogador.
- `lib/combat/attack.ts`, linhas 1035 a 1047: `resolveAttack` do jogador aplica so `action.damageFormula`, `bonusDamageFormula` do token e critico. Nao ha ramo de Ataque Furtivo.
- `lib/room/handlers/combat-attack.ts`, linha 230: o servidor ja passa `room.scene.tokens` para `resolveTokenAttack`, que repassa a `resolveAttack` em `attack.ts`, linhas 1187 a 1190. O dado dos aliados esta disponivel, falta a regra.
- `lib/combat/ability.ts`, linhas 181 a 251: `hasFlanking` acha um token na casa oposta, mas nao verifica se ele e aliado. Nao serve como atalho para a condicao "aliado adjacente".

**Onde entraria no motor.**

1. Novo helper `lib/combat/sneak-attack.ts`, com `sneakAttackDiceForLevel(level)` e `sneakAttackApplies(mode, attacker, defender, allTokens)`. A formula de dados sai de `rules.ts` e passa a ter uma fonte so. O teste de Vantagem reusa o `attackRollMode` de `lib/combat/conditions.ts`, linhas 125 a 176, que ja e chamado em `attack.ts`, linha 1016. O teste de aliado adjacente usa `axialDistance` ou `tokenAxialDistance`, ja importados em `attack.ts`, linhas 22 e 23, mais uma checagem de lado copiada de `isFriendlyTarget`, `attack.ts`, linhas 665 a 669.
2. Chamar o helper dentro do bloco `if (hit)` de `resolveAttack`, em `attack.ts`, linhas 1035 a 1043, logo depois de `rollActionDamage` e antes de `resistedDamageAmount`. O extra entra no mesmo `DamageBreakdown` (formula, rolls e total), para resistencia, vida temporaria e chat continuarem batendo.
3. Servidor sem mudanca estrutural. `combat-attack.ts` ja grava `defenderHpAfter` e o PA a partir do `AttackResolution` (linhas 245 a 254 e 321). Se o dano vier no `damage`, o handler aplica sem saber que e furtivo.
4. Renomear o texto em `rules.ts` para Ataque Furtivo, mantendo a formula por enquanto.

**Tamanho:** media. Um helper novo, uma insercao no bloco de acerto e um ajuste de texto. Nao mexe em schema de token.

**Risco.**

- Vantagem e aliado adjacente podem ocorrer no mesmo ataque. Sao condicoes alternativas, nao cumulativas. Somar os dois valores dobraria o furtivo.
- Usar `hasFlanking` direto faria um inimigo na casa oposta liberar o furtivo, porque a funcao nao filtra lado.
- Somar o extra depois de `resistedDamageAmount` pula resistencia e pode errar o calculo de vida temporaria.
- `bonusDamageFormula` do token e consumido em `attack.ts`, linhas 620 e 1038 a 1042. E outro recurso, nao pode ser reaproveitado como furtivo ou o buff some depois do primeiro golpe.
- `resolveMultiAttack` (`attack.ts`, linhas 1117 a 1139) chama `resolveAttack` uma vez por golpe. Se a regra valer por ataque, cada golpe qualificado recebe o extra. O livro nao limita usos por turno, entao isso fica como decisao explicita, nao como efeito colateral.
- Chat e undo leem `damage.formula`, `damage.rolls` e `damage.total`. Atualizar so o total deixa o log inconsistente.

**Como testar:** `scripts/verify-d11-ataque-furtivo.mjs`, usando o loader de transpilacao e o alias `@/` de `scripts/verify-feiticeiro-carisma.mjs`, linhas 19 a 62. Casos deterministas no helper: 1d6 no nv1, 3d6 no nv5, 5d6 no nv10, 10d6 no nv20 e nome Ataque Furtivo em `classLevelFeatures`. Casos de condicao com tokens montados na mao: sem Vantagem e sem aliado adjacente nao da extra; com Vantagem da `+3d6` no nv5; com aliado do mesmo lado adjacente da `+3d6`; com inimigo adjacente nao da; com as duas condicoes juntas da uma unica adicao. Caso de integracao: `resolveTokenAttack` com `allTokens` preenchido devolve `damage.total` entre base mais 3 e base mais 18 no nv5, e `damage.formula` contendo o dado extra.

### 4.2 D12, Fluxo Marcial do Espiritualista

**Status: corrigido no commit 7f9e371.** A linha do nivel 5 saiu de `lib/character/rules.ts` e o teste `scripts/verify-d12-chi-sem-fluxo.mjs` entrou no mesmo commit. Todo o texto abaixo continua como registro da analise feita antes da correcao. Onde dizia "faz hoje", leia "fazia ate o commit 7f9e371".

**O que o livro manda.** `livros/LIVRO-DO-JOGADOR.md`, linha 1167:

> **Chi:** Recurso próprio renovado a cada combate. **10 Chi** no início do combate; pode gastar no máximo **2 Chi por turno**.

A linha 920 repete 10 por combate e limite de 2 por turno. A linha 1179 manda tecnicas usarem PA do compendio mais custo de Chi. A busca por "Fluxo Marcial" em `livros/` nao encontra nenhuma ocorrencia. O livro nao concede desconto de Chi no nivel 5. O que existe no nivel 5 em outras classificacoes e Afinidade de magia, nao Chi.

**O que o codigo faz hoje.**

- `lib/character/rules.ts`, linha 608 ate o commit 7f9e371: `classLevelFeatures` anunciava no nivel 5 `Fluxo Marcial - 1a tecnica de Chi do turno custa 1 Chi a menos`. A linha foi removida no commit 7f9e371. Hoje a linha 608 e o Passo do Vácuo do nivel 11 e o nivel 5 nao aparece mais na lista.
- `lib/combat/chi-economy.ts`, linhas 5 a 8: pool 10 e teto `CHI_SPEND_CAP_PER_TURN = 2`. `canSpendChi` (linhas 39 a 43) e `spendChi` (linhas 45 a 51) so olham pool e gasto no turno, sem nivel e sem ordem de tecnica.
- `lib/combat/ability.ts`, linhas 1050 a 1052: `canUseAbility` barra o uso com a mensagem `Chi insuficiente ou limite de 2 por turno`.
- `lib/room/handlers/combat-ability.ts`, linhas 81 a 83: o servidor desconta o Chi de verdade.
- `lib/combat/pa-chip.ts`, linhas 74 a 79: a chip mostra o Chi restante e quantas unidades ainda cabem no turno, usando a mesma constante 2.

**Onde entraria no motor.** Nao entraria. O texto da linha 608 era a única parte que existia, e o motor nunca implementou o desconto. A acao correta, apagar essa linha de `rules.ts`, ja foi tomada no commit 7f9e371. Se alguém decidir implementar o desconto, a regra teria de entrar em `chi-economy.ts`, em `canSpendChi` e `spendChi`, com um campo novo em `BattleToken` para marcar a primeira tecnica do turno, mais ajuste na chip em `pa-chip.ts`. Isso mexeria em `lib/vtt/types.ts` e em `combat-turn.ts`, que hoje so zera `chiSpentThisTurn` (linhas 57 e 58 do handler de turno).

**Tamanho:** pequena para remover o texto. Grande para implementar, porque cria estado novo no token e muda uma constante usada em tres lugares.

**Risco.**

- Manter o texto e custo zero de implementacao, mas continuaria enganando quem le a ficha. Esse risco foi removido no commit 7f9e371 com a exclusao da linha.
- Implementar o desconto quebra a invariante de 2 Chi por turno. `CHI_SPEND_CAP_PER_TURN` e usado por `canSpendChi` e pela chip. O limite passaria a depender de ordem de uso, e a chip diria "excede limite" justamente quando o desconto permitisse o gasto.
- O campo de primeira tecnica teria de resetar no inicio de cada turno. Hoje `resetChiSpentThisTurn` (`chi-economy.ts`, linhas 27 a 29) faz so isso, e o handler de turno limpa os campos de Chi ao trocar de round (`combat-turn.ts`, linhas 57 e 58).
- Contradiz o livro. Qualquer verify de regra vai falhar se o desconto existir.

**Como testar:** `scripts/verify-d12-chi-sem-fluxo.mjs`, ja incluido no commit 7f9e371 (96 linhas), com o mesmo loader. Casos: o texto `Fluxo Marcial` nao aparece em nenhum arquivo de `livros/`; `classLevelFeatures("Espiritualista", 5)` nao contem `Fluxo Marcial`; `CHI_SPEND_CAP_PER_TURN === 2`; `canSpendChi({ chi: 10, chiSpentThisTurn: 2 }, 1) === false`; `spendChi` com esses valores devolve `null`; `classLevelFeatures` nos niveis 1, 5 e 10 nao muda a regra de Chi. Caso extra de regressao: `unifiedPaChipForAction` com uma tecnica de 1 Chi e 1 Chi ja gasto no turno mostra `turno 0 restante`.

**Nota da revisao, Corpo Transcendente.** A mesma revisao do D12 encontrou em `lib/character/rules.ts`, linha 609, o texto do nivel 20 do Espiritualista: `Corpo Transcendente - Chi maximo 12 neste combate`. Busca feita em 20/11/2026 em `livros/`, pelos termos `Corpo Transcendente`, `Transcendente`, `Chi máximo 12`, `Chi maximo 12` e `12 Chi`:

- `Corpo Transcendente` nao aparece em nenhum arquivo de `livros/`. Nao existe feature de nivel 20 com esse nome no livro.
- `Chi máximo 12` tambem nao aparece. A única ocorrencia de 12 Chi esta em `livros/guias-criacao/Espiritualista-Punho-do-Limiar.md`, linha 53: `Descanso curto + Respiração de Combate = até 12 Chi no próximo combate (classe)`. O numero 12 vem do pool de 10 mais os 2 Chi extras da Respiração de Combate (`LIVRO-DO-JOGADOR.md`, linha 1165), condicionado a descanso curto, e nao de um beneficio automatico do nivel 20.
- No codigo, o limite continua em 10. `CHI_POOL_PER_COMBAT = 10` em `lib/combat/chi-economy.ts`, linha 5; `chiMaxForEspiritualista` retorna essa constante nas linhas 14 a 16; `resetTokenChi` usa o mesmo maximo nas linhas 18 a 25. Nenhum lugar aplica 12.

Resultado: e o mesmo padrao do D12 antes da correcao, texto em `classLevelFeatures` que nao tem regra correspondente no livro e nao tem efeito no motor. Nao foi mudado nada. Se o maestro quiser, o caso vira nova entrada de divergencia, com numero a definir na proxima rodada.

### 4.3 D13, Golpe Sagrado do Paladino

**O que o livro manda.** `livros/LIVRO-DO-JOGADOR.md`, linha 1210:

> - Golpe Sagrado (Nivel 2): Ao acertar ataque corpo a corpo com arma, gasta 1 PA extra para +2d8 radiante (escala nos niveis da tabela). Mortos-vivos sofrem dano dobrado.

A tabela de progressao, linhas 1199 a 1203, da 2d8 no 2, 3d8 no 5, 4d8 no 9, 5d8 no 13 e 6d8 no 17. A linha 1221 classifica a acao como habilidade com PA extra. A linha 3044 diz que o talento Luz Penitente ignora resistencia radiante. A linha 3052 diz que a Ascensao do nivel 20 maximiza os dados. O livro nao diz se o extra vale uma vez por turno ou por golpe, e nao define como identificar morto-vivo no motor.

**O que o codigo faz hoje.**

- `lib/character/rules.ts`, linhas 617 a 624: texto `Golpe do Juramento` com a escala correta de dados. Nome errado e nenhum efeito mecanico.
- `lib/character/class-vtt.ts`, linhas 9 a 13: concede `habilidades-golpe-sagrado` ao Paladino a partir do nivel 2.
- `data/compendiums/habilidades.json`, linhas 578 a 600: entrada com descricao `Proximo ataque corpo a corpo +2d8 radiante (PA extra)`, alcance 1 e custo 1 PA.
- `lib/combat/compendium-actions.ts`, linhas 88 a 91: mapeia para `melee_attack_bonus`, com `bonusDamageFormula: "2d8"` e `selfTarget: true`.
- `lib/combat/ability.ts`, linhas 302 a 318 e 964 a 968: `resolveAbilityUse` manda `selfTarget` para `resolveAbilityBuff`. O ramo de `melee_attack_bonus` com `selfTarget`, linhas 472 a 490, devolve `nextAttackBonus: 2` e ignora completamente o `bonusDamageFormula`. O resultado e +2 no teste de ataque, nao +2d8 radiante.
- `lib/combat/attack.ts`, linha 567, aplica o `nextAttackBonus` e, linha 620, consome o buff no primeiro ataque, sem exigir corpo a corpo com arma nem verificar o tipo de acao.
- `lib/combat/ability.ts`, linhas 917 a 927: o `bonusDamageFormula` so e rolado no ramo de `resolveAbilityAttack`, que esta branco para esta habilidade por causa do `selfTarget`. Alem disso, esse ramo soma o extra depois de `resistedDamageAmount` (`attack.ts`, linha 1043), entao resistencia radiante nao incidiria sobre ele.
- `lib/room/handlers/combat-ability.ts`, linhas 71 a 83 e 134: o servidor paga o PA de `resolved.paCost` e grava o HP vindo de `resolved.attack`. Nao ha codigo de morto-vivo em `lib/combat/`, nem campo de tipo de criatura em `BattleToken` (`lib/vtt/types.ts`, linhas 60 a 118).

**Onde entraria no motor.**

1. Separar esta habilidade do ramo generico. Ou trocar o `effect` em `compendium-actions.ts`, linhas 88 a 91, por um efeito proprio, ou criar um caso especifico em `ability.ts`, linhas 472 a 490, que devolva `bonusDamageFormula` em vez de `nextAttackBonus`. Nao alterar o ramo generico, porque ele atende outras habilidades.
2. Escala por nivel em helper novo, por exemplo `lib/combat/paladin-divine-strike.ts`, com `golpeSagradoDiceForLevel(level)`, usando a tabela 2, 3, 4, 5, 6 a partir dos niveis 2, 5, 9, 13 e 17. O helper e chamado na construcao da acao ou em `resolveAbilityUse`, onde `actor.identity.nivel` ja esta disponivel.
3. O dano extra precisa entrar no `DamageBreakdown` antes de `resistedDamageAmount`, em `attack.ts`, linha 1043. Hoje o unico ponto que soma `bonusDamageFormula` apos a resistencia e `ability.ts`, linhas 917 a 927. Mover esse ponto afeta as outras habilidades que usam o mesmo campo.
4. Exigir ataque corpo a corpo com arma. O `nextAttackBonus` atual e consumo cego em `attack.ts`, linha 620. Se o dano ficar como buff no token, o consumo precisa checar `action.kind` e `rangeCells <= 1`.
5. Dano dobrado contra morto-vivo exigiria classificar o alvo. Hoje nao ha campo para isso em `BattleToken`, entao a parte fica de fora ate alguém decidir de onde vem a informacao, se de `monsterEntryId`, de tag ou de dados do compendio.
6. Renomear o texto de `rules.ts`, linhas 617 a 624, para Golpe Sagrado.
7. Servidor sem mudanca. `combat-ability.ts` ja paga 1 PA e aplica o HP do ataque. O talento Julgamento Ardente, que isenta esse PA uma vez por turno (`habilidades.json`, linha 753), nao tem implementacao e ficaria para outra entrada.

**Tamanho:** media para nome, escala e dano. Grande se entrarem morto-vivo e resistencia radiante, porque ai ha classificacao nova de token e mudanca na ordem em que o dano e calculado.

**Risco.**

- O ramo `melee_attack_bonus` com `selfTarget` tambem atende `habilidades-lamina-dos-sepulcros`, `habilidades-mordida-do-voto`, `habilidades-fera-interior` e `habilidades-pele-de-quimera` (`compendium-actions.ts`, linhas 148, 155, 159 e 164). Mexer nele globalmente troca o efeito de quatro habilidades de uma vez.
- `bonusDamageFormula` ja e usado por varias habilidades e pelo token. Mudar o momento em que ele entra pode alterar numeros publicados da secao 3 e de outras verificacoes.
- O buff atual dura 1 turno e e consumido por qualquer ataque (`buff-durations.ts`, linha 70, e `attack.ts`, linha 620). Manter esse comportamento com dano permitiria radiante em ataque a distancia, ao contrario do livro.
- Resistencia radiante hoje nao incide sobre o extra por causa da ordem em `ability.ts`, linha 917. Corrigir a ordem muda o resultado contra monstros resistentes, inclusive fora do Paladino.
- Sem classificacao de morto-vivo, qualquer atalho por nome de monstro quebraria quando o Mestre criar criatura propria (`gmCreatureStats`).
- Se o PA extra deixar de ser 1, `resolved.paCost` em `combat-ability.ts`, linha 71, e o que o servidor cobra. Qualquer mudanca de custo tem de passar por `abilityFromEntry` e `paCostForToken`, nao direto no handler.

**Como testar:** `scripts/verify-d13-golpe-sagrado.mjs`, com o mesmo loader. Casos de dados: 2 no nv2, 3 no nv5, 4 no nv9, 5 no nv13, 6 no nv17 e no nv20. Casos de contrato: `classLevelFeatures("Paladino", 5)` contem `Golpe Sagrado` e nao contem `Golpe do Juramento`; `classAbilityEntryIds` devolve `habilidades-golpe-sagrado` no nv2 mas nao no nv1; `abilityFromEntry` devolve custo 1 PA e formula com a escala do nivel. Caso de comportamento: `resolveAbilityUse` para o Paladino nv5 devolve `bonusDamageFormula: "3d8"`, sem `nextAttackBonus`, e o dano total do ataque cresce entre 3 e 24. Casos de regressao: as quatro habilidades que usam `melee_attack_bonus` com `selfTarget` continuam devolvendo `nextAttackBonus: 2`; resistencia radiante reduz o extra pela metade quando o talento Luz Penitente nao esta ativo; ataque a distancia nao consome o buff.

### 4.4 Fato x opiniao

- Fato verificado: citacoes do livro e numeros de linha, o estado atual do codigo em cada arquivo citado, a ausencia de `Fluxo Marcial` em `livros/`, o furtivo restrito a goblin, o Golpe Sagrado resolvendo como +2 no ataque e a escala de dados existindo so como texto.
- Opiniao de prioridade: D12 e o mais barato e o unico que o livro pede explicitamente para sair. D11 e o que mais muda numeros de dano e o que tem mais risco de interpretação. D13 e o que exige decisao de modelagem, porque "morto-vivo" e "uma vez por turno ou por golpe" nao estao definidos no motor.
- Opiniao de sequencia: resolver D12 primeiro, depois D11 com o helper isolado e testes de condicao, e deixar D13 para depois de decidir como o Mestre marca tipo de criatura. Esta ordem nao vem do livro.
- Fora deste plano: D8, D9 e D10, subclasses, nivel maximo, turnos contra bestiario e propostas de ajuste de balanceamento.

## Andamento

- [x] Etapa 1 - tabela-base nivel 1 (este arquivo, secao 1). Corrigida na Etapa 2 (secao 2.0).
- [x] Etapa 2 - nivel 1 com atributos, acerto, magia e Chi (secao 2). Feiticeiro e Espiritualista calculados; Clerigo e Druida conferidos com o livro (2.4); divergencias D1 a D7 em 2.5.
- [x] Etapa 3, parte 1 - niveis 5 e 10 (secao 3). Divergencias D8 a D13 em 3.6.
- [x] Plano para D11, D12 e D13 (secao 4). So leitura; nada mudado em lib/, data/, livros/ ou scripts/. D12 corrigido depois no commit 7f9e371; registro em 3.6 e 4.2, com nota sobre Corpo Transcendente em 4.2.
- [ ] Etapa 3, parte 2 - subclasses, nivel maximo, turnos contra bestiario e propostas de ajuste.
