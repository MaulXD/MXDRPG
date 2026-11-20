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

## Andamento

- [x] Etapa 1 - tabela-base nivel 1 (este arquivo, secao 1). Corrigida na Etapa 2 (secao 2.0).
- [x] Etapa 2 - nivel 1 com atributos, acerto, magia e Chi (secao 2). Feiticeiro e Espiritualista calculados; Clerigo e Druida conferidos com o livro (2.4); divergencias D1 a D7 em 2.5.
- [ ] Etapa 3 - o restante: subclasses, niveis 5, 10 e maximo, turnos contra bestiario, propostas de ajuste.
- [ ] Etapa 3 - maximo, turnos contra bestiario, propostas de ajuste.
