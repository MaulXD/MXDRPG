# ECOLOGIA DE MASMORRA E CULINÁRIA BIOMÁGICA
## Livro do Jogador — Eldarin v4.0

> Regras, personagem, combate, culinária biomágica, magia. Bestiário e masmorras: *Livro do Mestre*.

**Pontos principais (mesa digital):** combate por **Pontos de Acao (PA)** — inspirado em **Divinity: Original Sin 2** — **recuperacao fixa 5 PA/turno** (talentos podem alterar); **acumula ate 9 PA** no pool se nao gastar; **sem teto de gasto no turno** (bonus de PA permitem gastar mais no mesmo turno); **ataque basico 2 PA**; **monstros 6 PA**, **bosses 9 PA**; movimento por faixas (`walk`/`run`); **Atordoado** zera PA (`Cap. 2.6`, `Cap. 3.1`).

---

# PARTE I — O UNIVERSO DE ELDARIN

---

## CAPÍTULO 1 — O MUNDO

> **Atlas completo** (cidades, vilas, castelos, torres, rotas): ver `livros/ATLAS-DE-ELDARIN.md`.

### 1.1 Sobre o Sistema

> "A masmorra não e um lugar. E um organismo. E como todo organismo, ela tem ecossistema, cadeia alimentar e, se você souber onde olhar, um cardapio."
> — Grimorio do Primeiro Descente, Autor Desconhecido

Este RPG e inspirado na filosofia de Dungeon Meshi (Delicious in Dungeon): a masmorra e um ecossistema vivo, os monstros sao criaturas biologicas com anatomia funcional, e a sobrevivencia depende tanto de saber lutar quanto de saber cozinhar o que você abate.

Pilares do sistema:
- Explorar e necessario. Descansar e arriscado. Comer e poder.
- Cada monstro e um ingrediente. Cada ingrediente tem propriedades. Cada refeicao e uma decisao tática.
- O grupo que não aprende anatomia morre de fome ou de veneno. Frequentemente os dois.
- Chefoes não sao apenas vitorias — sao o melhor jantar da campanha.
- Na **mesa digital (VTT)**, o turno de combate e orcado em **Pontos de Acao** — cada golpe, magia, habilidade ou corrida estrategica consome PA ate o limite do personagem (`Cap. 2.6`, `Cap. 3.1`).

### 1.2 Visao Geral de Eldarin

**Eldarin** e o continente onde este jogo se passa — um mundo de tamanho medio construido, literal e figurativamente, ao redor das suas 11 masmorras. Economia, politica, cultura e religiao giram em torno do submundo. O reino central, **Valdremor**, ocupa o coracao geografico, equidistante das 11 entradas conhecidas como **As Bocas**. A capital e **Ossenfurt** — cidade fundada onde os primeiros exploradores acamparam ha seiscentos anos.

Nao existe, em Eldarin, distincao cultural entre "aventureiro" e "cidadao". Explorar masmorras e profissao reconhecida, taxada e regulamentada. Ha sindicato de exploradores, seguros de vida, mercados de ingredientes nas cidades-porta e escolas que ensinam Extração ao lado de matematica. Outras cidades importantes: **Vesper** (academia, Boca Dourada), **Kravenholm** (minas, Boca Vermelha), **Ferromur** (industria, Boca Cinza), **Salmour** (porto, Boca Azul).

### 1.3 O Submundo como Organismo

As masmorras de Eldarin não foram construidas. Cresceram. O submundo e um organismo que engoliu cidades, florestas e montanhas. As 11 masmorras — **As Bocas** — ligam-se por tuneis chamados **Veias**.

### 1.4 Economia e Cultura de Valdremor

Ingredientes de monstros sao a principal commodity de Valdremor. Cada cidade proxima a uma masmorra têm um **Mercado de Especiarias** onde exploradores vendem loot culinário.

| Raridade | Exemplos | Preço Medio |
|----------|----------|-------------|
| Comum | Carne básica de zumbi, osso de esqueleto | 2-10 po/kg |
| Incomum | Glandula de veneno, escama de dragonete | 25-80 po/unidade |
| Raro | Coracao de vampiro, cristal de mana osseo | 200-500 po |
| Muito Raro | Nucleo de elemental, ectoplasma puro | 1.000-3.000 po |
| Lendário | Componentes de Boss | Sem preço fixo — leilao |

**O Sindicato dos Exploradores:** Grupos de aventureiros se registram ao entrar em qualquer masmorra. Beneficios: seguro de vida (100 po por morte confirmada), acesso a mapas parciais, credito em lojas, informação sobre monstros. Custo: 5% de toda renda obtida.

**A Academia de Culinaria de Ossenfurt:** A maior instituicao de ensino culinário-biomagico do mundo. Aceita estudantes, treina Forrageio e Coccao, publica pesquisas sobre novas combinacoes de ingredientes.

---

# PARTE II — SISTEMA CENTRAL

---

## CAPÍTULO 2 — A FICHA DE PERSONAGEM

### 2.1 Atributos Classicos

| Atributo | Abreviação | Uso |
|----------|-----------|-----|
| Força | FOR | Ataques fisicos, peso carregado, quebrar portas |
| Destreza | DES | Furtividade, acrobacia, ataques precisos |
| Constituicao | CON | HP total, resistência a doenças e venenos |
| Inteligencia | INT | Estudo de anatomia, identificacao de ingredientes |
| Sabedoria | SAB | Percepção, harmonização culinaria, intuicao |
| Carisma | CAR | Negociacao, lideranca, inspiracao do grupo |

**Modificador de Atributo:** (Atributo menos 10) dividido por 2, arredondado para baixo.

**Bonus de Proficiencia:**

| Nivel | Bonus de Proficiencia |
|-------|----------------------|
| 1–4 | +2 |
| 5–8 | +3 |
| 9–12 | +4 |
| 13–16 | +5 |
| 17–20 | +6 |

### 2.2 Pontos de Vida (HP)

HP Base por Nivel: Dado da Classe + MOD CON (por nivel) + CON base (nivel 1)
Calculo rapido: HP = (Dado da classe medio x Nivel) + (MOD CON x Nivel)

### 2.3 Classe de Armadura (CA)

CA base = 10 + MOD DES (sem armadura)

| Tipo de Armadura | CA | Requisito |
|-----------------|-----|-----------|
| Sem armadura | 10 + DES | — |
| Armadura leve (couro) | 11 + DES | — |
| Armadura media (cota de malha) | 13 + DES (max +2) | FOR 11 |
| Armadura pesada (placas) | 16 | FOR 15 |
| Escudo | +2 | — |
| Armadura natural (monstro/Artífice) | variavel | — |

### 2.4 Atributos Culinarios

Alem dos atributos classicos, toda ficha possui a secao **Culinaria de Masmorra** com quatro atributos especificos:

**Extração (Destreza Manual):** A habilidade fisica de cortar, eviscerar e filetar carcacas de monstros.
- Teste: 1d20 + MOD DES + Proficiencia (se treinado)
- Sem treinamento: -2 na rolagem.
- Com Estudo de Anatomia: Vantagem na rolagem.

**Forrageio (Intuicao/Sabedoria):** A capacidade de equilibrar sabores, neutralizar toxinas e extrair o máximo biologico de um ingrediente.
- Teste: 1d20 + MOD SAB + Proficiencia (se treinado)

**Coccao (Tecnica/Fogo):** Controle de tempo e temperatura.
- Teste: 1d20 + MOD INT + Proficiencia (se treinado)
- Resultado abaixo de 8: Gororoba. 9-15: Comum. 16-20: Gourmet. 21+: Prato Perfeito.

**Fortitude (Resistência):** A tolerancia gastrica do personagem.
- Teste: 1d20 + MOD CON + Proficiencia (se treinado)
- CD 10: Alimentos estragados leves. CD 13: Venenos processados. CD 16: Ingredientes amaldicados. CD 19: Essências demoniacas ou divinas.

Os atributos culinários sobem com pratica: cada vez que o personagem prepara uma refeicao bem-sucedida com um novo tipo de monstro pela primeira vez, ganha +1 em um atributo culinário de sua escolha.

### 2.5 Experiencia e Niveis (1–20)

O **nivel do personagem** (1–20) segue o **nivel dos monstros** do bestiário. Subir de nivel exige **XP acumulado**; combaté e marcos na masmorra concedem XP.

#### XP total para estar em cada nivel

| Nv | XP acumulado minimo | XP para subir ao próximo |
|----|---------------------|--------------------------|
| 1 | 0 | 100 |
| 2 | 100 | 200 |
| 3 | 300 | 300 |
| 4 | 600 | 400 |
| 5 | 1 000 | 500 |
| 6 | 1 500 | 600 |
| 7 | 2 100 | 700 |
| 8 | 2 800 | 800 |
| 9 | 3 600 | 900 |
| 10 | 4 500 | 1 000 |
| 11 | 5 500 | 1 100 |
| 12 | 6 600 | 1 200 |
| 13 | 7 800 | 1 300 |
| 14 | 9 100 | 1 400 |
| 15 | 10 500 | 1 500 |
| 16 | 12 000 | 1 600 |
| 17 | 13 600 | 1 700 |
| 18 | 15 300 | 1 800 |
| 19 | 17 100 | 1 900 |
| 20 | 19 000 | — |

**Formula rapida:** XP acumulado para estar no nivel **N** = **50 × N × (N − 1)**. Para passar do nivel **L** ao **L + 1**, faltam **100 × L** XP (ex.: do 4 ao 5, +400).

#### XP por monstro derrotado

| Regra | Valor |
|-------|--------|
| **Base** | **100 × Nivel da ficha** do espécime (001–060) |
| **Versao Elite / Colossal** | Use o **nivel da versao Elite** na ficha (ex.: Zumbi Colossal nv. 5 = **500 XP**) |
| **Divisao** | Divida o pool **igualmente** entre quem participou do combaté (reduzido a 0,5 se só assistiu sem atacar) |
| **Banquete no mesmo descanso** | +25% XP se o grupo fez **Prato Estruturado** com aquele espécime antes do próximo descanso longo |
| **Monstro fraco demais** | Se **N medio do grupo − Nivel do monstro ≥ 4:** XP × 0,25 · se **≥ 2:** XP × 0,5 |
| **Monstro acima do grupo** | Se monstro **2+ niveis** acima do N medio: XP × 1,25 |

**Ritmo alvo (4 PCs):** ~**3–5** combates contra espécimes do **mesmo nivel** do grupo para subir **1 nivel**; andares com enxames de Comuns (nv. 1–2) aceleram o inicio.

#### Marcos do Mestre (sem combate)

| Marco | XP sugerido |
|-------|-------------|
| Andar limpo (sem TPK) | 50% do XP que falta para o próximo nivel do grupo |
| Boss de andar derrotado | 100% do gap para o próximo nivel **ou** soma dos XP dos lacaios + boss |
| Descoberta ecologica (bioma novo, 40 plantas) | 25 × nivel medio |
| Banquete Lendário (Cap. Mestre) | +25% XP da sessao daquele boss |

**Subir de nivel:** quando o XP acumulado atinge a linha do próximo nivel, o personagem sobe: +HP (Cap. 2.2), talentos nos niveis 4/8/12/16/20. PA na mesa digital **nao** aumentam por nivel — apenas talentos passivos especificos alteram recuperacao ou inicio de turno (Cap. 2.6).

**Tabela por codigo:** `livros/TABELA-XP-ESPECIMES.md` (001–060).

### 2.6 Pontos de Acao (PA) — mesa digital

**PA** medem quantas acoes taticas o personagem executa **no proprio turno** antes de passar a iniciativa. O modelo segue **Divinity: Original Sin (DOS)**: cada acao relevante gasta PA; **sobra nao some** ao passar o turno; no **inicio do seu turno** voce recupera PA **base** somados ao que ficou no pool (com teto). Movimento de hex **reinicia** a cada turno.

#### Pool, recuperacao e Atordoado (estilo DOS 2)

| Regra | Valor |
|-------|--------|
| **Recuperacao** | **+5 PA** no inicio de cada turno (salvo talentos que alteram isso) |
| **PA nao gastos** | Ao **passar o turno**, a sobra **permanece no pool**, ate o teto de acumulo |
| **Inicio do seu turno** | `PA no pool = min(9, sobra + 5)` — ex.: sobra **4** → **9 PA**; sobra **2** → **7 PA** |
| **Teto de acumulo** | **9 PA** no pool entre turnos (sobra guardada). Acima disso ao passar turno, o excedente se perde |
| **Gasto no turno** | **Sem teto fixo** — pode gastar mais que 9 no mesmo turno se ganhar PA (Carrasco, Adrenalina, etc.) |
| **Atordoado / Stunned** | Ao receber a condicao, **perde todo PA** do pool |

Ex.: comeca com **5 PA**; move (**1 PA**) e ataca (**2 PA**) → sobram **2 PA**; passa o turno → guarda **2**. Proximo turno: **min(9, 2+5) = 7 PA**. Se terminar com **9 PA** sem gastar e passar o turno, no proximo turno: **min(9, 9+5) = 9 PA** (recuperacao nao aumenta porque ja esta no teto de acumulo).

#### Talentos passivos de PA (mesa digital)

| Talento | Efeito |
|---------|--------|
| **Lobo Solitario** | Recuperacao **7 PA**/turno; acumula ate **11 PA** |
| **Canhao de Vidro** | Inicia cada turno com **7 PA** (ignora sobra+recuperacao); armadura nao bloqueia status |
| **Carrasco** | Ao eliminar inimigo: **+2 PA** imediatos (1x/turno) |
| **O Peao** | **1 PA** do movimento basico (1º bloco) **nao gasta**; incompativel com Carrasco |
| **Adrenalina** (ativa) | **+2 PA** agora; proximo turno recupera **2 a menos** |
| **Aceleracao** (buff) | Recuperacao **+1 PA**/turno enquanto durar |

IDs no VTT: `data/character/pa-modifiers.json` (`passivePa`).

#### Monstros na mesa digital (VTT)

| Regra | Valor |
|-------|--------|
| **PA padrao** | Monstros comuns e mini-boss: **6 PA** |
| **Boss** | **9 PA** |
| **Movimento** | Mesmas **faixas por hex** que personagens, usando `walk` e `run` do bloco do monstro (ex. walk 4, run 7: hex 1–2 → 1 PA; 3–5 livres; do 6º → PA de corrida) |
| **Visibilidade** | Jogadores **nao veem** PA de monstros na mesa; o mestre ve e controla |

O *Livro do Mestre* descreve ameaca e tier; o JSON `data/compendiums/monstros.json` e o VTT aplicam estes valores. **Tamanho no grid** (`tactical.tamanho`: `small` … `colossal`) vem de `data/monster-tamanhos.json` — alinhado ao SRD (goblin Pequeno, minotauro Grande, dragão ancião Imenso, etc.); ver **§3.1.3.1**.

#### O que gasta PA

| Tipo | Custo tipico |
|------|----------------|
| Ataque com arma | **2 PA** por golpe (padrao; compendio pode variar) |
| Magia | **1 PA** ou mais (`custoPontosAcao` na magia) |
| Habilidade de classe / trilha | **1 PA** ou mais (compendio) |
| **Movimentacao basica** (VTT) | **Faixas por hex** no turno (valores `walk` / `run` da ficha ou monstro): **1º bloco** (min. 2 hex, ou 1 se walk=1) → **1 PA**; **faixa livre** ate o hex anterior à corrida → **0 PA**; **corrida** a partir do hex **walk+2** (max. `run`) → **+1 PA a cada 2 hex** (ou 1 PA/hex se sobra 1 hex de corrida) |
| Orcamento de hex | **Caminhada** ate `walk`; **corrida** ate `run` — ex. walk **4**, run **7**: hex **1–2** → 1 PA; **3–5** livres; do **6º** em diante → PA de corrida |

Regras completas, exemplos de turno e tabelas de talentos: **Cap. 3.1** e **Cap. 12.0**. Referencia tecnica do VTT: `data/character/pa-modifiers.json`.

**Ficha:** anote **PA atual / PA maximo** ao lado de HP (impresso: ver `FICHA_PERSONAGEM_ELDARIN_v4.md`).

---

## CAPÍTULO 3 — MECANICA CENTRAL DE COMBATE

### 3.1 Sequencia de Turno

1. Rolagem de Iniciativa: 1d20 + MOD DES. Ordem decrescente.
2. Acao: Atacar, conjurar magia, usar item, Ajudar, Evadir, Correr.
3. Acao Bonus: Habilidades especificas de classe ou raca.
4. Movimento: Ate o valor de deslocamento base (normalmente 9m).
5. Reacao: Uma por turno, em resposta a gatilhos especificos.

**Mesa digital (VTT):** turnos usam **Pontos de Acao (PA)** (`Cap. 2.6`), no estilo **DOS**. No inicio do seu turno voce soma **PA base** ao que sobrou no pool (com teto). **Movimento, ataque, magia e habilidade** gastam PA conforme o compendio; **movimento basico = 1 PA**.

### 3.1.1 Economia de PA (mesa digital)

| Regra | Valor |
|-------|--------|
| Recuperacao por turno | **5 PA** (fixo; talentos alteram) |
| Acumulo no pool | Ate **9 PA** entre turnos |
| Gasto no turno | **Sem teto** — bonus podem permitir gastar bem mais no mesmo turno |
| Ataque / magia / habilidade | Custo no item (`custoPontosAcao`; padrao **2 PA**) |
| Movimentacao basica (VTT) | **Faixas** conforme `walk`/`run` (1º bloco = 1 PA; meio livre; corrida depois) |
| Monstros (VTT) | **6 PA** (comum/mini); **9 PA** (boss) |
| PA nao gastos (fim do turno) | **Permanecem no pool** (max. **9**); proximo turno **+5** recuperacao |
| Atordoado | **Perde** todo PA acumulado |
| Guerreiro nv. 5+ | Cada golpe de **Ataque Extra** custa **1 PA** (excecao; demais ataques com arma seguem o custo do item, em geral **2 PA**) |
| Mago, Clérigo, Druida, Bardo, Artifice nv. 5+ | **Afinidade Arcanica** — magias com custo **2+ PA** custam **1 PA** a menos (min. 1) |
| Monstros (VTT) | Custo por acao no compendio (muitas mordidas/garras **1 PA**); pool minimo **6 PA** |
| Cantrips / utilitarios | Alguns truques sem dano de combate podem ter **1 PA** no compendio |

#### 3.1.1.1 Areas na mesa digital (VTT)

No site, magias e habilidades de **area** usam hex (1 hex = 1,5 m). O mestre ou jogador escolhe o **centro** (e a **direcao**, em cone ou linha); o VTT mostra os hex afetados antes de gastar PA.

| Forma no VTT | Exemplo no livro | Parametro tipico |
|--------------|------------------|------------------|
| **burst** (raio) | Bola de Fogo, raio 6 m | `radiusHex` (6 m ≈ 4 hex) |
| **wall** (muralha) | Muralha Hexagonal | `hexCount` em hex adjacentes |
| **cone** | Maos Gelidas, cone | `lengthHex` + direcao |
| **line** (linha) | Relampago em linha, Ventania | `lengthHex` + direcao |
| **single** | Raio Arcano em um alvo | 1 hex |

Detalhe tecnico e pipeline livro → JSON: `docs/VTT-ACOES-PA-AREAS.md`.

#### 3.1.1.2 Magias canalizáveis (10 no compêndio)

Dez magias de dano marcadas como **canalizáveis** no VTT (`spell.channel` no JSON):

| Magia | Nv | PA base | Extra |
|-------|-----|---------|-------|
| Mãos Gelidas | 1 | 2 | até +2 PA |
| Chama de Vinha | 1 | 2 | até +2 PA |
| Onda de Trovão | 1 | 2 | até +2 PA |
| Esfera Ácida de Monstro | 2 | 2 | até +2 PA |
| Relâmpago | 3 | 2 | até +2 PA |
| Bola de Fogo | 3 | 3 | até +2 PA |
| Raio do Limiar | 3 | 2 | até +2 PA |
| Murcha | 4 | 3 | até +2 PA |
| Cone de Frio | 5 | 3 | até +2 PA |
| Cadeia de Relâmpago | 6 | 3 | até +2 PA |

Na mesa, antes de conjurar escolha **+0, +1 ou +2 PA extras**. Cada PA extra adiciona **+1d6** à fórmula de dano daquela conjuração. Os PA extras **não** são reduzidos por Afinidade Arcânica (só o custo base). Continua valendo o teto de **11 PA gastos** no turno.

**Empilhamento:** reducoes de talento e de classe **somam** antes do minimo 0 PA. Ex.: magia de fogo 2 PA com *Chama Controlada* (−1) e Afinidade Arcanica (−1) = **0 PA** naquele turno.

**Talentos** (Cap. 12.0) aumentam PA maximo ou reduzem custo de tipos especificos (arma, magia por elemento, magia de area, habilidade). A ficha deve registrar o talento pelo **nome**; no VTT o **id** da trilha (ex. `chama-controlada`) precisa constar em `talentos` para o calculo automatico.

### 3.1.2 Exemplos de turno (PA)

**Guerreiro nv. 5 (6 PA), espada, Ataque Extra (2 golpes):**
1. Caminhar 4 hex → 0 PA (restam 6 PA).
2. Atacar inimigo adjacente (2 golpes) → **2 PA** (restam 4 PA).
3. *Investida do Guerreiro* (habilidade 1 PA) → 1 PA (restam 3 PA).
4. Guardar 3 PA para o proximo turno (volta a 6 PA).

**Mago nv. 5 (6 PA), *Chama Controlada* (nv. 4), Bola de Fogo (2 PA no compendio):**
1. Correr alem da caminhada → 1 PA (restam 5 PA).
2. Bola de Fogo → 2 − 1 (fogo) − 1 (Afinidade) = **0 PA** (restam 5 PA).
3. Magia Cantrip 1 PA → 1 PA (restam 4 PA).

**Clérigo nv. 10 (7 PA), sem talentos de reducao:**
1. Magia 2 PA → Afinidade → **1 PA**.
2. Cura aliado (habilidade 1 PA) → 1 PA.
3. Ataque com maça 1 PA → 1 PA. Total gasto: 3 PA; sobram 4 PA.

### 3.1.3 Movimento e PA no hexagonal (VTT)

- **1 hex = 1,5 m.** Referencia de deslocamento: ~**9 m** por turno ≈ **6 hex** de corrida maxima; caminhada tipica ≈ **4 hex** com faixas de PA (`Cap. 2.6`).
- **Rota no mapa:** ao mover, o VTT traca um **caminho pelo grid** (nao linha reta atraves de obstaculos) e anima o token ao longo da rota; hex bloqueados por **tokens medios**; **Halfling**, **Gnomo** e criaturas **pequenas** (mob com deslocamento curto, ou `sharedHex` no token) podem **dividir o mesmo hex** com outra criatura pequena (ate 2 no bloco).
- **Modo caminhada / corrida:** orcamento de hex e custo de PA conforme faixas `walk`/`run` da ficha; o alcance mostrado na mesa respeita bloqueios e rotas validas.

#### 3.1.3.1 Tamanho de criaturas no grid (VTT)

Cada token ocupa **um ou mais hex** conforme o tamanho corporal. A escala segue o **SRD / D&D 5e** (Pequeno a Colossal). No VTT, o campo `tactical.tamanho` em `data/compendiums/monstros.json` espelha `data/monster-tamanhos.json` (80 fichas **001–080** + aliases de spawn). Tabela completa por código: *Livro do Mestre*, apêndice **Tamanho no grid (001–080)**; cada ficha lista **Tamanho** nas estatísticas.

| Tamanho (livro) | Categoria SRD | Hex ocupados | Exemplos no bestiário Eldarin |
|-----------------|---------------|--------------|-------------------------------|
| **Pequeno** | Small | **1** | Goblin, Goblin de Caverna |
| **Médio** | Medium | **1** | Zumbi, Orc, Esqueleto, Vampiro, Slimes |
| **Grande** | Large | **3** | Minotauro, Wyvern, Golem, Grifo, Elementais |
| **Gigante** | Huge | **7** | Escorpião Gigante, Hidra, Ciclope, Dragão Jovem de Gelo, Treant Podre |
| **Imenso** | Gargantuan | **19** | Dragão Ancião de Fogo, Kraken Menor, Verme Gigante de Pedra, Behemoth |
| **Colossal** | Colossal+ | **37** | Variante Colossal na invocação (+1 degrau no tamanho base) |

- **Grande** usa **3 hex em linha** (centro + dois opostos); demais tamanhos multi-hex usam **disco** ao redor do centro.
- Invocação **Elite** não altera tamanho; **Colossal** sobe **um degrau** (ex. Grande → Gigante).
- O token na mesa escala visualmente com o tamanho; bloqueio de movimento e alcance consideram **todos os hex** ocupados.

### 3.2 Ataques

**Rolagem de Ataque:** 1d20 + Modificador de Atributo + Bonus de Proficiencia (se proficiente)

- Resultado maior ou igual a CA do alvo: Acerto
- Natural 20: Acerto Crítico — dano dobrado
- Natural 1: Falha Critica — ação desperdicada, possivel acidente

**Dano:** Dado da arma + Modificador de Atributo

### 3.3 Saving Throws

1d20 + Modificador do atributo correspondente (mais Proficiencia se treinado) contra a **Classe de Dificuldade (CD)** do efeito.

### 3.4 Condicoes

| Condicao | Efeito | Duracao sugerida (mesa) |
|----------|--------|-------------------------|
| Agarrado | Velocidade 0. Pode se soltar com Força ou Acrobacia vs CD do agarrador. | Sem contador — ate escapar |
| Amedrontado | Desvantagem em ataques e testes enquanto a fonte do medo estiver visivel. | 2 rodadas ou ate a fonte sumir |
| Atordoado | Incapaz de agir. Falha automatica em Força e DES. Ataques contra tem Vantagem. | 1 turno |
| Cego | Desvantagem em ataques. Ataques contra tem Vantagem. | 2 rodadas |
| Encantado | Nao pode atacar o encantador. Encantador tem Vantagem em interacoes sociais. | 3 rodadas |
| Envenenado | Desvantagem em ataques e testes de atributo. | 3 rodadas |
| Exausto | Penalidades crescentes de 1 a 6. Nivel 6 = morte. | Sem contador — niveis ate descanso |
| Incapacitado | Sem acoes nem reacoes. | 1–2 turnos (efeito da magia) |
| Invisivel | Ataques tem Vantagem. Ataques contra tem Desvantagem. | 1 rodada ou ate atacar |
| Paralisado | Incapacitado, sem movimento. Acertos sao críticos automaticos. | 1–2 turnos |
| Petrificado | Transformado em pedra. Incapacitado, peso dobrado, resistência a todos os danos. | Sem contador — ate remoção |
| Prostrado | Velocidade 0 exceto arrastando. Desvantagem em ataques. | Sem contador — ate levantar |
| Restringido | Velocidade 0. Desvantagem em ataques e DES. Ataques contra tem Vantagem. | 2 rodadas |
| Surdo | Falha automatica em Percepção por som. | 2 rodadas |

Na mesa virtual, o Mestre pode aplicar condicoes com contador (1R, 2R, 1T, 2T) ou sem limite. O botao **Sug.** aplica a duracao sugerida da tabela.

#### 3.4.1 Buffs e debuffs temporarios (mesa virtual)

Efeitos de habilidades e posturas recebem duracao automatica na mesa. O contador aparece no icone de status e no tooltip.

| Efeito | Regra | Duracao automatica |
|--------|-------|-------------------|
| Postura / +defesa | Bonus na Classe de Armadura | Ate o inicio do proximo turno de quem usou |
| Golpe preparado / +ataque | Bonus no proximo teste de ataque | 1 turno (ou ate o ataque) |
| Investida | Movimento em linha + bonus corpo a corpo | 1 turno (ou ate o ataque) |
| Passo das sombras | Teleporte curto | 1 turno (ou ate usar o movimento) |
| Forma selvagem | Transformacao no movimento | 1 turno |
| Tiro certeiro | Vantagem no proximo ataque a distancia | 1 turno (ou ate o ataque) |
| Inspiracao | Vantagem no proximo ataque do aliado | 1 turno (ou ate o ataque) |
| Reflexos | Desloca 1 hex como reacao | 1 turno (ou ate usar) |
| Marca / Marca do cacador | Bonus ou vantagem contra alvo marcado | 1 turno (ou ate atacar o alvo) |
| Finta | Desvantagem no proximo ataque do alvo | 1 turno (ou ate o ataque) |
| Dano extra (ex.: golpe divino) | Dado extra no proximo acerto | 1 turno (ou ate acertar) |

**Turno (T)** = conta no fim do turno do personagem afetado. **Rodada (R)** = conta quando a rodada de combate avanca. **Ate prox. turno** = expira no inicio do proximo turno do dono do efeito.

### 3.5 Descanso e Recuperação

**Descanso Curto (1 hora):**
- Recupera HP usando Dados de Vida: 1d(Dado da Classe) + MOD CON por dado gasto.
- Nao recupera espacos de magia.
- Nao expira mutacoes.

**Descanso Longo (8 horas):**
- Recupera HP total.
- Recupera todos os espacos de magia.
- Expira todas as mutacoes biomágicas ativas.
- Requer pelo menos uma Refeicao Comum antes de comecar. Sem refeicao: recupera apenas 50% do HP e metade dos espacos de magia.

**Risco do Descanso na Masmorra:** Descansos longos dentro da masmorra tem risco de Encontro. O Mestre rola 1d6: 1-2 = Encontro de monstros durante o descanso; 3-5 = Nenhum encontro; 6 = O grupo e descoberto — proxima batalha e uma emboscada.

---

# PARTE III — RACAS JOGAVEIS

---

> "Nas masmorras de Eldarin, a pergunta não e de onde você vem — e o que você come, o que você construiu, e o que corre nas suas veias."

## VISAO GERAL DAS RACAS

| Raça | Origem | Papel Natural |
|------|--------|---------------|
| Humano | Superficie | Versatil, adaptavel, genericamente competente |
| Elfo | Florestas engolidas | Magico, sensivel, cozinheiro arcano supremo |
| Anão | Cidades subterraneas | Artífice, resistente, forjador de Ferramentas Orgânicas |
| Halfling | Vilas rurais proximas as entradas | Sortudo, furtivo, sensor de perigo |
| Gnomo | Torres de alquimia | Pocioneiro, curioso, inteligencia explosiva |
| Meio-Humano | Familias com ancestral bestial | Fisico especializado por linhagem animal |
| Forjado de Osso | Criado pelos Anaos com partes de monstros | Resiliente, construto vivo, sem necessidade de comer |

---

## COMO LER AS HABILIDADES RACIAIS

Cada traço racial segue o mesmo formato usado nas classes (ex.: **Fúria** do Bárbaro): **como ativar**, **quanto dura**, **o que muda nos números** e **como isso muda o combate ou a expedição**.

| Campo | Significado |
|-------|-------------|
| **Gatilho** | Quando a habilidade pode ser usada (passivo, reação, ação/ação bônus, 1×/dia, etc.). |
| **Duração** | Turnos, minutos, horas ou permanente. |
| **Efeito** | Bônus, resistências, Vantagem, dano extra, imunidades. |
| **Na mesa** | Papel tático — tank, scout, suporte, economia de PA, culinária, etc. |

**Nota:** **Fúria** é habilidade de **classe** (Bárbaro, nv. 1). **Herança Bestial** e o **Instinto** de cada linhagem são o equivalente racial dos Meio-Humanos — estado temporário de combate, não confundir com Fúria (salvo **Fúria Bestial** da Linhagem do Urso no nv. 16, descrita abaixo).

---

## HUMANO

**Lore:** O mais abundante e o mais ignorado. Humanos chegam as masmorras por todas as razoes possiveis — ganancia, fuga, missao divina, curiosidade cientifica ou simplesmente porque estavam no lugar errado na hora errada. O que os define não e forca nem magia, mas a velocidade com que aprendem e a teimosia com que sobrevivem.

**Atributos:** +1 em todos os seis atributos.

**Habilidades Raciais:**

**Adaptabilidade:** *Gatilho:* antes de rolar qualquer teste de atributo ou perícia. *Recarga:* 1× por descanso longo. *Efeito:* Vantagem naquele teste. *Na mesa:* “Carta na manga” — salva testes críticos de Percepção, Furtividade ou resistência sem depender de magia; humano compensa falta de especialização racial com flexibilidade.

**Paladar Versátil:** *Gatilho:* na criação do personagem (fixo). *Efeito:* escolhe qual atributo culinário (Forrageio, Coccão, Harmonização, etc.) recebe o bônus de **primeira vez com monstro novo** da campanha. *Na mesa:* define o arquétipo culinário do humano (scout de ingredientes, cozinheiro ou harmonizador) sem mudar raça.

**Resistência Mundana:** *Passivo permanente.* *Efeito:* +2 em Fortitude (testes de resistência física e Estômago de Ferro). *Na mesa:* aguenta venenos leves, exaustão de marcha e refeições ruins melhor que raças “frágeis”; combina bem com classes que investem em CON.

**Determinação:** *Gatilho:* quando dano ou efeito reduziria você a 0 HP. *Recarga:* 1× por dia. *Efeito:* fica com 1 HP em vez de cair inconsciente (não evita morte instantânea narrativa). *Na mesa:* uma “última perna” por sessão — ideal para tanques ou líderes que precisam sobreviver um golpe decisivo; no nv. 12 vira 2×/dia (Determinação Humana).

**Progressao Racial:**

| Nivel | Bonus |
|-------|-------|
| 4 | +1 em dois atributos a escolha |
| 8 | Aprende uma habilidade de subclasse de qualquer aliado (30 dias de treino) |
| 12 | Determinacao Humana — a habilidade acima funciona 2x/dia |
| 16 | +2 em todos os atributos culinários |
| 20 | Legado — escolhe uma mutação biomágica permanente de qualquer monstro consumido na campanha |

---

## ELFO

**Lore:** Ha 800 anos, a Grande Floresta de Alverith foi engolida pela Masmorra 7. Os elfos que sobreviveram adaptaram-se ao submundo ao longo de geracoes: perderam a conexao com a luz solar e ganharam sensibilidade mágica extrema as energias do ambiente. Sua pele emite bioluminescencia tenue (controlável voluntariamente), e seus sentidos detectam campos magicos como um humano detecta fumaca. Sao considerados os melhores harmonizadores de ingredientes do mundo.

**Atributos:** +2 DES, +1 INT

**Habilidades Raciais:**

**Visão Arcana:** *Passivo.* *Efeito:* visão no escuro 18 m; detecta campos mágicos ativos (armadilhas, auras, itens encantados) num raio de 5 m sem teste. *Na mesa:* batedor e desarmador natural em masmorras escuras; reduz surpresas de armadilhas mágicas e economiza tempo de exploração.

**Instinto de Forrageio:** *Passivo permanente.* *Efeito:* +3 em Forrageio. *Na mesa:* elfo é o melhor coletor/harmonizador de ingredientes — encontra partes melhores, falha menos em identificação de flora/fauna mágica e alimenta o sistema de culinária biomágica do grupo.

**Sono Élfico:** *Passivo.* *Efeito:* descanso longo em 4 h de meditação (em vez de 8 h). *Na mesa:* vigias noturnos eficientes — metade do grupo pode descansar enquanto o outro explora; em expedições longas, recupera slots e HP mais rápido que o restante.

**Resistência a Encantamentos:** *Passivo.* *Efeito:* Vantagem em testes de resistência contra Charme e Medo. *Na mesa:* tanque mental contra feiticeiros e horrores; menos chance de perder turnos ou fugir do combate por controle mental.

**Progressao Racial:**

| Nivel | Bonus |
|-------|-------|
| 4 | Toque Purificador — neutraliza venenos nao-magicos em ingredientes com um toque, sem teste |
| 8 | Leitura de Espécime — toque em monstro morto equivale a Estudo de Anatomia automatico |
| 12 | Mutacoes Elementais duram 48h em vez de 24h |
| 16 | Memoria Ancestral — acessa conhecimento ancestral 1x/semana (equivale ao Bestiario completo de 1 categoria) |
| 20 | Harmonia Perfeita — pratos preparados por Elfos sempre resultam em Prato Perfeito |

---

## ANAO

**Lore:** Os Anaos construiram impérios nas profundezas muito antes das masmorras existirem. Quando o submundo cresceu e engoliu suas cidades, eles simplesmente continuaram construindo — agora com materiais de monstros. Sao os criadores dos Forjados de Osso e os unicos que entendem completamente as Engrenagens Esquecidas. Sua cultura gira em torno da máxima: "Nada se desperdiça. Tudo vira ferramenta."

**Atributos:** +2 CON, +1 FOR

**Habilidades Raciais:**

**Resistência Anã:** *Passivo.* *Efeito:* Vantagem em testes contra veneno; resistência a dano de veneno (metade do dano). *Na mesa:* front-liner em masmorras tóxicas — aguenta mordidas venenosas e armadilhas de gás sem derreter.

**Visão de Escuro:** *Passivo.* *Efeito:* visão perfeita no escuro até 18 m. *Na mesa:* igual ao elfo em exploração subterrânea; não depende de tocha (menos furtividade quebrada).

**Mestria de Ferramentas:** *Passivo permanente.* *Efeito:* proficiência em todas as ferramentas de Extração (incl. Especialista); +2 em Extração. *Na mesa:* desossa monstros com eficiência — mais loot culinário, ferramentas orgânicas e materiais de craft para o grupo.

**Instinto de Forja:** *Gatilho:* ao criar Ferramenta Orgânica de Boss. *Efeito:* rola duas vezes o resultado e usa o melhor. *Na mesa:* anão “farm” equipamento lendário com menos frustracao; sinergia direta com Artífice e economia de masmorra.

**Progressao Racial:**

| Nivel | Bonus |
|-------|-------|
| 4 | Estômago de Pedra — imune a debuffs de Gororoba; refeicoes ruins sempre contam como Comuns |
| 8 | Resistência Termica — resistência permanente a fogo e calor extremo |
| 12 | Construtor Instintivo — Ferramentas Orgânicas de Boss em metade do tempo |
| 16 | Sangue de Forja — ataques corpo-a-corpo contam como magicos e adicionam +1d6 fogo |
| 20 | Lenda da Forja — cria Ferramenta Orgânica Lendaria 1x/mes com ingredientes acumulados sem depender de Boss |

---

## HALFLING

**Lore:** Os Halflings vivem nas vilas agricolas nos arredores das entradas das masmorras de Eldarin — os unicos loucos o suficiente para construir casas a 500 metros de uma boca de masmorra. Seculos de vida nessa vizinhanca perigosa desenvolveram neles algo inexplicavel pela ciencia: sorte. Nao magia, não habilidade — sorte biologica. Eles escorregam de armadilhas que deveriam te-los matado. Sobrevivem a situacoes que não deveriam sobreviver.

**Atributos:** +2 DES, +1 SAB

**Habilidades Raciais:**

**Sorte Inata:** *Gatilho:* ao rolar **1 natural** em qualquer d20. *Recarga:* 1× por descanso longo (2× no nv. 4; sem limite no nv. 20). *Efeito:* rerrola e **deve** usar o segundo resultado. *Na mesa:* evita falhas catastróficas em ataque, furtividade ou armadilha — halfling é o “salva-rolagem” do grupo.

**Bravura Halfling:** *Passivo.* *Efeito:* Vantagem contra Medo; não foge de combate por medo involuntário. *Na mesa:* suporte estável em encontros de horror; não abandona a linha de frente por efeito mental.

**Furtividade Natural:** *Passivo.* *Efeito:* pode tentar se esconder mesmo coberto só por criatura Média ou maior. *Na mesa:* scout em combate aberto — esconde-se atrás do guerreiro e ataca à distância ou prepara emboscada.

**Sensores Aguçados:** *Passivo.* *Efeito:* +3 em Percepção passiva; detecta criaturas ocultas e armadilhas a 1,5 m automaticamente. *Na mesa:* “radar de armadilha” na vanguarda; reduz dano surpresa e economiza testes ativos de Percepção.

**Paladar de Especialista:** *Gatilho:* ao provar ingrediente cru. *Efeito:* sabe instantaneamente se é seguro, tóxico leve, severo ou letal. *Na mesa:* testador de comida da expedição — evita envenenamento do grupo antes da culinária formal.

**Corpo Pequeno:** *Passivo.* *Efeito:* tamanho Pequeno; Desvantagem em armas pesadas. *Na mesa:* mais difícil de acertar (em regras que consideram tamanho), melhor em túneis estreitos; troca dano bruto por mobilidade e sorte.

**Progressao Racial:**

| Nivel | Bonus |
|-------|-------|
| 4 | Sorte Dupla — Sorte Inata funciona 2x por descanso longo |
| 6 | Passo Silencioso — movimento nunca provoca ataques de oportunidade em terreno natural |
| 8 | Faro de Perigo — no inicio de cada sessao, o Mestre informa ao Halfling se ha uma armadilha mortal no próximo andar |
| 10 | Sorte Compartilhada — pode gastar um uso de Sorte Inata em favor de um aliado adjacente |
| 12 | Reflexos de Sobrevivente — nunca pode ser surpreendido em combaté |
| 14 | +2 em Forrageio |
| 16 | Esquiva do Destino — uma vez por semana, cancela completamente um efeito que deveria afeta-lo |
| 18 | Sentido de Horde — detecta automaticamente o numero aproximado de inimigos em uma sala antes de entrar |
| 20 | Abencado pela Sorte — Sorte Inata funciona em qualquer dado, sem limite de usos diarios |

---

## GNOMO

**Lore:** Os Gnomos habitam as Torres de Alquimia espalhadas por Eldarin — laboratorios construidos estrategicamente perto das masmorras para que os ingredientes cheguem frescos. Sua obsessao não e a batalha nem a exploracao — e a transformacao. Todo monstro e uma equacao quimica por resolver. Todo veneno e uma poção pela metade. A culinaria de masmorra e a alquimia de laboratorio, para os Gnomos, sao a mesma coisa expressa em vocabularios diferentes.

**Atributos:** +2 INT, +1 SAB

**Habilidades Raciais:**

**Mente Alquímica:** *Passivo permanente.* *Efeito:* +4 em Forrageio para identificar e combinar propriedades de ingredientes. *Na mesa:* gnomo maximiza valor de cada monstro morto — descobre sinergias de poção e mutação que outras raças perdem.

**Pocioneiro Nato:** *Gatilho:* ao criar poção com ingredientes de monstro. *Efeito:* resultado sempre **uma categoria acima** do normal (Comum → Incomum, etc.). *Na mesa:* farm de consumíveis superior; grupo depende do gnomo para buffs pré-boss.

**Identificação Instantânea:** *Ação.* *Efeito:* identifica substância, veneno, poção ou ingrediente com Arcana CD 10. *Na mesa:* loot seguro — não bebe frasco desconhecido às cegas; acelera triagem após combate.

**Laboratório Portátil:** *Passivo.* *Efeito:* processa ingrediente bruto em componente alquímico estável em 10 min. *Na mesa:* crafting em campo entre andares; menos deterioração de partes raras.

**Resistência Mágica:** *Passivo.* *Efeito:* Vantagem em testes contra magias e efeitos mágicos. *Na mesa:* sobrevive melhor a rajadas de mago inimigo; pode ficar na retaguarda exposta sem derreter.

**Tamanho Pequeno:** *Passivo.* *Efeito:* mesmo benefício do Halfling em espaços apertados. *Na mesa:* exploração em galerias estreitas; combina com furtividade e posicionamento.

**Progressao Racial:**

| Nivel | Bonus |
|-------|-------|
| 4 | Poção Dupla — ao criar uma poção, cria duas automaticamente com os mesmos ingredientes |
| 6 | Estabilizador de Veneno — pode neutralizar qualquer veneno de monstro sem teste |
| 8 | Formula Secreta — cria uma poção exclusiva (efeito customizado, discutido com o Mestre) |
| 10 | Concentracao Arcana — pocoes criadas pelo Gnomo tem duração dobrada |
| 12 | Catalise Elemental — ao combinar ingredientes de dois tipos diferentes, pode criar efeitos hibridos |
| 14 | +2 em Coccao permanente |
| 16 | Grande Obra — uma vez por mes, cria uma Poção Lendaria usando ingredientes de Boss |
| 18 | Digestão Arcana — pode consumir qualquer poção como refeicao |
| 20 | Pedra Filosofal Pessoal — transmuta qualquer ingrediente em qualquer outro de mesma raridade uma vez por semana |

---

## MEIO-HUMANO — AS NOVE LINHAGENS

**Lore:** Ha geracoes, em Eldarin, cruzamentos entre humanos e criaturas da masmorra — sejam por magia selvagem, por mutacoes biomágicas acumuladas em familias que comiam certos monstros por séculos, ou por eventos que os historiadores preferem não documentar — criaram linhagens que persistiram. Os Meio-Humanos não sao monstros nem sao humanos puros: sao algo terceiro, portando fisica e instinto bestial dentro de uma mente humana.

**Regra de Linhagem:** Ao criar um Meio-Humano, escolhe-se uma das 9 Linhagens. Essa escolha e permanente.

**Atributos Comuns:** +1 CON (resistência hibrida), +1 em dois atributos definidos pela linhagem.

**Habilidades Comuns a Todos os Meio-Humanos:**

**Herança Bestial:** *Gatilho:* ação bônus. *Recarga:* 1× por dia. *Duração:* 1 minuto (10 rodadas). *Efeito:* ativa o **Instinto** da linhagem (lista abaixo em cada linhagem) — bônus de combate temporários que transformam o personagem em predador. *Na mesa:* botão de “modo combate” racial, comparável em cadência à **Fúria** do Bárbaro, mas com efeitos únicos por animal; use no burst de dano ou para reposicionar (velocidade, voo, visão).

**Olfato Aguçado:** *Passivo.* *Efeito:* detecta criaturas ocultas ou camufladas pelo cheiro num raio de 9 m (sem teste). *Na mesa:* counter de invisibilidade e emboscada; sinergia com Ladino e atiradores que precisam revelar alvos.

**Corpo Resistente:** *Passivo.* *Efeito:* resistência ou imunidade a uma condição definida pela linhagem (Prostrado, Paralisia, lentidão, etc.). *Na mesa:* define qual controle inimigo você ignora — escolha de linhagem é escolha de matchup.

**Instinto (durante Herança Bestial):** cada linhagem lista um efeito extra enquanto Herança Bestial estiver ativa. Trate como upgrade do estado — não é habilidade separada com recarga própria.

### Linhagem do Gato

"Eles não caem. Nunca vi um Meio-Gato cair de verdade."

Atributos: +2 DES, +1 SAB. Tracos Fisicos: Pupilas verticais, orelhas levemente pontudas, reflexo pupilar no escuro.

**Habilidades da linhagem:**

**Aterrissagem Felina:** *Passivo.* *Efeito:* imune a dano de queda até 18 m; sempre cai de pé. *Na mesa:* mobilidade vertical — salta de galerias superiores, reposiciona sem gastar PA em escalada; ideal assassino/arqueiro.

**Visão Noturna:** *Passivo.* *Efeito:* visão perfeita no escuro 18 m. *Na mesa:* combate e exploração noturna sem penalidade.

**Reflexos de Predador:** *Passivo.* *Efeito:* +3 Iniciativa; nunca surpreendido em combate. *Na mesa:* age primeiro, prepara emboscada ou foge antes do cerco fechar.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* velocidade +6 m; pode se mover por tetos e paredes. *Na mesa:* flanqueamento tridimensional — ignora linha de bloqueio no chão; Ladino/Guerreiro ágil devastador.

**Resistência:** *Passivo.* *Efeito:* imune a Prostrado involuntário. *Na mesa:* não cai de derrubar/golpe de impacto inimigo.

| Nivel | Bonus |
|-------|-------|
| 4 | Garras Retrateis — ataques desarmados causam 1d6 cortante |
| 8 | Furtividade Felina — Vantagem em todos os testes de Furtividade em superficies naturais |
| 12 | Sete Vidas — ao ser reduzido a 0 HP, rola CON CD 13; sucesso: fica a 1 HP (max 3x por campanha) |
| 16 | Predador Perfeito — acertos críticos em 19-20 enquanto Heranca Bestial ativa |
| 20 | Forma de Felino — transforma-se em felino de medio porte 1x/dia por 1 hora |

### Linhagem da Cobra

"Nunca vi um inimigo que soubesse de onde o golpe vinha."

Atributos: +2 DES, +1 INT. Tracos Fisicos: Pupilas elipticas douradas, lingua ligeiramente bifurcada, escamas finas imperceptiveis no pescoco e ombros.

**Habilidades da linhagem:**

**Visão Térmica:** *Passivo.* *Efeito:* enxerga criaturas de sangue quente até 9 m através de paredes finas. *Na mesa:* detecta emboscadas atrás de porta/parede; marca alvos para o grupo sem abrir passagem.

**Flexibilidade Óssea:** *Passivo.* *Efeito:* passa por aberturas de 15 cm; imune a agarramento. *Na mesa:* infiltração extrema e escape de grapple — não fica preso no tanque inimigo.

**Veneno Natural:** *Ação bônus (mordida).* *Efeito:* +1d4 veneno; CD 12 CON ou Envenenado 1 h (CD sobe com marcos). *Na mesa:* DPS gradual e debuff em alvo único; combina com agarramento da Constrição (nv. 8).

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* visão térmica 18 m atravessa paredes. *Na mesa:* wallhack tático — coordena ataques à distância e magias de área sem visão direta.

**Resistência:** *Passivo.* *Efeito:* Vantagem contra Paralisia e Petrificação. *Na mesa:* counter de medusas, gorgons e magias de imobilização.

| Nivel | Bonus |
|-------|-------|
| 4 | Veneno Aprimorado — CD aumenta para 14, duração para 2 horas |
| 8 | Constricao — em agarramento, causa 2d6 de esmagamento automaticamente por turno |
| 12 | Desprendimento — pode sair de qualquer restricao como ação bonus, sem teste |
| 16 | Veneno Paralisante — o veneno causa Paralisia por 1 turno (CD 17) |
| 20 | Olhar de Hipnose — como acao, forca SAB CD 16 ou alvo fica Encantado por 1 minuto |

### Linhagem do Urso

"Quando ele agarrou o Wyvern pelo pescoco e simplesmente não soltou, entendi que ia dar certo."

Atributos: +2 FOR, +2 CON (substituem o +1 CON base). Tracos Fisicos: Constituicao visivelmente mais larga, pelos mais grossos, unhas espessas.

**Habilidades da linhagem:**

**Abraço de Urso:** *Gatilho:* ao iniciar agarramento. *Efeito:* 2d6+FOR de dano; CD 16 para escapar. *Na mesa:* lockdown de alvo prioritário — segura caster ou atirador enquanto aliados focam.

**Destroçar:** *Gatilho:* ataque adicional em alvo agarrado ou adjacente. *Efeito:* golpe contundente que **ignora 5 de CA**. *Na mesa:* quebra armadura pesada e monstros com CA alta; sinergia com Bárbaro/Gladiador.

**Constituição Brutal:** *Passivo permanente.* *Efeito:* +3 HP por nível. *Na mesa:* tanque natural — maior pool que outras linhagens; aguenta foco de elite.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* FOR +4; agarramentos irresistíveis contra criaturas de tamanho igual ou menor. *Na mesa:* modo “boss grab” — remove inimigo médio do combate por rodadas inteiras.

**Resistência:** *Passivo.* *Efeito:* resistência a dano contundente. *Na mesa:* mitiga socos, quedas e ataques de ogros.

**Fúria Bestial (nv. 16):** *Gatilho:* ao ativar Herança Bestial (não gasta uso extra). *Duração:* enquanto Herança Bestial durar. *Efeito:* +2 dano em ataques corpo a corpo de Força, Vantagem em testes de FOR e CON, resistência a cortante/contundente/perfurante — **mesmo pacote mecânico da Fúria do Bárbaro**, mas só durante Herança Bestial. *Na mesa:* burst de tanque-dps; Urso nv. 16 é a única linhagem com “Fúria” racial explícita.

| Nivel | Bonus |
|-------|-------|
| 4 | Pele Grossa — +1 CA natural permanente |
| 8 | Rugido de Intimidacao — acao, CD 14 SAB em área de 6m ou Amedrontado por 1 minuto |
| 12 | Hibernação Rápida — descanso longo em 4 horas, recupera HP adicionais iguais ao dobro do nivel |
| 16 | Fúria Bestial — durante Herança Bestial: +2 dano melee FOR, Vantagem em FOR/CON, resistência física (como Fúria do Bárbaro) |
| 20 | Força de Titan — durante Heranca Bestial, FOR temporáriamente 26 (+8), conta como Enorme para agarramento |

### Linhagem do Tigre

"Tres metros. Do repouso ao pescoco do Drake em tres metros."

Atributos: +2 DES, +2 FOR (substituem o +1 CON base). Tracos Fisicos: Listras tigradas sutis, musculatura incrivelmente densa, dentes caninos levemente mais longos.

**Habilidades da linhagem:**

**Mordida de Tigre:** *Ação bônus.* *Efeito:* 2d8+FOR perfurante + agarramento automático. *Na mesa:* abertura de combo — morde e segura; alimenta Rip and Tear (nv. 12) e Investida (nv. 8).

**Explosão Muscular:** *Gatilho:* 1× por turno. *Efeito:* dobra deslocamento naquele turno. *Na mesa:* reposicionamento explosivo para flanco ou retirada; gasta pouco PA se movimento for separado de ataque.

**Velocidade Felina:** *Passivo.* *Efeito:* deslocamento base 12 m (em vez de 9 m). *Na mesa:* sempre na melhor posição de flanco; ativa Investida Fulminante com menos PA.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* velocidade 18 m; 1 ataque extra como ação bônus por turno; primeira mordida causa **dano triplo**. *Na mesa:* assassino de alvo único — alpha strike no início do estado; parecido com Fúria + Ataque Extra, mas 1×/dia.

**Resistência:** *Passivo.* *Efeito:* Vantagem contra lentidão e redução de velocidade. *Na mesa:* ignora terreno difícil mágico e web; mantém pressão no alvo.

| Nivel | Bonus |
|-------|-------|
| 4 | Salto Predatorio — pode saltar horizontalmente 9m como parte do movimento |
| 8 | Investida Fulminante — se mover pelo menos 6m antes de atacar, dano dobrado |
| 12 | Rip and Tear — mordida em alvo ja agarrado causa hemorragia (2d4 dano/turno até curado) |
| 16 | Velocidade Impossivel — durante Heranca Bestial, velocidade 24m, não provoca ataques de oportunidade |
| 20 | Apex Predator — ao matar uma criatura, recupera a ação de ataque imediatamente |

### Linhagem da Aguia

"Ela apontou para um ponto no escuro e disse 'Goblin, 80 metros, atras da terceira coluna'. Tinha razao."

Atributos: +2 DES, +1 SAB. Tracos Fisicos: Olhos dourados ou ambar com pupilas precisas, ossos levemente mais leves, cabelos rigidos com textura proxima a penas.

**Habilidades da linhagem:**

**Visão de Águia:** *Passivo.* *Efeito:* enxerga até 1,5 km; sem penalidade em ataques à distância por alcance ou névoa leve. *Na mesa:* atirador supremo em masmorras abertas — sniper de boss antes do combate corpo a corpo.

**Planar Livremente:** *Passivo.* *Efeito:* ao cair, desce no máximo 3 m por turno; deslocamento horizontal 12 m/turno enquanto plana. *Na mesa:* mobilidade aérea parcial antes do nv. 8; evita dano de queda e reposiciona sobre obstáculos.

**Percepção Predatória:** *Passivo.* *Efeito:* +4 Percepção; detecta movimento a 300 m. *Na mesa:* batedor de expedição — avisa emboscadas longe; economiza PA de movimento exploratório.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* asas completas; voo 15 m/turno; ataques aéreos em Vantagem. *Na mesa:* bypass de linha de frente — foca casters traseiros; counter de melee sem provocar oportunidade (nv. 16 Tigre é melhor em chão, Águia no ar).

**Resistência:** *Passivo.* *Efeito:* imune a Cegueira por ventos ou partículas. *Na mesa:* combate em ambientes com fumaça, areia ou pó sem perder precisão.

| Nivel | Bonus |
|-------|-------|
| 4 | Garras de Talao — ataques desarmados causam 1d8 cortante |
| 8 | Voo Controlado — planar torna-se voo parcial (sobe até 3m/turno) |
| 12 | Mergulho em Queda Livre — dano triplo no primeiro ataque após cair pelo menos 9m |
| 16 | Olhos de Caça — vantagem em ataques contra alvos observados por 1 turno |
| 20 | Senhor dos Ceus — Heranca Bestial concede asas permanentes de alta manobrabilidade (voo 18m) + mapa mental do andar atual |

### Linhagem do Lobo

"O problema não era ele. Era que ele sabia exatamente onde estávamos o tempo todo."

Atributos: +1 FOR, +1 DES, +1 SAB. Tracos Fisicos: Olhos palidos (ambar, cinza ou azul-gelo), cabelos densos, audicao visivelmente agucada.

**Habilidades da linhagem:**

**Rastreamento Infalível:** *Passivo.* *Efeito:* rastreia qualquer criatura pelo cheiro das últimas 24 h sem teste. *Na mesa:* perseguição narrativa e mecânica — não perde alvo fugitivo no mesmo andar (reforçado no nv. 16).

**Uivo Tático:** *Ação.* *Recarga:* conforme Mestre (tipicamente 1×/combate). *Efeito:* aliados +2 em ataques no próximo turno e conhecem posição do inimigo mais próximo. *Na mesa:* buff de grupo pré-alpha — coordena foco sem magia.

**Tática de Matilha:** *Passivo.* *Efeito:* Vantagem em ataques se aliado adjacente ao mesmo alvo. *Na mesa:* incentiva formação de flanco; sinergia com Guerreiro na linha de frente.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* identifica automaticamente os 3 alvos com menor HP; +2d6 dano contra eles. *Na mesa:* executor de limpeza — elimina adds feridos e acelera fim de combate.

**Resistência:** *Passivo.* *Efeito:* imune a se perder em qualquer ambiente. *Na mesa:* navegação infalível — grupo não perde tempo em labirintos (exploração).

| Nivel | Bonus |
|-------|-------|
| 4 | Mordida de Alcateia — ao atacar junto com um aliado no mesmo turno, a mordida causa dano adicional igual ao dado de ataque do aliado |
| 8 | Visao Noturna de Predador — visao perfeita no escuro até 24m |
| 12 | Lider de Matilha — aliados adjacentes ganham +1 em todos os testes quando acima de 50% HP |
| 16 | Caça Implacável — uma vez que rastreia um alvo, não pode ser impedido de encontra-lo no mesmo andar |
| 20 | Espirito do Lobo — Heranca Bestial convoca 1d4 lobos espectrais (30 HP cada, ataques 2d6) |

### Linhagem do Tubarao

"Ele sentiu o sangue antes de a porta abrir."

Atributos: +2 FOR, +1 CON. Tracos Fisicos: Dentes levemente mais duros, pele com textura aspera ao toque, membrana nictitante raramente visivel.

**Habilidades da linhagem:**

**Faro de Sangue:** *Passivo.* *Efeito:* detecta criaturas com HP < 50% num raio de 30 m, através de paredes. *Na mesa:* radar de execução — sabe quando boss entra em fase fraca; prioriza alvos sem Percepção ativa.

**Frenesi Sanguinário:** *Passivo.* *Efeito:* +2 em ataques e +1d8 dano contra alvos com HP < 50%. *Na mesa:* DPS que escala no fim do combate — deixa boss para outros e limpa adds feridos.

**Natação Perfeita:** *Passivo.* *Efeito:* nado 15 m; respiração subaquática indefinida; sem penalidade em combate aquático. *Na mesa:* dono de cenários inundados — única linhagem que não sofre em água.

**Mordida Dilacerante:** *Ação bônus.* *Efeito:* 2d8+FOR perfurante; em crítico, hemorragia 3d6/turno até cauterizar. *Na mesa:* bleed stack em alvo único; pressão constante de PA inimigo em cura.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* Frenesi ativa em alvos < 75% HP; mordida causa **dano dobrado**. *Na mesa:* modo caçador — ative quando boss já foi erosionado; burst de finalização.

**Resistência:** *Passivo.* *Efeito:* imune a debuffs em ambientes aquáticos. *Na mesa:* ignora lentidão, frio e pressão subaquática mágica.

| Nivel | Bonus |
|-------|-------|
| 4 | Couro de Tubarao — +1 CA natural; ataques cortantes causam 1 de dano ao atacante |
| 8 | Sensor de Pressao — detecta movimentos na agua ou no solo a 30m |
| 12 | Nao Para de Mover — regeneração de 5 HP/turno se mover pelo menos 3m por turno |
| 16 | Predador do Abismo — imune a Medo quando em combaté contra inimigos com HP reduzido |
| 20 | Rei das Profundezas — criaturas aquaticas de CR menor que 10 não atacam o personagem voluntariamente |

### Linhagem do Corvo

"Ela sabia o nome de todos no grupo. Havia nos visto uma vez, ha dois anos."

Atributos: +2 INT, +1 CAR. Tracos Fisicos: Cabelos invariavelmente negros com reflexo azulado, olhos escuros que refletem luz de forma incomum, movimentos de cabeca levemente angulares.

**Habilidades da linhagem:**

**Memória Absoluta:** *Passivo.* *Efeito:* lembra perfeitamente tudo que viu ou ouviu; detecta inconsistências em informações automaticamente. *Na mesa:* investigação e lore — não esquece pistas; counter de NPCs mentirosos.

**Presença Enigmática:** *Passivo.* *Efeito:* +3 Persuasão e Intimidação quando possui informação que o alvo ignora que você tem. *Na mesa:* face social do grupo — negociação, interrogatório e blefe informado.

**Voo de Corvo:** *Ação.* *Recarga:* 1× por descanso curto. *Duração:* 10 min em forma de corvo. *Na mesa:* reconhecimento seguro — espiona sala sem combate; mensagens (rede nv. 8).

**Colecionador de Segredos:** *Gatilho:* 1 min observando local sem ser detectado. *Efeito:* revela o segredo mais relevante (Mestre). *Na mesa:* bypass de dungeon puzzle — acha alavanca, baú ou emboscada antes de gastar PA.

**Instinto (Herança Bestial):** *Durante 1 min.* *Efeito:* Vantagem em **todos** os testes de INT e SAB. *Na mesa:* modo analista — magias, Arcana, Percepção e investigação em combate (ex.: identificar fraqueza nv. 12).

**Resistência:** *Passivo.* *Efeito:* imune a Encantamento. *Na mesa:* tanque mental absoluto contra controle social.

| Nivel | Bonus |
|-------|-------|
| 4 | Enganador Nato — Vantagem em testes de Enganação e Percepção para detectar mentiras |
| 8 | Rede de Corvos — pode enviar mensagens atraves de corvos por até 100km |
| 12 | Analise de Combaté — ao observar um inimigo por 1 turno, identifica sua maior fraqueza |
| 16 | Memoria de Batalha — imune a qualquer armadilha ou truque que ja tenha visto uma vez |
| 20 | Mente Mestra — durante Heranca Bestial, pode reescrever a ação de um aliado que acabou de falhar (age novamente com Vantagem) |

---

## FORJADO DE OSSO

**Lore:** Ha duzentos anos, os Anaos de Forja enfrentaram um problema etico: como criar um guardiao que não precisasse comer, não sentisse medo e não desobedecesse? A resposta foi os Forjados de Osso — construtos montados com ossos de monstros poderosos, articulados com metal anao, animados por um Nucleo de Alma instalado onde estaria o coracao.

O problema surgiu na terceira geração: eles começaram a ter opiniões. Ninguem sabe ao certo quando um Forjado de Osso adquire consciência plena. Os Forjados de Osso conscientes que habitam Valdremor sao considerados legalmente pessoas — mas de segunda classe, sem direito a propriedade ou voto. Dentro das masmorras, ninguem se importa com isso.

Um Forjado de Osso e feito de peças de monstros diferentes — cada exemplar e único. Alguns tem maxilares de Wyvern. Outros tem caixas torácicas de Basilisco. Essa composicao não e apenas estética: ela determina bônus passivos que variam por personagem.

**Atributos:** +2 CON, +1 FOR ou INT (escolha)

**Habilidades Raciais:**

**Construto Vivo:** *Passivo.* *Efeito:* não precisa respirar, comer ou dormir; imune a Veneno e doenças; imune a Encantado. *Na mesa:* vigia eterno, exploração em gás/água sem penalidade; ignora controle mental — tanque confiável contra feiticeiros.

**Núcleo de Alma:** *Gatilho:* ao chegar a 0 HP. *Duração:* Incapacitado mas estável 1d4 h (1d4 **turnos** em combate no nv. 8). *Efeito:* depois reinicia com 1 HP. *Destruição do Núcleo (narrativo):* morte permanente. *Na mesa:* “segunda vida” — não cai no chão como morte instantânea; grupo tem janela para proteger corpo; diferente de Determinação (1 HP imediato).

**Composição de Monstros:** *Gatilho:* criação do personagem (2 partes; +1 no nv. 4 e 14). *Efeito:* cada parte concede bônus passivo da tabela abaixo. *Na mesa:* customização total — mesmo “raça” pode ser tanque (Dragão+Troll), scout (Basilisco+Grifo) ou vampírico (Dente de Vampiro).

**Manutenção:** *Gatilho:* em vez de descanso longo. *Efeito:* 1 h com Artífice restaura como descanso longo. *Penalidade:* sem manutenção 48 h, −1 em todos os testes (cumulativo). *Na mesa:* dependência de grupo/PNJ — fraco em expedições isoladas; forte em base com artífice.

**Sem Bônus Culinários Passivos:** *Passivo.* *Efeito:* mutações exigem instalar componente no corpo (1 h; 10 min no nv. 10); duração 48 h (12 h no nv. 16). *Na mesa:* culinária mais lenta que orgânicos, mas mutações duram mais — planejamento pré-combate.

**Tabela de Partes de Monstros:**

| Parte | Habilidade | Na mesa |
|-------|-----------|---------|
| Osso de Dragão | +2 CA natural | Tanque — reduz hits que passam; stack com armadura. |
| Mandíbula de Wyvern | Mordida 2d6 perfurante + veneno (CD 13) | DPS corpo a corpo + debuff; ação bônus de mordida. |
| Garra de Grifo | Escalar superfícies sem teste | Mobilidade 3D; ignora custo de escalada em PA. |
| Costela de Troll | Regeneração 3 HP/turno | Sustain em combates longos; sinergia com foco inimigo. |
| Crânio de Basilisco | Vê auras mágicas e invisíveis | Counter invisibilidade; revela armadilhas mágicas. |
| Espinha de Hidra | +10 HP máx.; em 0 HP, CON CD 14 → 1 HP | Pool extra + terceira camada de sobrevivência. |
| Fêmur de Gigante | Conta como Grande para agarramento | Controle de campo — agarra humanoides Médios. |
| Escama de Elemental | Resistência a um elemento (escolha) | Matchup elemental — fogo, gelo, etc. |
| Dente de Vampiro | Ataques corpo a corpo curam 2 HP/acerto | Sustain ofensivo — menos dependência de cura. |

**Progressao Racial:**

| Nivel | Bonus |
|-------|-------|
| 4 | Upgrade de Componente — pode adicionar uma 3a parte de monstro a composicao |
| 6 | Amortecimento de Impacto — resistência a dano contundente |
| 8 | Processamento Avancado — modo de emergencia reinicia em 1d4 turnos em combaté |
| 10 | Instalacao Rápida — instala componentes em 10 minutos em vez de 1 hora |
| 12 | Estrutura Reforcada — +2 CA permanente adicional |
| 14 | Quarta Parte — adiciona uma 4a parte de monstro a composicao |
| 16 | Nucleo Aprimorado — pode consumir ingredientes normalmente sem instalacao (mutação dura 12h) |
| 18 | Autoreparo — como acao, gasta um componente armazenado para recuperar 4d8 HP |
| 20 | Obra-Prima dos Anaos — pode substituir qualquer parte do proprio corpo após um Banquete Lendário |


---

# PARTE IV — CLASSES E SUBCLASSES

---

## CAPÍTULO 4 — AS NOVE CLASSES BASE

Cada classe define o papel de combaté no Nivel 1 e o **Bônus Passivo de Sobrevivência** — a vantagem passiva que qualquer boa refeicao ativa, independente do tipo de monstro. No **Nivel 2**, o personagem escolhe sua **Subclasse (Caminho de Assimilação)**.

**PA na mesa digital:** todas as classes comecam com **5 PA** (Cap. 2.6). **Guerreiro** paga **1 PA por golpe** de Ataque Extra a partir do nv. 5. **Mago, Clérigo, Druida, Bardo e Artifice** ganham **Afinidade Arcanica** no nv. 5 (magias caras −1 PA). Demais classes usam o custo do compendio, modificados pelos talentos do Cap. 12.0.

---

### GUERREIRO

Dado de HP: 1d10 | Atributos Primarios: Força ou Destreza
Proficiencias: Todas as armaduras, todos os escudos, todas as armas
Atributos Culinarios Iniciais: Extração +3, Fortitude +2

**Bônus Passivo de Sobrevivência (Nivel 1):**
Metabolismo Focado — Apos uma Refeicao Comum ou melhor, ganha Vantagem em testes de Força e Atletismo até o próximo descanso longo.

**Tabela de Progressao:**

| Nivel | HP | Ataque Extra | Habilidades Notaveis |
|-------|-----|-------------|---------------------|
| 1 | 10+CON | — | Segundo Folego, Estilo de Combaté |
| 2 | +6 | — | Subclasse, Bonus de Passivo de Assimilação |
| 5 | +6 | 2 ataques/acao | Ataque Extra · **+1 PA max** · 1 PA/golpe |
| 11 | +6 | 3 ataques/acao | Ataque Extra Adicional |
| 17 | +6 | 4 ataques/acao | Ataque Extra Maximo |
| 20 | +6 | 4 ataques | Campeao Implacável (+1 Resistência Lendaria/dia) |

**PA (VTT):** nv. 5+ cada golpe de arma na acao de Ataque custa **1 PA** (nao um unico PA para todos os golpes). Talentos: Cap. 12.0 (Guerreiro).

**Habilidades Base:**
- Segundo Folego (Nivel 1): Como ação bonus, recupera 1d10 + Nivel do Guerreiro em HP. 1 uso por descanso curto.
- Estilo de Combaté (Nivel 1): Escolha um: Duelo (+2 dano com arma de uma mao), Grande Arma (rolar dano minimo duas vezes, usar maior), Protecao (reacao: impoe Desvantagem a ataques contra aliado adjacente), Arqueria (+2 em ataques a distancia).
- Golpe de Veterano (Nivel 14): Acertos críticos em 19 ou 20.
- Campeao Implacável (Nivel 20): Uma vez por dia, pode declarar falha como sucesso num teste de resistência.

**Subclasses do Guerreiro:**

Caçador de Feras (Especialidade: Feras e Bestiais): Ao comer carne vermelha de feras, ganha +2 FOR e regeneração de 3 HP/turno por 4h. *Caminho de talentos: Cap. 12.*

Quebrador de Carapaças (Especialidade: Carapaças e Insetoides): Ao comer artropodes, pele endurece — imunidade temporária a acertos críticos e +2 CA por 8h. *Caminho de talentos: Cap. 12.*

Cavaleiro Draconico (Especialidade: Escamosos e Draconideos): Consumir repteis ou draconicos concede resistência elemental e baforada curta (2d6). *Caminho de talentos: Cap. 12.*

Sentinela das Profundezas (Especialidade: Aquaticos e Anfibios): Comer monstros aquaticos concede respiração aquatica, nado de 12m/turno e pele escorregadia por 8h. *Caminho de talentos: Cap. 12.*

---

### PATRULHEIRO

Dado de HP: 1d10 | Atributos Primarios: Destreza e Sabedoria
Proficiencias: Armaduras leves e medias, escudos, armas simples e marciais
Atributos Culinarios Iniciais: Forrageio +3, Extração +2

**Bônus Passivo de Sobrevivência (Nivel 1):**
Estômago Selvagem — Nao sofre penalidades ao consumir alimentos crus, semi-preparados ou de qualidade duvidosa. Pode comer no campo sem fogueira sem risco.

**Subclasses do Patrulheiro:**

Caçador do Céu (Especialidade: Aves e Voadores): Comer monstros alados afia a visao no escuro (perfeita até 36m) e aumenta alcance de ataques em +9m por 8h. *Caminho de talentos: Cap. 12.*

Explorador de Esporos (Especialidade: Flora e Fungos): Imunidade a controle mental, ataques toxicos passivos e nuvens de esporos curativos no descanso por 12h. *Caminho de talentos: Cap. 12.*

Rastreador de Escamas (Especialidade: Repteis e Basiliscos): Imunidade a petrificação e camuflagem de pele ativa (Advantage em Furtividade em terrenos rochosos) por 8h. *Caminho de talentos: Cap. 12.*

Mestre de Enxame (Especialidade: Pragas e Insetos Menores): Conexao telepatica com insetos locais — detecta vibracoes no chao a 15m e localiza inimigos invisiveis. *Caminho de talentos: Cap. 12.*

---

### LADINO

Dado de HP: 1d8 | Atributos Primarios: Destreza e Inteligencia
Proficiencias: Armaduras leves, armas simples, espadas curtas, bestas de mao, rapiers
Atributos Culinarios Iniciais: Extração +4, Forrageio +2

**Bônus Passivo de Sobrevivência (Nivel 1):**
Digestão Rápida — Uma refeicao antes da batalha concede +6m de deslocamento e Vantagem em Iniciativa no primeiro turno de qualquer combate.

**Ataque Furtivo:** Causa dano bônus (1d6 no nivel 1, crescendo até 10d6 no nivel 20) ao atacar com Vantagem ou quando um aliado esta adjacente ao alvo.

**Subclasses do Ladino:**

Sombra Etérea (Especialidade: Espirituais): Comer ectoplasma permite ficar intangivel por 1 turno uma vez por combate, e adiciona +1d6 necrótico a ataques furtivos. *Caminho de talentos: Cap. 12.*

Forma Amorfa (Especialidade: Amorfos e Slimes): Corpo ganha elasticidade anormal — passa por frestas de 15cm, escapa de qualquer agarramento automaticamente, resistência a ácido. *Caminho de talentos: Cap. 12.*

Ladrao de Glandulas (Especialidade: Peconhentos): Bebendo veneno purificado, ataques ganham dano venenoso passivo (+1d4) e saliva torna-se corrosiva. *Caminho de talentos: Cap. 12.*

Corsario de Cripta (Especialidade: Osseos e Mortos-Vivos Corporeos): Resistência a dano necrótico e capacidade de fingir de morto perfeitamente (zerando aggro). *Caminho de talentos: Cap. 12.*

---

### MAGO

Dado de HP: 1d6 | Atributos Primarios: Inteligencia
Proficiencias: Adagas, dardos, fundas, cajados, bestas leves
Atributos Culinarios Iniciais: Coccao +4, Forrageio +3

**Bônus Passivo de Sobrevivência (Nivel 1):**
Mente Nutrigena — Consumir qualquer ingrediente magico (lodo elemental, glândula de mana, cristal de monstro) restaura 1 espaco de feitico de nivel baixo.

**Subclasses do Mago:**

Piromante das Brasas (Especialidade: Calor e Assados): Refeicoes assadas pelo Mago maximizam a Mana do grupo; feiticos de fogo dispensam componentes e causam +1d6 em criaturas de Gelo/Agua.

Criomante de Conservacao (Especialidade: Gelo e Dry-Aged): Carnes envelhecidas mágicamente no gelo concedem aura congelante passiva (1d4 frio a adjacentes) e escudos de gelo (+3 CA temporária).

Mago Alquímico (Especialidade: Tempo e Bacterias): Pratos fermentados garantem imunidade a ilusao e curam doenças/maldicoes do grupo.

Alquimista Ácido (Especialidade: Ácidos e Liquidos): Sopas densas de monstro permitem regurgitar ácido (2d6) ou expelir nevoa venenosa (CD 13 CON ou Envenenado) em combate.

Mago dos Encantos (Especialidade: Doces Magicos): Dieta rica em glicose arcana concede feiticos de encantamento e confusao de graça (sem espaco de magia) uma vez por dia.

**PA (VTT):** nv. 5 **Afinidade Arcanica** (magias 2+ PA −1). Talentos de trilha reduzem PA de magias por elemento ou area — Cap. 12.0 (Mago).

---

### CLERIGO

Dado de HP: 1d8 | Atributos Primarios: Sabedoria e Carisma
Proficiencias: Armaduras leves e medias, escudos, armas simples
Atributos Culinarios Iniciais: Forrageio +4, Fortitude +3

**Bônus Passivo de Sobrevivência (Nivel 1):**
Comunhao Material — Toda vez que se alimenta de qualquer refeicao, recebe HP Temporarios igual ao nivel do Clérigo vezes 2.

**Subclasses do Clérigo:**

Sacerdote da Purificacao (Especialidade: Amaldicados e Infectados): Carnes purificadas por reza concedem +3 em ataques contra o mal e curam maldicoes ativas no grupo após a refeicao.

Monge Ascético (Especialidade: Energia Interna): Lutar de barriga vazia por 8h+ concede +4 em esquiva e dano radiante. Quando finalmente come, libera onda de choque (3d8 radiante, área 6m).

Clérigo do Pao da Vida (Especialidade: Flora Divina): Transforma musgos e plantas em paes que fornecem HP Temporario extra (Nivel x3) a todo o grupo a cada manha.

Pastor de Quimeras (Especialidade: Monstros Mistos): Ao consumir bestas mágicas complexas, canaliza aura do animal para o grupo (ex: Aura do Leao — aliados adjacentes tem Vantagem em ataques).

Clérigo do Limiar (Especialidade: Mortos-Vivos Corporeos e Carnes Necroticas): Ao comer carne ossea ou de morto-vivo corporeo (rito de Limiar), resistência a necrótico e mortos-vivos com INT 3 ou menos não te escolhem como primeiro alvo até você ataca-los ou lancar necromancia hostil. *Caminho de talentos: Cap. 12 (Trilha Necromantica).*

**PA (VTT):** nv. 5 **Afinidade Arcanica**. Talentos de cura, area e necrotico — Cap. 12.0 (Clérigo).

---

### BARBARO

Dado de HP: 1d12 | Atributos Primarios: Força e Constituicao
Proficiencias: Armaduras leves e medias (não pesadas), escudos, todas as armas
Atributos Culinarios Iniciais: Fortitude +4, Extração +2

**Bônus Passivo de Sobrevivência (Nivel 1):**
Sede de Sangue — Consumir carne crua ou o coracao de um monstro recem-abatido (ação bônus) cura 1d8+CON em HP e estende a duração da Furia em 2 turnos.

**Furia:** Como ação bonus, entra em Furia por 1 minuto. Durante a Furia: +2 dano em ataques de Forca, Vantagem em testes de Força e CON, resistência a dano contundente/cortante/perfurante. Usos: 2 no Nivel 1, crescendo com o nivel.

**Subclasses do Bárbaro:**

Devorador de Coracoes (Especialidade: Orgaos Vitais de Predadores): Ao comer coracao do monstro, assimila um traco instintivo (faro, garras, regeneração) por 24h correspondente ao monstro consumido.

Mandibula de Ferro (Especialidade: Ossos e Carapaças): Mastigar exoesqueletos concede +1d6 dano perfurante em ataques desarmados (estilhacos entre os punhos).

Colosso do Gelo (Especialidade: Gordura e Monstros Gigantes): Imunidade a dano de frio e ignora penalidades de Exaustao ao estocar calorias de criaturas gordurosas. Pode reservar uma refeicao para dias sem comer.

Frenetico do Acucar (Especialidade: Doces Magicos e Slimes de Fruta): Velocidade de movimento dobra e ganha Acao Bonus extra ao consumir glicose mágica, mas sofre crash (Nivel 1 de Exaustao) quando o efeito acaba.

**PA (VTT):** custo padrao do compendio; talentos *Rush Doce*, *Mordida do Coracao*, +PA max — Cap. 12.0 (Bárbaro).

---

### BARDO

Dado de HP: 1d8 | Atributos Primarios: Carisma e Destreza
Proficiencias: Armaduras leves, armas simples, algumas marciais, todos os instrumentos musicais
Atributos Culinarios Iniciais: Forrageio +5, Coccao +2

**Bônus Passivo de Sobrevivência (Nivel 1):**
Harmonia de Sabores — Quando o Bardo come junto do grupo, a duração dos bônus de comida de todos os membros e estendida em 50%.

**Inspiracao de Bardo:** Como ação bonus, concede 1d6 de Inspiracao a um aliado. O aliado pode adicionar esse dado a qualquer teste. Evolui de 1d6 para 1d12 conforme o nivel.

**Subclasses do Bardo:**

Estratega de Masmorra (Especialidade: Fermentados e Liquidos Organicos): Bebidas emparelhadas com o prato correto maximizam os dados de cura de qualquer magia do Bardo pelas proximas horas.

Bardo Fermentador (Especialidade: Fungos e Levedura): Beber suas cervejas de fungo concede HP Temporario adicional (igual ao dado de Inspiracao atual) sempre que usa Inspiracao de Bardo.

Danciarino das Facas (Especialidade: Aves e Ingredientes Ageis): Carnes magras de aves permitem usar Carisma em vez de Destreza para atacar e recuperar facas de trinchar lancadas.

Cantor dos Venenos (Especialidade: Ervas e Plantas Magicas): Mastigar raizes picantes raras aumenta a CD de resistência dos feiticos de ilusao e encantamento em +3.

**PA (VTT):** nv. 5 **Afinidade Arcanica**. Talentos de magia, habilidade e area — Cap. 12.0 (Bardo).

---

### DRUIDA

Dado de HP: 1d8 | Atributos Primarios: Sabedoria
Proficiencias: Armaduras leves e medias (não metalicas), escudos não metalicos, armas simples não metalicas
Atributos Culinarios Iniciais: Forrageio +5, Extração +1

**Bônus Passivo de Sobrevivência (Nivel 1):**
Ciclo da Vida — Pode se alimentar de qualquer planta, raiz ou fungo venenoso da masmorra, convertendo o veneno em nutricao sem sofrer dano.

**Forma Selvagem:** Como acao, transforma-se em qualquer besta que ja tenha encontrado (HP máximo do animal, mantém INT e SAB). Usos e limites evoluem com o nivel.

**Subclasses do Druida:**

Circulo da Decomposicao (Especialidade: Fungos Necroticos e Lodo): Cogumelos necróticos concedem imunidade a necrótico e fazem magias de terra causarem envenenamento passivo.

Circulo do Superpredador (Especialidade: Carne Crua de Feras): Forma Selvagem ganha HP extra igual ao HP máximo do ultimo monstro grande consumido.

Circulo da Simbiose (Especialidade: Seiva e Sementes Magicas): Ingerir sementes mágicas cria armadura de vinhas viva sob a pele — rebaté dano cortante ao atacante (1d6 por ataque recebido).

Circulo do Solo Vivo (Especialidade: Minerais e Elementais de Terra): Mastigar pedras elementais concede resistência permanente a dano contundente enquanto dieta ativa.

**PA (VTT):** nv. 5 **Afinidade Arcanica**. *Forma Selvagem* e magias de trilha usam PA do compendio; talentos −PA — Cap. 12.0 (Druida).

---

### ARTIFICE

Dado de HP: 1d8 | Atributos Primarios: Inteligencia e Destreza
Proficiencias: Armaduras leves e medias, escudos, todas as ferramentas, armas simples e bestas
Atributos Culinarios Iniciais: Coccao +5, Extração +3

**Bônus Passivo de Sobrevivência (Nivel 1):**
Panela de Pressao — Utensilios criados pelo Artífice fazem qualquer ingrediente render o dobro de porcoes.

**Infusoes:** O Artífice pode criar Infusoes Magicas em itens mundanos — transformando uma espada comum em +1, ou uma mochila em extradimensional.

**Subclasses do Artífice:**

Ferreiro de Utensilios (Especialidade: Carapaças e Ingredientes Duros): Comer pratos feitos em panelas forjadas de exoesqueleto aumenta a CA das proprias armaduras em +2.

Engenheiro de Explosivos (Especialidade: Inflamaveis e Glandulas de Fogo): Consumir glândulas combustiveis concede resistência a Fogo e aumenta o dano de bombas e engenhocas em +2d6.

Biologo Alquimico (Especialidade: Ácidos e Venenos): Micro-doses de toxinas processadas garantem imunidade a envenenamento e a habilidade de revestir armas com ácido corrosivo (+1d6 ácido, 1 minuto).

Construtor de Armadilhas (Especialidade: Caça Intacta e Extracao Perfeita): Comer carne extraída sem dano de batalha concede Vantagem em todos os testes de INT e na criacao de invencoes por 24h.

**PA (VTT):** nv. 5 **Afinidade Arcanica**. Bombas, infusoes e habilidades de engenharia — custo no compendio; talentos −PA — Cap. 12.0 (Artifice).

---

# PARTE V — ALIMENTACAO E CULINARIA BIOMAGICA

---

## CAPÍTULO 5 — A NECESSIDADE DE COMER

Na masmorra, a fome não e um inconveniente — e uma mecanica.

**Frequencia:** Uma refeicao completa por dia e necessaria para evitar Exaustao.

**Exaustao por Fome:**
- Dia 1 sem comer: Nivel 1 de Exaustao (-2 em todas as rolagens)
- Dia 2 sem comer: Nivel 2 (-2 em velocidade)
- Dia 3+: Progressao até Nivel 6 (morte)

### 5.1 Estudo de Anatomia

Antes de extrair ingredientes de um monstro, o grupo pode fazer um Estudo de Anatomia.

- Qualquer personagem faz um teste de Inteligencia/Natureza contra a CD do monstro.
- CD = 10 + Nivel do monstro dividido por 2 (arredondado)
- Sucesso: O grupo mapeia a Anatomia daquela especie permanentemente. Futuras rolagens de Extração contra aquela especie tem Vantagem.
- Falha: Pode tentar novamente após matar 3 exemplares adicionais da mesma especie.

**Bonus de Anatomia por Classe:**
- Patrulheiro: +3 em testes de Anatomia de feras e bestiais
- Artífice Biologo Alquimico: +5 em testes de Anatomia de qualquer especie
- Druida: Automaticamente conhece anatomia de Flora e Fungos

### 5.2 Extracao de Ingredientes (Extração)

Apos matar um monstro, o grupo tem **1 hora** antes que a carne comece a degradar mágicamente.

| Dificuldade | CD de Extração | Resultado em falha |
|-------------|---------------|-------------------|
| Facil | 10 | Carne básica obtida, partes nobres destruidas |
| Medio | 14 | Metade dos ingredientes recuperados |
| Dificil | 17 | Apenas ingredientes basicos, sem glândulas |
| Especialista | 20 | Falha total — ingrediente perdido ou perigoso |

**Ferramentas de Extracao:**
- Faca comum: Serve para Facil e Medio.
- Kit de Extração (do Artífice): +2 em todos os testes, serve para Dificil.
- Ferramentas Especializadas (orgânicas ou mágicas): Necessarias para Especialista.
- Recipiente Magico Selado: Necessario para Espirituais e Elementais.

### 5.3 Qualidade da Refeicao

O Cozinheiro do grupo (quem tem maior Coccao) rola para determinar a qualidade do prato.

| Resultado do Teste de Coccao | Qualidade | Efeito |
|-----------------------------|-----------|--------|
| 7 ou menos | Gororoba | Recupera HP minimo (1d4). Teste de Fortitude CD 13 ou sofre debuff severo. |
| 8–15 | Refeicao Comum | Restaura 50% do HP e Mana perdidos. Ativa Bônus Passivo de Sobrevivência e Subclasse. |
| 16–20 | Refeicao Gourmet | Restaura 100% do HP e Mana. Concede Buff Temporario ao grupo inteiro por 2 horas. |
| 21+ | Prato Perfeito | Como Gourmet + o cozinheiro rola 2d4 na Rolagem do Prato (escolhe o maior). |

**Debuffs de Gororoba (Teste de Fortitude, CD 13):**
- Falha por 1-4: -20% do HP Maximo por 24h
- Falha por 5-9: Velocidade reduzida a metade por 12h
- Falha por 10+: Impossibilidade de lancar magias complexas por enjoo severo por 8h
- Falha critica (natural 1): Todos os tres efeitos acima simultaneamente

### 5.4 Adaptacao Biomágica — A Regra do Prato Estruturado

Esta e a mecanica central do sistema. Ao preparar um prato de monstro especifico, o Cozinheiro extrai DNA magico que temporáriamente altera os corpos do grupo.

**As mutacoes duram 24 horas** (ou até o próximo descanso longo).

**Passo 1 — O Foco (Garantido):**
O Cozinheiro escolhe 1 habilidade da **tabela do espécime** preparado (Cap. 6.2 / `ASSIMILACAO-POR-ESPECIME.md` — 8 por monstro, codigo 001–060). Essa habilidade e garantida para todo o grupo.

**Refeicao só de planta (sem monstro):** use **Cap. 5B** — 40 especies; não rola d4 de assimilação; efeito de planta por 24h.

**Passo 2 — O Aproveitamento (Rolagem do 1d4):**

| Resultado do d4 | Habilidades Totais |
|----------------|-------------------|
| 1 | Apenas o Foco (1 habilidade) |
| 2 | Foco + 1 escolha do Cozinheiro (2 total) |
| 3 | Foco + 2 escolhas do Cozinheiro (3 total) |
| 4 | Foco + 3 escolhas do Cozinheiro (4 total — máximo) |

**Passo 3 — Distribuicao:** Todas as habilidades obtidas se aplicam a todo o grupo que participou da refeicao.

**Bônus de Prato Perfeito:** Se o teste de Coccao resultou em Prato Perfeito (21+), o Cozinheiro rola 2d4 e usa o maior resultado.

### 5.5 Duracao e Sobreposicao de Mutacoes

- Mutacoes do mesmo tipo não se acumulam — a mais recente substitui a anterior.
- Mutacoes de tipos diferentes coexistem normalmente.
- O máximo de mutacoes ativas simultaneamente e 8.
- Ao dormir e acordar sem comer, todas as mutacoes ativas expiram.

### 5.6 Minérios, especiarias e tesouros

Alem de **ingredientes** (carne, glândulas), masmorras geram **riqueza capturavel**: especiarias para cozinha, minérios para craft e tesouros para faccao ou mercado.

| Fonte | Regra |
|-------|--------|
| **Monstro** | Apos Extração com **sucesso**, cada espécime concede **1 saque** (especiaria + minério + moedas/tesouro) — tabela **001–060** em `CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md` |
| **Extração excepcional** | Resultado **5+ acima da CD** = +1 especiaria **ou** +1 minério (escolha do grupo) |
| **Cenario** | Objetos **OBJ-R** (veios, baus, altares) — saque fixo ou rolagem 1d12 do bioma |
| **Forrageio** | 1x por descanso curto no bioma: SAB ou INT + Natureza CD 12 → 1d6 (catálogo) |

**Especiaria em prato:** 1 ESP por refeicao = **+1 Forrageio** no teste de Coccao daquela refeicao.

**Minério:** vendido ou usado em craft (Artífice CD 12; 3 unidades Comuns = 1 item +0 orgânico 24h).

**Covil / sala de tesouro:** 2d6 × (10 × nivel do andar) **po** + 1 item TES raro se a sala estiver marcada no mapa.

Lista completa: **ESP-01–30**, **MIN-01–30**, **TES-01–20** no catálogo.

---

## CAPÍTULO 6 — ASSIMILACAO BIOMAGICA

### 6.1 Regra central

Cada **espécime** do bestiário (Livro do Mestre, codigos **001–060**) possui **8 habilidades** proprias. Ao cozinhar aquele monstro, use **somente** a tabela daquele codigo — não a categoria ecologica antiga.

| Fonte | Uso |
|-------|-----|
| **livros/ASSIMILACAO-POR-ESPECIME.md** | Tabelas completas (480 habilidades) |
| **Cap. 5.4** | Foco + d4 + Prato Perfeito |
| **Cap. 5B** | Plantas (sem d4; efeito vegetal) |

Nomes de habilidade **podem repetir** entre espécimes diferentes (ex.: varios tem *Resistência Necrotica*), mas cada monstro sempre lista **seus** 8 numerados.

### 6.2 Indice de espécimes (001–080)

| Cod | Espécime |
|-----|----------|
| 001 | Zumbi de Masmorra |
| 002 | Esqueleto Armado |
| 003 | Ghoul |
| 004 | Espectro |
| 005 | Lich (Arquiliche) |
| 006 | Assombracao |
| 007 | Vampiro |
| 008 | Cavaleiro Espectral |
| 009 | Mumia |
| 010 | Dragonete de Magma |
| 011 | Wyvern |
| 012 | Dragão Jovem de Gelo |
| 013 | Drake de Pedra |
| 014 | Dragão Anciao de Fogo |
| 015 | Golem de Pedra |
| 016 | Armadura Animada |
| 017 | Golem de Ferro Vulcanico |
| 018 | Automato de Genio |
| 019 | Minotauro |
| 020 | Basilisco |
| 021 | Manticora |
| 022 | Grifo |
| 023 | Cocatriz |
| 024 | Aranha Tecerrochas |
| 025 | Escorpião Gigante |
| 026 | Centopeia Caustica |
| 027 | Besouro-Diamante |
| 028 | Sapo-Engolidor |
| 029 | Kraken Menor |
| 030 | Serpente-do-Abismo |
| 031 | Tubarao-Cego |
| 032 | Goblin de Caverna |
| 033 | Hobgoblin Guerreiro |
| 034 | Orc de Masmorra |
| 035 | Cogumelo-Rei |
| 036 | Treant Podre |
| 037 | Planta Carnivora Gigante |
| 038 | Slime Ácido |
| 039 | Slime de Cristal |
| 040 | Elemental de Fogo |
| 041 | Elemental de Gelo |
| 042 | Yeti das Profundezas |
| 043 | Lobo do Inverno |
| 044 | Mimico de Baul |
| 045 | Doppelganger |
| 046 | Hidra das Cavernas |
| 047 | Quimera |
| 048 | Anjo Caido |
| 049 | Gargula de Cristal |
| 050 | Aberracao Tentacular |
| 051 | Basilisco de Magma |
| 052 | Sereia das Profundezas |
| 053 | Troll de Pedra |
| 054 | Ciclope |
| 055 | Harpia de Caverna |
| 056 | Roper |
| 057 | Aboleth |
| 058 | Pudim Negro |
| 059 | Lagosta-Gigante Abissal |
| 060 | Caranguejo-Eremita Colossal |
| 061 | Aranha-Cavaleira |
| 062 | Mosca-Carniça Colossal |
| 063 | Besouro-Trovão |
| 064 | Verme Gigante de Pedra |
| 065 | Salamandra Gigante |
| 066 | Behemoth de Pedra |
| 067 | Fera da Sombra |
| 068 | Medusa |
| 069 | Fênix de Caverna |
| 070 | Gigante de Pedra |
| 071 | Bruxa da Masmorra |
| 072 | Fera Seminal |
| 073 | Carniçal Alado |
| 074 | Balor |
| 075 | Enxame de Ratos-Cadáveres |
| 076 | Elemental de Terra |
| 077 | Banshee |
| 078 | Morcego-Tirano |
| 079 | Ooze Ocular |
| 080 | Tarrasque (Bebê) |

**Espécimes 061–080:** bestiário estendido (Livro do Mestre); invocação no VTT, sem tabela de assimilação 8×1.

**Variante Elite / Colossal:** use a tabela do **espécime base** (ex.: Zumbi Colossal = 001).

**Espécime novo (Mestre):** copie estrutura de 8 linhas; 4–6 podem espelhar categoria proxima, 2–4 unicos.

### 6.3 Categorias ecologicas (referencia legada)

> **Nao usar** em Prato Estruturado se o espécime tiver codigo 001–060. Apenas referencia de design para espécimes sem ficha.

### ARACNIDEOS E INSETOIDES
(Aranhas, Escorpioes, Centopeias, Besouros)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Aderencia de Quitina | Escala paredes e tetos lisos perfeitamente, sem teste. |
| 2 | Glandula Fibrilar | Dispara teias resistentes pelas palmas das maos (alcance 9m). Imobiliza ou serve como corda. |
| 3 | Olhos Compostos | Visao periferica 360 graus. Imune a flanqueamento e ataques furtivos. |
| 4 | Sentido Sismico | Visao as cegas 10m — detecta qualquer movimento no solo, incluindo invisiveis. |
| 5 | Armadura Fina | Quitina cresce sob a pele: +2 CA permanente enquanto ativa. |
| 6 | Patas Multiplas | Velocidade base aumenta em 5m por turno. |
| 7 | Metabolismo Filtrador | Imunidade total a venenos e doenças nao-mágicas. |
| 8 | Quelíceras Acidas | Ataques corpo-a-corpo e mordidas ganham +1d6 de dano venenoso. |

Espécimes-chave: Aranha Tecerrochas (Nivel 3), Escorpião Gigante (Nivel 4), Centopeia Caustica (Nivel 5), Besouro-Diamante (Nivel 2), Aranha-Cavaleira (Nivel 9).

### VULCANICOS E ELEMENTAIS DE FOGO
(Salamandras, Dragonetes de Magma, Elementais)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Fornalha Interna | Imune ao frio extremo. Pode ferver liquidos segurando-os. |
| 2 | Sangue Fervente | 50% de resistência a dano de Fogo e Magma. |
| 3 | Toque Cauterizante | Ataques corpo-a-corpo causam +1d6 de dano de fogo. |
| 4 | Halito de Brasa | Cospe cone de chamas (4m, 3d6 fogo) uma vez por combate. |
| 5 | Pele de Obsidiana | Ignora o dano extra de acertos críticos inimigos. |
| 6 | Suor Fumegante | Exala fumaca — ataques a distancia contra você tem Desvantagem. |
| 7 | Pegadas de Magma | Rastro de chamas atras — inimigos que seguirem sofrem 1d6 fogo/turno. |
| 8 | Digestão Derretida | Pode comer metais e pedras brutas para recuperar 2d6 HP. |

### BESTIAIS ALADOS E HIBRIDOS AEREOS
(Grifos, Harpias, Morcegos-Tirano, Manticoras)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Ossos Ocos | Peso despenca. Sem dano de quedas de até 15m. Saltos triplicam. |
| 2 | Visao de Rapina | Enxerga quilometros. Sem penalidade para tiros a longa distancia. |
| 3 | Asas de Planagem | Membranas sob os bracos permitem planar controladamente. |
| 4 | Voo Verdadeiro | Asas plenas crescem — voo livre de 12m/turno. |
| 5 | Vocalizacao Sonica | Grito em área que atordoa inimigos (CD 13 CON, Atordoado 1 turno). |
| 6 | Garras Retrateis | Pes firmam no chao (imune a empur xoes). Pode prender inimigos. |
| 7 | Pena-Bussola | Sabe exatamente o Norte. Detecta mudancas climaticas e sismicas. |
| 8 | Plumagem Furtiva | Passos e equipamentos silenciados. Vantagem em Furtividade. |

### GOBLINOIDES E NECROFAGOS
(Goblins, Orcs, Hobgoblins, Ghouls)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Fortitude | Imune a penalidades por alimentos estragados ou podres. |
| 2 | Instinto de Horda | Bonus de +2 em dano quando um aliado tambem estiver atacando o mesmo alvo. |
| 3 | Faro para Ouro | Detecta metais preciosos e tesouros atraves de paredes até 10m. |
| 4 | Adrenalina Covarde | Velocidade dobra temporáriamente ao se afastar de um inimigo mais forte. |
| 5 | Garras de Escavador | Escava terra ou cascalho a velocidade de caminhada. |
| 6 | Metabolismo Acelerado | Precisa de metade do tempo para descanso curto e longo. |
| 7 | Visao de Submundo | Visao perfeita no escuro absoluto. |
| 8 | Aderencia Rasteira | Move-se em velocidade máxima mesmo rastejando ou deitado. |

### DRACONICOS
(Wyverns, Drakes, Dragoes Jovens, Dragonetes)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Escamas de Wyrm | CA base aumenta em +3 (não acumula com armaduras pesadas). |
| 2 | Sangue de Fera Ancestral | Vantagem em Intimidacao. Monstros de nivel 4 ou menos hesitam. |
| 3 | Figado Alquimico | Qualquer veneno no corpo e queimado para restaurar 1d6 Mana. |
| 4 | Olhos de Dragão | Enxerga auras mágicas, objetos ilusorios e criaturas invisiveis. |
| 5 | Garras de Adamante | Ataques desarmados cortam metal e podem quebrar armas inimigas. |
| 6 | Pulmoes de Fole | Prende respiração por horas. Imune a gases, venenos inalados e esporos. |
| 7 | Cauda Preensil | Cauda robusta cresce — segura armas leves ou derruba oponentes. |
| 8 | Aura de Majestade | Monstros de INT 5 ou menos não te atacam primeiro sem provocação. |

### GLACIAIS
(Yetis, Lobos do Inverno, Elementais de Gelo)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Sangue Anticongelante | Imunidade total a dano de frio e penalidades de clima gelado. |
| 2 | Passos de Geada | Agua congela sob as botas. Pode correr sobre lagos e rios. |
| 3 | Toque Congelante | Ataques corpo-a-corpo reduzem a velocidade do alvo a metade. |
| 4 | Pelagem de Tundra | Pelos brancos crescem — ganha HP Temporario (5) a cada hora. |
| 5 | Visao de Nevasca | Visao perfeita atraves de neblina, chuva, fumaca ou neve. |
| 6 | Halito de Inverno | Rajada de gelo (cone 4m, 3d6 frio) que apaga chamas e cristaliza alvos. |
| 7 | Sono de Hibernação | Transe profundo que pausa progressao de maldicoes, venenos e sangramento. |
| 8 | Gelo Espinhoso | Ao sofrer dano fisico, estilhacos de gelo causam 1d6 ao atacante. |

### ESPIRITUAIS E AMALDICADOS
(Espectros, Assombracoes, Banshees, Cavaleiros Espectrais)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Passo Intangivel | Atravessa portas trancadas ou paredes finas uma vez por combate. |
| 2 | Levitacao Espectral | Pes flutuam. Imune a armadilhas de piso e terreno dificil. |
| 3 | Toque Drenante | Ataques desarmados causam dano necrótico e curam o personagem na mesma proporcao. |
| 4 | Olhos do Alem | Ao tocar um cadaver, ve os ultimos 5 segundos de vida da criatura. |
| 5 | Voz de Tumba | Fala telepaticamente a 30m. A voz causa pavor — CD 12 SAB ou Amedrontado. |
| 6 | Corpo Translucido | Mistura-se com sombras automaticamente em luz fraça (quase invisivel). |
| 7 | Resistência Fantasmagorica | Sofre metade do dano de ataques fisicos nao-magicos. |
| 8 | Sexto Sentido Frio | Nao pode ser surpreendido. Detecta mortos-vivos num raio de 20m. |

### MIMICOS E METAMORFOS
(Mimicos de Bau, Doppelgangers, Gargulas de Cristal)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Camuflagem Perfeita | Se imovel, torna-se indistinguivel de objeto comum. |
| 2 | Lingua Adesiva | Lingua se estende a 3m como chicote para desarmar ou puxar objetos. |
| 3 | Pele Mutavel | Altera cor da pele, feicoes e tom de voz para imitar qualquer humanoide. |
| 4 | Bolsa Dimensional Gastrica | Estômago torna-se espaco extra-dimensional — engole itens sem ganhar peso. |
| 5 | Mordida Surpresa | Mordida em alvo que não notou você causa o triplo do dano normal. |
| 6 | Juntas Articuladas | Desloca ossos a vontade para escapar de qualquer restricao fisica. |
| 7 | Metabolismo de Material | Ganha resistência fisica baseada no ultimo material que o Mimiico imitava. |
| 8 | Sangue Corrosivo | Secreta ácido leve — dissolve fechaduras, grades e metais mundanos silenciosamente. |

### AQUATICOS E ABISSAIS
(Sapos, Krakens, Serpentes, Tubaroes-Cegos)

| # | Habilidade | Efeito |
|---|-----------|--------|
| 1 | Guelras de Profundeza | Respiração subaquatica infinita, sem limite de profundidade. |
| 2 | Pele Escorregadia | Impossivel de ser agarrado, imobilizado ou preso por correntes. |
| 3 | Bexiga Natatoria | Infla o peito para flutuar no ar ou armazenar oxigenio para aliados. |
| 4 | Radar de Linha Lateral | Sente movimentacao e batimentos cardiacos atraves de paredes ou agua. |
| 5 | Jato de Tinta Cega | Nuvem de tinta (raio 6m) que cega por 1 minuto. |
| 6 | Bioeletricidade | Corpo gera carga — ataques dao choque (+1d6 eletrico) e armas de metal recebem descarga de volta. |
| 7 | Camuflagem de Polvo | Muda cor e textura instantaneamente — invisivel ao colar em parede. |
| 8 | Resistência Abissal | Imune a dano de esmagamento e mudancas extremas de pressao. |


---



---




---

# CAPÍTULO 5B — FLORA DE MASMORRA (40 ESPECIES)

> Alimentacao **vegetal** para Druidas, Forrageiros e Clérigo do Pao da Vida. Cada planta ativa **Bônus Passivo de Sobrevivência** e efeito proprio (sem precisar de monstro). Ver tambem **Assimilação por Espécime** (Cap. 6.2) para carne de monstro.

---

## Regras rapidas

| Regra | Detalhe |
|-------|---------|
| **Quem pode** | Druida (Ciclo da Vida), Explorador de Esporos, Clérigo do Pao da Vida, qualquer um com Fortitude 4+ |
| **Preparo** | Crua (Druida ok), refeicao Comum (Coccao 8+), ou ritual de Pao da Vida |
| **Extração planta** | DES ou SAB + bonus; planta **Comum** não exige Estudo de Anatomia |
| **Mutação** | Planta **não** rola d4 de assimilação de monstro — concede **efeito de planta** (24h ou nota) |
| **Ecologia** | Monstros listados em **Consumidores** comem a planta no bioma; Mestre pode fazer encontros de herbivoria |

**Qualidade:** Falha em Coccao com planta toxica = veneno leve (CON CD 12 ou 1d6/turno, 3 turnos). Prato Perfeito dobra duração do efeito de planta.

---

## Indice das 40 plantas

| # | Nome | Bioma típico | Raridade |
|---|------|--------------|----------|
| 01 | Musgo-Lanterna | Estômago Botanico, Arquivos | Comum |
| 02 | Raiz-Relogio | Engrenagens, Cidadela Palida | Comum |
| 03 | Broto de Veia | Qualquer Boca (superficie de tunel) | Comum |
| 04 | Erva-Sino | Abatedouro Celestial, planicie | Comum |
| 05 | Folha de Salmour | Pantano, costa | Comum |
| 06 | Cogumelo-Bandeira | Fungos, Digestor | Comum |
| 07 | Trevo de Obelisco | Cemiterio de Colossos | Incomum |
| 08 | Vinha de Grimwald | Cidadela Palida | Incomum |
| 09 | Liquen Frio | Boca Branca, gelo | Comum |
| 10 | Flor de Espelho | Labirinto Prismatico | Incomum |
| 11 | Palma de Ferromur | Engrenagens | Incomum |
| 12 | Algas de Prata | Mar de Prata Cega | Comum |
| 13 | Hera Sangrenta | Fornalhas, Deserto de Carne | Incomum |
| 14 | Samambaia de Cinza | Jardim de Cinzas | Comum |
| 15 | Tubarao-Relva (alga rasteira) | Abismo Invertido | Incomum |
| 16 | Esporo-Madrugada | Estômago Botanico | Comum |
| 17 | Raiz de Yeti | Montanhas geladas | Incomum |
| 18 | Cacto Roxo | Deserto Purpura | Incomum |
| 19 | Arvore-Raçao (nucleo) | Vale Podre, Digestor | Raro |
| 20 | Mel de Xilema | Colmeia de insetos + flora | Incomum |
| 21 | Casca-Brilho | Aranhas, teias antigas | Incomum |
| 22 | Flor Narcotica | Ninho Crepuscular | Raro |
| 23 | Planta Carnivora (bulbo) | Estômago Botanico | Incomum |
| 24 | Musgo de Lareth | Ruinas engolidas | Raro |
| 25 | Semente de Vinha Guardia | Simbiose druidica | Incomum |
| 26 | Capim Eco | Fosso das Emocoes | Incomum |
| 27 | Broto de Treant Podre | Floresta podre | Raro |
| 28 | Cristal-Mel (seiva) | Gargulas, cavernas de cristal | Raro |
| 29 | Folha de Abismo | Boca Azul profunda | Raro |
| 30 | Erva do Limiar | Boca Negra | Incomum |
| 31 | Tuberculo de Lobo | Norte, cavernas geladas | Incomum |
| 32 | Flor de Mira | Qualquer Boca (oferta) | Comum |
| 33 | Raiz de Valdrun | Forjas, superficie | Comum |
| 34 | Orquidea Sorn | Arquivos, Vesper | Raro |
| 35 | Musgo Estelar | Boca Laranja (alto) | Raro |
| 36 | Polen de Matriarca | Teias de aranha-rei | Raro |
| 37 | Fruto de Hidra (sementes) | Cavernas aquaticas | Raro |
| 38 | Liquen de Golem | Engrenagens vivas | Raro |
| 39 | Broto Ancestral | Boss derrotado (1/semana) | Lendário |
| 40 | Flor do Chefe Final | Boca Vazia (andares 1-3) | Lendário |

---

## Ficha por planta (01–20)

### 01 — Musgo-Lanterna
**Consumidores:** Goblin, Besouro-Diamante, Planta Carnivora (filhotes).  
**Efeito (24h):** Luz suave 3m; +2 em testes de orientacao em tunel; Druida cura 1d4+SAB ao descansar curto em área umida.

### 02 — Raiz-Relogio
**Consumidores:** Esqueleto (não come — energia ambiente), Autômato menor, ratos de masmorra.  
**Efeito:** Imune a sono magico forcado 1x; próximo descanso curto em 5 min (raiz mastigada).

### 03 — Broto de Veia
**Consumidores:** Quase todos os herbivoros pequenos; Centopeia (filhotes).  
**Efeito:** +1 em Extração e Forrageio; primeira refeicao de **monstro** no dia conta como Comum+.

### 04 — Erva-Sino
**Consumidores:** Grifo (ninhos), Harpia, aventureiros locais.  
**Efeito:** Vantagem em Percepção auditiva; aliados a 6m acordam de surpresa com +2 Iniciativa 1 combate.

### 05 — Folha de Salmour
**Consumidores:** Sapo-Engolidor, peixes de caverna, Serpente-do-Abismo (jovem).  
**Efeito:** Respiração em ar umido/nevoa; +2 em CON vs gases 24h.

### 06 — Cogumelo-Bandeira
**Consumidores:** Goblin, Cogumelo-Rei (simbiose), Ghoul (ocasional).  
**Efeito:** +3 Fortitude; imune a podridao leve de ingrediente Comum.

### 07 — Trevo de Obelisco
**Consumidores:** Zumbi (não — supersticao); Espectro (energia); humanos de Grimwald.  
**Efeito:** 1 reroll em save de morte por veneno/necrótico por 24h.

### 08 — Vinha de Grimwald
**Consumidores:** Treant Podre, Planta Carnivora, Druida locais.  
**Efeito:** Escalar superficie orgânica sem teste; rebaté 1d4 cortante a quem te acertar corpo a corpo (1/combate).

### 09 — Liquen Frio
**Consumidores:** Lobo do Inverno, Yeti, Elemental de Gelo (ambiente).  
**Efeito:** Resistência a frio; ignora Exaustao por frio ambiental 24h.

### 10 — Flor de Espelho
**Consumidores:** Mimico (polen), Doppelganger (não digere — copia aroma).  
**Efeito:** Vantagem em testes vs ilusao; detecta Mimico adjacente automaticamente.

### 11 — Palma de Ferromur
**Consumidores:** Besouro-Diamante, construtos desligados (oxidacao reduzida).  
**Efeito:** Armas metalicas do grupo não oxidam na Boca Cinza 24h; +1 Coccao com ferro/forja.

### 12 — Algas de Prata
**Consumidores:** Tubarao-Cego, Kraken Menor, Lagosta Abissal.  
**Efeito:** Nado 6m; visao 9m em agua turva 24h.

### 13 — Hera Sangrenta
**Consumidores:** Ghoul, Vampiro (suco), Dragonete (ninho).  
**Efeito:** +1d4 necrótico em um ataque por combate; ou cura 2d6 se Druida Circulo Decomposicao.

### 14 — Samambaia de Cinza
**Consumidores:** Elemental de Fogo (contraste), Zumbi Colossal (ambiente).  
**Efeito:** Resistência a fogo ambiental (não magia boss) metade dano 24h.

### 15 — Tubarao-Relva
**Consumidores:** Serpente-do-Abismo, Sereia, peixes gigantes.  
**Efeito:** Movimento em terreno dificil aquático normal; Vantagem em Furtividade submerso.

### 16 — Esporo-Madrugada
**Consumidores:** Cogumelo-Rei, Forrageiro (cultivo), insetos.  
**Efeito:** Nuvem 1,5m curativa 1d8 HP (1/dia, acao); +2 Forrageio com fungos.

### 17 — Raiz de Yeti
**Consumidores:** Yeti, Lobo do Inverno, Basilisco de Gelo (raro).  
**Efeito:** +2 FOR temporario 1h; depois 1 nivel Exaustao leve (crash) se não comer carne no mesmo dia.

### 18 — Cacto Roxo
**Consumidores:** Escorpião Gigante, Gargula de Cristal, viajantes Mirraga.  
**Efeito:** +2 CA natural 4h; sede não afeta 24h em deserto.

### 19 — Arvore-Raçao (nucleo)
**Consumidores:** Treant Podre, Rei Cogumelo, herbivoros grandes.  
**Efeito:** Uma refeicao equivale a 3 dias de racao; grupo em 6m não precisa comer hoje (1/semana).

### 20 — Mel de Xilema
**Consumidores:** Besouro-Diamante, Aranha Tecerrochas (larvas), ursos de caverna.  
**Efeito:** +2 HP temp max por nivel ao amanhecer; Vantagem em primeiro save do dia.

---

## Ficha por planta (21–40)

### 21 — Casca-Brilho
**Consumidores:** Aranha Tecerrochas, Escorpião.  
**Efeito:** +2 CA vs ataques de oportunidade; teia própria 1 uso (9m, imobiliza DES CD 13).

### 22 — Flor Narcotica
**Consumidores:** Apenas preparadores (monstros evitam). Planta Carnivora se alimenta de insetos atraidos.  
**Efeito:** Descanso longo em 4h; SAB CD 14 ou Lentidão 1h ao acordar. Bardo: +3 CD Encantamento 8h.

### 23 — Planta Carnivora (bulbo)
**Consumidores:** Ela mesma; Hidra (arranca).  
**Efeito:** Ataque desarmado 1d6+DES ácido 1/combate; +2 vs agarrar.

### 24 — Musgo de Lareth
**Consumidores:** Esqueletos antigos (decadencia), Golem de Pedra (minerais).  
**Efeito:** Vantagem em Historia/Natureza sobre ruinas; 1 pergunta ao Mestre sobre andar visitado (1/semana).

### 25 — Semente de Vinha Guardia
**Consumidores:** Druida planta; Ceifador não come.  
**Efeito:** Como Circulo Simbiose: rebaté 1d6 cortante 8h; plantar semente = vinha 3m escalar 24h.

### 26 — Capim Eco
**Consumidores:** Banshee (nao); Espectro absorve.  
**Efeito:** Ouve emocoes fortes 10m; imune a surpresa por invisivel incorporeo 24h.

### 27 — Broto de Treant Podre
**Consumidores:** Treant Podre, Cogumelo-Rei em guerra.  
**Efeito:** 2d8 HP temp; resistência a necrótico 24h; Forma Selvagem +5 HP max 24h.

### 28 — Cristal-Mel (seiva)
**Consumidores:** Gargula de Cristal, Slime de Cristal.  
**Efeito:** Visao detecta ilusao e invisivel 12m 24h; 1 cristal arremessavel 2d6 perfurante.

### 29 — Folha de Abismo
**Consumidores:** Aboleth servos, peixes abissais.  
**Efeito:** Pressao profunda ignorada 24h; +2 em saves vs medo 24h.

### 30 — Erva do Limiar
**Consumidores:** Mortos-vivos baixa INT (não comem); Clérigo Limiar cultiva.  
**Efeito:** 1 fragmento de alma “vazio” para ritual necromancia sem kill (Clérigo Limiar); ou cura 3d8.

### 31 — Tuberculo de Lobo
**Consumidores:** Lobo do Inverno, Orc, Patrulheiro besta.  
**Efeito:** Faro 15m; Vantagem em rastrear 24h; +3m movimento.

### 32 — Flor de Mira
**Consumidores:** Ofertas em altares; insetos; sem predador fixo.  
**Efeito:** +2 em sobrevivencia em masmorra; 1 reroll em falha de Exaustao por fome (1/dia).

### 33 — Raiz de Valdrun
**Consumidores:** Anoes; Forjado de Osso (minerais).  
**Efeito:** +2 em craft/Extração metal e osso 24h; ignora -2 sem treino em osso 1 refeicao.

### 34 — Orquidea Sorn
**Consumidores:** Aberracao (polen); Leitores de Sorn.  
**Efeito:** +4 Estudo de Anatomia proxima especie estudada 24h; 1 truque Adivinhacao 1x sem slot.

### 35 — Musgo Estelar
**Consumidores:** Grifo, Wyvern, Anjo Caido (corrompido, energia).  
**Efeito:** Levitacao 3m/turno 10 min (1/dia); queda lenta 24h.

### 36 — Polen de Matriarca
**Consumidores:** Aranha-Cavaleira, enxames.  
**Efeito:** Imune a veneno de aracnideos 24h; +2 em saves vs Restringido 24h.

### 37 — Fruto de Hidra (sementes)
**Consumidores:** Hidra; peixes grandes.  
**Efeito:** Regenera 1d6 HP inicio do turno 3 turnos (1/combate); ou 5d8 HP uma vez.

### 38 — Liquen de Golem
**Consumidores:** Golem de Pedra (lento), construtos.  
**Efeito:** Resistência contundente 24h; +2 CA vs derrubar 24h.

### 39 — Broto Ancestral
**Consumidores:** Nenhum (Boss deixou).  
**Efeito:** Escolhe 1 habilidade da tabela do Boss derrotado (Cap. 6.2) por 48h; 1/semana por grupo.

### 40 — Flor do Chefe Final
**Consumidores:** Nao existe predador — flor sente “campanha”.  
**Efeito:** Mestre revela 1 pista verdadeira sobre Chefe Final; grupo +2 em todos saves 24h após Banquete de campanha.

---

## Cadeia alimentar (mesa)

| Camada | Exemplos |
|--------|----------|
| **Produtores** | Musgo-Lanterna, Broto de Veia, Algas |
| **Herbivoros** | Besouro-Diamante filhote, goblins, lagostas jovens |
| **Onivoros** | Goblin, Ghoul, Orc, Sapo-Engolidor |
| **Predadores** | Aranha, Wyvern, Vampiro, Planta Carnivora |
| **Apex / Boss** | Hidra, Lich, Chefe Final |

**Encontro ecologico (opcional):** 1d6 ao explorar bioma com flora — 1-2 herbivoros comendo planta (# da tabela), 3 predador caçando, 4 planta carnivora, 5-6 nada.

**Druida na cadeia:** pode “negociar” com herbivoros (SAB CD 12) oferecendo planta #01–06 — +2 em primeiro teste social com especie.

---

*Ver `ASSIMILACAO-POR-ESPECIME.md` para 8 habilidades por monstro (carne).*


---

# PARTE VI — DIVINDADES, DEIDADES E RELIGIOES DE ELDARIN

---

## CAPÍTULO 7 — O PANTEAO DE ELDARIN

Em Eldarin, os deuses não sao figuras distantes de mito — eles sao evidentes no dia a dia das masmorras. Criaturas angelicas e demoniacas aparecem literalmente nas profundezas. Ingredientes com propriedades "divinas" ou "abissais" existem no bestiário. A forca que anima os Forjados de Osso e de origem incerta.

As religioes de Eldarin emergiram dessa realidade concreta: as pessoas não adoram os deuses por fe cega, mas porque os deuses sao palpaveis — suas bencoes chegam, seus ensinamentos funcionam, seus segredos estão literalmente enterrados nas profundezas.

Ha tres deuses principais no panteao de Eldarin, alem de cultos menores e a opcao de vida sem devocao religiosa.

---

### VALDRUN — O ETERNO FORJADOR

Domínio: Criação, Artesanato, Transformacao, Trabalho
Simbolo: Uma bigorna partida ao meio com uma chama no centro
Alinhamento: Neutro Bom
Clero: Chamados de Mestres da Forja; vestem avental de couro negro com simbolos gravados a fogo

**Lore:** Valdrun e o deus mais antigo do panteao, adorado pelos Anaos antes mesmo das masmorras existirem. Segundo a crenca, foi ele quem ensinou os primeiros Anaos a trabalhar o metal e a pedra — e quando as masmorras surgiram e engoliriram as cidades subterraneas, os Anaos não fugiram: eles continuaram construindo, porque Valdrun ensina que não ha tragedia que não possa virar material.

A crenca central de Valdrun: **nada no universo e refugo**. Tudo pode ser transformado. Um osso de monstro e uma ferramenta esperando ser descoberta. Um veneno e uma medicina a ser refinada. Um inimigo morto e um ingrediente a ser aproveitado. Este principio e a fundacao filosofica de toda a culinaria biomágica.

Valdrun tambem e associado aos Forjados de Osso: a crenca e que o "momento em que um Forjado adquire consciência" e o instante em que Valdrun sopra uma fagulha de alma no Nucleo de Alma. Isso torna os Forjados tecnicamente criatura sagrada dentro desta fe.

**Cultos:** A Igreja da Forja Permanente e a religiao organizada de Valdrun — hierarquica, tecnica, com rituais que envolvem trabalho manual. O Culto do Desperdicio Zero e uma seita mais radical que considera pecado mortal descartar qualquer ingrediente de monstro sem aproveitar completamente.

**Bonus para Seguidores de Valdrun:**
- Artesao Abencado: Proficiencia automatica em ferramentas de Extração de todos os niveis.
- Transformador: Uma vez por dia, ao falhar num teste de Forrageio, pode rolar novamente (Valdrun "inspira" a tecnica correta).
- Nucleo Resiliente: Seguidores que tambem sao Forjados de Osso tem o CD de destruicao do Nucleo de Alma aumentado em +4.
- Bencao do Aproveitamento: Ao preparar um Banquete Lendário de Boss, rola uma habilidade de assimilação extra garantida alem do Foco normal.

---

### MIRA — A MAE-ABISMO

Domínio: Submundo, Adaptacao, Sobrevivencia, Ciclismo da Vida
Simbolo: Uma boca aberta com dentes em forma de estalagmites, da qual brota um broto verde
Alinhamento: Neutro
Clero: Chamados de Descentes; sem vestes fixas — cada um usa o que encontrou na masmorra

**Lore:** Mira e a personificacao do submundo como organismo. Para seus seguidores, as masmorras não sao lugares — sao partes do corpo de Mira. Cada Boca e uma abertura de sua anatomia. Cada corredor e uma veia. Cada monstro e uma celula de seu sistema imunologico.

A crenca central de Mira: **a masmorra não e inimiga — e um ambiente**. Exploradores que morrem não sao vitimas; sao ingredientes da própria ecologia do submundo, devolvidos ao ciclo. Seguidores de Mira não combatem a masmorra — eles aprendem a coexistir, adaptar e aproveitar. E por isso que a culinaria biomágica, para eles, e ato sagrado: ao comer um monstro, você incorpora a vida da masmorra em si mesmo. Você se torna mais Masmorra.

Mira e a deusa mais popular entre exploradores veteranos, Meio-Humanos com linhagens bestiais, Druidas e Patrulheiros. Tambem e invocada por familias que moram próximo as Bocas.

Existe um dogma secreto da fe de Mira que apenas clérigos de alto nivel conhecem: o Chefe Final da Masmorra 11 não e um inimigo criado por acidente. E uma extensao do proprio corpo de Mira, e o verdadeiro "Rito de Passagem" que a deusa exige de quem deseja compreender o submundo completamente.

**Cultos:** O Culto dos Descentes e descentralizado — sem templos fixos, sem hierarquia formal. O Circulo das Bocas e uma organizacao de Clérigos de Mira que mapeiam as conexoes entre as 11 masmorras, acreditando que juntas formam um único ser consciente.

**Bonus para Seguidores de Mira:**
- Filho da Masmorra: Bonus de +2 em todos os Saving Throws realizados dentro de masmorras.
- Adaptacao Acelerada: Mutacoes biomágicas de qualquer tipo duram 36h em vez de 24h.
- Digestão Sagrada: Uma vez por descanso longo, pode comer um ingrediente de monstro sem preparo ou coccao e ativar uma habilidade de assimilação aleatoria (rola 1d8 na tabela da categoria do monstro).
- Ciclo da Vida: Ao morrer dentro de uma masmorra com pelo menos 3 seguidores de Mira presentes, existe 25% de chance de reviver espontaneamente com 1 HP no inicio do próximo turno.

---

### SORN — O SENHOR DO CONHECIMENTO PROIBIDO

Domínio: Conhecimento, Segredos, Anatomia, Magia das Profundezas
Simbolo: Um olho aberto com pupila em forma de chave
Alinhamento: Neutro Maligno (o deus em si); a maioria dos seguidores e Neutro
Clero: Chamados de Leitores; vestem robes cinza com textos gravados em tinta de monstro

**Lore:** Sorn não e adorado por forca ou bondade — e adorado por saber. Para seus seguidores, o conhecimento e o bem supremo, e o submundo e a maior biblioteca do mundo: cada monstro e um capitulo, cada bioma e um volume, cada masmorra e um tomo que aguarda leitura.

A crenca central de Sorn: **nenhum conhecimento deve ser destruido**. Monstros não devem ser simplesmente mortos — devem ser estudados, catalogados, entendidos. A culinaria biomágica e, para os Leitores, uma extensao do estudo anatomico: ao transformar um monstro em prato e consumi-lo, você literalmente incorpora o conhecimento da criatura em seu proprio corpo.

Sorn têm um lado sombrio que seus seguidores moderam com etica pessoal: o deus não distingue entre conhecimento "bom" e "ruim". Os extremistas da fe de Sorn chegam a criar monstros, poluem masmorras com experiencias e manipulam ecossistemas inteiros — pela gloriosa causa do conhecimento.

Sorn e popular entre Magos, Gnomos Arcanistas, Artífices Biologos Alquimicos e qualquer personagem com Inteligencia alta que valoriza o Estudo de Anatomia.

**Cultos:** A Academia Cinzenta e a organizacao de culto legitima e academica de Sorn — mantida dentro da universidade de Vesper, proxima a Masmorra 5. O Convento do Olho Aberto e uma seita clandestina que acredita que as respostas para todos os segredos do submundo estão no Andar 4 da Masmorra 11.

**Bonus para Seguidores de Sorn:**
- Leitor de Espécimes: Bonus de +4 em todos os testes de Estudo de Anatomia.
- Arquivo Mental: Ao mapear a Anatomia de uma especie, nunca esquece — o beneficio e sempre ativo.
- Revelacao Proibida: Uma vez por semana, pode fazer uma pergunta ao Mestre sobre a natureza de qualquer monstro recentemente derrotado (o Mestre revela uma resistência, imunidade ou habilidade especial não declarada).
- Conhecimento e Carne: Ao realizar um Prato Perfeito com uma especie estudada anatomicamente, rola 2 habilidades de assimilação garantidas (Foco duplo) em vez de apenas 1.

---

## CAPÍTULO 8 — OS SEM-DEUSES: BONUS DO NAO-CRENTE

Nem todos os habitantes de Eldarin seguem uma divindade. Exploradores ceticos, filosofos pragmaticos e sobreviventes que viram deuses demais para confiar em algum deles frequentemente decidem trilhar o caminho sem deus.

Em Eldarin, essa escolha tem custo e recompensa proprias. Sem o amparo de um deus, o personagem depende exclusivamente de si mesmo.

**Regra do Sem-Deus:** Ao criar o personagem, se o jogador declarar que o personagem e sem devocao religiosa (e mantiver isso durante a campanha, recusando-se a invocar qualquer divindade mesmo em momentos de desespero), o personagem recebe:

- Autoconfianca: Uma vez por descanso longo, pode adicionar 1d6 a qualquer teste ANTES de rolar. Nao e sorte divina — e preparo proprio.
- Metabolismo Puro: Mutacoes duram o dobro do tempo normal (48h em vez de 24h) — sem um deus "filtrando" a assimilação, o corpo absorve mais completamente.
- Sem Saving Throw Religiosa: E imune a qualquer efeito de maldade ou bondade divina que exija falta de fe como CD adicional.
- Orgulho Terreno: Ao chegar a 0 HP sem aliados vivos, pode gastar um Dado de Vida adicional como ação bonus.

**Penalidade do Sem-Deus:** Sem a bencao de nenhuma divindade, o personagem não pode comprar servicos religiosos, não tem acesso a magias que exijam apelo divino acima do nivel 4, e sera tratado com desconfianca em cidades profundamente religiosas.

---

## CAPÍTULO 9 — CULTOS MENORES E DEIDADES SECUNDARIAS

**A Faca Sem Nome:** Entidade adorada por assassinos e Ladinos que cultivam o silencio como pratica religiosa. Nao tem lore, não tem mito — apenas um simbolo (uma faca vertical com a lâmina virada para dentro) e uma pratica: nunca revelar o nome do alvo após o servico. Bonus: +2 em todos os ataques furtivos e imunidade a deteccao mágica de presenca.

**O Enxame:** Deidade insular adorada por tribos de Goblins Fungicos da Masmorra 3 e por algumas familias Halfling. Entidade coletiva, sem forma individual — e a soma de todas as criaturas pequenas do submundo. Bonus: quando rodeado por 3 ou mais aliados, ganha +1 CA e +1 em todos os ataques por aliado adicional acima de 2 (máximo +4).

**O Primeiro Cozinheiro:** Figura mitica — não exatamente um deus, mas adorado como tal. Teria sido o primeiro ser a preparar um prato de monstro e sobreviver. A Academia de Culinaria de Ossenfurt mantem um altar a ele. Bonus: ao preparar um Prato Perfeito pela primeira vez com uma especie nova, recupera todos os espacos de magia gastos durante o preparo da refeicao.

---


---


# PARTE VII — CRIACAO DE PERSONAGEM

---

## CAPÍTULO 10 — GUIA PASSO A PASSO

### Passo 1 — Conceito

Antes de qualquer numero, decida a premissa narrativa do seu personagem. Responda:
- Por que você esta nas masmorras? (ganancia, missao, fuga, curiosidade, devocao religiosa)
- Qual e sua relacao com comida de monstro? (louco por culinaria, pragmatico puro, com nojo mas adaptando, estudioso)
- Você segue algum deus do panteao? Qual e sua relacao com essa fe?

### Passo 2 — Escolha de Raça

Escolha uma das sete racas jogaveis. Se Meio-Humano, escolha uma das nove linhagens. Anote os bônus de atributo racial e as habilidades raciais de Nivel 1.

### Passo 3 — Distribuicao de Atributos

**Metodo Padrao (recomendado):** Distribua 27 pontos nos 6 atributos usando a tabela de custo abaixo. Todos os atributos comecam em 8.

| Atributo Final | Custo em Pontos |
|---------------|----------------|
| 8 | 0 |
| 9 | 1 |
| 10 | 2 |
| 11 | 3 |
| 12 | 4 |
| 13 | 5 |
| 14 | 7 |
| 15 | 9 |

**Metodo Alternativo (mais caos):** Role 4d6, descarte o menor dado, some os tres restantes. Repita 6 vezes. Distribua os resultados livremente.

Apos distribuir, aplique os bônus raciais.

### Passo 4 — Escolha de Classe

Escolha uma das nove classes. Anote o Dado de HP, os atributos primarios, as proficiencias iniciais e os atributos culinários iniciais.

Calcule o HP inicial: Dado máximo da classe + MOD CON.

**PA (mesa digital):** anote **5 / 5** PA (atual / maximo) na ficha — Cap. 2.6.

A subclasse (Caminho de Assimilação) e escolhida no **Nivel 2** — anote a Passivo de Assimilação do Cap. 4.
- **Niveis 4, 8, 12 e 16:** um talento do **Caminho de Subclasse** (Cap. 12), em ordem.
- **Nivel 20:** **Ascensao** da subclasse (capstone, Cap. 12).

### Passo 5 — Religiao

Decida se o personagem segue Valdrun, Mira, Sorn, um culto menor, ou e Sem-Deus. Anote os bônus da devocao escolhida. Discuta com o Mestre as implicacoes narrativas.

### Passo 6 — Atributos Culinarios Iniciais

Some os bônus da classe com quaisquer bônus raciais.

- Extração: base 0 + bônus de classe + bônus racial
- Forrageio: base 0 + bônus de classe + bônus racial
- Coccao: base 0 + bônus de classe + bônus racial
- Fortitude: base 0 + bônus de classe + bônus racial

### Passo 7 — Equipamento Inicial

No **criador de personagem** (passo *Equipamento*), escolha **um kit** entre as opções da sua classe. Cada kit traz arma(s), armadura (quando aplicável) e truques iniciais para conjuradores — tudo já **equipado** na ficha (arma/ação ativa e armadura vestida), de modo que a **CA** e as ações de combate já consideram o equipamento.

**Todo personagem nível 1 também recebe:**
- Kit de trinchar, tocha de masmorra e corda de seda de aranha
- **50 PO** para compras na masmorra

**Bônus por raça** (somam ao inventário):
- **Anão:** kit de trinchar extra
- **Gnomo:** kit de brasas mágicas
- **Forjado de Osso:** corda de seda de aranha extra

**Bônus por antecedente** (somam ao inventário):
- **Explorador:** corda de seda de aranha extra
- **Criminoso:** adaga extra
- **Soldado:** gladius extra
- **Eremita:** magia *Estabilizar* no grimório

#### Kits por classe (escolha 1)

| Classe | Opções |
|--------|--------|
| **Guerreiro** | Lâmina leve + couro curtido · Espada longa + cota de malha · Arco longo + couro acolchoado |
| **Patrulheiro** | Arco curto + couro · Gladius + gibão de peles · Rapieira + meia-armadura |
| **Ladino** | Rapieira + couro · Adagas gêmeas + couro acolchoado · Arco curto (sem armadura pesada) |
| **Mago** | Adaga + *Lâmina de Espírito* e *Chama de Fogareiro* · Besta leve + couro (*Raio do Limiar* no grimório) · Adaga + *Onda de Trovão* e *Escudo Arcano* |
| **Clérigo** | Maça + meia-armadura + cura · Besta + couro + *Curar Ferimentos* · Azagaia + brigandina |
| **Bárbaro** | Machado grande + gibão · Gladius + couro batido · Maça + couro curtido |
| **Bardo** | Rapieira + couro + *Inspiração Culinária* · Adaga + couro acolchoado + *Sussurro de Masmorra* · Arco curto + *Ilusão Menor* |
| **Druida** | Cimitarra + gibão + *Crescimento Acelerado* · Azagaia + escamas de dragonete + *Purificar Veneno* · Adaga + couro de troll + *Estabilizar* |
| **Artífice** | Maça + couro + kit de brasas + *Chama de Fogareiro* · Besta + meia-armadura + *Armadura Arcana* · Adaga + brigandina + *Detectar Veneno* |

Na mesa virtual, troque arma ou armadura pelo painel **Em uso** na ficha; a CA é recalculada automaticamente ao equipar.

### Passo 8 — Background

Escolha ou crie um background narrativo. Responda:
- Qual e o primeiro monstro que você ja comeu?
- Qual e o pior prato que você ja preparou ou comeu?
- Qual e o seu objetivo ao explorar as masmorras de Eldarin?


---

# PARTE VIII — SISTEMA DE TALENTOS

---

## CAPÍTULO 11 — REGRAS DE TALENTOS

Nos **Niveis 4, 8, 12 e 16**, alem dos bônus normais de progressao, cada personagem escolhe **1 Talento do Caminho de Subclasse** (Cap. 12), ligado a **Caminho de Assimilação** escolhida no Nivel 2.

**Fontes de Talentos:**
- **Caminho de Subclasse (obrigatorio):** 34 caminhos — um por subclasse (Cap. 4). Cadeia 4 → 8 → 12 → 16, mais **Ascensao** no Nivel 20.
- **Talentos Universais (Cap. 13, opcional):** O Mestre pode permitir **1** talento universal extra **somente** na janela do Nivel 12.

**Pre-requisito:** Talentos de nv. 8, 12 e 16 exigem o talento anterior do **mesmo** caminho de subclasse.

**Limite padrão:** 4 talentos de subclasse (um por janela) + Ascensao no 20. O extra universal do nv. 12 não substitui o talento de subclasse — e adicional se o Mestre permitir.

**Nivel 2:** Escolha a subclasse; ganha a **Passivo de Assimilação** passiva (Cap. 4 e Cap. 12).

### Talentos e Pontos de Acao (mesa digital)

Alem dos efeitos narrativos de cada talento (Cap. 12), muitos caminhos alteram a **economia de PA** no VTT:

| Tipo de bonus | Quando aparece | Efeito |
|---------------|--------------|--------|
| **+1 PA maximo** | Em geral talentos de nv. **8** (alguns nv. 16) | Soma ao PA maximo da tabela do Cap. 2.6 |
| **−1 PA no custo** | Talentos de nv. **4** (e alguns 8/12) | Reduz o custo da acao indicada (arma, magia, habilidade) |
| **Afinidade Arcanica** | Mago, Clérigo, Druida, Bardo, Artifice **nv. 5** | Magias com custo 2+ PA: −1 PA (min. 1) — nao exige talento |

**Tabela por subclasse:** Cap. **12.0**. O Mestre pode ignorar PA na mesa puramente narrativa (sem VTT); neste caso use acao / acao bonus / movimento do Cap. 3.1 classico.

### Balanceamento (classes vs monstros)

Use a **faixa de andar** (Livro do Mestre, Cap. 21) e o **escalonamento** quando o grupo estiver acima do nivel do ficha do monstro.

| Faixa | Referencia |
|-------|------------|
| Nv. 1–4 | 1–2 inimigos Comuns por PC; CA 8–14; evite 3+ Hobgoblins sem flanquear |
| Nv. 5–8 | Elites e pares; Ladino/Guerreiro com subclasse definem DPR |
| Nv. 9–12 | Intermediarios + controle; Clérigo/Druida sustentam |
| Nv. 13+ | Lendários com Resistência Lendaria; preparar fogo/luz vs mortos-vivos |

**Abismos conhecidos (ajuste de mesa):** Hobgoblin CA 18 no nv. 3 e duro sem Vantagem — use moral ou versao nv. 2. Guerreiro nv. 17+ com 4 ataques supera ficha estática se não escalar HP. Mago 1d6 HP exige distancia. **Corsario de Cripta** vs **Clérigo do Limiar:** mesmo tema, Ladino = furtivo/aggro; Clérigo = servos/magia/`Desejo de Morte`.

---

## CAPÍTULO 12 — CAMINHOS DE SUBCLASSE (DIETA MARCIAL)

> **Nota de edicao:** Este capitulo substitui as arvores genericas de talentos por classe (Caminho do Acougueiro/Bastiao, Predador/Guia, etc.). A identidade mecanica vem da **Subclasse (Cap. 4)** escolhida no Nivel 2.

### 12.0 Pontos de Acao e talentos de subclasse (VTT)

Na mesa digital, talentos abaixo **somam-se** a **Afinidade Arcanica** (conjuradores nv. 5) e as regras do Cap. 3.1. **−1 PA** nunca reduz abaixo de **0**. Varias reducoes no **mesmo** conjuro **acumulam**.

#### +1 PA maximo (talento)

| Classe | Talentos (nv. tipico) |
|--------|------------------------|
| Guerreiro | *Maestria de Acougue* (8), *Sangue de Predador* (16) |
| Patrulheiro | — (talentos focam **−PA** em ataques a distancia; ver abaixo) |
| Bárbaro | *Instinto Roubado* (8), *Coracao Duplo* (12), *Sobredose Controlada* (16) |
| Mago | *Forno de Campo*, *Camara Fria Portatil*, *Cultura Viva*, *Sopa de Resistencia*, *Banquete Minimo* (8); *Brasas Persistentes*, *Envelhecimento Instantaneo*, *Transmutacao Enzimatica*, *Festa Hipnotica* (16) |
| Clérigo | *Fermento Sagrado* (8), *Disciplina Vazia*, *Ecologia Sagrada* (8); *Aura Sagrada*, *Corpo Templo*, *Bencao do Forno*, *Sincretismo*, *Colheita de Alma* (16) |
| Bardo | *Menu de Expedicao* (8), *Cancao Ebria* (12), *Brinde de Batalha*, *Barril Explosivo*, *Encanto Culinario* (16) |
| Druida | *Podridao Fertil* (8), *Fusao Biomagica* (8); *Grande Decomposicao*, *Caca Alpha*, *Floresta em Miniatura* (16) |
| Artifice | *Catalisador*, *Fogareiro Portatil* (8); *Forja Rapida*, *Motor de Vapor Menor*, *Mutageno de Batalha*, *Engenho de Caca* (16) |
| Ladino | — (reducoes de custo; ver abaixo) |

#### −1 PA no custo (talento)

| Classe | Talento | Aplica-se a |
|--------|---------|-------------|
| **Guerreiro** | *Corte Limpo* (4) | 1º golpe de **arma** no turno |
| **Patrulheiro** | *Tiro de Precisao* (4) | Ataques a **distancia** (arma) |
| **Ladino** | *Toque Fantasmal*, *Passo entre Sombras* (4/8) | **Habilidades** |
| | *Aplicacao Rapida* (8) | **Arma** ou **habilidade** |
| | *Arremesso Ritmico* (4) | Arma custo **2+ PA** |
| **Bárbaro** | *Rush Doce* (8), *Mordida do Coracao* (4) | **Habilidades** |
| **Mago** | *Chama Controlada*, *Combustao Arcana* | Magias **fogo** |
| | *Gelar Ingrediente*, *Escudo de Geada* | Magias **frio** |
| | *Fermentacao Acelerada* | Qualquer **magia** |
| | *Nuvem Bacteriana*, *Brasas Persistentes*, *Nevoa de Caldeira* | Magias de **area** |
| | *Caldo Corrosivo* | Magias **acido** / **veneno** |
| | *Doce Encantador* | Qualquer **magia** |
| | *Acucar Cristalizado* (12) | Magias custo **2+ PA** |
| **Clérigo** | *Purificar Veneno*, *Pao da Manha* | **Magia** e **habilidade** |
| | *Purificacao Abencoada*, *Golpe do Jejum* | **Magias** |
| | *Mesa Abundante* | Magias de **area** |
| | *Dominio do Limiar*, *Colheita de Alma* | Magias **necroticas** |
| **Bardo** | *Harmonizacao de Tacas* | **Magia** e **habilidade** |
| | *Menu de Expedicao*, *Fermento de Masmorra* | **Habilidades** |
| | *Cancao Ebria*, *Nota Picante* | **Magias** |
| | *Sinfonia de Ervas* | Magias de **area** |
| **Druida** | *Esporos Necroticos* | **Necrotico** |
| | *Toque de Bolor*, *Vinha Agarradora*, *Semente Guardia* | **Magias** |
| | *Forma Aprimorada* | **Habilidades** (ex.: Forma Selvagem) |
| | *Tremor Leve* | **Trovao** / **forca** |
| **Artifice** | *Panela Viva* | **Habilidades** |
| | *Fogareiro Portatil* | **Fogo** (magia/habilidade) |
| | *Seringa Basica* | **Magia** e **habilidade** |
| | *Bomba de Glandula* | Magias de **area** |
| | *Laboratorio de Campo* (12) | Magias **2+ PA** |
| | *Armadilha Biologica* | **Habilidades** |

**Referencia VTT:** `data/character/pa-modifiers.json` (ids em kebab-case, ex. `chama-controlada`).

---

## Indice — 34 Subclasses por Classe

| Classe | Subclasse |
|--------|-----------|
| **Guerreiro** | Caçador de Feras |
| | Quebrador de Carapaças |
| | Cavaleiro Draconico |
| | Sentinela das Profundezas |
| **Patrulheiro** | Caçador do Céu |
| | Explorador de Esporos |
| | Rastreador de Escamas |
| | Mestre de Enxame |
| **Ladino** | Sombra Etérea |
| | Forma Amorfa |
| | Ladrao de Glandulas |
| | Corsario de Cripta |
| **Mago** | Piromante das Brasas |
| | Criomante de Conservacao |
| | Mago Alquímico |
| | Alquimista Ácido |
| | Mago dos Encantos |
| **Clérigo** | Sacerdote da Purificacao |
| | Monge Ascético |
| | Clérigo do Pao da Vida |
| | Pastor de Quimeras |
| | Clérigo do Limiar *(Trilha Necromantica)* |
| **Bárbaro** | Devorador de Coracoes |
| | Mandibula de Ferro |
| | Colosso do Gelo |
| | Frenetico do Acucar |
| **Bardo** | Estratega de Masmorra |
| | Bardo Fermentador |
| | Dancarino das Facas |
| | Cantor dos Venenos |
| **Druida** | Circulo da Decomposicao |
| | Circulo do Superpredador |
| | Circulo da Simbiose |
| | Circulo do Solo Vivo |
| **Artífice** | Ferreiro de Utensilios |
| | Engenheiro de Explosivos |
| | Biologo Alquimico |
| | Construtor de Armadilhas |

---

## Regras

### Escolha e identidade
- **Nivel 2:** escolhe **uma** Subclasse listada no Capítulo 4. Ganha imediatamente a **Passivo de Assimilação** passiva da subclasse (bonus ativo após Refeicao Comum ou melhor, como o Bônus Passivo de Sobrevivência da classe).
- A subclasse define **identidade de combaté e culinaria** — não ha mais caminhos genericos duplicados por classe.
- Especialidade alimentar indica quais monstros/ingredientes **otimizam** a dieta; outras refeicoes ainda ativam Bônus Passivo de Sobrevivência, mas não os efeitos da Passivo de Assimilação.

### Talentos obrigatorios do Caminho
- **Niveis 4, 8, 12 e 16:** em cada janela, o personagem escolhe **exatamente 1** talento do **seu** Caminho de Subclasse (cadeia com pre-requisito).
- **Nivel 8** exige o talento de nv. 4 do mesmo caminho; **nv. 12** exige o de nv. 8; **nv. 16** exige o de nv. 12.
- **Nivel 20:** ganha a **Ascensao** (capstone) da subclasse — não conta como um dos 4 talentos de janela.

### Talentos Universais (Cap. 13)
- Por padrão, **não** ha talento extra nas janelas 4/8/12/16 — apenas o da subclasse.
- **Opcional (Mestre):** pode permitir **1** Talento Universal extra **somente** na janela do **Nivel 12**, OU (raro, narrativa forte) permitir **trocar** a Ascensao de nv. 20 por um Talento Universal de nv. 20 equivalente — o personagem perde o capstone da subclasse.

### Integracao com progressao de classe
- **Guerreiro:** Ataque Extra em nv. 5 (2 ataques), 11 (3), 17 (4) — soma-se aos talentos de subclasse.
- **Ladino:** Ataque Furtivo escala normalmente; talentos de subclasse podem modificar tipo de dano ou condições do furtivo.
- **Bárbaro:** Furia e talentos de subclasse interagem onde indicado.
- **Mago / Clérigo / Bardo / Druida / Artífice:** magias exclusivas de subclasse (Cap. 19) **somam-se** ao grimorio ou lista de preparacao e **não** substituem talentos de caminho.

### Culinaria em masmorra (estilo expedicao)
- Muitos talentos referem **Extração**, **Estudo de Anatomia**, **qualidade de ingrediente** e **refeicao de campo** — assumem o sistema de Parte V (Alimentacao e Culinaria Biomágica).
- Quando um talento diz "ingrediente intacto", significa qualidade máxima para aquela parte sem teste adicional de Extração.

---

# CAMINHOS POR SUBCLASSE

---

## GUERREIRO

### Caçador de Feras (Guerreiro)

**Dieta nv.2:** Ao comer carne vermelha de feras e bestiais, ganha +2 FOR e regeneração de 3 HP por turno por 4 horas.

**Nv 4 — Corte Limpo:** Ataques contra feras e bestiais ignoram 3 pontos de CA. Acertos críticos causam sangramento (2d4 HP no inicio do turno do alvo, 3 turnos). Criaturas mortas por crítico rendem o triplo de porcoes de carne.

**Nv 8 — Maestria Voraz (requer Corte Limpo):** +4 permanente em Extração ao processar feras. Como ação bonus, pode Extração um monstro bestial vivo acima de 25% HP — o alvo fica Atordoado 1 turno e perde 1d10 HP. Uma vez por combate.

**Nv 12 — Abaté Perfeito (requer Maestria Voraz):** Uma vez por turno, se reduzir um inimigo a 0 HP com um único ataque corpo a corpo, todos os ingredientes da carcaca ficam intactos (qualidade superior automatica). Com 2+ ataques por ação (nv. 5+), pode declarar qual ataque e o "abate" antes de rolar.

**Nv 16 — Sangue de Predador (requer Abaté Perfeito):** Como ação bonus, consome coracao de fera (inventário ou extraido na hora): recupera 2d10 HP e ganha +3 em ataques corpo a corpo até o fim do combate. Usos: CON por descanso curto.

**Nv 20 — Ascensao — Legado do Predador:** Mutacoes biomágicas obtidas de feras duram 48 horas em vez de 24. Uma vez por descanso longo, pode assumir por 10 minutos um traco de predador supremo (+4 FOR, garras 2d6, sentido de cheiro 18m). Enquanto ativo, cada acerto crítico em fera ou bestial cura 1d10 HP.

---

### Quebrador de Carapaças (Guerreiro)

**Dieta nv.2:** Ao comer artropodes e carapaceos, a pele endurece — imunidade temporária a acertos críticos contra você e +2 CA por 8 horas.

**Nv 4 — Percussao Penetrante:** Ataques com armas contundentes ou de impacto ignoram 5 pontos de CA de criaturas com carapaça natural ou armadura nao-metalica pesada. +1d6 dano contra insetoides e crustaceos.

**Nv 8 — Estrutura Quitinosa (requer Percussao Penetrante):** Enquanto a dieta estiver ativa, +4 CA adicional (cumulativo com a dieta). Escudo e armadura media contam como +1 slot de protecao contra crítico (primeiro crítico por combaté vira acerto normal).

**Nv 12 — Esmagamento Total (requer Estrutura Quitinosa):** Ao acertar um ataque contundente, pode escolher destruir a carapaça do alvo: -4 CA permanente até reparar/armadura nova, e você extrai 1 porcao de quitina intacta. Uma vez por alvo por combate.

**Nv 16 — Corpo de Crustaceo (requer Esmagamento Total):** Resistência a dano perfurante e cortante enquanto dieta ativa. Reacao: ao sofrer dano fisico, reduz 1d10+CON (minimo 1). Usos: CON por descanso curto.

**Nv 20 — Ascensao — Carapaça Viva:** +2 CA base permanente. Uma vez por descanso longo, endurece a pele em carapaça viva (10 min): imune a crítico, resistência a perfurante/cortante/contundente, e ataques desarmados seus causam 2d8+FOR perfurante.

---

### Cavaleiro Draconico (Guerreiro)

**Dieta nv.2:** Ao consumir repteis ou draconideos, ganha resistência a um tipo elemental (escolha ao comer) e baforada curta 2d6 (ação bônus, cone 4,5m, 1/combate).

**Nv 4 — Escama de Wyrm:** Armadura ou escudo reforcado com couro draconico concede +1 CA. Imune a medo de dragoes e reptis gigantes.

**Nv 8 — Ira Draconica (requer Escama de Wyrm):** Baforada da dieta passa a 4d6 e empurra alvos 3m (FOR CD 14). Se você ja tem 2+ ataques por acao, pode substituir um ataque da ação por baforada.

**Nv 12 — Heranca de Sangue (requer Ira Draconica):** Resistência elemental da dieta vira **imunidade** ao tipo escolhido enquanto dieta ativa. Primeiro ataque corpo a corpo em cada combaté causa +2d6 do tipo elemental.

**Nv 16 — Majestade do Dragão (requer Heranca de Sangue):** Acao bonus: Presenca Aterrorizante (9m, SAB CD 15 ou Amedrontado 1 min, reteste no fim do turno). Criaturas de tipo reptil/draconico tem Desvantagem no save.

**Nv 20 — Ascensao — Ascensao Draconica:** 10 minutos, 1/descanso longo: asas (voo 12m), baforada ilimitada no tipo elemental, +4 FOR, escamas +2 CA. Ao terminar, deve comer uma porcao draconica ou sofre 1 nivel de Exaustao até a proxima refeicao.

---

### Sentinela das Profundezas (Guerreiro)

**Dieta nv.2:** Ao comer aquaticos e anfibios, ganha respiração aquatica, nado 12m/turno e pele escorregadia (+2 em testes para escapar agarrao) por 8 horas.

**Nv 4 — Combaté Subaquatico:** Sem penalidade de ataque ou movimento sob agua. Em terreno encharcado ou chuva, +1 CA por escorregadio.

**Nv 8 — Pele Anfibia (requer Combaté Subaquatico):** Ignora terreno dificil molhado/lodoso. Pode agarrar com vantagem em oponentes em superficie molhada.

**Nv 12 — Pressao das Profundezas (requer Pele Anfibia):** Imune a dano de pressao, sufocamento por mergulho e efeitos de "puxar para o fundo". Aliados adjacentes em agua profunda podem respirar se você permitir (ação bônus, 8h).

**Nv 16 — Mestre das Aguas Negras (requer Pressao das Profundezas):** Enquanto submerso ou em chuva forte: +2 CA e **+1 ataque** por ação de Ataque (cumulativo com Ataque Extra de nv. 5/11/17). Fora d'agua, mantem +1 ataque se dieta ativa nas ultimas 4h.

**Nv 20 — Ascensao — Forma Abissal:** 1/descanso longo, 1 minuto: controla correntes em raio 9m (terreno dificil, empurra 3m no inicio do turno dos inimigos, aliados ganham nado). Seus ataques em agua causam +2d8 frio ou pressao (escolha ao ativar).

---

## PATRULHEIRO

### Caçador do Céu (Patrulheiro)

**Dieta nv.2:** Ao comer aves e voadores, visao no escuro perfeita até 36m e +9m de alcance em ataques a distancia por 8 horas.

**Nv 4 — Tiro de Precisao:** Primeiro ataque a distancia em cada combaté contra alvo com HP cheio causa +2d6 dano (estilo Primeiro Sangue). Se o alvo for voador, +3d6.

**Nv 8 — Rastreio Aereo (requer Tiro de Precisao):** Estudo de Anatomia em aves concede ignorar meia cobertura e tres quartos contra aquela especie. Pode localizar criaturas voadoras no mesmo andar por som de asa (Percepção automatica CD 12 para surpresa).

**Nv 12 — Olho de Falcao (requer Rastreio Aereo):** Marca uma Presa (ação bônus, 1/descanso curto): sabe direcao exata no andar; ataques a distancia com Vantagem se a Presa não tiver visto você neste combate.

**Nv 16 — Golpe Celeste (requer Olho de Falcao):** 1/descanso longo: um ataque a distancia ignora CA, resistências e imunidades fisicas; trata como crítico para dano e extracao (penas intactas).

**Nv 20 — Ascensao — Ataque de Mergulho:** Uma vez por combate, pode "mergulhar" de plataforma ou salto (minimo 3m de queda ou voo): ataque a distancia ou corpo a corpo com +4d6 e derruba Prostrado (DES CD 16). Se matar, recupera a munição ou arma e 1d10 HP de adrenalina.

---

### Explorador de Esporos (Patrulheiro)

**Dieta nv.2:** Ao comer flora e fungos de masmorra, imunidade a controle mental, ataques toxicos passivos leves (1d4 veneno em primeiro ataque por combate) e nuvem de esporos curativos no descanso (aliados recuperam 1d8 HP).

**Nv 4 — Identificacao de Flora:** Vantagem em Natureza e Coccao com fungos/plantas. Pode identificar esporos toxicos ou curativos sem kit em 1 minuto.

**Nv 8 — Flechas de Esporo (requer Identificacao de Flora):** Prepara 3 municoes de esporo por descanso longo: ao acertar, alvo testa CON CD 14 ou Envenenado; aliados podem usar esporo curativo (cura 2d8, ação bonus).

**Nv 12 — Nuvem de Cura (requer Flechas de Esporo):** No descanso curto, espalha esporos curativos (raio 6m): aliados recuperam 2d8+SAB HP e removem 1 condicao de veneno ou doenca leve.

**Nv 16 — Rede de Raizes (requer Nuvem de Cura):** 1/descanso longo em área com vegetacao ou fungos: raizes Restringem inimigos em raio 6m (FOR CD 15, metade velocidade se passar). Aliados no raio tem cobertura parcial (+2 CA).

**Nv 20 — Ascensao — Florescimento Toxico:** 10 minutos, 1/descanso longo: nuvem 9m de esporos — inimigos 4d8 veneno + Envenenado (CON CD 16); aliados imunes e curados 2d8. Apos efeito, nascem 1d4 porcoes de fungo raro no chao.

---

### Rastreador de Escamas (Patrulheiro)

**Dieta nv.2:** Ao comer repteis e basiliscos, imunidade a petrificação e camuflagem de pele (Vantagem em Furtividade em terreno rochoso) por 8 horas.

**Nv 4 — Rastejamento Silencioso:** Vantagem em Furtividade e Iniciativa em cavernas e ruinas. Primeiro ataque em surpresa causa +2d6 se dieta ativa.

**Nv 8 — Sentido Termico (requer Rastejamento Silencioso):** Detecta criaturas vivas a 18m mesmo invisiveis ou atras de parede fina (1m). Nao funciona em constructos frios.

**Nv 12 — Escamas Adaptativas (requer Sentido Termico):** Resistência a frio e fogo enquanto dieta ativa. Reacao: +4 CA contra um ataque que você viu (escamas eriçadas). Usos: SAB por descanso curto.

**Nv 16 — Olhar Frio (requer Escamas Adaptativas):** 1/descanso curto: olhar reptiliano (1 alvo, 18m, CON CD 15 ou Lentidão 1 min; falha por 5+ = Paralisado 1 turno). Criaturas ja Envenenadas tem Desvantagem no save.

**Nv 20 — Ascensao — Forma de Reptil:** Transformacao parcial 10 min (1/descanso longo): escamas +2 CA, escalada 9m, mordida 2d6+DES perfurante como ação bonus, imunidade a petrificação. Pode extrair glândula de petrificação de basilisco morto com Vantagem em Extração.

---

### Mestre de Enxame (Patrulheiro)

**Dieta nv.2:** Ao comer pragas e insetos menores, conexao telepatica com insetos locais — detecta vibracoes no chao a 15m e localiza invisiveis "sentindo" o enxame.

**Nv 4 — Sentido de Formigueiro:** Aliados a 3m ganham +2 em Percepção passiva. Você não pode ser surpreendido por criaturas Medias ou menores.

**Nv 8 — Direcao de Enxame (requer Sentido de Formigueiro):** Acao bonus: direciona insetos para um quadrado — próximo ataque contra ocupante tem Vantagem, ou aliado naquele quadrado ganha +2 CA até seu próximo turno. Usos: SAB por descanso curto.

**Nv 12 — Convocacao de Insetos (requer Direcao de Enxame):** 1/descanso longo: enxame ocupa 6m (dano 2d8 perfurante no turno deles a quem entrar, velocidade metade). Dura 1 minuto ou até dispersar (fogo área 3d6+).

**Nv 16 — Mente Coletiva (requer Convocacao de Insetos):** Compartilha sentidos com aliados a 9m (todos veem o que um viu neste turno, 1 rodada). Mapa mental de armadilhas no andar após 30 min de exploracao (estilo Cartografo Nato, apenas passagens e armadilhas mecanicas).

**Nv 20 — Ascensao — Infestacao:** 1/descanso longo: infesta o andar — por 1 hora, você sempre sabe numero aproximado e tipo de criaturas Medias- no raio 30m; inimigos que descansam no andar sofrem 2d6 veneno ao acordar (CON CD 16 metade). Aliados ganham +3 em sobrevivencia e forrageio.

---

## LADINO

### Sombra Etérea (Ladino)

**Dieta nv.2:** Ao comer ectoplasma e residuos espirituais, pode ficar intangivel 1 turno por combaté e Ataque Furtivo ganha +1d6 necrótico.

**Nv 4 — Toque Fantasmal:** Ataque Furtivo pode aplicar Lentidão espiritual (velocidade -3m, 1 min, CON CD 13). Uma vez por combate, atravessa parede fina (30cm) como movimento.

**Nv 8 — Passo entre Sombras (requer Toque Fantasmal):** Intangibilidade da dieta sobe para 2 turnos/combate. Ao sair de intangibilidade, próximo ataque furtivo tem Vantagem automatica.

**Nv 12 — Absorção de Eter (requer Passo entre Sombras):** Ao reduzir espiritual a 0 HP, absorve fragmento: recupera 1 uso de intangibilidade ou 1d8 HP. Ataques furtivos contra espirituais causam dano máximo nos dados de furtivo.

**Nv 16 — Forma Translucida (requer Absorção de Eter):** 1/descanso longo, 1 minuto: semi-invisivel (ataques contra você com Desvantagem; seus furtivos +2d6). Comunica telepaticamente com aliados a 18m.

**Nv 20 — Ascensao — Mente Morta:** Imune a medo e encantamento. 1/combate, quando um aliado cai a 0 HP, reacao: fica intangivel até o fim do turno e faz um Ataque Furtivo contra quem causou o dano com crítico em 19-20.

---

### Forma Amorfa (Ladino)

**Dieta nv.2:** Ao comer amorfos e slimes, corpo elastico — passa por frestas de 15cm, escapa agarramento automaticamente, resistência a ácido.

**Nv 4 — Flexibilidade Extrema:** Vantagem em testes para escapar e em Furtividade em tubos. Ataque Furtivo em alvo Agarrado causa +1d6 ácido.

**Nv 8 — Absorção de Impacto (requer Flexibilidade Extrema):** Reacao ao dano contundente ou de queda: reduz metade. Pode "rebater" 1d10 ácido ao atacante se o dano foi reduzido a 0.

**Nv 12 — Forma Fluida (requer Absorção de Impacto):** 1/descanso curto, 3 turnos: imune a agarrao, crítico contra você vira acerto normal, deslocamento +3m. Ataques furtivos aplicam Desarme leve (objeto cai) em falha de DES CD 14.

**Nv 16 — Corpo de Gel (requer Forma Fluida):** Resistência a ácido e perfurante. Pode se comprimir em espaco de 5cm por 1 rodada (ação bônus). Extrair nucleo de slime morto: Vantagem em Extração, qualidade máxima.

**Nv 20 — Ascensao — Dissolucao:** 1/descanso longo: dissolve armadura nao-mágica de metal em contato (1 peca, 1 minuto fora de combate) OU em combaté toca alvo — 6d8 ácido e equipamento leve corroi (DES CD 16 metade dano). Ataque Furtivo máximo (10d6 em nv. 20) contra alvo sem armadura pesada ganha +2d6.

---

### Ladrao de Glandulas (Ladino)

**Dieta nv.2:** Ao beber veneno purificado de peconhentos, ataques ganham +1d4 veneno passivo e saliva corrosiva (interrogatorio, +2 em Intimidacao com criaturas que sentem dor).

**Nv 4 — Resistência a Veneno:** Imune a veneno comum; metade de veneno magico. Pode aplicar veneno de monstro a arma como ação bônus (3 ataques de duração).

**Nv 8 — Aplicacao Rápida (requer Resistência a Veneno):** Mantem até 3 venenos ativos em armas diferentes. Ataque Furtivo pode dobrar dado de veneno em vez de somar furtivo (escolha ao acertar).

**Nv 12 — Veneno Personalizado (requer Aplicacao Rápida):** Prepara 1 veneno "assinatura" por descanso longo com efeito de monstro estudado (paralisia leve, cegueira, etc., CON CD 14). Ingredientes de glândula extraidos em furtivo crítico sao sempre superiores.

**Nv 16 — Imunidade Total (requer Veneno Personalizado):** Imune a veneno magico. 1/combate: Golpe Envenenado — se Ataque Furtivo acertar, alvo testa CON CD 16 ou Envenenado e perde 1 ação na proxima rodada.

**Nv 20 — Ascensao — Veneno Lendário:** 1/descanso longo, coat veneno lendario (24h): armas causam +2d8 veneno; seu sangue envenena quem te morder (4d8, CON CD 17). Ataque Furtivo contra Envenenado pode aplicar Um Golpe, Uma Morte em alvos com 25% HP ou menos (CD 16 CON negar).

---

### Corsario de Cripta (Ladino)

**Dieta nv.2:** Ao comer osseos e mortos-vivos corporeos, resistência a necrótico e pode fingir morte perfeita (zera aggro até se mover ou 1 hora).

**Nv 4 — Sussurro de Tumba:** Comunica com mortos-vivos Int 3+ como se compartilhasse idioma por 1 minuto (não controla). Vantagem em Ataque Furtivo contra mortos-vivos distraidos.

**Nv 8 — Aparencia Cadaverica (requer Sussurro de Tumba):** Parece morto-vivo para inspecao casual. Pode entrar em criptas sem alarme social. Fingir morte agora e ação bonus.

**Nv 12 — Aura de Morte (requer Aparencia Cadaverica):** Raio 3m: inimigos vivos tem -1 em ataques (medo visceral). 1/descanso curto, comanda 1 morto-vivo Fraco (HP 15, 1 ataque) por 10 min — ele pode Extração para o grupo.

**Nv 16 — Controle de Morto-Vivo (requer Aura de Morte):** Ate 3 mortos-vivos Fracos ou 1 Medio (estatisticas do Mestre) obedecendo por 1 hora. Ataques furtivos contra alvos adjacentes a seu morto-vivo ganham +2d6 necrótico.

**Nv 20 — Ascensao — Senhor da Cripta:** 1/descanso longo: levanta esqueleto de monstro Grande morto na sessao (metade HP original, ataques do monstro sem magia). Enquanto ativo, você tem resistência a necrótico e crítico em mortos-vivos em 19-20. Ossos extraidos por você contam como ingrediente Lendário menor.

---

## MAGO

### Piromante das Brasas (Mago)

**Dieta nv.2:** Refeicoes assadas por você maximizam recuperacao de Mana do grupo no descanso; feiticos de fogo +1d6 vs gelo/agua e dispensam componentes de fogo.

**Nv 4 — Chama Controlada:** Truque `Chama de Fogareiro` extra. 1/descanso curto, maximize dano de um feitico de fogo de nivel 3 ou menor.

**Nv 8 — Forno de Campo (requer Chama Controlada):** Prepara refeicao assada em combaté (10 min) ou ação bônus "lanche carbonizado" (1d8 HP temp a aliado adjacente). Aliados que comem ganham resistência a frio 1 hora.

**Nv 12 — Combustao Arcana (requer Forno de Campo):** Ao lancar feitico de fogo, pode acender ingrediente inflamavel em alcance — +2d6 no próximo ataque de aliado contra alvo naquele quadrado.

**Nv 16 — Brasas Persistentes (requer Combustao Arcana):** Feiticos de fogo deixam brasas 1 rodada (2d6 fogo a quem iniciar turno no espaco). `Bola de Fogo` pode não incendiar comida aliada (variante Forno Arcano, Cap. 19).

**Nv 20 — Ascensao — Coracao do Forno:** 1/descanso longo, 1 minuto: aura 6m de calor — aliados +2 em Coccao e recuperam 1 espaco de magia de nivel 3 ou menor ao fim; inimigos 4d10 fogo no inicio do turno (DES CD 17 metade). Seus feiticos de fogo ignoram resistência enquanto ativo.

---

### Criomante de Conservacao (Mago)

**Dieta nv.2:** Carnes dry-aged mágicamente concedem aura 1d4 frio a adjacentes no inicio do turno inimigo e +3 CA temporária de gelo (8h).

**Nv 4 — Gelar Ingrediente:** Pode preservar ingredientes indefinidamente com toque (1 min). Magia `Gelo de Conservação` (Cap. 19) no grimorio.

**Nv 8 — Camara Fria Portátil (requer Gelar Ingrediente):** Bolsa extradimensional fria: 50 kg de carne sem estragar. Descanso longo em grupo: +1d8 HP extra por porcao conservada.

**Nv 12 — Escudo de Geada (requer Camara Fria Portátil):** Reacao: +5 CA vs um ataque corpo a corpo (gelo quebra a lâmina). Usos: INT por descanso curto. Aliados adjacentes +1 CA.

**Nv 16 — Envelhecimento Instantaneo (requer Escudo de Geada):** 1/descanso longo: envelhece ingrediente 10 anos em 1 rodada (efeito fermentacao ou dry-age superior). Proximo prato do grupo conta como Gourmet automatico.

**Nv 20 — Ascensao — Zero Absoluto:** 1/descanso longo: raio 9m, 1 rodada — inimigos CON CD 17 ou 6d8 frio e velocidade 0; criaturas de fogo/gelo falham automaticamente. Aliados na área preservam ingredientes em inventário e imunidade a frio ambiental 24h.

---

### Mago Alquímico (Mago)

**Dieta nv.2:** Pratos fermentados garantem imunidade a ilusao ao grupo por 8h e removem doenca ou maldicao leve após refeicao.

**Nv 4 — Fermentação Acelerada:** Magias `Envelhecer Matéria` e `Fermentação Acelerada` (Cap. 19). Transforma Comum em Incomum com 1 espaco nv. 1 em 1 minuto.

**Nv 8 — Cultura Viva (requer Fermentação Acelerada):** Cria antidoto cultural para veneno identificado (5 min, 3 doses). Aliados que comem seu fermentado ganham Vantagem em saves de ilusao e encantamento 24h.

**Nv 12 — Nuvem Bacteriana (requer Cultura Viva):** 1/descanso curto: nuvem 4,5m — inimigos CON CD 14 ou Envenenado "fermentado" (Desvantagem em Concentracao); aliados curam 2d8+INT.

**Nv 16 — Transmutação Enzimatica (requer Nuvem Bacteriana):** Combina dois ingredientes incompativeis em hibrido 1/descanso longo (propriedades de ambos, 24h). Veneno vira antidoto correspondente.

**Nv 20 — Ascensao — Grande Barril:** 1/semana: barril de fermento lendario — grupo inteiro imune a ilusao, doenca e maldicao moderada por 7 dias; 1/dia cada um pode rerrolar um save mental falho.

---

### Alquimista Ácido (Mago)

**Dieta nv.2:** Sopas densas permitem regurgitar ácido 2d6 ou expelir nevoa venenosa (CD 13 CON ou Envenenado) 1/combaté após refeicao propria.

**Nv 4 — Caldo Corrosivo:** Truque de acidificar liquido. +2 em Coccao para sopas. 1/descanso longo: cone 4,5m 4d6 ácido (INT CD 14 metade) após Gourmet proprio.

**Nv 8 — Sopa de Resistência (requer Caldo Corrosivo):** Refeicao de sopa concede resistência a ácido e veneno ao grupo 8h. Você pode armazenar 1 "engolida" de ácido para usar reacao (3d6 ácido ao ser golpeado corpo a corpo).

**Nv 12 — Nevoa de Caldeira (requer Sopa de Resistência):** Nevoa 6m: CON CD 15 ou Envenenado; visibilidade reduzida para inimigos. Aliados dentro veem normalmente.

**Nv 16 — Extracao Liquida (requer Nevoa de Caldeira):** Extração liquido: de monstros amorfos extrai 1d4 porcoes extras com teste de Coccao CD 14. Feiticos de ácido +2d6.

**Nv 20 — Ascensao — Maré Acida:** 1/descanso longo: linha 18m x 3m de caldo fervente — 8d8 ácido e terreno dificil 1 min. Se matar com este dano, corpo dissolve em ingredientes alquimicos (qualidade superior automatica).

---

### Mago dos Encantos (Mago)

**Dieta nv.2:** Glicose arcana concede 1 magia de Encantamento nv. 1-3 por dia sem gastar espaco (escolhida ao preparar, Cap. 19).

**Nv 4 — Doce Encantador:** Truque `Doce Confuso` (Cap. 19). Inspirar aliado com doce: +1d4 em um teste social ou Coccao em 1 hora.

**Nv 8 — Banquete Minimo (requer Doce Encantador):** Acao bonus: distribui doces (3 aliados) — +1d6 HP temp e Vantagem no próximo save de Sabedoria.

**Nv 12 — Acucar Cristalizado (requer Banquete Minimo):** 1/descanso curto: cristal de acucar arcano — prende 1 inimigo Pequeno/Medio (DES CD 15 ou Restringido 1 min). Ou cura aliado 3d8+INT.

**Nv 16 — Festa Hipnotica (requer Acucar Cristalizado):** 1/descanso longo: 9m, criaturas com INT 4+ testam SAB CD 16 ou Encantados (não atacam grupo) por 1 rodada; aliados recuperam 2d8 HP.

**Nv 20 — Ascensao — Imperio do Doce:** Encantamento diario sobe para nv. 4 sem espaco 1x/dia. Grupo que come seu banquete semanal (preparacao 1h) tem Vantagem contra medo e charm por 24h e +2 CD em suas magias de encantamento.

---

## CLERIGO

### Sacerdote da Purificacao (Clérigo)

**Dieta nv.2:** Carnes purificadas por reza concedem +3 em ataques contra aberracoes e mortos-vivos e curam maldicoes leves do grupo após a refeicao.

**Nv 4 — Purificar Veneno:** `Purificar Veneno` 3x/dia sem espaco nv. 1 (Cap. 19). Toque purifica 1 porcao de carne amaldicoada.

**Nv 8 — Laminas Abencoadas (requer Purificar Veneno):** Armas do grupo contam como mágicas vs mortos-vivos por 1 hora após benzer refeicao (ação bônus). +1d6 radiante em Ataque Furtivo de aliado contra morto-vivo (não empilha com furtivo do Ladino em excesso — use o maior bonus).

**Nv 12 — Purificacao Abencoada (requer Laminas Abencoadas):** Magia Cap. 19. 1/descanso longo remove maldicao moderada do grupo após ritual de 10 min e refeicao.

**Nv 16 — Aura Sagrada (requer Purificacao Abencoada):** Raio 3m: aliados +2 em saves vs necrótico e veneno; mortos-vivos tem Desvantagem em ataques contra aliados na aura.

**Nv 20 — Ascensao — Julgamento da Mesa:** 1/descanso longo: todos os inimigos mortos-vivos ou aberracoes em 9m — 8d8 radiante (SAB CD 17 metade) e não regeneram por 24h. Aliados que comeram sua refeicao purificada neste dia rerrolam 1 save falho cada.

---

### Monge Ascético (Clérigo)

**Dieta nv.2:** Após 8h sem comer, +4 em esquiva e dano radiante nos ataques; ao quebrar o jejum com refeicao, onda 3d8 radiante em 6m (CON CD 14 metade).

**Nv 4 — Disciplina Vazia:** Enquanto em jejum ativo, não precisa comer para manter Bônus Passivo de Sobrevivência da classe (não o da subclasse). +2 em Concentracao.

**Nv 8 — Golpe do Jejum (requer Disciplina Vazia):** Primeiro ataque após quebrar jejum causa +3d8 radiante extra. 1/combaté se permanecer em jejum: esquiva reacao +4 CA.

**Nv 12 — Jejum Prolongado (requer Golpe do Jejum):** Jejum seguro até 3 dias sem Exaustao (agua normal). No 3o dia, onda ao comer sobe para 5d8.

**Nv 16 — Corpo Templo (requer Jejum Prolongado):** Resistência a necrótico e veneno enquanto jejum 8h+. Cura mágica em você cura +2 HP por nivel de espaco.

**Nv 20 — Ascensao — Transfiguracao pelo Vazio:** 1/descanso longo: jejum instantaneo 1 minuto e explosao 10d8 radiante em 9m (inimigos CON CD 17); aliados curados 4d8. Proximas 24h: imune a fome forcada e veneno.

---

### Clérigo do Pao da Vida (Clérigo)

**Dieta nv.2:** Transforma musgos e plantas em pao que concede HP temporario extra (nivel x3) a todo o grupo ao amanhecer.

**Nv 4 — Pao da Manha:** Ritual (10 min, R): paes = nivel do Clérigo; quem come ao amanhecer ganha HP temp = nivel x3 (Cap. 19).

**Nv 8 — Fermento Sagrado (requer Pao da Manha):** Pao tambem remove 1 nivel de Exaustao leve (1 ou menos). 2 usos de ritual por descanso longo.

**Nv 12 — Mesa Abundante (requer Fermento Sagrado):** Refeicao de pao conta como Refeicao Comum+ para ativar dietas de todos que comem, mesmo sem fogueira completa.

**Nv 16 — Bencao do Forno (requer Mesa Abundante):** Aliados a 6m recuperam 1d8 HP no inicio do seu turno se comeram seu pao nas ultimas 8h.

**Nv 20 — Ascensao — Milagre do Pao:** 1/semana: alimenta até 50 criaturas com 1 refeicao — cada uma ganha HP máximo temp igual nivel x5 por 24h e imunidade a fome. Em combate, fragmento de pao como ação bônus cura 4d8+SAB.

---

### Pastor de Quimeras (Clérigo)

**Dieta nv.2:** Ao comer bestas mágicas complexas, canaliza aura de animal (ex.: Leao — aliados adjacentes Vantagem em ataques) por 8h.

**Nv 4 — Ecologia Sagrada:** Estudo de Anatomia em quimeras com Vantagem. Identifica qual traco animal a carne concedera antes de cozinhar.

**Nv 8 — Aura Dupla (requer Ecologia Sagrada):** Pode manter duas auras menores simultaneas (metade do bônus cada) ou uma aura maior (+1 aliados adjacentes em dano).

**Nv 12 — Chamado do Rebanho (requer Aura Dupla):** Convoca espirito-bestia Medio (HP 30, 1 ataque 2d6) por 10 min, 1/descanso longo. Espirito pode carregar 1 porcao de ingrediente sem estragar.

**Nv 16 — Sincretismo (requer Chamado do Rebanho):** Ao cozinhar quimera, grupo escolhe 2 mutacoes leves da lista da especie em vez de 1.

**Nv 20 — Ascensao — Cordeiro e Leao:** 1/descanso longo, 10 min: aura 9m — aliados +2 ataques/dano e imunes a medo; você assume tracos de Boss quimera ja consumido (asas, baforada ou escamas, a escolha do Mestre). Mortos-vivos animais fogem (SAB CD 17).

---

### Clérigo do Limiar (Clérigo) — *Trilha Necromantica*

**Dieta nv.2:** Carnes osseas ou de morto-vivo corporeo consumidas com rito do Limiar concedem resistência a necrótico e fazem mortos-vivos com INT 3 ou menos ignorarem você como primeiro alvo do combaté até você ataca-los ou usar necromancia hostil contra a especie.

**Nv 4 — Domínio do Limiar:** Comanda **servos** mortos-vivos (zumbi ou esqueleto reduzido: HP = 10 + nivel×3, CA = 8 + nivel÷4, ataque 1d6 + mod. SAB necrótico). Maximo de servos = min(3, mod. SAB). Agem na sua iniciativa (acao bônus para ordenar ataque ou movimento). Recupera 1 servo destruido por descanso longo se tiver carcaca. Servos podem Extração corpos mortos com metade do seu bônus de Extração.

**Nv 8 — Colheita de Alma (requer Domínio do Limiar):** Ao reduzir criatura viva a 0 HP, captura 1 fragmento de alma (inventário, max 3). Consumir fragmento: cura 2d8 + SAB OU lança 1 magia de Necromancia de nv. 3 ou menos sem gastar espaco (1/descanso longo). Fragmento alimenta `Animação de Mortos` sem componente de carcaca se usado no mesmo dia.

**Nv 12 — Sacrificio Ritual (requer Colheita de Alma):** Transfere HP proprio a aliado na taxa 1:2 (minimo 1 HP transferido). Pode manter Concentracao enquanto transfere. 1/descanso curto, pode sacrificar um servo para curar aliado 4d8 + nivel sem custo de HP.

**Nv 16 — Senhor da Fronteira (requer Sacrificio Ritual):** Imune a morte instantanea. Ao chegar a 0 HP, estado **liminar** 1 minuto: age normalmente, não pode ser curado, ao fim testa CON CD 17 — sucesso fica com 1 HP, falha morre (ou narrativa de Phylactery se campanha permitir).

**Nv 20 — Ascensao — Desejo do Limiar:** Desbloqueia a magia **Desejo de Morte** (Cap. 18) — pode prepara-la 1x após descanso longo sem gastar espaco de nv. 9. Servos ativos sobem para min(6, mod. SAB + 2) e usam estatisticas de Esqueleto Armado ou Zumbi de Masmorra do bestiário com HP dobrado. Uma vez por descanso longo, `Animação de Mortos` dura 24h sem Concentracao.

---

## BARBARO

### Devorador de Coracoes (Bárbaro)

**Dieta nv.2:** Ao comer coracao de predador, assimila traco instintivo da especie (faro, garras, regeneração) por 24h conforme o monstro.

**Nv 4 — Mordida do Coracao:** Em Furia, ação bônus comer coracao (monstro morto na sessao): +1d10 HP e estende Furia 2 turnos.

**Nv 8 — Instinto Roubado (requer Mordida do Coracao):** Durante Furia, traco assimilado e dobrado (ex.: faro 18m vira 27m). 1 ataque extra como ação bônus com -2 dano (estilo Ataque Frenetico).

**Nv 12 — Coracao Duplo (requer Instinto Roubado):** Pode armazenar 2 tracos de especies diferentes; troca com ação bonus. Críticos em Furia extraem coracao automatico.

**Nv 16 — Predador Alfa (requer Coracao Duplo):** Imune a medo em Furia. Ao cair abaixo 50% HP, +2 ataques e +2d6 dano até subir acima de 50%.

**Nv 20 — Ascensao — Legiao de Coracoes:** 1/descanso longo: consome coracao lendario — 10 min de Furia sem limite de usos, todos os tracos de predadores ja comidos nesta campanha ativos simultaneamente (Mestre limita a 3 efeitos fortes). HP máximo +20 até descanso longo.

---

### Mandibula de Ferro (Bárbaro)

**Dieta nv.2:** Mastigar exoesqueletos concede +1d6 perfurante em ataques desarmados (estilhacos entre os punhos) por 8h.

**Nv 4 — Mastigador:** Pode morder carapaça como ação bônus em agarramento: 2d6+FOR perfurante e alvo -2 CA até fim do turno dele.

**Nv 8 — Ossos como Arma (requer Mastigador):** Em Furia, ataques desarmados contam como magicos e +1d8. Pode quebrar escudo inimigo em crítico (DES CD 14).

**Nv 12 — Mandibula de Ferro (requer Ossos como Arma):** Resistência a perfurante fora de Furia; em Furia, imune a crítico. Mordida recupera 1d6 HP se dano causado >= 10.

**Nv 16 — Esmagar Cranio (requer Mandibula de Ferro):** 1/combaté em Furia: mordida em alvo Agarrado — se HP restante < 5d6+FOR, execucao narrativa (Mestre confirma) e você ganha +2 CA de restos de carapaça.

**Nv 20 — Ascensao — Titereiro de Quitina:** Furia transforma pele em carapaça total: +3 CA, garras 3d6 perfurante, resistência cortante/contundente. 1/descanso longo, mordida área (cone 3m) 6d6 perfurante.

---

### Colosso do Gelo (Bárbaro)

**Dieta nv.2:** Imunidade a frio e ignora 1 nivel de Exaustao por estocar calorias de criaturas gordurosas; pode reservar 1 refeicao para dia sem comer.

**Nv 4 — Reserva de Gordura:** Sem comer 24h, mantem dieta ativa. Em Furia, resistência a frio vira imunidade.

**Nv 8 — Avalanche (requer Reserva de Gordura):** Em neve ou gelo, deslocamento +6m e primeiro ataque em Furia derruba (FOR CD 15 Prostrado).

**Nv 12 — Hibernação de Combaté (requer Avalanche):** 1/descanso curto: 1 rodada "dormir" em Furia — próximo turno acorda com ação completa extra e 3d8 HP.

**Nv 16 — Pele de Mamute (requer Hibernação de Combate):** +2 CA em Furia. Aliados adjacentes em clima frio extremo não ganham Exaustao ambiental.

**Nv 20 — Ascensao — Inverno Eterno:** 1/descanso longo, 1 min: aura 9m de frio — inimigos 3d8 frio e velocidade metade; você tamanho Grande, +4 CON temporario, Furia automatica sem gastar uso. Terreno torna-se dificil para inimigos.

---

### Frenetico do Acucar (Bárbaro)

**Dieta nv.2:** Glicose mágica dobra velocidade e concede 1 ação bônus extra por combate; ao terminar, 1 nivel de Exaustao.

**Nv 4 — Pico de Acucar:** Acao bônus consumir doce: +3m e próximo ataque +1d6. Nao acumula crash até fim do combate.

**Nv 8 — Rush Doce (requer Pico de Acucar):** Em Furia após doce, ação bônus adicional pode ser ataque ou movimento. Crash reduzido: sem Exaustao se descanso curto apos.

**Nv 12 — Metabolismo Queimado (requer Rush Doce):** 2 doces por descanso longo sem crash duplo. Furia +2 DES temporario.

**Nv 16 — Sobredose Controlada (requer Metabolismo Queimado):** 1/combate: triplica ação bônus do doce — 2 ataques bônus ou movimento+dash+ataque.

**Nv 20 — Ascensao — Diabete Arcano:** 1/descanso longo: 5 min de hiper — velocidade dobrada, 2 acoes bônus por turno, +2d6 em todos os ataques em Furia automatica; ao fim, 2 niveis Exaustao recuperaveis 1 por descanso longo. Slimes de fruta mortos por você explodem em doce curativo 4d8 para aliados.

---

## BARDO

### Estratega de Masmorra (Bardo)

**Dieta nv.2:** Bebidas emparelhadas com prato maximizam dados de cura de magias do Bardo pelas proximas horas.

**Nv 4 — Forrageio de Taças:** Ao usar Inspiracao em quem vai cozinhar, alvo ganha +1d6 em Coccao/Forrageio por 1h (Cap. 19).

**Nv 8 — Menu de Expedicao (requer Forrageio de Taças):** Descanso curto com bebida sua: grupo recupera +1d8 HP extra e ativa dieta mesmo com refeicao Comum.

**Nv 12 — Reserva Envelhecida (requer Menu de Expedicao):** 1 magia de cura por descanso longo cura valor máximo dos dados se vinho correto foi consumido antes.

**Nv 16 — Brinde de Batalha (requer Reserva Envelhecida):** Acao bonus: aliado bebe — próximo ataque Vantagem e +1d8 dano. Usos: CAR por descanso curto.

**Nv 20 — Ascensao — Grande Cru:** 1/semana: banquete liquido — magias de cura do grupo dobram dados por 24h; 1/dia cada aliado rerrola save de veneno ou medo após brinde.

---

### Bardo Fermentador (Bardo)

**Dieta nv.2:** Cervejas de fungo concedem HP temporario igual ao dado de Inspiracao atual sempre que usa Inspiracao de Bardo.

**Nv 4 — Fermento de Masmorra:** Cria 3 cervejas por descanso longo (acao bônus beber: 1d8 HP temp + 1d6 Inspiracao extra ao próximo teste).

**Nv 8 — Ressaca Positiva (requer Fermento de Masmorra):** Aliado que bebe recupera 1 uso de habilidade de classe em descanso curto (1/dia por grupo).

**Nv 12 — Cancao Ebria (requer Ressaca Positiva):** 1/descanso curto, Cancao de Poder (1 min): aliados que ouvem +2 ataques e teste de resistências; inimigos SAB CD 15 ou Distraidos (-2 ataques).

**Nv 16 — Barril Explosivo (requer Cançao Ebria):** Arremessa barril (18m): 4d6 fogo + CON CD 15 ou Envenenado leve. Ingrediente de fungo necessario.

**Nv 20 — Ascensao — Festa dos Fungos:** 1/descanso longo: nuvem alegra 9m — aliados Vantagem em todos os saves mentais 10 min; inimigos com INT 6+ testam CAR CD 17 ou não atacam (encantamento) 1 rodada. Inspiracao de Bardo sobe 1 passo de dado (ex.: 1d8 para 1d10) até descanso longo.

---

### Dancarino das Facas (Bardo)

**Dieta nv.2:** Carnes magras de aves permitem usar Carisma em vez de Destreza para atacar e recuperar facas de trinchar lancadas.

**Nv 4 — Arremesso Ritmico:** Proficiencia em facas de trinchar como arma (1d6). Ataque a distancia com CAR. 1/descanso curto recupera 1d4 facas lancadas.

**Nv 8 — Danca de Laminas (requer Arremesso Ritmico):** Acao bonus: até 2 ataques com facas (CAR para acerto). Se acertar ambos em mesmo alvo, +1d6 furtivo "de palco".

**Nv 12 — Espectaculo Sangrento (requer Danca de Laminas):** 1/combate: performance 1 turno (CON CD 14 ou inimigos Desvantagem vs grupo); você ganha 2 acoes bônus de faca neste turno.

**Nv 16 — Faca Volta (requer Espectaculo Sangrento):** Facas mágicas retornam após acerto ou erro. Crítico com faca: alvo sangra 2d4 e ingrediente de ave intacto.

**Nv 20 — Ascensao — Finale das Facas:** 1/descanso longo: chuva de facas em raio 6m — 8d6 cortante (DES CD 17 metade); você pode mover até metade do deslocamento entre cada 2d6 sem provocar oportunidade. Inspiracao concedida a aliado que acertar crítico neste combaté e maximizada.

---

### Cantor dos Venenos (Bardo)

**Dieta nv.2:** Raizes picantes raras aumentam CD de resistência de ilusao e encantamento em +3 por 8h.

**Nv 4 — Nota Picante:** +1 CD em ilusao/encantamento. Truque de ilusao olfativa (nuvem de especiaria).

**Nv 8 — Refrao Queima (requer Nota Picante):** 1/descanso curto: aliado que falhou save mental repete com Vantagem após cheirar especiaria (ação bônus).

**Nv 12 — Sinfornia de Ervas (requer Refrao Queima):** Contracanto (estilo Cap. 12): reacao interrompe feitico 18m, CD Concentracao 14+CAR.

**Nv 16 — Encanto Culinario (requer Sinfornia de Ervas):** Refeicao com especiarias: quem come ganha +2 CD em saves mentais 8h. Você prepara 2 porcoes extra de efeito.

**Nv 20 — Ascensao — Ode ao Wasabi:** 1/descanso longo: canto 1 min — inimigos 6d8 psiquico + SAB CD 18 ou Atordoado 1 turno; aliados imunes e +3 CD em magias mentais 1 hora. Ilusoes criadas por você parecem reais até dano fisico (CD 19 para desacreditar).

---

## DRUIDA

### Circulo da Decomposicao (Druida)

**Dieta nv.2:** Cogumelos necróticos concedem imunidade a necrótico e magias de terra causam envenenamento passivo (+1d4 veneno, 1/combate).

**Nv 4 — Esporos Necroticos:** Magias Cap. 19 no grimorio. Forma Selvagem mantem imunidade a necrótico.

**Nv 8 — Podridao Fertil (requer Esporos Necroticos):** Monstros mortos por você apodrecem em nutrientes: 1d4 porcoes de fungo Comum em 1 hora.

**Nv 12 — Toque de Bolor (requer Podridao Fertil):** Ataque em Forma Selvagem ou magia: +2d6 necrótico. 1/descanso curto, nuvem 3m 3d8 necrótico (CON CD 14).

**Nv 16 — Grande Decomposicao (requer Toque de Bolor):** Magia Cap. 19. Terreno 6m torna-se dificil e 2d6 necrótico ao entrar (1 min).

**Nv 20 — Ascensao — Ciclo da Podridem:** 1/descanso longo: área 12m — mortos-vivos 10d8 necrótico (SAB CD 17); vivos inimigos Envenenado. Aliados curam 2d8 ao comer fungos gerados. Forma Selvagem pode ser esqueleto-florestal (imune necrótico, aura 1d6 necrótico adjacente).

---

### Circulo do Superpredador (Druida)

**Dieta nv.2:** Forma Selvagem ganha HP extra igual ao HP máximo do ultimo monstro Grande consumido (aplicar uma vez por transformacao).

**Nv 4 — Forma Aprimorada:** Forma Selvagem até CR dobro do limite normal de nivel.

**Nv 8 — Fusao Biomágica (requer Forma Aprimorada):** Em forma de especie cuja carne comeu, ganha mutação biomágica da especie enquanto transformado.

**Nv 12 — Forma Monstruosa (requer Fusao Biomágica):** Pode assumir monstros até CR = nivel do Druida (basilisco, manticora, etc.).

**Nv 16 — Caça Alpha (requer Forma Monstruosa):** Em Forma Selvagem, +2d6 no primeiro ataque contra presa com HP cheio. Extração em forma concede Vantagem.

**Nv 20 — Ascensao — Forma Lendaria:** 1/descanso longo: Forma de Boss derrotado pela campanha (10 min), mantem INT/SAB, estatisticas fisicas do Boss. HP extra da dieta dobra. Apos terminar, deve comer 1 porcao da especie ou Exaustao 1.

---

### Circulo da Simbiose (Druida)

**Dieta nv.2:** Sementes mágicas criam armadura de vinhas (rebaté 1d6 cortante a cada ataque recebido) por 8h.

**Nv 4 — Semente Guardia:** Armadura de vinhas +2 CA e 1d6 rebate. Planta semente em 1 min: cresce fruta curativa 1d8 em 8h.

**Nv 8 — Rede Simbiotica (requer Semente Guardia):** Aliado adjacente ganha metade do rebaté (arredonda 1d4 minimo). Pode compartilhar 1 mutação vegetal com aliado por descanso longo.

**Nv 12 — Vinha Agarradora (requer Rede Simbiotica):** 1/descanso curto: vinhas 6m Restringem (FOR CD 15). Em Forma Selvagem, ataques aplicam Lentidão em falha de DES CD 14.

**Nv 16 — Floresta em Miniatura (requer Vinha Agarradora):** Descanso longo em área verde: cria 2d4 porcoes de planta Comum. Imune a veneno de plantas enquanto dieta ativa.

**Nv 20 — Ascensao — Corpo Bosque:** 10 min, 1/descanso longo: pele-bosque — CA 16+SAB, rebaté 2d6, regenera 2d8/turno. Aliados a 3m ganham +2 CA de vinhas. Ao terminar, planta arvore que frutifica em 1 semana (recurso de faccao).

---

### Circulo do Solo Vivo (Druida)

**Dieta nv.2:** Pedras elementais concedem resistência a dano contundente enquanto dieta ativa.

**Nv 4 — Morder a Terra:** Pode mastigar mineral elemental (1/dia) para curar 2d8+CON sem magia.

**Nv 8 — Pele de Pedra (requer Morder a Terra):** +2 CA em Forma Selvagem ou humanoide com dieta. Terreno rochoso não e dificil para voce.

**Nv 12 — Tremor Leve (requer Pele de Pedra):** 1/descanso curto: 6m, criaturas FOR CD 14 ou Prostradas. Estruturas frageis racham (narrativo).

**Nv 16 — Golem Momentaneo (requer Tremor Leve):** 1/descanso longo: elemental de pedra Pequeno (30 HP) por 10 min obedece; pode Extração rochas.

**Nv 20 — Ascensao — Montanha Viva:** 1/descanso longo, 10 min: tamanho Grande, resistência contundente/perfurante/cortante, esmagamento 3d10 contundente (acao, 1/turno). Aliados em 3m imunes a tremor e desabamento. Pedras comidas neste estado alimentam grupo 1 dia sem refeicao.

---

## ARTIFICE

### Ferreiro de Utensilios (Artífice)

**Dieta nv.2:** Pratos em panelas de exoesqueleto aumentam CA das proprias armaduras em +2 por 8h.

**Nv 4 — Panela Viva:** Infusão em utensilio de cozinha: ingredientes rendem dobro (empilha com Panela de Pressao da classe em +50% total, não triplica). +2 em Coccao com seu kit.

**Nv 8 — Armadura de Caldeirao (requer Panela Viva):** Infusão +1 em armadura media que você veste; se forjada com quitina, +2 total.

**Nv 12 — Reforco de Campo (requer Armadura de Caldeirao):** Aliado usa sua panela 1 descanso: +1 CA por 8h. Você repara armadura quebrada em 1 hora com exoesqueleto.

**Nv 16 — Forja Rápida (requer Reforco de Campo):** Cria arma orgânica +1 em 4 horas (dano tipo monstro). 1 arma ativa por vez.

**Nv 20 — Ascensao — Mestre de Utensilios:** Armadura que você veste +3 CA permanente (magic). 1/descanso longo: distribui 3 utensilios infundidos (+1 Coccao ou +1 CA) ao grupo por 24h. Constructos de metal ignoram rustico de masmorra.

---

### Engenheiro de Explosivos (Artífice)

**Dieta nv.2:** Glandulas combustiveis concedem resistência a Fogo e +2d6 em bombas e engenhocas por 8h.

**Nv 4 — Fogareiro Portátil:** Acende fogueira segura em 1 acao; cozinha em combaté em dobro de velocidade (minimo 5 min por prato simples).

**Nv 8 — Bomba de Glandula (requer Fogareiro Portátil):** 3 bombas/descanso longo (4d6 fogo, 3m, DES CD 14). Nao afeta comida aliada se acertar panela — escolhe ao arremessar.

**Nv 12 — Caldeira a Pressao (requer Bomba de Glandula):** Reacao: explosao controlada reduz dano de fogo em você a 0 e reflete 2d8 fogo ao atacante (alcance 3m).

**Nv 16 — Motor de Vapor Menor (requer Caldeira a Pressao):** Se tiver Construto Auxiliar (Pequeno, 20 HP, CA 13), ele ganha lanca-fogo integrada 2d6+INT; senao, pode criar um em 8 horas de descanso longo.

**Nv 20 — Ascensao — Inferno Controlado:** 1/descanso longo: incendio direcionado 12m linha 10d6 fogo (DES CD 17 metade); aliados na linha sofrem metade automaticamente. Bombas dobram dado até descanso longo. Imune a proprio fogo.

---

### Biologo Alquimico (Artífice)

**Dieta nv.2:** Micro-doses de toxina garantem imunidade a envenenamento e revestir arma com +1d6 ácido por 1 minuto (3/combate).

**Nv 4 — Seringa Basica:** 2 seringas/descanso longo — aliado ganha 1 mutação leve 8h ou antidoto a veneno conhecido.

**Nv 8 — Catalisador (requer Seringa Basica):** Dobrar ingrediente Comum em poção (10 min). Veneno em arma dura 5 ataques.

**Nv 12 — Laboratorio de Campo (requer Catalisador):** Kit completo sem penalidade; antidoto em 5 min para veneno identificado.

**Nv 16 — Mutageno de Batalha (requer Laboratorio de Campo):** Você injeta mutageno: +2 STR ou +2 DES por 10 min, 1 Exaustao depois. 1/descanso longo.

**Nv 20 — Ascensao — Mutação Direcionada:** 1/semana: mutação permanente sintetica para aliado (equivalente Boss medio, aprovacao Mestre). Em combate, nuvem 6m 5d8 ácido+veneno (CON CD 17) 1/descanso longo; aliados imunes.

---

### Construtor de Armadilhas (Artífice)

**Dieta nv.2:** Carne extraída sem dano de batalha concede Vantagem em INT e criacao de invencoes por 24h.

**Nv 4 — Armadilha Biologica:** Monta armadilha em 5 min com ingrediente (efeito biomagico do monstro, Percepção CD 18 detectar).

**Nv 8 — Extracao Perfeita (requer Armadilha Biologica):** Vantagem em Extração se monstro morreu em armadilha sua ou com 0 dano de arma cortante.

**Nv 12 — Rede de Campo (requer Extracao Perfeita):** 3 armadilhas ativas simultaneas. Armadilha pode ser remota (corda, 9m).

**Nv 16 — Engenho de Caça (requer Rede de Campo):** 1/descanso longo: armadilha maior (6d8 dano tipo escolhido + condicao do ingrediente, FOR ou DES CD 16).

**Nv 20 — Ascensao — Arquiteto da Masmorra:** 1/descanso longo: converte área 12m em "zona preparada" 1 hora — todas as armadilhas +2d6, Percepção inimiga CD 20, você e aliados Vantagem em Furtividade e INT para invencoes. Ao fim, recupera todos os ingredientes usados (metade porcoes, qualidade preservada).

---

## Referencia rapida — janelas de talento

| Nivel | Ganho de subclasse |
|-------|-------------------|
| 2 | Passivo de Assimilação (passiva) |
| 4 | Talento 1 do caminho |
| 8 | Talento 2 (requer 4) |
| 12 | Talento 3 (requer 8) |
| 16 | Talento 4 (requer 12) |
| 20 | Ascensao (capstone) |

*Talentos Universais (Cap. 13): opcionais conforme secao Regras.*

---

*Fim do Capítulo 12 — Caminhos de Subclasse (Caminho de Assimilação).*


## CAPÍTULO 13 — TALENTOS UNIVERSAIS

### TALENTOS DE COMBATE

Especialista em Armas Orgânicas (Nivel 4): Proficiencia em todas as armas orgânicas. Armas orgânicas nas suas maos causam +1d4 de dano adicional do tipo correspondente ao monstro de origem.

Pele Grossa (CON 14, Nivel 4): +1 CA permanente. Quando sofre dano que o reduziria a exatamente 0 HP, pode testar CON CD 12 para ficar a 1 HP em vez disso. 1x por descanso curto.

Reflexos de Combaté (DES 16, Nivel 8): Pode usar reacao para fazer um ataque contra qualquer inimigo que entre no seu alcance de ameaca. Nao conta como ataque de oportunidade.

Golpe Brutal (FOR 18, Nivel 12): Uma vez por turno, pode declarar um Golpe Brutal. Se acertar, o alvo e derrubado Prostrado (sem teste de resistência) e sofre dano adicional igual ao modificador de FOR.

### TALENTOS CULINARIOS

Maos de Mestre — Extração (Extração +4, Nivel 4): +3 permanente em Extração. Nunca sofre penalidade por extrair ingredientes "as cegas" — mesmo sem Estudo de Anatomia, extrai como se tivesse feito o estudo.

Paladar Apurado — Forrageio (Forrageio +5, Nivel 4): +3 permanente em Forrageio. Uma vez por refeicao, pode rolar o resultado de Forrageio com Vantagem.

Controle de Chama Perfeito — Coccao (Coccao +4, Nivel 8): O resultado minimo em testes de Coccao e sempre 10 (nunca Gororoba). Prato Perfeito agora exige resultado 18+ em vez de 21+.

Estômago Lendário (Fortitude +5, Nivel 8): Imune a debuffs de Gororoba. Pode comer ingredientes de categoria Especialista crus. Uma vez por semana, pode ingerir um ingrediente bruto de Boss e receber 1 mutação aleatoria por 8h.

Cozinheiro de Expedicao (Nivel 4): Pode preparar refeicoes em metade do tempo normal. Em combate, pode preparar uma "refeicao de emergencia" como ação bônus — concede 2d8 HP Temporarios e ativa o Bônus Passivo de Sobrevivência de qualquer aliado que consuma.

Extrator de Elite (Extração +6, Nivel 12): Ao extrair ingredientes de um monstro com Estudo de Anatomia, extrai automaticamente o dobro de ingredientes normais. Nunca destroca ingredientes de Boss durante extracao.

### TALENTOS DE SOBREVIVENCIA

Sentido de Masmorra (Nivel 4): Ao entrar num bioma, recebe automaticamente informação sobre nivel de perigo, presenca de armadilhas obvias e tipo de criaturas predominantes. Nunca se perde em andares ja visitados.

Metabolismo Acelerado (CON 14, Nivel 4): Mutacoes biomágicas duram 36h em vez de 24h. Pode manter uma mutação "reservada" — ao perder uma mutação, a reservada ativa automaticamente.

Primeiros Socorros Avancados (SAB 13, Nivel 4): Pode estabilizar um aliado a 0 HP como ação bonus. Ao usar kit medico mais ingredientes curativos, cura 3d8 HP como ação (uma vez por descanso curto por aliado).

Resistência Elemental (CON 16, Nivel 8): Escolhe dois elementos (Fogo, Frio, Ácido, Relâmpago, Veneno). Ganha resistência permanente a ambos. Pode ser escolhido uma segunda vez para imunidade a um dos dois elementos.

Visao no Escuro (Nivel 4): Se não tinha, ganha visao no escuro até 12m. Se ja tinha, a distancia dobra e pode ver cores em vez de tons de cinza no escuro.

### TALENTOS SOCIAIS E ESPECIAIS

Estudioso de Bestiario (INT 14, Nivel 4): Escolhe 3 categorias de monstros. Para essas categorias, sempre tem conhecimento equivalente a Estudo de Anatomia completo. Ao encontrar um monstro novo, pode identificar sua categoria e habilidades com teste INT CD 10.

Negociador do Submundo (CAR 15, Nivel 4): Pode tentar negociar com qualquer monstro inteligente (INT 6+) em vez de combater. Testa CAR (Persuasao) contra CD 8 + nivel do monstro. Sucesso: monstro torna-se neutro e pode fornecer informacoes ou ingredientes voluntariamente.

Mercador de Ingredientes (Nivel 4): Vende ingredientes por 150% do preço normal. Recebe informação sobre demanda atual — sabe quais ingredientes estão valorizados antes de entrar na masmorra.

Especializacao de Inimigo (Nivel 8): Escolhe um tipo de monstro. Ganha +2 em ataques, +2d6 de dano e Vantagem em Extração contra esse tipo. Pode ser escolhido multiplas vezes para tipos diferentes.

Alquimista Amador (INT 13, Nivel 4): Pode criar pocoes básicas (Cura Leve, Antidoto, Resistência Elemental) com ingredientes de monstros sem ser Gnomo ou ter subclasse de alquimia.


---

# PARTE IX — ARMAS E EQUIPAMENTOS

---

## CAPÍTULO 14 — ARMAS CLASSICAS

### 14.1 Propriedades de Armas

| Propriedade | Efeito |
|------------|--------|
| Leve | Pode ser usada com outra arma leve na mao oposta sem penalidade |
| Pesada | Criaturas Pequenas tem Desvantagem em ataques com essa arma |
| Versatil | Pode ser usada com uma ou duas maos (dois danos listados) |
| Alcance | Alcance de ataque aumentado para 3m em vez de 1,5m |
| Arremesso | Pode ser arremessada com as estatisticas indicadas |
| Munição | Requer munição. Sem munição, não pode ser usada para ataque a distancia |
| Recarga | Apos cada disparo, requer ação bônus para recarregar |
| Penetrante | Ignora 2 pontos de CA de armaduras metalicas |
| Esmagadora | Acertos críticos derrubam o alvo Prostrado (CON CD 13) |
| Cortante | Causa Sangramento em acertos críticos (1d4 dano/turno) |
| Perfurante | Em acertos críticos, o dado de dano e rolado 3 vezes |

### 14.2 Armas Simples (Corpo a Corpo)

| Arma | Dano | Propriedades | Preço |
|------|------|-------------|-------|
| Clava | 1d4 contundente | Leve | 1 po |
| Adaga | 1d4 perfurante | Leve, Arremesso (6/18m) | 2 po |
| Foice Curta | 1d4 cortante | Leve | 1 po |
| Lança | 1d6 perfurante | Arremesso (6/12m), Versatil (1d8) | 1 po |
| Cajado | 1d6 contundente | Versatil (1d8) | 2 po |
| Machado de Mao | 1d6 cortante | Leve, Arremesso (6/12m) | 5 po |
| Maça | 1d6 contundente | Esmagadora | 5 po |
| Martelo de Guerra | 1d8 contundente | Versatil (1d10), Esmagadora | 15 po |

### 14.3 Armas Simples (A Distancia)

| Arma | Dano | Alcance | Propriedades | Preço |
|------|------|---------|-------------|-------|
| Besta Leve | 1d8 perfurante | 24/96m | Munição, Recarga | 25 po |
| Dardo | 1d4 perfurante | 6/18m | Leve, Arremesso | 5 cp |
| Funda | 1d4 contundente | 9/36m | Munição | 1 po |
| Zarabatana | 1 perfurante | 7,5/30m | Munição (agulha) | 10 po |

### 14.4 Armas Marciais (Corpo a Corpo)

| Arma | Dano | Propriedades | Preço |
|------|------|-------------|-------|
| Espada Curta | 1d6 perfurante | Leve, Perfurante | 10 po |
| Espada Longa | 1d8 cortante | Versatil (1d10), Cortante | 15 po |
| Montante | 2d6 cortante | Pesada, Alcance, Cortante | 50 po |
| Machado de Batalha | 1d8 cortante | Versatil (1d10) | 10 po |
| Machado Grande | 1d12 cortante | Pesada, Cortante | 30 po |
| Maça de Guerra | 2d6 contundente | Pesada, Esmagadora | 50 po |
| Alabarda | 1d10 cortante | Pesada, Alcance | 20 po |
| Lança Longa | 1d10 perfurante | Pesada, Alcance | 10 po |
| Rapieira | 1d8 perfurante | Leve, Perfurante | 25 po |
| Sabre | 1d6 cortante | Leve, Cortante | 25 po |
| Tridente | 1d6 perfurante | Arremesso (6/12m), Versatil (1d8) | 5 po |
| Chicote | 1d4 cortante | Alcance, Leve | 2 po |

### 14.5 Armas Marciais (A Distancia)

| Arma | Dano | Alcance | Propriedades | Preço |
|------|------|---------|-------------|-------|
| Arco Curto | 1d6 perfurante | 24/96m | Munição, Cortante | 25 po |
| Arco Longo | 1d8 perfurante | 45/180m | Munição, Pesada, Perfurante | 50 po |
| Besta Pesada | 1d10 perfurante | 30/120m | Munição, Pesada, Recarga | 50 po |
| Besta de Mao | 1d6 perfurante | 9/36m | Leve, Munição, Recarga | 75 po |

### 14.6 Escudos e Protecao

| Item | Bonus CA | Notas | Preço |
|------|---------|-------|-------|
| Escudo de Madeira | +1 | Leve, pode ser destruido | 5 po |
| Escudo de Metal | +2 | Padrao | 20 po |
| Escudo de Torre | +3 | Pesado — Desvantagem em DES | 50 po |
| Escudo de Espinhos | +2 | Atacantes que acertem corpo-a-corpo tomam 1d4 | 75 po |

### 14.8 Propriedades mágicas (efeitos EFE)

Catálogo técnico: **`CATALOGO-EFEITOS-DE-EQUIPAMENTO.md`**. No VTT, armas com `weapon.special` aplicam cura ou dano extra no acerto conforme o gatilho.

| Gatilho | Exemplo |
|---------|---------|
| **onHit** | Lâmina vampírica: +1 HP ao atacante por acerto (EFE-01) |
| **onCrit** | Maça necrótica: +2d6 necrótico no crítico (EFE-05) |
| **whileEquipped** | Armadura orgânica: resistências narrativas (Mestre) |

**Encantamento +3:** além de bônus numérico (+3 ataque/dano ou CA), ganha **um efeito EFE** extra (tabela no catálogo) ou vampírico padrão (EFE-01) se a arma +0 não tinha propriedade.

**Orgânicas (Cap. 15):** entradas **ORG-01–ORG-08** no compêndio `armas` com os mesmos gatilhos; veneno com save, lentidão e HP máximo seguem regra de mesa até automação completa.

---

## CAPÍTULO 15 — ARMAS ORGÂNICAS

Armas forjadas de partes de monstros da masmorra. Cada uma carrega o DNA do ser que a originou — e algumas ainda estão, de certa forma, vivas.

### 15.1 Regras de Armas Orgânicas

**Criação:** O Artífice (ou ferreiro especializado) cria armas orgânicas durante ou após um Banquete. Tempo de forja: 1d4 dias para armas comuns, 1d6+1 semanas para armas de Boss.

**Degradação:** Armas orgânicas têm um **Contador de Durabilidade (CD)**. A cada acerto crítico ou exposição a condições extremas, perde 1 de CD. Ao chegar a 0, a arma perde suas propriedades especiais mas ainda funciona como arma mundana.

**Manutenção:** O Artífice pode restaurar CD gastando ingredientes do mesmo tipo do monstro de origem (1 ingrediente por 2 CD restaurados, 1 hora de trabalho).

**Evolução:** Armas orgânicas de Boss podem ser "aprimoradas" ao serem alimentadas com ingredientes do mesmo tipo de monstro ao longo do tempo — ganham +1 em dano a cada 10 ingredientes absorvidos, máximo +3.

### 15.2 Catálogo de Armas Orgânicas

> **VTT:** IDs **ORG-01–ORG-08** em `armas.json` (efeitos EFE automáticos; saves e lentidão = Mestre). Ver **`CATALOGO-EFEITOS-DE-EQUIPAMENTO.md`**.

**Lâmina de Dente de Wyvern** (Espada Curta | Dano: 1d8 perfurante + 1d6 veneno | CD: 15)
Extraída da mandíbula de um Wyvern. A glândula de veneno na base ainda funciona. Propriedades: Perfurante. A cada acerto, injeta veneno automaticamente (CON CD 14 ou Paralisado por 1 turno). Manutenção: alimentada com veneno de qualquer reptil venenoso (1 frasco = 3 CD). Preço: 350 po.

**Maça de Fêmur Milenar** (Maça de Guerra | Dano: 2d6+2 contundente | CD: 20)
O fêmur de um Esqueleto Comandante com séculos de existência. Propriedades: Esmagadora. Acertos críticos liberam um pulso de energia necrótica (área 3m, 2d6 necrótico, CD 13 CON ou Amedrontado por 1 turno). Preço: 280 po.

**Adaga de Quelícera de Aranha** (Adaga | Dano: 1d6 perfurante + 1d4 veneno | CD: 12)
A quelícera principal de uma Aranha Tecerrochas Matriarca. Propriedades: Leve, Arremesso (6/18m). O veneno causa lentidão (-3m de velocidade por 2 horas; sem teste de resistência). Preço: 180 po.

**Espada de Escama de Dragão** (Espada Longa | Dano: 1d10 cortante + 1d6 do elemento do dragão | CD: 25)
Escamas sobrepostas de um Dragão Jovem, forjadas em lâmina. Propriedades: Cortante. Dano elemental corresponde ao tipo do dragão (Fogo, Gelo, Ácido, Relâmpago). Causa dano dobrado contra criaturas com imunidade ao elemento oposto. Preço: 500 po.

**Lança de Ferrão de Escorpião** (Lança | Dano: 1d8 perfurante + 1d8 veneno | CD: 18)
O ferrao caudal de um Escorpião Gigante. Propriedades: Arremesso (6/12m), Versatil (1d10+1d8 veneno). O veneno causa Envenenamento por 1 hora (CON CD 15). Preço: 220 po.

**Martelo Fornalha (de Magma)** (Martelo de Guerra | Dano: 2d8 contundente + 1d8 fogo | CD: 22)
Forjado da mandíbula calcificada do Leviata de Magma. Propriedades: Esmagadora. Acertos críticos causam Ignição (alvo pega fogo — 1d6 fogo/turno até apagado). Pode ser usado para cozinhar sem fogueira. Preço: 650 po.

**Arco de Osso de Grifo** (Arco Longo | Dano: 1d10 perfurante | CD: 18)
Ossos ocos das asas de um Grifo adulto. Extremamente leves. Propriedades: Munição, Pesada (para classes sem proficiencia), Perfurante. O peso reduzido concede +3m de alcance a todos os disparos. Preço: 400 po.

**Cutelo Fornalha — Ferramenta-Arma** (Machado Grande | Dano: 2d8 cortante + 1d6 fogo | CD: 28)
A mandíbula inferior do Leviata de Magma. Serve como arma de combaté e utensilio culinário. Propriedades: Pesada, Cortante. Qualquer carne cortada pelo Cutelo sai parcialmente cozida — reduz o tempo de preparo em 50%. Preço: Inestimavel (unico).

**Rede de Seda da Matriarca** (Rede | Dano: — (restringe) | CD: 20)
Tecida da seda da Matriarca Tecela de Cristal. Cada fio resiste a forca de uma manticora. Propriedades: Arremesso (6m). Ao acertar: alvo Restringido (FOR ou DES CD 17 para escapar — ação completa). A seda crystalina corta quem tenta rasgar com forca bruta (2d6 cortante). Preço: 300 po.

**Chicote de Tentaculo de Kraken** (Chicote | Dano: 2d6 cortante + Agarramento | CD: 20)
Um tentaculo preservado de Kraken Menor. Propriedades: Alcance (6m em vez de 3m). Acertos: alem do dano, o alvo fica Agarrado (FOR CD 15 para escapar). O chicote pode agarrar e puxar objetos de até 50kg a distancia. Preço: 380 po.

**Arco de Costela de Lich** (Arco Curto Magico | Dano: 1d8 perfurante + 1d6 necrótico | CD: 30)
Costelas do Arquiliche, curvadas e mantidas em forma por encantamentos. Propriedades: Munição. Nao precisa de flechas fisicas — conjura flechas necróticas automaticamente. Cada flecha reduz o HP máximo do alvo em 2 até descanso longo. Preço: Inestimavel (arma de Boss unica).

**Espada de Garra de Dragão de Gelo** (Espada Longa | Dano: 1d10 cortante + 2d6 frio | CD: 24)
A garra dianteira de um Dragão Jovem de Gelo. Propriedades: Cortante. Acertos críticos congelam parcialmente o alvo (velocidade reduzida a metade por 1 minuto, CON CD 16). Em combaté aquatico, causa dano dobrado. Preço: 600 po.

**Pelagem-Armadura de Grifo** (Armadura Media + Arma | CA: 15+DES(max2) | Dano das Garras: 1d8 cortante | CD: 18)
O couro e as garras dianteiras de um Grifo adulto, montados como armadura funcional. Propriedades: Garras contam como armas leves que não ocupam as maos. Ao escalar, não requer teste. Quedas de até 12m sem dano. Preço: 450 po.

**Manopla de Seda Cortante** (Luva Especial | Dano: 1d6 cortante (fios) | CD: 22)
Criada das glândulas intactas da Matriarca Tecela de Cristal. Lança fios microscopicos invisiveis que cortam qualquer material. Propriedades: Como ação bonus, pode lancar fios em área de 9m — criaturas que passem por eles testam DES CD 15 ou tomam 2d6 cortante e ficam Restringidas. Preço: Inestimavel (unico).

### 15.3 Tabela Resumida de Armas Orgânicas

| Arma | Base | Dano | Efeito Especial | CD | Preço |
|------|------|------|----------------|-----|-------|
| Lâmina de Dente de Wyvern | Espada Curta | 1d8+1d6 veneno | Paralisia CD14 | 15 | 350 po |
| Maça de Fêmur Milenar | Maça de Guerra | 2d6+2 | Pulso necrótico | 20 | 280 po |
| Adaga de Quelícera | Adaga | 1d6+1d4 veneno | Lentidão | 12 | 180 po |
| Espada de Escama de Dragão | Espada Longa | 1d10+1d6 elemental | Dano elemental duplo | 25 | 500 po |
| Lança de Ferrão de Escorpião | Lança | 1d8+1d8 veneno | Envenenamento CD15 | 18 | 220 po |
| Martelo Fornalha | Martelo de Guerra | 2d8+1d8 fogo | Ignição crítico | 22 | 650 po |
| Arco de Osso de Grifo | Arco Longo | 1d10 | +3m alcance | 18 | 400 po |
| Cutelo Fornalha | Machado Grande | 2d8+1d6 fogo | Cozinha sem fogo | 28 | Unico |
| Rede de Seda da Matriarca | Rede | — | Restricao CD17 | 20 | 300 po |
| Chicote de Tentaculo | Chicote | 2d6+Agarre | Alcance 6m | 20 | 380 po |
| Arco de Costela de Lich | Arco Curto | 1d8+1d6 necrótico | Reduz HP max | 30 | Unico |
| Espada de Garra de Dragão de Gelo | Espada Longa | 1d10+2d6 frio | Congelamento crítico | 24 | 600 po |
| Pelagem-Armadura de Grifo | Armadura Media | CA15 + 1d8 garras | Escalada livre | 18 | 450 po |
| Manopla de Seda Cortante | Luva | 1d6 (fios) | Armadilha de fios | 22 | Unico |

---

## CAPÍTULO 16 — EQUIPAMENTOS E ITENS DE AVENTURA

### 16.1 Ferramentas de Extração

| Item | Bonus | Notas | Preço |
|------|-------|-------|-------|
| Faca de Campo | +0 | Basica. Serve para Facil | 2 po |
| Kit de Extração Basico | +1 | Facil e Medio sem penalidade | 15 po |
| Kit de Extração Avancado | +2 | Ate Dificil sem penalidade | 50 po |
| Kit de Artífice (Extração) | +3 | Todas as dificuldades, incluindo Especialista | 150 po |
| Recipiente de Vidro Grosso | Necessario | Para Slimes e Ácidos | 25 po/conjunto |
| Frasco Selado Magicamente | Necessario | Para Espirituais e Elementais | 80 po/frasco |
| Luva Resistente a Ácido | Protecao | Necessaria para Centopeias e Pudins | 30 po |
| Martelo de Exoesqueleto | Ferramenta | Necessario para Carapaças Dificeis | 20 po |

### 16.2 Equipamentos de Cozinha

| Item | Efeito | Preço |
|------|--------|-------|
| Panela de Campo | Basica. Sem bônus | 5 po |
| Panela de Ferro Anão | +1 em Coccao | 40 po |
| Panela de Escama de Dragão | +2 em Coccao. Resistente a fogo | 200 po |
| Panela de Carapaça de Escorpião | +2 Coccao. Resistente a ácido | 180 po |
| Fogareiro Portátil (Artífice) | Controle de temperatura preciso (+3 Coccao) | 300 po |
| Nucleo de Chama Primordial | Fonte de calor eterno. Nunca apaga | 800 po |
| Cera de Mumia (Preservacao) | Ingredientes não estragam por 7 dias | 50 po/bloco |
| Frascos de Fermentacao | +2 Forrageio em ingredientes fermentados | 30 po/conjunto |

### 16.2.1 Kit de Brasas Magicas (biomas sem fogo aberto)

Para **Pantano da Decomposicao**, **Ninho Crepuscular** e trechos de **Engrenagens/Fornalhas** com gas — tocha e `Chama de Fogareiro` **proibidos** (detonam ou apagam). Ver `SUPLEMENTO-BIOMAS-VERTICAIS-LUZ-E-BRASAS.md`.

| Item | Efeito | Preço |
|------|--------|-------|
| Kit de Brasas Magicas (6 brasas) | 30 min calor/panela cada; penumbra 3m; +1 Coccao; não detona gas | 45 po |
| Brasa Magica (avulsa) | 1 uso, 30 min | 12 po |
| Bolsa de Recarga (6 brasas) | Repoe kit | 35 po |
| Suporte de Pedra-Caldeira | +1 Forrageio em sopas com brasa | 25 po |
| Panela Selada de Masmorra | Coccao segura em gas (tampa vedada) | 20 po |
| Pano Umido Antifaisca (3 usos) | Evita 1 detonacao por faisca acidental | 8 po |

Conjuradores usam o truque **Calor de Panela** (Cap. 18) em vez do kit.

### 16.3 Protecoes e Vestimentas

| Item | CA | Notas | Preço |
|------|-----|-------|-------|
| Roupas Comuns | 10 | Sem protecao | 1 po |
| Couro Curtido | 11+DES | Armadura leve | 10 po |
| Couro Acolchoado | 12+DES | Armadura leve. Silenciosa | 45 po |
| Cota de Malha | 13+DES(max2) | Armadura media | 50 po |
| Meia-Armadura | 14+DES(max2) | Armadura media | 750 po |
| Cota de Escamas | 14+DES(max2) | Armadura media | 50 po |
| Armadura de Placas Parcial | 15 | Armadura pesada | 400 po |
| Armadura de Placas Completa | 16 | Armadura pesada | 1.500 po |
| Couro de Troll | 13+DES | Armadura leve orgânica. Regenera 1 CA/descanso curto | 250 po |
| Cota de Escama de Basilisco | 16 | Armadura media orgânica. Resistência a petrificação | 500 po |
| Armadura de Carapaça de Escorpião | 17 | Armadura pesada orgânica. Resiste a perfurante | 600 po |

### 16.4 Itens Miscelaneos Essênciais

| Item | Efeito | Preço |
|------|--------|-------|
| Corda de Seda de Aranha (15m) | Resistência: 500kg. Nao queima | 25 po |
| Tocha de Pena de Fenix | Eterna. Nao apaga em vento ou agua | 150 po |
| Mapa de Sindicato (andar) | Parcial. Revela 60% do andar | 50 po |
| Antidoto Universal | Neutraliza 1 veneno identificado | 50 po |
| Kit Medico de Masmorra | 10 usos. Estabiliza + cura 1d8 | 30 po |
| Lanterna de Oleo | 6h de luz, raio 9m | 5 po |
| Cristal de Luz Continua | Luz permanente, raio 6m | 50 po |
| Bussola de Masmorra | Aponta para a saida mais proxima | 200 po |
| Saco de Dormir Aquecido | Imune a Exaustao por frio durante descanso | 15 po |
| Recipiente Isotermico | Ingredientes não degradam por 48h | 40 po |
| Bolsa de Especiarias (10 slots) | Organiza ESP; +1 Harmon se usar 1 ESP/prato | 18 po |
| Maleta de Minérios (8 slots) | Transporte seguro de MIN; evita quebra em queda DES 12 | 35 po |
| Kit de Avaliacao (joias) | Vantagem em identificar TES genuino vs TES-03 falso | 50 po |


---



---


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

### 17.6 Classificacao por nivel e escola

**Circulos de poder (lista geral, 53 magias):**

| Nivel | Nome na mesa | Poder tipico | Qtd. | Quando o grupo costuma ver |
|------:|--------------|--------------|-----:|----------------------------|
| 0 | **Truque** | Utilidade, cozinha, 1d4 | 6 | Nv. 1+ (sem gastar espaco) |
| 1 | **1o circulo** | Cura leve, armadura, identificar | 8 | Nv. 1–3 |
| 2 | **2o circulo** | Controle, preservar, ilusao menor | 9 | Nv. 3–5 |
| 3 | **3o circulo** | Area, fogo, necromancia media | 8 | Nv. 5–7 |
| 4 | **4o circulo** | Mutação, ecossistema, purificacao forte | 6 | Nv. 7–9 |
| 5 | **5o circulo** | Teleporte, cone de frio, biomancia maior | 6 | Nv. 9–11 |
| 6 | **6o circulo** | Praga, desintegrar, cadeia | 3 | Nv. 11–13 |
| 7 | **7o circulo** | Polimorfismo, prisao de gelo, regeneração | 4 | Nv. 13–15 |
| 8 | **8o circulo** | Terremoto | 1 | Nv. 15–17 |
| 9 | **9o circulo / Lenda** | Transcendência, Desejo de Morte | 2 | Nv. 17–20 (Clérigo do Limiar: capstone) |

**+ 8 magias exclusivas de subclasse** (Cap. 19.3) — não entram na tabela acima; somam-se ao grimorio.

**Por escola (lista geral):**

| Escola | Nv.0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Total |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Biomancia | 0 | 1 | 1 | 1 | 2 | 1 | 0 | 2 | 0 | 1 | 9 |
| Evocacao | 1 | 1 | 1 | 3 | 1 | 1 | 1 | 0 | 1 | 0 | 10 |
| Transmutação | 2 | 1 | 3 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 9 |
| Necromancia | 0 | 0 | 1 | 2 | 1 | 1 | 1 | 0 | 0 | 1 | 7 |
| Abjuracao | 1 | 2 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 7 |
| Adivinhacao | 1 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 4 |
| Encantamento | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| Ilusao | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 |
| Conjuracao | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |

*Biomancia inclui feiticos hibridos (ex.: Forma de Monstro). Dupla escola no texto da magia prevalece.*

**Tags de leitura rapida (cada entrada do Cap. 18):**

`[Escola] | Tempo | Alcance | Duracao | Classes | (C) concentracao | (R) ritual`

---

## CAPÍTULO 18 — LISTA DE MAGIAS (GRIMORIO DE ELDARIN)

> **Total:** 53 magias na lista geral (Cap. 18) + 8 exclusivas de subclasse (Cap. 19) = **61** feiticos no sistema.

### NIVEL 0 — TRUQUES (SEM CUSTO)

**Calor de Panela** — Transmutação | Acao | Toque | Concentracao, até 1 hora | Mago, Clérigo, Bardo, Druida, Artífice
Aquece recipiente fechado sem chama visivel; penumbra 3m. Coccao segura em biomas sem fogo aberto (Cap. 16.2.1). +1 Coccao se unica fonte de calor no prato. **Todo conjurador inicia com este truque.**

**Chama de Fogareiro** — Evocacao | Acao | Toque | Ate ser apagada | Mago, Clérigo, Bardo, Druida, Artífice
Chama na ponta dos dedos. **Proibida** em Ninho Crepuscular (12), gas do Pantano (10), vapor oleoso (8), bolsao sulfuroso (4). Use Calor de Panela ou Brasas Magicas.

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
| **Biologo Alquimico (Artífice)** | Micro-doses: imunidade veneno; arma +1d6 ácido 1 min |
| **Engenheiro de Explosivos** | Glandulas de fogo: resistência Fogo; bombas +2d6 |
| **Ferreiro de Utensilios** | Prato em panela de exoesqueleto: +2 CA em armaduras proprias |
| **Construtor de Armadilhas** | Carne intacta: Vantagem INT e invencoes 24h |

### 19.4 Mapa — magia exclusiva por subclasse

| Subclasse | Magia exclusiva (Cap. 19.3) |
|-----------|----------------------------|
| Piromante das Brasas | Maos Ardentes |
| Criomante de Conservacao | Gelo de Conservação |
| Mago Alquímico | Envelhecer Matéria, Fermentação Acelerada |
| Sacerdote da Purificacao | Purificacao Abencada |
| Circulo da Decomposicao | Esporos Necroticos, Grande Decomposicao |
| Bardo Confeiteiro | Doce Confuso |
| Clérigo do Limiar | **Desejo de Morte** (nv. 9 — via Ascensao Cap. 12; fora dos 8 de 19.3) |

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

## CAPÍTULO 20 — MAGIAS POR CLASSE (REFERÊNCIA RÁPIDA)

> Texto completo de cada magia: Cap. 18–19.

### MAGO

| Nv | Magias disíponíveis |
|---:|---|
| 0 | Calor de Panela; Chama de Fogareiro; Lâmina de Espirito; Detectar Veneno; Maos Firmes; *(excl.)* Envelhecer Matéria |
| 1 | Extracao Amplificada; Maos Gelidas; Identificar Ingrediente; Armadura Arcana; Onda de Trovao; *(excl.)* Maos Ardentes |
| 2 | Aprimoramento Biomagico; Raios de Enfraquecimento; Esfera Acida de Monstro; Transmutação de Carne; Preservação Perfeita; Forma Menor; Escudo Arcano; Ilusão Menor; *(excl.)* Gelo de Conservação; *(excl.)* Fermentação Acelerada |
| 3 | Animação de Mortos; Injecao Biomágica; Bola de Fogo; Contágio Necrótico; Ventania; Ler Mentes; Relâmpago; Sono |
| 4 | Visao do Ecossistema; Murcha; Mutação Forcada; Parede de Fogo; Preservação Anual |
| 5 | Grande Transmutação Biomágica; Cone de Frio; Salto Dimensional |
| 6 | Causar Praga; Disintegrar; Cadeia de Relâmpago |
| 7 | Forma de Monstro; Prisao de Gelo; Regeneração Biomágica; Invisibilidade Maior |
| 9 | Biomancia Suprema — Transcendência |

**Piromante:** variante Forno Arcano em `Bola de Fogo` (19.2).

### CLERIGO

| Nv | Magias disíponíveis |
|---:|---|
| 0 | Calor de Panela; Chama de Fogareiro; Detectar Veneno; Estabilizar |
| 1 | Crescimento Acelerado; Purificar Veneno; Curar Ferimentos |
| 2 | Raios de Enfraquecimento; Preservação Perfeita |
| 3 | Animação de Mortos; Contágio Necrótico; Sono |
| 4 | Murcha; Preservação Anual; Cura em Massa; *(excl.)* Purificacao Abencada |
| 5 | Ressurreicao Incompleta; Restaurar Vigor |
| 6 | Causar Praga |
| 7 | Regeneração Biomágica |
| 8 | Terremoto |
| 9 | Desejo de Morte *(Clérigo do Limiar, Ascensao nv. 20)* |

**Talentos (Cap. 12):** 34 caminhos de subclasse (4/8/12/16 + Ascensao 20); **Clérigo do Limiar** = trilha necromantica + `Desejo de Morte`. Magias de 19.3 somam-se ao grimorio e não substituem talentos de caminho.

### BARDO

| Nv | Magias disíponíveis |
|---:|---|
| 0 | Calor de Panela; Chama de Fogareiro; Lâmina de Espirito; Detectar Veneno |
| 1 | Identificar Ingrediente; Onda de Trovao; Curar Ferimentos; *(excl.)* Doce Confuso |
| 2 | Inspiracao Culinaria; Ilusão Menor |
| 3 | Ler Mentes; Sono |
| 5 | Salto Dimensional |
| 7 | Invisibilidade Maior |

### DRUIDA

| Nv | Magias disíponíveis |
|---:|---|
| 0 | Calor de Panela; Chama de Fogareiro; Detectar Veneno; Estabilizar; Maos Firmes; *(excl.)* Esporos Necroticos |
| 1 | Extracao Amplificada; Crescimento Acelerado; Purificar Veneno; Onda de Trovao; Curar Ferimentos |
| 2 | Aprimoramento Biomagico; Preservação Perfeita; Forma Menor |
| 3 | Ventania; Relâmpago |
| 4 | Visao do Ecossistema; Parede de Fogo; Preservação Anual; Cura em Massa |
| 5 | Despertar; Restaurar Vigor; *(excl.)* Grande Decomposicao |
| 6 | Cadeia de Relâmpago |
| 7 | Forma de Monstro; Regeneração Biomágica |
| 8 | Terremoto |

### ARTIFICE

| Nv | Magias disíponíveis |
|---:|---|
| 0 | Calor de Panela; Chama de Fogareiro; Lâmina de Espirito; Detectar Veneno; Maos Firmes |
| 1 | Extracao Amplificada; Identificar Ingrediente; Armadura Arcana |
| 2 | Aprimoramento Biomagico; Esfera Acida de Monstro; Transmutação de Carne; Preservação Perfeita; Escudo Arcano |
| 3 | Injecao Biomágica |
| 4 | Preservação Anual |
| 5 | Salto Dimensional |

Poder extra: **Infusoes** (Cap. IV), não lista 19.3.

---
