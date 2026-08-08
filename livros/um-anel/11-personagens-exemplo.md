# Personagens Pré-gerados — O Um Anel 2ª ed. (fonte: TOR_Starter_Set_Pre-generated_Characters.pdf)

> Fonte: the one ring/TOR_Starter_Set_Pre-generated_Characters.pdf

---

## Visão geral

Este livreto de 16 páginas contém **8 fichas de personagem pré-geradas completas** para o Starter Set, cada uma ocupando duas páginas: (1) a ficha de estatísticas da frente (leiaute de coluna dupla: Atributos/Perícias/Proficiências de Combate nos dois terços da esquerda, retrato + acompanhamento de Resistência/Esperança + Condições + Equipamento de Viagem/Guerra no terço da direita, tabelas de Equipamento de Guerra/Armadura na base), e (2) uma ilustração de retrato de página inteira mais uma citação em primeira pessoa e um parágrafo curto de história de fundo.

**Personagens capturados, na ordem do livreto:**
1. Drogo Bolseiro — Hobbit do Condado
2. Esmeralda Took — Hobbit do Condado
3. Lobelia Bracegirdle — Hobbit do Condado
4. Paladin Took II — Hobbit do Condado
5. Primula Brandybuck — Hobbit do Condado
6. Rorimac Brandybuck — Hobbit do Condado
7. Balin, filho de Fundin — Anão do Povo de Durin
8. Bilbo Bolseiro — Hobbit do Condado

### Estrutura de campos da ficha (como observada — útil pra validar o esquema de ficha da VTT)

- **Cabeçalho:** Nome, Cultura Heroica, Idade, Características Distintivas (2, texto livre).
- **Três caixas de Atributo** (FORÇA / CORAÇÃO / ASTÚCIA), cada uma mostrando:
  - Um número pequeno de "Valor" (o Atributo bruto, canto superior direito da caixa).
  - Um número grande de "NA" (Número-Alvo, o valor exibido em destaque contra o qual se rola de fato).
  - Uma estatística derivada: **Resistência** (coluna de Força), **Esperança** (coluna de Coração), **Bloqueio** (coluna de Astúcia).
- **Perícias:** 18 no total, dispostas em 3 colunas de 6 sob o Atributo que as governa (Força: Fascínio, Atletismo, Vigilância, Caçada, Música, Ofício — Coração: Indução, Viagem, Discernimento, Cura, Cortesia, Batalha — Astúcia: Persuasão, Furtividade, Busca, Exploração, Enigma, História). Cada uma tem uma caixa de marcação (Favorecida) e uma trilha de losangos de 0 a 6.
- **Proficiências de Combate:** Machados, Arcos, Lanças, Espadas — cada uma uma trilha de losangos de 0 a 6 (ou mais, com equipamento).
- **Recompensas:** campo de texto livre listando heranças especiais (em geral vazio nos pré-gerados de nível mais baixo).
- **Valor** e **Sabedoria:** campos numéricos de losango único (ambos normalmente começam em 1, maiores em personagens veteranos).
- **Virtudes:** lista de texto livre de habilidades especiais com descrições mecânicas curtas (muitas vezes anotando "já contado no total" quando elevam passivamente uma estatística derivada mostrada em outro ponto da ficha).
- **Resistência Atual / Esperança Atual:** losangos de acompanhamento vazios (pra marcar durante o jogo), cada um com rótulos de referência pequenos de "Carga" e "Fadiga" (Resistência) ou equivalentes.
- **Condições:** caixas de Exausto / Ferido (desmarcadas em todas as 8 fichas de exemplo — são personagens "novos", prontos pra começar).
- **Equipamento de Viagem:** um item nomeado mais a Perícia associada a ele entre parênteses (conforme a regra de Itens Úteis no livreto de Regras).
- **Tabela de Equipamento de Guerra:** colunas Nome / Dano / Ferimento / Carga / Notas (vazia pros Hobbits desarmados que não possuem arma listada).
- **Tabela de Armadura / Elmo / Escudo:** colunas Nome / Proteção (ou Bloqueio, no caso do Escudo) / Carga.
- **Ilustração de retrato** do personagem (a página de trás repete o retrato em página inteira, com uma citação em primeira pessoa e um resumo de história de fundo em terceira pessoa).

### Nota sobre Valor de Atributo × NA impresso (não é erro — é a variante oficial de campanha curta)

As fichas do Starter Set imprimem, nas 8 páginas, **NA = 18 − Valor do Atributo** (ex.: Balin, Força 5 → NA 13; Drogo, Coração 6 → NA 12), e não o **NA = 20 − Atributo** que o material afirma em quatro pontos independentes (`02-resolucao-de-acoes.md`; `03-aventureiros.md` ×2; `09-starter-set-regras-condensadas.md` ×2).

**Isso não é divergência: é uma regra opcional oficial.** O box *Tweaking the Target Numbers* do Livro Básico (`02-resolucao-de-acoes.md`) diz explicitamente:

> Calcular os NAs subtraindo os Atributos de 20 produz limiares de dificuldade apropriados a campanhas médias e longas […] Para campanhas mais curtas ou jogos de uma sessão, os jogadores e o Mestre podem combinar derivar os NAs subtraindo os Atributos de **18** em vez disso.

O Starter Set é justamente um produto de campanha curta / one-shot, então suas fichas usam a variante 18 corretamente. **Os dois números estão certos, cada um no seu contexto.** A VTT implementa o padrão (`lib/character/um-anel/rules.ts::attributeTN`, 20 − Atributo), então a ficha destes 8 pré-gerados aparece com NA 2 pontos acima do PDF — comportamento correto pro padrão, e a variante 18 fica como possível opção de campanha no futuro (ainda não implementada).

Independentemente disso, **a coluna de Valor está comprovadamente correta**: os 7 pré-gerados Hobbit usam, cada um, **exatamente um dos 6 conjuntos oficiais de Atributos** da tabela de Hobbits do Condado em `03-aventureiros.md` — nenhum valor fora da tabela, e cada conjunto aparece uma vez (Bilbo repete o conjunto 1 de Drogo):

| Pré-gerado | Força | Coração | Astúcia | Conjunto oficial |
|---|---|---|---|---|
| Drogo Bolseiro | 3 | 6 | 5 | 1 |
| Paladin Took II | 3 | 7 | 4 | 2 |
| Esmeralda Took | 2 | 7 | 5 | 3 |
| Primula Brandybuck | 4 | 6 | 4 | 4 |
| Rorimac Brandybuck | 4 | 5 | 5 | 5 |
| Lobelia Bracegirdle | 2 | 6 | 6 | 6 |
| Bilbo Bolseiro | 3 | 6 | 5 | 1 |

Se os Valores tivessem sido transcritos errado da arte da ficha, não cairiam todos dentro de uma tabela fechada de 6 linhas. A implementação da VTT portanto **guarda os Valores impressos e calcula o NA ao vivo com 20 − Atributo** (`lib/character/um-anel/rules.ts::attributeTN`), o que faz a ficha mostrar NA 2 pontos acima do PDF de propósito.

**A divergência de verdade, essa não resolvível pela fonte:** a Resistência impressa nas 7 fichas Hobbit está exatamente **2 pontos acima** da fórmula cultural do livro (Hobbits do Condado: Resistência = FORÇA + 18). Esperança (CORAÇÃO + 10) e Bloqueio (ASTÚCIA + 12) fecham exatos nas 7, inclusive somando as 3 Virtudes que alteram estatística (Confiança de Drogo, Agilidade de Paladin, Robustez de Rorimac). E **Balin, o único Anão, fecha exato nas três** com as bases do Povo de Durin (Resistência + 22, Esperança + 8, Bloqueio + 10). Ou seja, o desvio de +2 está confinado à Resistência das fichas Hobbit. O livreto condensado do Starter Set não traz bloco de criação de personagem, então não há como saber pela fonte se é erro de impressão ou uma base de Resistência diferente adotada só no Starter Set. **Os valores impressos foram preservados por fidelidade ao material**, e `scripts/verify-um-anel-pregens.mjs` fixa a relação pra que ninguém "corrija" recalculando.

Os valores de losango de Perícia/Proficiência foram lidos direto da arte renderizada; trate contagens exatas de losango como transcrição de melhor esforço e confira na fonte se algum valor específico for carregar lógica de jogo.

---

## 1. Drogo Bolseiro

**Cultura Heroica:** Hobbit do Condado | **Idade:** 52 | **Características Distintivas:** Fiel, Honrado

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 3 | 15 | Resistência 23 |
| CORAÇÃO | 6 | 12 | Esperança 18 |
| ASTÚCIA | 5 | 13 | Bloqueio 17 |

**Perícias:**
- Força: Fascínio 0, Atletismo 0, **Vigilância 2 (Favorecida)**, Caçada 0, **Música 2 (Favorecida)**, Ofício 1
- Coração: Indução 0, **Viagem 1 (Favorecida)**, Discernimento 1, Cura 2, **Cortesia 2 (Favorecida)**, Batalha 0
- Astúcia: Persuasão 2, Furtividade 2, Busca 0, Exploração 0, Enigma 2, História 1

**Proficiências de Combate:** Machados 0, Arcos 2, Lanças 0, Espadas 1

**Recompensas:** — (nenhuma) | **Valor:** 1 | **Sabedoria:** 1

**Virtudes:** Confiança (+2 de Esperança máxima, já contado no total)

**Equipamento de Guerra / Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Capa e Chapéu Finos (FASCÍNIO)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Eu me instalo direitinho em Buckland, prontinho pra casar com uma bela ala só minha da Casa Brandy, e o Primo Bilbo me chama pra Hobbiton! Não é lá muito apropriado, veja bem. Mas eu já fiz minha cota de coisas impróprias, suponho, como empacotar tudo pra morar do outro lado do Brandevin feito um Hobbit ribeirinho de botas. Primula diz que eu preciso criar coragem (um trocadilho brandybuckiano, esse) e superar meus medos se um dia eu quiser um lugar como deve ser na Casa Brandy. Então suponho que vamos ver que estranheza o Primo Bilbo andou aprontando, contanto que não tenha barco envolvido. Ainda sou um Hobbit do Setor-Oeste como manda o figurino, e não me sinto à vontade com essas geringonças pouco confiáveis."*

**História de fundo:** Drogo Bolseiro tem cerca de cinquenta anos na época destas aventuras, e é um Hobbit bem como manda o figurino, se bem que um pouco acima do peso. Um dia, ele se casará com sua adorável Primula, e os dois terão um filho, Frodo Bolseiro.

---

## 2. Esmeralda Took

**Cultura Heroica:** Hobbit do Condado | **Idade:** 24 | **Características Distintivas:** Ávido, Jovial

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 2 | 15 | Resistência 22 |
| CORAÇÃO | 7 | 11 | Esperança 17 |
| ASTÚCIA | 5 | 13 | Bloqueio 17 |

**Perícias:**
- Força: Fascínio 1, Atletismo 1, Vigilância 0, Caçada 0, Música 2, Ofício 1
- Coração: **Indução 2 (Favorecida)**, Viagem 0, Discernimento 0, Cura 1, **Cortesia 1 (Favorecida)**, Batalha 0
- Astúcia: **Persuasão 1 (Favorecida)**, Furtividade 2, Busca 0, Exploração 0, Enigma 2, História 0

**Proficiências de Combate:** Machados 1, Arcos 2, Lanças 0, Espadas 0

**Recompensas:** — (nenhuma) | **Valor:** 1 | **Sabedoria:** 1

**Virtudes:** Proeza (−1 no NA de Força — é o que explica o NA impresso 15 com Força 2)

**Equipamento de Guerra / Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Bengala dos Took (VIAGEM)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Ah, isto vai ser uma delícia! Uma verdadeira Aventura Bolseiro aqui mesmo, planejada pelo próprio Senhor de Bolsão! Sim, eu sei que tecnicamente estou aqui porque a Tia-Avó Lalia quis que eu garantisse que 'aquele Bolseiro Louco não fosse aprontar nenhuma tolice', e mais provavelmente pra me tirar de Vila dos Tuk por alguns dias depois do rebuliço na festa de aniversário dela ano passado, mas aquilo não foi minha culpa, e verdade seja dita, pretendo voltar com uma boa história ou duas no bolso. Na verdade, não tenho dúvida de que terei mais fios pra desenrolar do que a Vovó Rosa guarda perto daquela cadeira de balanço rangente dela."*

**História de fundo:** Bisneta de Gerontius, o Velho Tuk, ela ainda está na casa dos vinte. Tinha cerca de cinco anos quando Bilbo Bolseiro deixou Bolsão pra ir reclamar o ouro de Smaug, o Dragão. Ela se casará com Saradoc Brandybuck, e um dia se tornará mãe de um certo Meriadoc Brandybuck.

---

## 3. Lobelia Bracegirdle

**Cultura Heroica:** Hobbit do Condado | **Idade:** 42 | **Características Distintivas:** Curioso, Olhos de Lince

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 2 | 16 | Resistência 22 |
| CORAÇÃO | 6 | 12 | Esperança 16 |
| ASTÚCIA | 6 | 12 | Bloqueio 18 |

**Perícias:**
- Força: **Fascínio 2 (Favorecida)**, Atletismo 0, Vigilância 1, Caçada 0, Música 2, Ofício 1
- Coração: Indução 0, Viagem 0, **Discernimento 2 (Favorecida)**, Cura 1, **Cortesia 2 (Favorecida)**, Batalha 0
- Astúcia: Persuasão 2, **Furtividade 2 (Favorecida)**, **Busca 2 (Favorecida)**, Exploração 0, Enigma 2, História 1

**Proficiências de Combate:** Machados 0, Arcos 1, Lanças 0, Espadas 2

**Recompensas:** — (nenhuma) | **Valor:** 1 | **Sabedoria:** 1

**Virtudes:** Maestria (2 Perícias Favorecidas adicionais, já contadas no total)

**Equipamento de Guerra / Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Guarda-chuva Requintado (PERSUASÃO)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Dá pra acreditar no descaramento daquele... daquele... Brandybuck! Ah, ele se diz um Bolseiro, mas nenhum Bolseiro direito e de bem sairia correndo com um bando de Anões loucos e um mago meio pirado pra dentro do desconhecido, muito menos teria a audácia de aparecer mais de um ano depois com um pônei carregado de ouro e fingir que está tudo às mil maravilhas! Não vou tolerar isso, eu lhe digo. E não vou tolerar que ele traga mais escândalo indevido às pessoas de bem do Condado. Ele está aprontando alguma, chamando Tuks e Brandybucks a Bolsão pra algum assunto sujo e encrenqueiro, sem dúvida."*

**História de fundo:** Filha de Blanco Bracegirdle e Primrose Boffin, Lobelia ainda não se casou com Otho Sacola-Bolseiro. Tem cerca de quarenta anos, e já viu sua ambição de entrar em Bolsão como legítima proprietária desaparecer uma vez, quando Bilbo voltou de sua aventura contra todas as probabilidades.

---

## 4. Paladin Took II

**Cultura Heroica:** Hobbit do Condado | **Idade:** 27 | **Características Distintivas:** Ávido, Rústico

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 3 | 15 | Resistência 23 |
| CORAÇÃO | 7 | 11 | Esperança 17 |
| ASTÚCIA | 4 | 14 | Bloqueio 17 |

**Perícias:**
- Força: Fascínio 0, **Atletismo 1 (Favorecida)**, Vigilância 0, **Caçada 1 (Favorecida)**, Música 1, Ofício 1
- Coração: Indução 0, Viagem 0, Discernimento 1, Cura 1, Cortesia 1, Batalha 0
- Astúcia: Persuasão 1, **Furtividade 2 (Favorecida)**, Busca 0, **Exploração 1 (Favorecida)**, Enigma 1, História 0

**Proficiências de Combate:** Machados 1, Arcos 0, Lanças 0, Espadas 2

**Recompensas:** — (nenhuma) | **Valor:** 1 | **Sabedoria:** 1

**Virtudes:** Agilidade (+1 no Bloqueio, já contado no total — é o que explica o Bloqueio 17 com Astúcia 4)

**Equipamento de Guerra / Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Trouxa de Viajante dos Took (EXPLORAÇÃO)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Cuidando da minha vida em Whitwell e quem vem descendo a alameda da minha fazenda? A jovem Esmeralda! Vai visitar o Primo Bilbo, ela vai, e pensei comigo mesmo: essa é uma ideia das boas. Que mal tem um Tuk se divertir um pouco antes de se acomodar e se tornar um fazendeiro de respeito? Ainda estou na casa dos vinte, por que não deixar a responsabilidade pra outra estação ou duas e honrar meu bisavô com um pouco de aventura? Parece só o justo."*

**História de fundo:** Irmão menor de idade de Esmeralda Took, e futuro Thain — por ora sua única distinção é ser o filho mais velho de Adalgrim Took, e um fazendeiro recém-estabelecido de Whitwell. Um dia, terá um filho, e o chamará de Peregrin.

---

## 5. Primula Brandybuck

**Cultura Heroica:** Hobbit do Condado | **Idade:** 40 | **Características Distintivas:** Bem-falante, Fiel

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 4 | 14 | Resistência 24 |
| CORAÇÃO | 6 | 12 | Esperança 16 |
| ASTÚCIA | 4 | 13 | Bloqueio 16 |

**Perícias:**
- Força: Fascínio 0, Atletismo 0, Vigilância 1, Caçada 0, Música 1, Ofício 0
- Coração: Indução 0, Viagem 0, Discernimento 1, Cura 1, **Cortesia 1 (Favorecida)**, Batalha 0
- Astúcia: Persuasão 1, Furtividade 2, Busca 0, Exploração 0, **Enigma 2 (Favorecida)**, História 1

**Proficiências de Combate:** Machados 0, Arcos 2, Lanças 1, Espadas 0

**Recompensas:** — (nenhuma) | **Valor:** 1 | **Sabedoria:** 1

**Virtudes:** Proeza (−1 no NA de Astúcia — é o que explica o NA impresso 13 com Astúcia 4)

**Equipamento de Guerra / Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Roupas Elegantes (CORTESIA)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"É bem apropriado que Drogo e eu voltemos a Bolsão por um tempo. Não vemos o Tio Bilbo dele desde que Drogo prometeu se casar comigo ali mesmo na frente de todos, debaixo da Árvore da Festa. O querido Drogo pode ser meio rígido às vezes, mas tem um toque do tio nele. Rory está vindo também, sagaz como sempre e convencido de que algo estranho está a caminho. Esmeralda está convencida de que vamos encontrar um dragão ou alguma tolice assim. Quanto a Lobelia, bem, quanto menos se disser, melhor. Alguém tem que manter a cabeça no lugar em toda essa história, e parece que sou a única apta para o serviço."*

**História de fundo:** Prima de Bilbo Bolseiro (pelo lado da mãe), Primula é a filha mais nova de Gorbadoc Brandybuck, o Senhor de Buckland. Em breve, se casará com Drogo Bolseiro, e os dois terão um filho, Frodo.

---

## 6. Rorimac Brandybuck

**Cultura Heroica:** Hobbit do Condado | **Idade:** 58 | **Características Distintivas:** Olhos de Lince, Rústico

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 4 | 14 | Resistência 26 |
| CORAÇÃO | 5 | 13 | Esperança 15 |
| ASTÚCIA | 5 | 13 | Bloqueio 17 |

**Perícias:**
- Força: Fascínio 0, Atletismo 0, **Vigilância 1 (Favorecida)**, Caçada 1, Música 1, Ofício 1
- Coração: Indução 0, Viagem 0, **Discernimento 2 (Favorecida)**, Cura 1, Cortesia 1, Batalha 0
- Astúcia: Persuasão 1, **Furtividade 2 (Favorecida)**, Busca 0, Exploração 0, Enigma 1, História 0

**Proficiências de Combate:** Machados 0, Arcos 0, Lanças 1, Espadas 2

**Recompensas:** — (nenhuma) | **Valor:** 1 | **Sabedoria:** 1

**Virtudes:** Robustez (+2 de Resistência máxima, já contado no total)

**Equipamento de Guerra / Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Faca de Esfolar Coelhos (CAÇADA)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Todas aquelas histórias de dragão e contos infantis não são sem um fundo de verdade, eu lhe digo. O Bolseiro Louco está aprontando alguma, e pretendo descobrir o quê. Simples e direito ele era antes daquele mago arrastá-lo pra dentro do desconhecido, só pra plantá-lo de volta mais de um ano depois com uma mochila cheia de ouro e um brilho no olho. Não estou julgando ele, veja bem. Nós de Buckland já somos chamados de estranhos o bastante por esses Hobbits rígidos do Setor-Oeste, mas se o Bolseiro está aprontando alguma estranheza nova, pretendo testemunhar em primeira mão e ver com meus próprios olhos o que está acontecendo."*

**História de fundo:** Irmão de Primula, Rorimac (chamado "Rory") em breve herdará o título de Senhor de Buckland. Por ora, é um Hobbit robusto, desconfiado de tudo que seja sobrenatural, e sempre pronto a defender a irmã.

---

## 7. Balin, filho de Fundin

**Cultura Heroica:** Anão do Povo de Durin | **Idade:** 197 | **Características Distintivas:** Ávido, Curioso

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 5 | 13 | Resistência 27 |
| CORAÇÃO | 4 | 14 | Esperança 12 |
| ASTÚCIA | 5 | 13 | Bloqueio 15 |

> As três derivadas de Balin fecham exatas com as bases do Povo de Durin (Resistência + 22, Esperança + 8, Bloqueio + 10). É o controle que isola o desvio de +2 na Resistência às fichas Hobbit.

**Perícias:**
- Força: Fascínio 2, Atletismo 1, Vigilância 0, Caçada 0, Música 2, Ofício 2
- Coração: Indução 2, **Viagem 2 (Favorecida)**, Discernimento 0, Cura 0, Cortesia 2, Batalha 2
- Astúcia: Persuasão 2, Furtividade 0, **Busca 2 (Favorecida)**, **Exploração 1 (Favorecida)**, Enigma 1, História 0

**Proficiências de Combate:** Machados 2, Arcos 0, Lanças 1, Espadas 1

**Recompensas:** Machado de Balin (cruel, afiado); Cota de Malha de Prata (justa ao corpo, feitura astuta)

**Valor:** 4 | **Sabedoria:** 3

**Virtudes:**
- Escuro pra Trabalho Escuro (Inspirado no escuro)
- Mão Firme (soma +1 ao dano infligido em um Golpe Pesado)
- Caminho de Durin (+2 no Bloqueio no subterrâneo)

**Equipamento de Guerra:**
| Item | Dano | Ferimento | Carga | Notas |
|---|---|---|---|---|
| Machado de Balin | 6 | 18 | 2 | — |

**Armadura:**
| Item | Proteção | Carga |
|---|---|---|
| Cota de Malha de Prata | 4d+2 | 10 |

**Escudo:**
| Item | Bloqueio | Carga |
|---|---|---|
| Escudo | +2 | 4 |

(Carga total anotada na ficha: 16 — consistente com 2 + 10 + 4 dos itens acima.)

**Equipamento de Viagem:** Viola de Fabricação Anã (MÚSICA)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Ah, só passando pra tomar um chazinho, e o que encontro? Uma nova roda de conspiradores reunida mais uma vez em volta da mesa do querido Bilbo Bolseiro, contemplando à luz de velas algum mapa antigo. Pois bem, bendita seja minha barba se nossa alegre aventurinha não deixou sua marca! Velhos hábitos custam a morrer, ou assim dizem, e parece que a companhia de supostos 'caçadores de tesouro experientes' do Bilbo bem poderia usar um toque de perspicácia de quem entende dessas coisas."*

**História de fundo:** Balin é um viajante calejado. Lutou em muitas batalhas, mas nunca perdeu o apetite pela aventura. Acompanhou Bilbo e Thorin na Demanda de Erebor, e desenvolveu um forte apego ao velho Hobbit ladrão.

---

## 8. Bilbo Bolseiro

**Cultura Heroica:** Hobbit do Condado | **Idade:** 70 | **Características Distintivas:** Bem-falante, Honrado

| Atributo | Valor | NA impresso | Derivada |
|---|---|---|---|
| FORÇA | 3 | 15 | Resistência 23 |
| CORAÇÃO | 6 | 12 | Esperança 16 |
| ASTÚCIA | 5 | 13 | Bloqueio 17 |

**Perícias:**
- Força: Fascínio 0, Atletismo 0, Vigilância 0, Caçada 0, Música 1, Ofício 1
- Coração: Indução 0, Viagem 0, Discernimento 2, Cura 1, **Cortesia 2 (Favorecida)**, Batalha 0
- Astúcia: Persuasão 2, Furtividade 1, **Busca 1 (Favorecida)**, **Exploração 1 (Favorecida)**, **Enigma 1 (Favorecida)**, **História 1 (Favorecida)**

**Proficiências de Combate:** Machados 0, Arcos 2, Lanças 0, Espadas 2

**Recompensas:** Ferroada (Espada Curta Élfica, ver Equipamento de Guerra)

**Valor:** 2 | **Sabedoria:** 3

**Virtudes:**
- Maestria (2 Perícias Favorecidas adicionais, já contadas no total)
- Bravo no Aperto (enquanto estiver Exausto ou Ferido, você está Inspirado em todas as rolagens)
- Certeiro no Alvo (ataques à distância são Favorecidos, pode arremessar pedras)

**Equipamento de Guerra:**
| Item | Dano | Ferimento | Carga | Notas |
|---|---|---|---|---|
| Ferroada | 3 | 20 | 1 | Brilha quando há Orcs por perto |
| Pedras arremessadas | 1 | 12 | 0 | — |

**Armadura / Escudo:** nada listado

**Equipamento de Viagem:** Anel Mágico de Bilbo (gaste 1 Esperança pra ficar invisível); Cachimbo Bem-Talhado (DISCERNIMENTO)

**Condições:** Exausto ☐ / Ferido ☐

**Citação:** *"Me chamam de pirado, esquisito, e até de um tanto louco. Suponho que, pelos padrões do Condado, talvez tenham razão. Mas, e talvez eu esteja sendo um pouco Tookish demais aqui, eu digo: há algo de errado em uma aventurinha de vez em quando? Ouso dizer que esses simplórios bobos e fofoqueiros vagabundos bem poderiam ter mais emoção na vida. Eu certamente tive minha cota nos meus anos — e uma porção graúda foi, tudo de uma vez, eu lhe digo! Com aquele assunto de Anões e magos e dragões e tudo mais. Pergunte a um Bolger ou a um Boffin, e dirão que nada de bom saiu daquilo, mas eles não sabem o que estão perdendo!"*

**História de fundo:** Amigo de ursos e hóspede de águias, Bilbo Bolseiro é Ganhador-do-Anel e Portador-da-Sorte, e até Cavalgador-de-Barril! É ao mesmo tempo o maior Hobbit aventureiro de todos os tempos, e o mais amante da paz. Mas por trás de seus modos alegres, ele esconde um segredo terrível…

---

## Notas de referência cruzada para o esquema de ficha da VTT

- Os 7 pré-gerados Hobbit compartilham o rótulo de Cultura "Hobbit do Condado" e uma distribuição de Atributos semelhante (Força 2–4, Coração 5–7, Astúcia 4–6) — consistente com Hobbits sendo emocionalmente resilientes e fisicamente pouco imponentes, conforme o arquétipo da Cultura. Como registrado acima, cada distribuição é um dos 6 conjuntos oficiais da tabela de Hobbits.
- Balin (Anão do Povo de Durin) tem Força (5) e Resistência (27) notavelmente maiores, Esperança menor (12), e é o único pré-gerado com Recompensas, Equipamento de Guerra, Armadura e Escudo preenchidos, além de 3 Virtudes e Valor/Sabedoria mais altos (4/3) — consistente com ser escrito como um "veterano" NPC-virado-companheiro em vez de um Hobbit jovem e novato.
- Bilbo Bolseiro é igualmente um build "veterano": 3 Virtudes, Recompensas/Equipamento de Guerra preenchidos, Valor 2 / Sabedoria 3, e 6 Perícias Favorecidas (bem acima das 2–4 dos outros Hobbits) graças à Virtude Maestria.
- Toda Virtude que aumenta uma estatística derivada numérica diz explicitamente "já contado no total" — confirma que, neste formato de ficha, as derivadas (Resistência/Esperança/Bloqueio) são sempre exibidas como valores finais pós-Virtude, e não como valores-base com modificadores listados à parte. A lógica de ficha da VTT provavelmente deve armazenar tanto o resultado da fórmula-base quanto quaisquer bônus fixos de Virtude, mas apenas exibir e usar o total somado, conforme esta convenção.
- Todo pré-gerado "novato" (todos exceto Balin e Bilbo) tem zero Recompensas e uma tabela de Equipamento de Guerra/Armadura/Escudo vazia — confirma que estes campos são opcionais/anuláveis no esquema, não obrigatórios.
- O campo de Equipamento de Viagem consistentemente pareia exatamente um item com exatamente uma Perícia entre parênteses, confirmando a relação de 1 item para 1 Perícia descrita na regra de "Itens Úteis" no livreto de Regras.
